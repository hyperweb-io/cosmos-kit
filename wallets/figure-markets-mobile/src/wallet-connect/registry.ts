import { OS, Wallet } from '@cosmos-kit/core';

import { ICON } from '../constant';

export const figureMarketsMobileInfo: Wallet = {
  name: 'figure-markets-mobile',
  prettyName: 'Figure Markets Mobile',
  logo: ICON,
  mode: 'wallet-connect',
  mobileDisabled: () =>
    'figure-markets' in window &&
    /FigureMarketsCosmos/i.test(navigator.userAgent),
  rejectMessage: {
    source: 'Request rejected',
  },
  downloads: [
    {
      device: 'mobile',
      os: 'android',
      link: 'https://play.google.com/store/apps/details?id=com.figuremarkets.wallet.android',
    },
    {
      device: 'mobile',
      os: 'ios',
      link: 'https://apps.apple.com/us/app/figure-markets-wallet/id1575425801',
    },
    {
      link: 'https://www.figure.com/',
    },
  ],
  connectEventNamesOnWindow: ['figure_markets_keystorechange'],
  supportedChains: ['provenance'],
  walletconnect: {
    name: 'Figure Markets Wallet',
    projectId:
      '0e4915107da5b3408b38e248f7a710f4529d54cd30e9d12ff0eb886d45c18e92',
    encoding: 'base64',
    mobile: {
      native: {
        ios: 'figuremarketswc:',
        android: 'intent:',
      },
      universal: 'https://gw.figure.com/app/wc',
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
          return `${plainAppUrl}://wcV2?${encodedWcUrl}#Intent;package=com.figuremarkets.wallet.android;scheme=figuremarketswc;end;`;
        default:
          return `${plainAppUrl}://wcV2?${encodedWcUrl}`;
      }
    },
  },
};
