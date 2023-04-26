import {
  ExpiredError,
  Logger,
  AppUrl,
  Mutable,
  RejectedError,
  State,
  Wallet,
  WalletAccount,
  WalletClient,
  WalletClientActions,
  DappEnv,
  getStringFromUint8Array,
  getUint8ArrayFromString,
  AuthRange,
  AddRaw,
  Namespace,
  Signature,
} from '@cosmos-kit/core';
import SignClient from '@walletconnect/sign-client';
import { getSdkError } from '@walletconnect/utils';
import { PairingTypes, SessionTypes } from '@walletconnect/types';
import EventEmitter from 'events';
import { CoreUtil } from './utils';
import {
  EnableOptions,
  EnableOptionsMap,
  WalletConnectOptions,
  RequestAccount1,
  RequestAccount2,
  RequestAccount3,
  CosmosDoc,
  EthereumDoc,
  CosmosSignResponse,
} from './types';
import Long from 'long';
import { defaultEnableOptions } from './config';
import { CosmosDocValidator } from './type-guards';

const EXPLORER_API = 'https://explorer-api.walletconnect.com';

export class WCClient implements WalletClient {
  readonly walletInfo: Wallet;
  readonly options?: WalletConnectOptions;

  signClient?: SignClient;
  wcCloudInfo?: any; // info from WalletConnect Cloud Explorer
  actions?: WalletClientActions;
  qrUrl: Mutable<string>;
  appUrl: Mutable<AppUrl>;

  pairings: PairingTypes.Struct[] = [];
  sessions: SessionTypes.Struct[] = [];
  emitter?: EventEmitter;
  logger?: Logger;
  relayUrl?: string;
  env?: DappEnv;

  constructor(walletInfo: Wallet, options?: WalletConnectOptions) {
    if (!walletInfo.walletconnect) {
      throw new Error(
        `'walletconnect' info for wallet ${walletInfo.prettyName} is not provided in wallet registry.`
      );
    }
    this.walletInfo = walletInfo;
    this.options = options;

    this.qrUrl = { state: State.Init };
    this.appUrl = { state: State.Init };
  }

  get isMobile() {
    return this.env?.device === 'mobile';
  }

  // walletconnect wallet name
  get wcName(): string {
    return this.walletInfo.walletconnect.name;
  }

  // wallet defined bytes encoding
  get wcEncoding(): BufferEncoding {
    return this.walletInfo.walletconnect.encoding || 'hex';
  }

  // walletconnect wallet project id
  get wcProjectId(): string {
    return this.walletInfo.walletconnect.projectId;
  }

  // walletconnect wallet mobile link
  get wcMobile() {
    return this.walletInfo.walletconnect.mobile;
  }

  deleteSession(topic: string) {
    const chainIds = [];
    this.sessions = this.sessions.filter((s) => {
      if (s.topic === topic) {
        s.namespaces.cosmos.accounts.forEach((account) => {
          const [, chainId] = account.split(':');
          chainIds.push(chainId);
        });
        return false;
      } else {
        return true;
      }
    });
    this.emitter?.emit('reset', chainIds);
    this.logger?.debug('[WALLET EVENT] Emit `reset`');
  }

  protected async subscribeToEvents() {
    if (typeof this.signClient === 'undefined') {
      await this.init();
    }

    this.signClient.on('session_ping', (args) => {
      this.logger?.debug('EVENT', 'session_ping', args);
    });

    this.signClient.on('session_event', async (args) => {
      this.logger?.debug('EVENT', 'session_event', args);
      // const {
      //   topic,
      //   params: { event, chainId },
      // } = args;
      // if (this.session?.topic != topic) return;
      // if (event.name === 'accountsChanged') {
      //   await this.connect(
      //     this.accounts.map(([, chainId]) => chainId),
      //     false
      //   );
      // }
    });

    this.signClient.on('session_update', ({ topic, params }) => {
      this.logger?.debug('EVENT', 'session_update', { topic, params });
      // if (this.session?.topic != topic) return;

      // const { namespaces } = params;
      // const _session = this.signClient.session.get(topic);
      // this.session = { ..._session, namespaces };
    });

    this.signClient.on('session_delete', (args) => {
      this.logger?.debug('EVENT', 'session_delete', args);
      this.deleteSession(args.topic);
    });

    this.signClient.on('session_expire', (args) => {
      this.logger?.debug('EVENT', 'session_expire', args);
      this.deleteSession(args.topic);
    });

    this.signClient.on('session_proposal', (args) => {
      this.logger?.debug('EVENT', 'session_proposal', args);
    });

    this.signClient.on('session_request', (args) => {
      this.logger?.debug('EVENT', 'session_request', args);
    });

    this.signClient.on('proposal_expire', (args) => {
      this.logger?.debug('EVENT', 'proposal_expire', args);
    });
  }

