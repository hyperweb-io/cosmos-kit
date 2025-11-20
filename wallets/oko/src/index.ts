import { PROVIDER_CONFIG } from './constant';
import { OkoMainWallet } from './main-wallet';
import { okoWalletInfo } from './registry';
import type { OkoLoginProvider, OkoWalletOptions } from './types';

export const makeOkoWallets = (options: OkoWalletOptions): OkoMainWallet[] => {
  // If no loginMethods specified, use all available providers
  const providers =
    options.loginMethods?.map((m) => m.provider) ??
    (Object.keys(PROVIDER_CONFIG) as OkoLoginProvider[]);

  return providers.map((provider) => {
    const providerConfig = PROVIDER_CONFIG[provider];

    const { loginMethods, ...baseOptions } = options;
    const internalOptions = {
      ...baseOptions,
      loginProvider: provider,
    };

    return new OkoMainWallet({
      ...okoWalletInfo,
      name: okoWalletInfo.name + '_' + provider,
      prettyName: providerConfig?.name || okoWalletInfo.prettyName,
      logo: providerConfig?.logo
        ? { major: okoWalletInfo.logo as string, minor: providerConfig.logo }
        : okoWalletInfo.logo,
      options: internalOptions,
    });
  });
};

export { OkoChainWallet } from './chain-wallet';
export { OkoWalletClient } from './client';
export { OkoMainWallet } from './main-wallet';
export { okoWalletInfo } from './registry';
export type {
  OkoLoginMethod,
  OkoLoginProvider,
  OkoWalletOptions,
} from './types';
