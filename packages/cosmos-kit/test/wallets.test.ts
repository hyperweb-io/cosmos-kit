import { describe, expect, test } from '@jest/globals';
import { wallets, keplr } from '../src/wallets';

describe('wallets', () => {
  test('wallets has at least one wallet', () => {
    expect(wallets.length).toBeGreaterThanOrEqual(1);
  });

  test('wallets.keplr', () => {
    expect(wallets.keplr).toBeDefined();
    expect(wallets.keplr.length).toBe(2);
    expect(wallets.keplr.length).toBe(keplr.length);
    expect(wallets.keplr.mobile).toBe(keplr.mobile);
    expect(wallets.keplr.extension).toBe(keplr.extension);
  });

  test('wallets.aria', () => {
    expect(wallets.aria).toBeDefined();
    expect(wallets.aria.length).toBe(2);
    expect(wallets.aria.extension?.walletInfo.name).toBe('aria-extension');
    expect(wallets.aria.mobile?.walletInfo.name).toBe('aria-cosmos-mobile');
    expect(wallets.for('aria').length).toBe(2);
  });

  test('wallets.for()', () => {
    const ws = wallets.for('keplr', 'cosmostation');
    expect(ws.length).toBe(4);
    expect(ws.mobile.length).toBe(2);
    expect(ws.extension.length).toBe(2);
  });

  test('wallets.not()', () => {
    const ws = wallets.not('coin98', 'compass');
    expect(ws.length).toBe(wallets.length - 2);
  });

  test('wallets.mobile', () => {
    expect(wallets.mobile.every((w) => w.isModeWalletConnect)).toBe(true);
  });

  test('wallets.extension', () => {
    expect(wallets.extension.every((w) => w.isModeExtension)).toBe(true);
  });
});