  protected async deleteInactivePairings() {
    if (typeof this.signClient === 'undefined') {
      await this.init();
    }

    for (const pairing of this.signClient.pairing.getAll({ active: false })) {
      await this.signClient.pairing.delete(pairing.topic, {
        code: 7001,
        message: 'Clear inactive pairings.',
      });
      this.logger?.debug('Delete inactive pairing:', pairing.topic);
    }
  }

  protected async restorePairings() {
    if (typeof this.signClient === 'undefined') {
      await this.init();
    }
    this.pairings = this.signClient.pairing
      .getAll({ active: true })
      .filter(
        (p) =>
          p.peerMetadata?.name === this.wcName &&
          p.expiry * 1000 > Date.now() + 1000
      );
    this.logger?.debug('RESTORED PAIRINGS: ', this.pairings);
  }

  get pairing(): PairingTypes.Struct | undefined {
    return this.pairings[0];
  }

  protected async restoreSessions() {
    if (typeof this.signClient === 'undefined') {
      await this.init();
    }
    this.sessions = this.signClient.session
      .getAll()
      .filter(
        (s) =>
          s.peer.metadata.name === this.wcName &&
          s.expiry * 1000 > Date.now() + 1000
      );
    this.logger?.debug('RESTORED SESSIONS: ', this.sessions);
  }

  protected getSessionWithMethod(
    prefix: string,
    chainId: string,
    method: string
  ): SessionTypes.Struct {
    return this.sessions.find((s) => {
      if (!s.namespaces[prefix]) {
        return false;
      }
      const { accounts, methods } = s.namespaces[prefix];
      return (
        accounts.find((acc) => acc.startsWith(`${prefix}:${chainId}`)) &&
        methods.findIndex((m) => m === method) !== -1
      );
    });
  }

  protected getSession(prefix: string, chainId: string): SessionTypes.Struct {
    return this.sessions.find((s) => {
      if (!s.namespaces[prefix]) {
        return false;
      }
      const { accounts } = s.namespaces[prefix];
      return accounts.find((acc) => acc.startsWith(`${prefix}:${chainId}`));
    });
  }

  get walletName() {
    return this.walletInfo.name;
  }

  get dappProjectId() {
    return this.options?.initSignClientOptions.projectId;
  }

  setActions(actions: WalletClientActions) {
    this.actions = actions;
  }

  setQRState(state: State) {
    this.qrUrl.state = state;
    this.actions?.qrUrl?.state?.(state);
  }

  setQRError(e?: Error | string) {
    this.setQRState(State.Error);
    this.qrUrl.message = typeof e === 'string' ? e : e?.message;
    this.actions?.qrUrl?.message?.(this.qrUrl.message);
    if (typeof e !== 'string' && e?.stack) {
      this.logger?.error(e.stack);
    }
  }

  async init() {
    await this.initSignClient();
    if (this.isMobile) {
      await this.initAppUrl();
    }
  }

  protected async initSignClient() {
    if (
      this.signClient &&
      this.relayUrl === this.options?.initSignClientOptions.relayUrl
    ) {
      return;
    }

    this.signClient = await SignClient.init(
      this.options?.initSignClientOptions
    );
    this.relayUrl = this.options?.initSignClientOptions.relayUrl;

    this.logger?.debug('CREATED CLIENT: ', this.signClient);
    this.logger?.debug('relayerRegion ', this.relayUrl);

    await this.subscribeToEvents();
    await this.restorePairings();
    await this.restoreSessions();
  }

  protected async initWCCloudInfo() {
    const fetcUrl = `${EXPLORER_API}/v3/wallets?projectId=${this.dappProjectId}&sdks=sign_v2&search=${this.wcName}`;
    const fetched = await (await fetch(fetcUrl)).json();
    this.wcCloudInfo =
      fetched.listings[this.walletInfo.walletconnect?.projectId!];
    this.logger?.debug('WalletConnect Info:', this.wcCloudInfo);
  }

  protected async initAppUrl() {
    this.appUrl.state = State.Pending;

    if (!this.wcCloudInfo) await this.initWCCloudInfo();

    const native = this.wcCloudInfo.mobile.native || this.wcMobile?.native;
    const universal =
      this.wcCloudInfo.mobile.universal || this.wcMobile?.universal;

    this.appUrl.data = { native, universal };
    this.appUrl.state = State.Done;
  }

