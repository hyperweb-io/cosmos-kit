import {
  EndpointOptions,
  Wallet,
  WalletConnectOptions,
} from '@cosmos-kit/core';
import {
  AriaClient as ExtensionAriaClient,
  getAriaFromExtension,
} from '@cosmos-kit/aria-extension';
import { WCWallet } from '@cosmos-kit/walletconnect';

import { ChainAriaMobile } from './chain-wallet';
import { AriaClient } from './client';

export class AriaMobileWallet extends WCWallet {
  constructor(
    walletInfo: Wallet,
    preferredEndpoints?: EndpointOptions['endpoints']
  ) {
    // @ts-ignore
    super(walletInfo, ChainAriaMobile, AriaClient);
    this.preferredEndpoints = preferredEndpoints;
  }

  async initClient(options?: WalletConnectOptions): Promise<void> {
    try {
      const aria = await getAriaFromExtension();
      const userAgent: string | undefined = window.navigator.userAgent;
      // When running inside the Aria mobile app, use the full extension client
      if (aria && userAgent?.includes('AriaMobile')) {
        this.initClientDone(
          aria ? new ExtensionAriaClient(aria) : undefined
        );
      } else {
        // External browser -> use WalletConnect
        await super.initClient(options);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Client Not Exist!') {
          await super.initClient(options);
          return;
        }

        this.initClientError(error);
      }
    }
  }
}
