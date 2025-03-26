import { Wallet } from '@cosmos-kit/core';
import { MainWalletBase } from '@cosmos-kit/core';

import { ChainBitgetwalletExtension } from './chain-wallet';
import { BitgetWalletClient } from './client';
import { getBitgetwalletFromExtension } from './utils';

export class BitgetwalletExtensionWallet extends MainWalletBase {
  constructor(walletInfo: Wallet) {
    super(walletInfo, ChainBitgetwalletExtension);
  }

  async initClient() {
    this.initingClient();
    try {
      const leap = await getBitgetwalletFromExtension();
      this.initClientDone(leap ? new BitgetWalletClient(leap) : undefined);
    } catch (error) {
      this.initClientError(error);
    }
  }
}
