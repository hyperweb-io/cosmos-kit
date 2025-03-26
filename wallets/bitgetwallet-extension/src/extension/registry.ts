import { Wallet } from '@cosmos-kit/core';

import { ICON } from '../constant';

export const BitgetwalletExtensionInfo: Wallet = {
  name: 'bitgetwallet-extension',
  prettyName: 'Bitget Wallet',
  logo: ICON,
  mode: 'extension',
  mobileDisabled: true,
  rejectMessage: {
    source: 'Request rejected',
  },
  connectEventNamesOnWindow: ['bitget_keystorechange'],
  downloads: [
    {
      device: 'desktop',
      browser: 'chrome',
      link: 'https://chromewebstore.google.com/detail/bitget-wallet-crypto-web3/jiidiaalihmmhddjgbnbgdfflelocpak'
    },
    {
      link: 'https://www.bitget.com/download'
    },
  ]
};
