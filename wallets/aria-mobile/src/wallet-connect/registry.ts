import { OS, Wallet } from '@cosmos-kit/core';

import { ICON } from '../constant';

export const AriaMobileInfo: Wallet = {
  name: 'aria-cosmos-mobile',
  prettyName: 'Aria Mobile',
  logo: ICON,
  mode: 'wallet-connect',
  mobileDisabled: () => false,
  rejectMessage: {
    source: 'Request rejected',
  },
  downloads: [
    {
      link: 'https://chromewebstore.google.com/detail/aria-wallet/cgghllcclkhfpkjhgomhehlebgphifbm',
    },
  ],
  walletconnect: {
    name: 'Aria',
    projectId: '70ba37949838afd24f17421f5b6bcfd0',
    encoding: 'base64',
    // Custom Aria-specific WalletConnect methods for extended functionality
    requiredNamespaces: {
      methods: [
        // Core extended methods
        'aria_signArbitrary',
        'aria_sendTx',
        'aria_verifyArbitrary',
        // Power features
        'aria_getKeysSettled',
        'aria_getChainInfosWithoutEndpoints',
        // EVM support
        'aria_signEthereum',
        // Advanced signing
        'aria_signDirectAux',
        'aria_experimentalSignEIP712CosmosTx_v0',
      ],
      events: ['aria_keystorechange', 'aria_accountsChanged'],
    },
    mobile: {
      native: {
        ios: 'ariawallet:',
        android: 'intent:',
      },
    },
    formatNativeUrl: (
      appUrl: string,
      wcUri: string,
      os: OS | undefined,
      _name: string
    ): string => {
      const plainAppUrl = appUrl.split(':')[0];
      const encodedWcUrl = encodeURIComponent(wcUri);
      switch (os) {
        case 'ios':
          return `${plainAppUrl}://wcV2?${encodedWcUrl}`;
        case 'android':
          return `intent://wcV2?${encodedWcUrl}#Intent;package=com.orchestralabs.aria;scheme=ariawallet;end;`;
        default:
          return `${plainAppUrl}://wcV2?${encodedWcUrl}`;
      }
    },
  },
};
