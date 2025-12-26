import { Wallet } from '@cosmos-kit/core';

import { ICON } from '../constant';

export const vultisigExtensionInfo: Wallet = {
  name: 'vultisig-extension',
  prettyName: 'Vultisig',
  logo: ICON,
  mode: 'extension',
  mobileDisabled: true,
  rejectMessage: {
    source: 'Request rejected',
  },
  downloads: [
    {
      device: 'desktop',
      browser: 'chrome',
      link: 'https://chromewebstore.google.com/detail/vultisig-extension/ggafhcdaplkhmmnlbfjpnnkepdfjaelb',
    },
    {
      link: 'https://chromewebstore.google.com/detail/vultisig-extension/ggafhcdaplkhmmnlbfjpnnkepdfjaelb',
    },
  ],
};
