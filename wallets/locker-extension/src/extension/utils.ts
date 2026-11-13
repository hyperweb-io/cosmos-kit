import { ClientNotExistError } from '@cosmos-kit/core';

import { Locker } from './types';

interface LockerWindow {
  lockerCosmos?: Locker;
}

const fromWindow = (): Locker | undefined => {
  const locker = (window as LockerWindow).lockerCosmos;
  return locker?.isLocker ? locker : undefined;
};

/**
 * Locker Wallet defines `window.lockerCosmos` at document_start, before the page's own scripts; the wait for
 * `readystatechange` covers a page that runs this earlier, as the other extension wallets do.
 */
export const getLockerFromExtension: () => Promise<
  Locker | undefined
> = async () => {
  if (typeof window === 'undefined') {
    return void 0;
  }

  const locker = fromWindow();

  if (locker) {
    return locker;
  }

  if (document.readyState === 'complete') {
    throw ClientNotExistError;
  }

  return new Promise((resolve, reject) => {
    const documentStateChange = (event: Event) => {
      if (
        event.target &&
        (event.target as Document).readyState === 'complete'
      ) {
        const locker = fromWindow();
        if (locker) {
          resolve(locker);
        } else {
          reject(ClientNotExistError.message);
        }
        document.removeEventListener('readystatechange', documentStateChange);
      }
    };

    document.addEventListener('readystatechange', documentStateChange);
  });
};
