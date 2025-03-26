import { ClientNotExistError } from '@cosmos-kit/core';

import { Bitgetwallet } from './types';

interface BitgetwalletWindow {
  bitgetWallet: BitgetwalletExtension;
}

interface BitgetwalletExtension {
  keplr?: Bitgetwallet;
}

export const getBitgetwalletFromExtension: () => Promise<
  Bitgetwallet | undefined
> = async () => {
  if (typeof window === 'undefined') {
    return void 0;
  }

  const bitgetWallet = (window as BitgetwalletWindow).bitgetWallet.keplr;

  if (bitgetWallet) {
    return bitgetWallet;
  }

  if (document.readyState === 'complete') {
    if (bitgetWallet) {
      return bitgetWallet;
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
        if (bitgetWallet) {
          resolve(bitgetWallet);
        } else {
          reject(ClientNotExistError.message);
        }
        document.removeEventListener('readystatechange', documentStateChange);
      }
    };

    document.addEventListener('readystatechange', documentStateChange);
  });
};
