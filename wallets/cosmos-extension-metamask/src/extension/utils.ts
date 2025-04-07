import { ClientNotExistError } from '@cosmos-kit/core';
import { CosmosSnap } from '@cosmsnap/snapper';

interface MetamaskWindow {
  ethereum?: {
    isMetaMask?: boolean;
  };
}

interface SnapWindow {
  cosmos?: CosmosSnap;
}

export const isMetamaskInstalled = async (): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return false;
  }

  const ethereum = (window as MetamaskWindow).ethereum;
  return Boolean(ethereum?.isMetaMask);
};

export const getSnapProviderFromExtension: () => Promise<
  CosmosSnap | undefined
> = async () => {
  if (typeof window === 'undefined') {
    return void 0;
  }

  // Check if MetaMask is installed first
  const hasMetaMask = await isMetamaskInstalled();
  if (!hasMetaMask) {
    throw ClientNotExistError;
  }

  const cosmos = (window as SnapWindow).cosmos;

  if (cosmos) {
    return cosmos;
  }

  if (document.readyState === 'complete') {
    if (cosmos) {
      return cosmos;
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
        if (cosmos) {
          resolve(cosmos);
        } else {
          reject(ClientNotExistError.message);
        }
        document.removeEventListener('readystatechange', documentStateChange);
      }
    };

    document.addEventListener('readystatechange', documentStateChange);
  });
};
