import { Wallet } from '@cosmos-kit/core';
import { MainWalletBase } from '@cosmos-kit/core';

import { ChainFoxWalletExtension } from './chain-wallet';
import { FoxWalletClient } from './client';
import { getFoxWalletFromExtension } from './utils';

export class FoxWalletExtensionWallet extends MainWalletBase {
  constructor(walletInfo: Wallet) {
    super(walletInfo, ChainFoxWalletExtension);
  }

  async initClient() {
    this.initingClient();
    try {
      const foxwallet = await getFoxWalletFromExtension();
      this.initClientDone(
        foxwallet ? new FoxWalletClient(foxwallet) : undefined
      );
    } catch (error) {
      this.initClientError(error);
    }
  }
}