  get nativeUrl() {
    return this.appUrl.data?.native;
  }

  get universalUrl() {
    return this.appUrl.data?.universal;
  }

  get redirectHref(): string | undefined {
    return this.nativeUrl || this.universalUrl;
  }

  get redirectHrefWithWCUri(): string | undefined {
    let href: string | undefined;
    if (this.nativeUrl) {
      href = (
        this.walletInfo.walletconnect.formatNativeUrl ||
        CoreUtil.formatNativeUrl
      )(this.nativeUrl, this.qrUrl.data, this.walletName);
    } else if (this.universalUrl) {
      href = (
        this.walletInfo.walletconnect.formatNativeUrl ||
        CoreUtil.formatUniversalUrl
      )(this.universalUrl, this.qrUrl.data, this.walletName);
    }
    return href;
  }

  get displayQRCode() {
    if (this.pairing || this.redirect) {
      return false;
    } else {
      return true;
    }
  }

  get redirect() {
    return Boolean(this.isMobile && (this.nativeUrl || this.universalUrl));
  }

  openApp(withWCUri: boolean = true) {
    const href = withWCUri ? this.redirectHrefWithWCUri : this.redirectHref;
    if (href) {
      this.logger?.debug('Redirecting:', href);
      CoreUtil.openHref(href);
    } else {
      this.logger?.error('No redirecting href.');
    }
  }

  async enable(authRange: AuthRange, options?: EnableOptionsMap) {
    if (typeof this.signClient === 'undefined') {
      await this.init();
    }

    if (this.qrUrl.state !== 'Init') {
      this.setQRState(State.Init);
    }

    await this.restorePairings();
    const pairing = this.pairing;
    this.logger?.debug('Restored active pairing topic is:', pairing?.topic);

    if (this.displayQRCode) this.setQRState(State.Pending);

    const _options =
      options || this.options?.enableOptions || defaultEnableOptions;
    const requiredNamespaces = Object.fromEntries(
      Object.entries(authRange).map(([ns, { chainIds }]) => {
        if (typeof _options[ns] === 'undefined') {
          throw new Error(`Unknown namespace ${ns} for WalletConnect.`);
        }
        const { prefix, methods, events } = _options[ns] as EnableOptions;
        return [
          prefix,
          {
            chains: chainIds
              ? chainIds.map((chainId) => `${prefix}:${chainId}`)
              : void 0,
            methods,
            events,
          },
        ];
      })
    );

    let connectResp: any;
    try {
      this.logger?.debug('Connecting namespaces:', _options);
      connectResp = await this.signClient.connect({
        pairingTopic: pairing?.topic,
        requiredNamespaces,
      });
      this.qrUrl.data = connectResp.uri;
      this.logger?.debug('Using QR URI:', connectResp.uri);
      if (this.displayQRCode) this.setQRState(State.Done);
    } catch (error) {
      this.logger?.error('Client connect error: ', error);
      if (this.displayQRCode) this.setQRError(error);
      return;
    }

    if (this.redirect) this.openApp();

    try {
      const session = await connectResp.approval();
      this.logger?.debug('Established session:', session);
      this.sessions.push(session);
      await this.restorePairings();
    } catch (error) {
      this.logger?.error('Session approval error: ', error);
      await this.deleteInactivePairings();
      if (!error) {
        if (this.displayQRCode) this.setQRError(ExpiredError);
        throw new Error('Proposal Expired');
      } else if (error.code == 5001) {
        throw RejectedError;
      } else {
        throw error;
      }
    } finally {
      if (!pairing && this.qrUrl.message !== ExpiredError.message) {
        this.setQRState(State.Init);
      }
    }
  }

  async disable(authRange: AuthRange, options?: unknown) {
    if (typeof this.signClient === 'undefined') {
      await this.init();
    }
    if (this.sessions.length === 0) {
      return;
    }

    for (const session of this.sessions) {
      try {
        this.logger?.debug('Delete session:', session);
        await this.signClient.disconnect({
          topic: session.topic,
          reason: getSdkError('USER_DISCONNECTED'),
        });
      } catch (error) {
        this.logger?.error(
          `SignClient.disconnect session ${session.topic} failed:`,
          error
        );
      }
    }
    this.sessions = [];
  }

  protected getAccountsFromSession(
    namespace: Namespace,
    prefix: string,
    chainId: string
  ): WalletAccount[] {
    const session = this.getSession(prefix, chainId);
    const accounts: WalletAccount[] = [];
    Object.entries(session.namespaces).forEach(([, nsValue]) => {
      nsValue.accounts.forEach((account) => {
        const [prefix2, chainId, address] = account.split(':');
        if (prefix === prefix2) {
          accounts.push({
            address: {
              value: address,
            },
            namespace,
            chainId,
          });
        }
      });
    });
    return accounts;
  }

