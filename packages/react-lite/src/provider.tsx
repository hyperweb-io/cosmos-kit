import type { AssetList, Chain } from '@chain-registry/types';
import {
  ChainName,
  Data,
  EndpointOptions,
  Logger,
  LogLevel,
  MainWalletBase,
  NameServiceName,
  SessionOptions,
  SignerOptions,
  State,
  WalletConnectOptions,
  WalletManager,
  WalletModalProps,
  WalletRepo,
} from '@cosmos-kit/core';
import { Origin } from '@dao-dao/cosmiframe';
import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

export const walletContext = createContext<{
  walletManager: WalletManager;
  modalProvided: boolean;
} | null>(null);

export function ChainProvider({
  chains,
  assetLists,
  wallets,
  walletModal: ProvidedWalletModal,
  throwErrors = false,
  subscribeConnectEvents = true,
  defaultNameService = 'icns',
  walletConnectOptions,
  signerOptions,
  endpointOptions,
  sessionOptions,
  logLevel = 'WARN',
  allowedIframeParentOrigins,
  children,
}: {
  chains: (Chain | ChainName)[];
  wallets: MainWalletBase[];
  assetLists?: AssetList[];
  walletModal?: (props: WalletModalProps) => ReactElement;
  throwErrors?: boolean | 'connect_only';
  subscribeConnectEvents?: boolean;
  defaultNameService?: NameServiceName;
  walletConnectOptions?: WalletConnectOptions; // SignClientOptions is required if using wallet connect v2
  signerOptions?: SignerOptions;
  endpointOptions?: EndpointOptions;
  sessionOptions?: SessionOptions;
  logLevel?: LogLevel;
  /**
   * Origins to allow wrapping this app in an iframe and connecting to this
   * Cosmos Kit instance.
   *
   * Defaults to localhost, Osmosis, DAO DAO, and Abstract.
   */
  allowedIframeParentOrigins?: Origin[];
  children: ReactNode;
}) {
  const logger = useMemo(() => new Logger(logLevel), []);

  const [isViewOpen, setViewOpen] = useState<boolean>(false);
  const [viewWalletRepo, setViewWalletRepo] = useState<
    WalletRepo | undefined
  >();

  const [data, setData] = useState<Data>();
  const [state, setState] = useState<State>(State.Init);
  const [msg, setMsg] = useState<string | undefined>();

  const [, setClientState] = useState<State>(State.Init);
  const [, setClientMsg] = useState<string | undefined>();

  const [render, forceRender] = useState<number>(0);

  logger.debug('[provider.tsx] data:', data);
  logger.debug('[provider.tsx] state:', state);
  logger.debug('[provider.tsx] message:', msg);

  const [walletManager, setWalletManager] = useState<WalletManager | null>();

  useEffect(() => {
    const walletManager = new WalletManager(
      chains,
      wallets,
      logger,
      throwErrors,
      subscribeConnectEvents,
      allowedIframeParentOrigins,
      assetLists,
      defaultNameService,
      walletConnectOptions,
      signerOptions,
      endpointOptions,
      sessionOptions
    );

    walletManager.setActions({
      viewOpen: setViewOpen,
      viewWalletRepo: setViewWalletRepo,
      data: setData,
      state: setState,
      message: setMsg,
    });

    walletManager.walletRepos.forEach((wr) => {
      wr.setActions({
        viewOpen: setViewOpen,
        viewWalletRepo: setViewWalletRepo,
        render: forceRender,
      });
      wr.wallets.forEach((w) => {
        w.setActions({
          data: setData,
          state: setState,
          message: setMsg,
        });
      });
    });

    walletManager.mainWallets.forEach((w) => {
      w.setActions({
        data: setData,
        state: setState,
        message: setMsg,
        clientState: setClientState,
        clientMessage: setClientMsg,
      });
    });

    setWalletManager(walletManager);
  }, []);

  useEffect(() => {
    walletManager?.onMounted();
    return () => {
      setViewOpen(false);
      walletManager?.onUnmounted();
    };
  }, [render, walletManager]);

  if (!walletManager) return null;

  return (
    <walletContext.Provider
      value={{ walletManager, modalProvided: Boolean(ProvidedWalletModal) }}
    >
      {ProvidedWalletModal && (
        <ProvidedWalletModal
          isOpen={isViewOpen}
          setOpen={setViewOpen}
          walletRepo={viewWalletRepo}
        />
      )}
      {children}
    </walletContext.Provider>
  );
}
