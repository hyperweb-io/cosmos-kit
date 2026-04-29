import { MainWalletBase } from '@cosmos-kit/core';
import { getHashQueryParams } from '@web3auth/auth';
import { WEB3AUTH_NETWORK } from '@web3auth/modal';

import { Web3AuthChainWallet } from './chain-wallet';
import { Web3AuthClient } from './client';
import { Web3AuthWalletInfo } from './types';
import { WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY } from './utils';

export class Web3AuthWallet extends MainWalletBase {
  constructor(walletInfo: Web3AuthWalletInfo) {
    super(walletInfo, Web3AuthChainWallet);
  }

  get walletInfo(): Web3AuthWalletInfo {
    return this._walletInfo as Web3AuthWalletInfo;
  }

  async initClient() {
    const { options } = this.walletInfo;
    try {
      if (!options) {
        throw new Error('Web3auth options unset');
      }

      if (typeof options.client?.clientId !== 'string') {
        throw new Error('Invalid web3auth client ID');
      }

      if (
        typeof options.client?.web3AuthNetwork !== 'string' ||
        !Object.values(WEB3AUTH_NETWORK).includes(
          options.client
            .web3AuthNetwork as typeof WEB3AUTH_NETWORK[keyof typeof WEB3AUTH_NETWORK]
        )
      ) {
        throw new Error('Invalid web3auth network');
      }

      if (typeof options.promptSign !== 'function') {
        throw new Error('Invalid promptSign function');
      }
    } catch (err) {
      this.initClientError(err);
      return;
    }

    this.initingClient();
    try {
      if (typeof this.env === 'undefined') {
        throw new Error('Undefined env.');
      }
      this.initClientDone(
        new Web3AuthClient(
          this.env,
          options,
          (chainId) =>
            this.getChainWalletList().find(
              (chainWallet) => chainWallet.chainId === chainId
            )?.chain
        )
      );

      // Force connect to this wallet if the redirect auto connect key is set
      // and there is a wallet in the hash.
      const redirectAutoConnect = localStorage.getItem(
        WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY
      );
      if (redirectAutoConnect !== options.loginProvider) {
        return;
      }

      // Same logic used in `@web3auth/auth-adapter` >
      const redirectResult = getHashQueryParams();
      const shouldAutoConnect =
        Object.keys(redirectResult).length > 0 &&
        !!redirectResult.sessionId &&
        !redirectResult.error;

      if (shouldAutoConnect) {
        try {
          await this.connect(true);
        } catch (error) {
          this.logger?.error(error);
        }
      } else {
        // Don't try to connect again if no hash query params ready. This
        // prevents auto-connect loops.
        localStorage.removeItem(WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY);
      }
    } catch (error) {
      this.initClientError(error);
    }
  }

  setLoginHint(hint: string) {
    if (this.client instanceof Web3AuthClient) {
      this.client.setLoginHint(hint);
    }
  }
}
