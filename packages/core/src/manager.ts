/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { AssetList, Chain } from '@chain-registry/types';
import { isInIframe, Origin } from '@dao-dao/cosmiframe';
import Bowser from 'bowser';
import EventEmitter from 'events';

import type { ChainWalletBase, MainWalletBase } from './bases';
import { StateBase } from './bases';
import { makeCosmiframeWallet } from './cosmiframe';
import {
  COSMIFRAME_KEYSTORECHANGE_EVENT,
  COSMIFRAME_WALLET_ID,
} from './cosmiframe/constants';
import type { NameService } from './name-service';
import { WalletRepo } from './repository';
import {
  ChainName,
  ChainRecord,
  DeviceType,
  EndpointOptions,
  EventName,
  NameServiceName,
  OS,
  SessionOptions,
  SignerOptions,
  SimpleAccount,
  State,
  WalletConnectOptions,
  WalletName,
} from './types';
import type { Logger } from './utils';
import { convertChain, Session, WalletNotProvidedError } from './utils';

export class WalletManager extends StateBase {
  chainRecords: ChainRecord[] = [];
  walletRepos: WalletRepo[] = [];
  defaultNameService: NameServiceName = 'icns';
  mainWallets: MainWalletBase[] = [];
  coreEmitter: EventEmitter;
  walletConnectOptions?: WalletConnectOptions;
  readonly session: Session;
  repelWallet = true; // only allow one wallet type to connect at one time. i.e. you cannot connect keplr and cosmostation at the same time
  isLazy?: boolean; // stands for `globalIsLazy` setting
  throwErrors: boolean | 'connect_only';
  subscribeConnectEvents: boolean;
  cosmiframeEnabled: boolean;
  private _reconnectMap = {};

  constructor(
    chains: (Chain | ChainName)[],
    wallets: MainWalletBase[],
    logger: Logger,
    throwErrors: boolean | 'connect_only',
    subscribeConnectEvents = true,
    allowedCosmiframeParentOrigins: Origin[] = [
      /^https?:\/\/localhost(:\d+)?/,
      /^https:\/\/(.+\.)?osmosis\.zone/,
      /^https:\/\/(.+\.)?daodao\.zone/,
      /^https:\/\/.+-da0da0\.vercel\.app/,
      /^https:\/\/(.+\.)?abstract\.money/,
    ],
    assetLists?: AssetList[],
    defaultNameService?: NameServiceName,
    walletConnectOptions?: WalletConnectOptions,
    signerOptions?: SignerOptions,
    endpointOptions?: EndpointOptions,
    sessionOptions?: SessionOptions
  ) {
    super();
    this.throwErrors = throwErrors;
    this.subscribeConnectEvents = subscribeConnectEvents;
    this.coreEmitter = new EventEmitter();
    this.logger = logger;
    if (defaultNameService) this.defaultNameService = defaultNameService;
    this.session = new Session({
      duration: 1800000,
      callback: () => {
        this.mainWallets.forEach((w) => w.disconnectAll(false));
        window?.localStorage.removeItem('cosmos-kit@2:core//accounts');
        window?.localStorage.removeItem('cosmos-kit@2:core//current-wallet');
      },
      ...sessionOptions,
    });
    this.walletConnectOptions = walletConnectOptions;
    this.cosmiframeEnabled =
      isInIframe() && !!allowedCosmiframeParentOrigins?.length;
    // Add Cosmiframe wallet to beginning of list if enabled.
    wallets = [
      ...(this.cosmiframeEnabled
        ? [makeCosmiframeWallet(allowedCosmiframeParentOrigins)]
        : []),
      ...wallets,
    ];
    wallets.forEach(
      ({ walletName }) =>
        (this._reconnectMap[walletName] = () =>
          this._reconnect(walletName, true))
    );
    this.init(
      chains,
      assetLists,
      wallets,
      walletConnectOptions,
      signerOptions,
      endpointOptions
    );
  }

