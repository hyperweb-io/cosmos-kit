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
    projectId: '0e4915107da5b3408b38e248f7a710f4529d54cd30e9d12ff0eb886d45c18e92',
    encoding: 'base64',
    mobile: {
      native: {
        ios: 'arculuswc:',
        android: 'intent:',
      },
      universal: 'https://gw.arculus.co/app/wc'
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
        case 'android':
          return `${plainAppUrl}://wcV2?${encodedWcUrl}#Intent;package=co.arculus.wallet.android;scheme=arculuswc;end;`;
        default:
          return `${plainAppUrl}://wc?uri=${encodedWcUrl}`;
      }
    },
  },
};
