import { Wallet } from '@cosmos-kit/core';
import { MainWalletBase } from '@cosmos-kit/core';

import { ChainLockerExtension } from './chain-wallet';
import { LockerClient } from './client';
import { getLockerFromExtension } from './utils';

export class LockerExtensionWallet extends MainWalletBase {
  constructor(walletInfo: Wallet) {
    super(walletInfo, ChainLockerExtension);
  }

  async initClient() {
    this.initingClient();
    try {
      const locker = await getLockerFromExtension();
      this.initClientDone(locker ? new LockerClient(locker) : undefined);
    } catch (error) {
      this.initClientError(error);
    }
  }
}
