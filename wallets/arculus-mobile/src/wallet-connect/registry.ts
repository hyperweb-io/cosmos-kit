import { OS, Wallet } from '@cosmos-kit/core';

import { ICON } from '../constant';

export const ArculusMobileInfo: Wallet = {
  name: 'arculus-mobile',
  prettyName: 'Arculus Mobile',
  logo: ICON,
  mode: 'wallet-connect',
  mobileDisabled: () => 'arculus' in window && /ArculusCosmos/i.test(navigator.userAgent),
  rejectMessage: {
    source: 'Request rejected',
  },
  downloads: [
    {
      device: 'mobile',
      os: 'android',
      link:
        'https://play.google.com/store/apps/details?id=co.arculus.wallet.android',
    },
    {
      device: 'mobile',
      os: 'ios',
      link: 'https://apps.apple.com/us/app/arculus-wallet/id1575425801',
    },
    {
      link:
        'https://www.getarculus.com/',
    },
  ],
  connectEventNamesOnWindow: ['arculus_keystorechange'],
  walletconnect: {
    name: 'Arculus Wallet',
    projectId: 'd5235b42fc7273823b6dc3214c822da3',
    mobile: {
      native: {
        ios: 'arculuswc:',
        android: 'arculuswc:',
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
        default:
          return `${plainAppUrl}://wcV2?${encodedWcUrl}`;
      }
    },
  },
};
