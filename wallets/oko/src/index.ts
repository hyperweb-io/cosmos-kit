import { OkoMainWallet } from "./main-wallet";
import { okoWalletInfo } from "./registry";
import type { OkoWalletOptions, OkoLoginMethod } from "./types";

export const makeOkoWallets = (
  options: Omit<OkoWalletOptions, "loginProvider"> & {
    loginMethods: OkoLoginMethod[];
  }
): OkoMainWallet[] =>
  options.loginMethods.map(
    ({ provider, name, logo }) =>
      new OkoMainWallet({
        ...okoWalletInfo,
        name: okoWalletInfo.name + "_" + provider,
        prettyName: name,
        logo: logo || okoWalletInfo.logo,
        options: {
          ...options,
          loginProvider: provider,
        },
      })
  );

export { OkoMainWallet } from "./main-wallet";
export { OkoChainWallet } from "./chain-wallet";
export { OkoWalletClient } from "./client";
export { okoWalletInfo } from "./registry";
export type { OkoWalletOptions, OkoLoginMethod, OkoLoginProvider } from "./types";