  init(
    chains: (Chain | ChainName)[],
    assetLists: AssetList[],
    wallets: MainWalletBase[],
    walletConnectOptions?: WalletConnectOptions,
    signerOptions?: SignerOptions,
    endpointOptions?: EndpointOptions
  ) {
    this.logger.info(
      `${chains.length} chains and ${wallets.length} wallets are provided!`
    );
    this.isLazy = endpointOptions?.isLazy;

    this.chainRecords = chains.map((chain) => {
      const chainName = typeof chain === 'string' ? chain : chain.chain_name;
      const converted = convertChain(
        chain,
        assetLists,
        signerOptions,
        endpointOptions?.endpoints?.[chainName],
        this.isLazy,
        this.logger
      );
      return converted;
    });

    this.mainWallets = wallets.map((wallet) => {
      wallet.logger = this.logger;
      wallet.throwErrors = this.throwErrors;
      wallet.session = this.session;
      wallet.walletConnectOptions = this.walletConnectOptions;
      wallet?.setChains(this.chainRecords);
      return wallet;
    });

    this.chainRecords.forEach((chainRecord, index) => {
      const repo = new WalletRepo(
        chainRecord,
        wallets.map(({ getChainWallet }) => getChainWallet(chainRecord.name)!)
      );
      repo.logger = this.logger;
      repo.repelWallet = this.repelWallet;
      repo.session = this.session;
      this.walletRepos.push(repo);
      if (repo.fetchInfo) {
        this.chainRecords[index] = repo.chainRecord;
      }
    });
    this.checkEndpoints(endpointOptions?.endpoints);
  }

  private checkEndpoints(endpoints?: EndpointOptions['endpoints']) {
    Object.keys(endpoints || {}).map((key) => {
      if (this.chainRecords.findIndex((c) => c.name === key) === -1) {
        this.logger?.warn(
          `You are providing endpointOptions with unrecognized chain NAME ${key} (NOT found such chain in ChainProvider property "chains")`
        );
      }
    });
  }

  setWalletRepel(value: boolean) {
    this.repelWallet = value;
    this.walletRepos.forEach((repo) => (repo.repelWallet = value));
    window?.localStorage.setItem(
      'cosmos-kit@2:core//repel-wallet',
      value.toString()
    );
  }

  addEndpoints = (endpoints: EndpointOptions['endpoints']) => {
    this.mainWallets.forEach((mainWallet) => {
      mainWallet.addEnpoints(endpoints);
    });
  };

  addChains = (
    chains: (Chain | ChainName)[],
    assetLists: AssetList[],
    signerOptions?: SignerOptions,
    endpoints?: EndpointOptions['endpoints']
  ) => {
    const newChainRecords = chains.map((chain) => {
      const chainName = typeof chain === 'string' ? chain : chain.chain_name;
      return convertChain(
        chain,
        assetLists,
        signerOptions,
        endpoints?.[chainName],
        this.isLazy,
        this.logger
      );
    });
    newChainRecords.forEach((chainRecord) => {
      const index = this.chainRecords.findIndex(
        (chainRecord2) => chainRecord2.name === chainRecord.name
      );
      if (index == -1) {
        this.chainRecords.push(chainRecord);
      } else {
        this.chainRecords[index] = chainRecord;
      }
    });

    this.checkEndpoints(endpoints);

    this.mainWallets.forEach((wallet) => {
      wallet.setChains(newChainRecords, false);
    });

    newChainRecords.forEach((chainRecord, i) => {
      const repo = new WalletRepo(
        chainRecord,
        this.mainWallets.map(
          ({ getChainWallet }) => getChainWallet(chainRecord.name)!
        )
      );
      repo.setActions({
        viewOpen: this.actions?.viewOpen,
        viewWalletRepo: this.actions?.viewWalletRepo,
      });
      repo.wallets.forEach((w) => {
        w.setActions({
          data: this.actions?.data,
          state: this.actions?.state,
          message: this.actions?.message,
        });
      });
      repo.logger = this.logger;
      repo.repelWallet = this.repelWallet;
      repo.session = this.session;

      if (repo.fetchInfo) {
        this.chainRecords[i] = repo.chainRecord;
      }

      const index = this.walletRepos.findIndex(
        (repo2) => repo2.chainName === repo.chainName
      );
      if (index == -1) {
        this.walletRepos.push(repo);
      } else {
        this.walletRepos[index] = repo;
      }
    });
  };

  on = (event: EventName, handler: (params: any) => void) => {
    this.coreEmitter.on(event, handler);
  };

  off = (event: EventName, handler: (params: any) => void) => {
    this.coreEmitter.off(event, handler);
  };

  get activeRepos(): WalletRepo[] {
    return this.walletRepos.filter((repo) => repo.isActive === true);
  }

  getMainWallet = (walletName: WalletName): MainWalletBase => {
    const wallet = this.mainWallets.find((w) => w.walletName === walletName);

    if (!wallet) {
      throw new WalletNotProvidedError(walletName);
    }

    return wallet;
  };

  getWalletRepo = (chainName: ChainName): WalletRepo => {
    const walletRepo = this.walletRepos.find(
      (wr) => wr.chainName === chainName
    );

    if (!walletRepo) {
      throw new Error(`Chain ${chainName} is not provided.`);
    }

    return walletRepo;
  };