  protected getPrefix(namespace: Namespace): string {
    const prefix = defaultEnableOptions[namespace]?.prefix as string;
    if (!prefix) {
      throw new Error(
        `No matched prefix in WalletConnect for namespace ${namespace}.`
      );
    }
    return prefix;
  }

  async getAccounts(
    authRange: AuthRange,
    options?: unknown
  ): Promise<AddRaw<WalletAccount>[]> {
    const accountsList = await Promise.all(
      Object.entries(authRange).map(async ([namespace, { chainIds }]) => {
        if (!chainIds) {
          return Promise.reject('No chainIds provided.');
        }
        const prefix = this.getPrefix(namespace as Namespace);
        return Promise.all(
          chainIds.map(async (chainId) => {
            const sessionAccounts = this.getAccountsFromSession(
              namespace as Namespace,
              prefix,
              chainId
            );
            let method: string;
            switch (namespace) {
              case 'ethereum':
              case 'everscale':
              case 'stellar':
                return sessionAccounts;
              case 'cosmos':
                method = 'cosmos_getAccounts';
              case 'tezos':
                method = 'tezos_getAccounts';
              case 'solana':
                method = 'solana_getAccounts';
              case 'near':
                method = 'near_getAccounts';

                const session = this.getSessionWithMethod(
                  prefix,
                  chainId,
                  method
                );
                if (typeof session === 'undefined') {
                  return sessionAccounts;
                }

                const requestAccounts = await this.signClient.request({
                  topic: session.topic,
                  chainId: `${prefix}:${chainId}`,
                  request: {
                    method,
                    params: {},
                  },
                });
                if (namespace == 'cosmos' || namespace == 'tezos') {
                  return (requestAccounts as RequestAccount1[]).map(
                    (acc) =>
                      ({
                        address: {
                          value: acc.address,
                        },
                        namespace,
                        chainId,
                        publicKey: {
                          value: acc.pubkey,
                          algo: acc.algo,
                        },
                      } as WalletAccount)
                  );
                } else if (namespace == 'solana') {
                  return (requestAccounts as RequestAccount2[]).map(
                    (acc) =>
                      ({
                        address: {
                          value: acc.pubkey,
                        },
                        namespace,
                        chainId,
                        publicKey: {
                          value: acc.pubkey,
                        },
                      } as WalletAccount)
                  );
                } else if (namespace == 'near') {
                  return (requestAccounts as RequestAccount3[]).map(
                    (acc) =>
                      ({
                        name: acc.accountId,
                        namespace,
                        chainId,
                        publicKey: {
                          value: acc.pubkey,
                        },
                      } as WalletAccount)
                  );
                }
              default:
                return Promise.reject(`Unmatched namespace: ${namespace}.`);
            }
          })
        );
      })
    );
    return accountsList.flat().flat();
  }

  async sign(
    namespace: Namespace,
    chainId: string,
    signer: string,
    doc: CosmosDoc.Amino | CosmosDoc.Direct | EthereumDoc.HexBytes,
    options?: WalletConnectOptions['signOptions']
  ): Promise<AddRaw<Signature>> {
    const prefix = this.getPrefix(namespace as Namespace);
    let method: string, params: object;
    switch (namespace) {
      case 'cosmos':
        if (CosmosDocValidator.isDirect(doc)) {
          method = 'cosmos_signDirect';
          params = {
            signerAddress: signer,
            signDoc: doc,
          };
        } else if (CosmosDocValidator.isAmino(doc)) {
          method = 'cosmos_signAmino';
          params = {
            signerAddress: signer,
            signDoc: doc,
          };
        } else {
          return Promise.reject('Unmatched doc type.');
        }
      case 'ethereum':
        if (EthereumDocValidator.isHexString(doc)) {
          const _options = options || this.options?.signOptions;
          if (_options?.ethereum?.signHexBytes == 'personal_sign') {
            method = 'personal_sign';
            params = [doc, signer];
          } else if (_options?.ethereum?.signHexBytes == 'eth_sign') {
            method = 'eth_sign';
            params = [signer, doc];
          } else {
            return Promise.reject(
              'There are two sign methods for hex bytes doc possiblely provided by wallet. Please set `signHexBytes` in options.'
            );
          }
        } else if (EthereumDocValidator.isTypedData(doc)) {
          method = 'eth_signTypedData';
          params = [signer, doc];
        } else if (EthereumDocValidator.isTypedData(doc)) {
          method = 'eth_signTypedData';
          params = [signer, doc];
        } else {
          return Promise.reject('Unmatched doc type.');
        }

        const session = this.getSessionWithMethod(prefix, chainId, method);
        if (typeof session === 'undefined') {
          throw new Error(
            `Session for ${chainId} with method ${method} not established yet.`
          );
        }

        const resp = await this.signClient.request({
          topic: session.topic,
          chainId: `${prefix}:${chainId}`,
          request: {
            method,
            params,
          },
        });

        switch (method) {
          case 'cosmos_signDirect':
          case 'cosmos_signAmino':
            const { signature, signed } = resp as
              | CosmosSignResponse.Direct
              | CosmosSignResponse.Amino;
            return {
              signature: {
                value: signature.signature,
              },
              publicKey: {
                value: signature.pub_key.value,
                algo: signature.pub_key.type,
              },
              signedDoc: signed,
            };
          default:
            return Promise.reject(`Unmatched method: ${method}.`);
        }
      default:
        return Promise.reject(`Unmatched namespace: ${namespace}.`);
    }
  }

