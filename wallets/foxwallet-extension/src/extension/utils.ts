import { ClientNotExistError } from '@cosmos-kit/core';

import { FoxWallet } from './types';

interface FoxWalletWindow {
  foxwallet?: FoxWalletExtension;
}

interface FoxWalletExtension {
  cosmos?: FoxWallet;
}

export const getFoxWalletFromExtension: () => Promise<
  FoxWallet | undefined
> = async () => {
  if (typeof window === 'undefined') {
    return void 0;
  }

  const foxwallet = (window as FoxWalletWindow).foxwallet?.cosmos;

  if (foxwallet) {
    return foxwallet;
  }

  if (document.readyState === 'complete') {
    if (foxwallet) {
      return foxwallet;
    } else {
      throw ClientNotExistError;
    }
  }

  return new Promise((resolve, reject) => {
    const documentStateChange = (event: Event) => {
      if (
        event.target &&
        (event.target as Document).readyState === 'complete'
      ) {
        if (foxwallet) {
          resolve(foxwallet);
        } else {
          reject(ClientNotExistError.message);
        }
        document.removeEventListener('readystatechange', documentStateChange);
      }
    };

    document.addEventListener('readystatechange', documentStateChange);
  });
};