  getChainWallet = (
    chainName: ChainName,
    walletName: WalletName
  ): ChainWalletBase => {
    const chainWallet: ChainWalletBase | undefined =
      this.getMainWallet(walletName).getChainWallet(chainName);

    if (!chainWallet) {
      throw new Error(`${chainName} is not provided!`);
    }
    return chainWallet;
  };

  getChainRecord = (chainName: ChainName): ChainRecord => {
    const chainRecord: ChainRecord | undefined = this.chainRecords.find(
      (c) => c.name === chainName
    );

    if (!chainRecord) {
      throw new Error(`${chainName} is not provided!`);
    }
    return chainRecord;
  };

  // get chain logo
  getChainLogo = (chainName: ChainName): string | undefined => {
    const chainRecord = this.getChainRecord(chainName);
    return (
      // until chain_registry fix this
      // chainRecord?.chain.logo_URIs?.svg ||
      // chainRecord?.chain.logo_URIs?.png ||
      // chainRecord?.chain.logo_URIs?.jpeg ||
      chainRecord?.assetList?.assets[0]?.logo_URIs?.svg ||
      chainRecord?.assetList?.assets[0]?.logo_URIs?.png ||
      undefined
    );
  };

  getNameService = async (chainName?: ChainName): Promise<NameService> => {
    let _chainName: ChainName;
    if (!chainName) {
      if (!this.defaultNameService) {
        throw new Error('defaultNameService is undefined');
      }
      const { getNameServiceRegistryFromName } = await import('./utils');
      const registry = getNameServiceRegistryFromName(this.defaultNameService);
      if (!registry) {
        throw new Error(
          'Unknown defaultNameService ' + this.defaultNameService
        );
      }
      _chainName = registry.chainName;
    } else {
      _chainName = chainName;
    }

    return await this.getWalletRepo(_chainName).getNameService();
  };

  private _reconnect = async (
    walletName: WalletName,
    checkConnection = false,
    onlyChainNames?: ChainName[]
  ) => {
    if (
      checkConnection &&
      this.getMainWallet(walletName)?.isWalletDisconnected
    ) {
      return;
    }
    this.logger?.debug('[Event Emit] `refresh_connection` (manager)');
    this.coreEmitter.emit('refresh_connection');
    await this.getMainWallet(walletName).connect();
    await Promise.all(
      this.getMainWallet(walletName)
        .getChainWalletList(true)
        .map((w, index) =>
          !onlyChainNames
            ? // If no chains specified, just connect the first chain wallet and sync to all active chain wallets.
              index === 0
              ? w.connect(true)
              : undefined
            : // If chains specified, connect only the specified chains, without sync.
            onlyChainNames.includes(w.chainName)
            ? w.connect(false)
            : undefined
        )
    );
  };

  private _restoreAccounts = async () => {
    const walletName =
      // If Cosmiframe enabled, use it by default instead of stored wallet.
      this.cosmiframeEnabled
        ? COSMIFRAME_WALLET_ID
        : window.localStorage.getItem('cosmos-kit@2:core//current-wallet');
    if (walletName) {
      try {
        const mainWallet = this.getMainWallet(walletName);
        mainWallet.activate();

        let onlyChainNames: ChainName[] | undefined;
        if (mainWallet.clientMutable.state === State.Done) {
          const accountsStr = window.localStorage.getItem(
            'cosmos-kit@2:core//accounts'
          );
          if (accountsStr && accountsStr !== '[]') {
            const accounts: SimpleAccount[] = JSON.parse(accountsStr);

            const accountChainWallets = accounts.flatMap(
              (data): ChainWalletBase | [] => {
                const chainWallet = mainWallet
                  .getChainWalletList(false)
                  .find(
                    (w) =>
                      w.chainRecord.chain?.chain_id === data.chainId &&
                      w.namespace === data.namespace
                  );
                chainWallet?.activate();
                if (mainWallet.walletInfo.mode === 'wallet-connect') {
                  chainWallet?.setData(data);
                  chainWallet?.setState(State.Done);
                }
                return chainWallet || [];
              }
            );

            mainWallet.setState(State.Done);

            // Activate all repos for the account chains and get their chain
            // records.
            const connectedChainRecords = accountChainWallets.flatMap(
              (chainWallet): ChainRecord | [] => {
                try {
                  const repo = this.getWalletRepo(chainWallet.chainName);
                  repo.activate();
                  return repo.chainRecord;
                } catch {
                  return [];
                }
              }
            );

            const attemptConnectAll = async () => {
              try {
                await mainWallet.client?.enable?.(
                  connectedChainRecords.map(
                    (chainRecord) => chainRecord.chain.chain_id
                  )
                );
                return true;
              } catch (error) {
                // If the error is a wallet rejection, log and return false to
                // indicate user rejection. Do not throw to continue.
                if (error instanceof Error && mainWallet.rejectMatched(error)) {
                  this.logger?.error(
                    `Failed to connect to stored chains: ${error.message}`
                  );
                  return false;
                }

                throw error;
              }
            };

            // Connect to all chains at once. On error (other than user
            // rejection), attempt to add each chain and try again.
            try {
              const rejected = !(await attemptConnectAll());
              // If user rejected, do not call `_reconnect` at the bottom or
              // else every chain wallet will attempt to connect to all chains
              // again.
              if (rejected) {
                return;
              }
            } catch (error) {
              // If failed to enable, add each chain and try again.
              for (const chainRecord of connectedChainRecords) {
                await mainWallet.client?.addChain?.(chainRecord);
              }

              const rejected = !(await attemptConnectAll());
              // If user rejected, do not call `_reconnect` at the bottom or
              // else every chain wallet will attempt to connect to all chains
              // again.
              if (rejected) {
                return;
              }
            }

            onlyChainNames = connectedChainRecords.map(
              (chainRecord) => chainRecord.name
            );
          }
        }

        if (mainWallet.walletInfo.mode !== 'wallet-connect') {
          await this._reconnect(walletName, undefined, onlyChainNames);
        }
      } catch (error) {
        if (error instanceof WalletNotProvidedError) {
          this.logger?.warn(error.message);
        } else {
          throw error;
        }
      }
    }
  };

