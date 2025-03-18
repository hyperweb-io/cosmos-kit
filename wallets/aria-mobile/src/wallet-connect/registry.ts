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
  },
};
