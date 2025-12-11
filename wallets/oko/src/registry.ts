import type { Wallet } from '@cosmos-kit/core';

import { OKO_ICON } from './constant';

export const okoWalletInfo: Wallet = {
  name: 'oko-wallet',
  prettyName: 'Oko Wallet',
  logo: OKO_ICON,
  mode: 'extension',
  mobileDisabled: false,
  rejectMessage: {
    source: 'Request rejected',
  },
};