  _handleCosmiframeKeystoreChangeEvent = (event: MessageEvent) => {
    if (
      typeof event.data === 'object' &&
      'event' in event.data &&
      event.data.event === COSMIFRAME_KEYSTORECHANGE_EVENT
    ) {
      // Dispatch event to our window.
      window.dispatchEvent(new Event(COSMIFRAME_KEYSTORECHANGE_EVENT));

      // Reconnect if the parent updates.
      this._reconnect(COSMIFRAME_WALLET_ID);
    }
  };

  onMounted = async () => {
    if (typeof window === 'undefined') return;

    // If Cosmiframe enabled, rebroadcast keystore change event messages as
    // events and reconnect if the parent changes. Since the outer window can be
    // a different origin (and it most likely is), it cannot dispatch events on
    // our (the iframe's) window. Thus, it posts a message with the event name
    // to our window and we broadcast it.
    if (this.cosmiframeEnabled) {
      window.addEventListener(
        'message',
        this._handleCosmiframeKeystoreChangeEvent
      );
    }

    const parser = Bowser.getParser(window.navigator.userAgent);
    const env = {
      browser: parser.getBrowserName(true),
      device: (parser.getPlatform().type || 'desktop') as DeviceType,
      os: parser.getOSName(true) as OS,
    };
    this.setEnv(env);
    this.walletRepos.forEach((repo) => repo.setEnv(env));

    await Promise.all(
      this.mainWallets.map(async (wallet) => {
        wallet.setEnv(env);
        wallet.emitter?.emit('broadcast_env', env);
        if (this.subscribeConnectEvents) {
          wallet.walletInfo.connectEventNamesOnWindow?.forEach((eventName) => {
            window.addEventListener(
              eventName,
              this._reconnectMap[wallet.walletName]!
            );
            this.logger?.debug(`Add "${eventName}" event listener to window`);
          });
          wallet.walletInfo.connectEventNamesOnClient?.forEach(
            async (eventName) => {
              wallet.client?.on?.(
                eventName,
                this._reconnectMap[wallet.walletName]!
              );
              this.logger?.debug(
                `Add "${eventName}" event listener to wallet client ${wallet.walletPrettyName}`
              );
            }
          );
        }

        if (wallet.walletInfo.mode === 'wallet-connect') {
          await wallet.initClient(this.walletConnectOptions);
        } else {
          await wallet.initClient();
        }
      })
    );

    await this._restoreAccounts();
  };

  onUnmounted = () => {
    if (typeof window === 'undefined') {
      return;
    }

    // If using Cosmiframe, stop listening for keystore change event.
    if (this.cosmiframeEnabled) {
      window.removeEventListener(
        'message',
        this._handleCosmiframeKeystoreChangeEvent
      );
    }

    this.mainWallets.forEach((wallet) => {
      wallet.walletInfo.connectEventNamesOnWindow?.forEach((eventName) => {
        window.removeEventListener(
          eventName,
          this._reconnectMap[wallet.walletName]!
        );
      });
      wallet.walletInfo.connectEventNamesOnClient?.forEach(
        async (eventName) => {
          wallet.client?.off?.(
            eventName,
            this._reconnectMap[wallet.walletName]!
          );
        }
      );
    });
  };
}
