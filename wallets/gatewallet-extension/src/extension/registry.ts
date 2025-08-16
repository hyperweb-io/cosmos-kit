import { Wallet } from '@cosmos-kit/core';

import { ICON } from '../constant';

export const GatewalletExtensionInfo: Wallet = {
  name: 'gatewallet-extension',
  prettyName: 'GateWallet',
  logo: ICON,
  mode: 'extension',
  mobileDisabled: false,
  rejectMessage: {
    source: 'Request rejected',
  },
  connectEventNamesOnWindow: ['gatewallet_keystorechange'],
  downloads: [
    {
      link: 'https://www.gate.io/zh/mobileapp',
    },
  ],
};
