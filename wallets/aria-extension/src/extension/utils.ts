import { ClientNotExistError } from '@cosmos-kit/core';

export const getAriaFromExtension = async () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const aria = (window as any).aria;

  if (aria) {
    return aria;
  }

  return new Promise((resolve, reject) => {
    const checkReadyState = () => {
      if (document.readyState === 'complete') {
        const aria = (window as any).aria;
        if (aria) {
          resolve(aria);
        } else {
          reject(ClientNotExistError);
        }
      }
    };

    document.addEventListener('readystatechange', checkReadyState);
  });
};
