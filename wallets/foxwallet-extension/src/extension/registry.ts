import { Wallet } from '@cosmos-kit/core';

import { ICON } from '../constant';

export const FoxWalletExtensionInfo: Wallet = {
  name: 'foxwallet-extension',
  prettyName: 'FoxWallet',
  logo: ICON,
  mode: 'extension',
  mobileDisabled: false,
  rejectMessage: {
    source: 'Request rejected',
  },
  connectEventNamesOnWindow: ['foxwallet_keystorechange'],
  downloads: [
    {
      device: 'mobile',
      os: 'android',
      link: 'https://play.google.com/store/apps/details?id=com.foxwallet.play&pli=1',
    },
    {
      device: 'mobile',
      os: 'ios',
      link: 'https://apps.apple.com/us/app/foxwallet-secure-crypto-asset/id1590983231',
    },
    {
      link: 'https://foxwallet.com/download',
    },
  ],
};
