import { Wallet } from '@cosmos-kit/core';

import { ICON } from '../constant';

export const lockerExtensionInfo: Wallet = {
  name: 'locker-extension',
  prettyName: 'Locker Wallet',
  logo: ICON,
  mode: 'extension',
  mobileDisabled: true,
  rejectMessage: {
    source: 'User rejected the request.',
  },
  downloads: [
    {
      device: 'desktop',
      browser: 'chrome',
      link: 'https://chromewebstore.google.com/detail/locker-protocol-wallet/pdkhlfhhjkdepnppbdpliepjaocghibh',
    },
    {
      device: 'desktop',
      browser: 'brave',
      link: 'https://chromewebstore.google.com/detail/locker-protocol-wallet/pdkhlfhhjkdepnppbdpliepjaocghibh',
    },
    {
      device: 'desktop',
      browser: 'firefox',
      link: 'https://addons.mozilla.org/firefox/addon/locker-protocol-wallet/',
    },
    {
      link: 'https://lockerprotocol.com',
    },
  ],
};
