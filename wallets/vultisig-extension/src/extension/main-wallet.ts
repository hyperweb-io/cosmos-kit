import { Wallet } from '@cosmos-kit/core';
import { MainWalletBase } from '@cosmos-kit/core';

import { ChainVultisigExtension } from './chain-wallet';
import { VultisigClient } from './client';
import { getVultisigFromExtension } from './utils';

export class VultisigExtensionWallet extends MainWalletBase {
  constructor(walletInfo: Wallet) {
    super(walletInfo, ChainVultisigExtension);
  }

  async initClient() {
    this.initingClient();
    try {
      const vultisig = await getVultisigFromExtension();
      this.initClientDone(vultisig ? new VultisigClient(vultisig) : undefined);
    } catch (error) {
      this.initClientError(error);
    }
  }
}
