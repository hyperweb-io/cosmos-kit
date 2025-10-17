import { MainWalletBase } from '@cosmos-kit/core';
import { wallets as coin98Extension } from '@cosmos-kit/coin98-extension';
import { wallets as compassExtension } from '@cosmos-kit/compass-extension';
import { wallets as okxwalletExtension } from '@cosmos-kit/okxwallet-extension';
import { wallets as cosmostationExtension } from '@cosmos-kit/cosmostation-extension';
import { wallets as cosmostationMobile } from '@cosmos-kit/cosmostation-mobile';
import { wallets as galaxyStationExtension } from '@cosmos-kit/galaxy-station-extension';
import { wallets as galaxyStationMobile } from '@cosmos-kit/galaxy-station-mobile';
import { wallets as keplrExtension } from '@cosmos-kit/keplr-extension';
import { wallets as keplrMobile } from '@cosmos-kit/keplr-mobile';
import { wallets as owalletExtension } from '@cosmos-kit/owallet-extension';
import { wallets as owalletMobile } from '@cosmos-kit/owallet-mobile';
import { wallets as leapExtension } from '@cosmos-kit/leap-extension';
import { wallets as leapMobile } from '@cosmos-kit/leap-mobile';
import { wallets as leapMetamaskCosmosSnap } from '@cosmos-kit/leap-metamask-cosmos-snap';
import { wallets as ledgerUSB } from '@cosmos-kit/ledger';
import { wallets as omniMobile } from '@cosmos-kit/omni-mobile';
import { wallets as finExtension } from '@cosmos-kit/fin-extension';
import { wallets as trustExtension } from '@cosmos-kit/trust-extension';
import { wallets as trustMobile } from '@cosmos-kit/trust-mobile';
import { wallets as shellExtension } from '@cosmos-kit/shell-extension';
import { wallets as ctrlExtension } from '@cosmos-kit/ctrl-extension';
import { wallets as exodusExtension } from '@cosmos-kit/exodus-extension';
import { wallets as tailwindWallet } from '@cosmos-kit/tailwind';
import { wallets as cdcwalletExtension } from '@cosmos-kit/cdcwallet-extension';
import { wallets as bitgetwalletExtension } from '@cosmos-kit/bitgetwallet-extension';
import { wallets as gatewalletExtension } from '@cosmos-kit/gatewallet-extension';

export type WalletName =
  | 'keplr'
  | 'cosmostation'
  | 'ledger'
  | 'okxwallet'
  | 'leap'
  | 'trust'
  | 'ctrl'
  | 'fin'
  | 'omni'
  | 'coin98'
  | 'shell'
  | 'compass'
  | 'tailwind'
  | 'owallet'
  | 'exodus'
  | 'galaxystation'
  | 'cdcwallet'
  | 'bitgetwallet'
  | 'gatewallet';

export type WalletList<
  E extends MainWalletBase | null,
  M extends MainWalletBase | null
> = (E extends MainWalletBase
  ? M extends MainWalletBase
  ? [E, M]
  : [E]
  : M extends MainWalletBase
  ? [M]
  : []) & {
    mobile: M | null;
    extension: E | null;
  };

export function createWalletList<
  ExtensionWallet extends MainWalletBase | null,
  MobileWallet extends MainWalletBase | null,
  MetaMaskSnap extends MainWalletBase | null
>(
  extension: ExtensionWallet | null,
  mobile: MobileWallet | null,
  snap?: MetaMaskSnap
) {
  const list = [extension, mobile, snap].filter((wallet) =>
    Boolean(wallet)
  ) as WalletList<ExtensionWallet, MobileWallet>;
  list.mobile = mobile;
  list.extension = extension;
  return list;
}

