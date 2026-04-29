import { ClientNotExistError } from '@cosmos-kit/core';

import { Vultisig } from './types';

interface VultisigWindow {
  vultisig?: {
    keplr?: Vultisig;
  };
}

export const getVultisigFromExtension: () => Promise<
  Vultisig | undefined
> = async () => {
  if (typeof window === 'undefined') {
    return void 0;
  }

  const vultisig = (window as VultisigWindow)?.vultisig?.keplr;

  if (vultisig) {
    return vultisig;
  }

  if (document.readyState === 'complete') {
    if (vultisig) {
      return vultisig;
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
        const vultisig = (window as VultisigWindow)?.vultisig?.keplr;
        if (vultisig) {
          resolve(vultisig);
        } else {
          reject(ClientNotExistError.message);
        }
        document.removeEventListener('readystatechange', documentStateChange);
      }
    };

    document.addEventListener('readystatechange', documentStateChange);
  });
};
