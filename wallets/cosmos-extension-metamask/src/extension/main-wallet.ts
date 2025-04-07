import { Wallet } from '@cosmos-kit/core';
import { MainWalletBase } from '@cosmos-kit/core';

import { ChainCosmosExtensionMetamaskSnap } from './chain-wallet';
import { CosmosExtensionClient } from './client';
import { isMetamaskInstalled } from './utils';

export class CosmosMetamaskExtensionWallet extends MainWalletBase {
  constructor(walletInfo: Wallet) {
    super(walletInfo, ChainCosmosExtensionMetamaskSnap);
  }

  async initClient() {
    this.initingClient();
    try {
      const installed = await isMetamaskInstalled();
      this.initClientDone(installed ? new CosmosExtensionClient() : undefined);
    } catch (error) {
      this.initClientError(error);
    }
  }
}