  protected async _signAmino(
    chainId: string,
    signer: string,
    signDoc: StdSignDoc,
    signOptions?: SignOptions
  ) {
    const session = this.getSession('cosmos', chainId);
    if (!session) {
      throw new Error(`Session for ${chainId} not established yet.`);
    }

    if (this.redirect) this.openApp();

    const resp = await this.signClient.request({
      topic: session.topic,
      chainId: `cosmos:${chainId}`,
      request: {
        method: 'cosmos_signAmino',
        params: {
          signerAddress: signer,
          signDoc,
        },
      },
    });
    this.logger?.debug(`Response of cosmos_signAmino`, resp);
    return resp;
  }

  async signAmino(
    chainId: string,
    signer: string,
    signDoc: StdSignDoc,
    signOptions?: SignOptions
  ): Promise<AminoSignResponse> {
    const result = (await this._signAmino(
      chainId,
      signer,
      signDoc,
      signOptions
    )) as AminoSignResponse;
    return result;
  }

  protected async _signDirect(
    chainId: string,
    signer: string,
    signDoc: DirectSignDoc,
    signOptions?: SignOptions
  ) {
    const session = this.getSession('cosmos', chainId);
    if (!session) {
      throw new Error(`Session for ${chainId} not established yet.`);
    }
    const signDocValue: WCSignDirectRequest = {
      signerAddress: signer,
      signDoc: {
        chainId: signDoc.chainId,
        bodyBytes: getStringFromUint8Array(signDoc.bodyBytes, this.wcEncoding),
        authInfoBytes: getStringFromUint8Array(
          signDoc.authInfoBytes,
          this.wcEncoding
        ),
        accountNumber: signDoc.accountNumber.toString(),
      },
    };

    if (this.redirect) this.openApp();

    const resp = await this.signClient.request({
      topic: session.topic,
      chainId: `cosmos:${chainId}`,
      request: {
        method: 'cosmos_signDirect',
        params: signDocValue,
      },
    });
    this.logger?.debug(`Response of cosmos_signDirect`, resp);
    return resp;
  }

  async signDirect(
    chainId: string,
    signer: string,
    signDoc: DirectSignDoc,
    signOptions?: SignOptions
  ): Promise<DirectSignResponse> {
    const { signed, signature } = (await this._signDirect(
      chainId,
      signer,
      signDoc,
      signOptions
    )) as CosmosSignDirectResponse;
    return {
      signed: {
        chainId: signed.chainId,
        accountNumber: Long.fromString(signed.accountNumber, false),
        authInfoBytes: getUint8ArrayFromString(
          signed.authInfoBytes,
          this.wcEncoding
        ),
        bodyBytes: getUint8ArrayFromString(signed.bodyBytes, this.wcEncoding),
      },
      signature,
    };
  }

  // restoreLatestSession() {
  //   if (typeof this.signClient === 'undefined') {
  //     await this.init();
  //   }
  //   if (typeof this.session !== 'undefined') return;

  //   const targetKey = this.signClient.session.keys.reverse().find((key) => {
  //     const session = this.signClient.session.get(key);
  //     return (
  //       session.peer.metadata.name === this.walletWCName &&
  //       session.expiry * 1000 > Date.now() + 1000
  //     );
  //   });

  //   if (targetKey) {
  //     this.session = this.signClient.session.get(targetKey);
  //     this.logger?.debug('RESTORED LATEST SESSION:', this.session);
  //   }
  // }
}