export const keplr = createWalletList(keplrExtension[0], keplrMobile[0]);
export const cosmostation = createWalletList(
  cosmostationExtension[0],
  cosmostationMobile[0]
);
export const ledger = ledgerUSB;
export const leap = createWalletList(
  leapExtension[0],
  leapMobile[0],
  leapMetamaskCosmosSnap[0]
);
export const galaxystation = createWalletList(
  galaxyStationExtension[0],
  galaxyStationMobile[0]
);
export const okxwallet = createWalletList(okxwalletExtension[0], null);
export const trust = createWalletList(trustExtension[0], trustMobile[0]);
export const ctrl = createWalletList(ctrlExtension[0], null);
export const fin = createWalletList(finExtension[0], null);
export const omni = createWalletList(null, omniMobile[0]);
export const shell = createWalletList(shellExtension[0], null);
export const coin98 = createWalletList(coin98Extension[0], null);
export const compass = createWalletList(compassExtension[0], null);
export const exodus = createWalletList(exodusExtension[0], null);
export const tailwind = createWalletList(tailwindWallet[0], null);
export const owallet = createWalletList(owalletExtension[0], owalletMobile[0]);
export const cdcwallet = createWalletList(cdcwalletExtension[0], null);
export const bitgetwallet = createWalletList(bitgetwalletExtension[0], null);
export const gatewallet = createWalletList(gatewalletExtension[0], null);

export type SubWalletList = MainWalletBase[] & {
  get mobile(): MainWalletBase[];
  get extension(): MainWalletBase[];
};

export type AllWalletList = SubWalletList & {
  keplr: typeof keplr;
  cosmostation: typeof cosmostation;
  ledger: typeof ledger;
  okxwallet: typeof okxwallet;
  leap: typeof leap;
  trust: typeof trust;
  ctrl: typeof ctrl;
  fin: typeof fin;
  omni: typeof omni;
  coin98: typeof coin98;
  compass: typeof compass;
  exodus: typeof exodus;
  tailwind: typeof tailwind;
  owallet: typeof owallet;
  cdcwallet: typeof cdcwallet;
  galaxystation: typeof galaxystation;
  bitgetwallet: typeof bitgetwallet;
  gatewallet: typeof gatewallet;
  for: (...names: WalletName[]) => SubWalletList;
  not: (...names: WalletName[]) => SubWalletList;
};

export function defineGetters(wallets: MainWalletBase[]) {
  return Object.defineProperties(wallets, {
    mobile: {
      get() {
        return this.filter(
          (wallet: MainWalletBase) => wallet.isModeWalletConnect
        );
      },
    },
    extension: {
      get() {
        return this.filter((wallet: MainWalletBase) => wallet.isModeExtension);
      },
    },
  }) as SubWalletList;
}

export function createAllWalletList(ws: MainWalletBase[]) {
  const wallets = ws.slice() as AllWalletList;

  wallets.keplr = keplr;
  wallets.cosmostation = cosmostation;
  wallets.ledger = ledger;
  wallets.okxwallet = okxwallet;
  wallets.leap = leap;
  wallets.trust = trust;
  wallets.ctrl = ctrl;
  wallets.fin = fin;
  wallets.omni = omni;
  wallets.coin98 = coin98;
  wallets.compass = compass;
  wallets.exodus = exodus;
  wallets.tailwind = tailwind;
  wallets.owallet = owallet;
  wallets.cdcwallet = cdcwallet;
  wallets.galaxystation = galaxystation;
  wallets.bitgetwallet = bitgetwallet;
  wallets.gatewallet = gatewallet;
  defineGetters(wallets);

  wallets.for = function (...ns: WalletName[]) {
    const names = Array.from(new Set(ns));
    return defineGetters(
      names
        .map((name: WalletName) =>
          wallets.filter((wallet: MainWalletBase) =>
            wallet.walletInfo.name.startsWith(name)
          )
        )
        .flat()
    );
  };

  wallets.not = function (...ns: WalletName[]) {
    const names = Array.from(new Set(ns));
    return defineGetters(
      wallets.filter(
        (wallet: MainWalletBase) =>
          !names.some((name: WalletName) =>
            wallet.walletInfo.name.startsWith(name)
          )
      )
    );
  };

  return wallets;
}

export const wallets = createAllWalletList([
  ...keplr,
  ...leap,
  ...ledger,
  ...okxwallet,
  ...trust,
  ...cosmostation,
  ...ctrl,
  ...fin,
  ...omni,
  ...coin98,
  ...compass,
  ...exodus,
  ...tailwind,
  ...owallet,
  ...cdcwallet,
  ...galaxystation,
  ...bitgetwallet,
  ...gatewallet,
]);
