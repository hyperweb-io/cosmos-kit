import { Wallet } from '@cosmos-kit/core';
import { ICON } from '../constant';

export const ariaExtensionInfo: Wallet = {
  name: 'aria-extension',
  prettyName: 'Aria',
  logo: ICON,
  mode: 'extension',
  mobileDisabled: () => !('aria' in window),
  rejectMessage: {
    source: 'Request rejected',
  },
  connectEventNamesOnWindow: ['aria_keystorechange'],
  downloads: [
    {
      device: 'desktop',
      browser: 'chrome',
      link: 'https://chromewebstore.google.com/detail/aria-wallet/cgghllcclkhfpkjhgomhehlebgphifbm',
    },
  ],
};
