// adds polyfill for TextEncoder/TextDecoder because jsdom doesn't support them
// https://github.com/jsdom/jsdom/issues/2524
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

Object.setPrototypeOf(window, {
  keplr: {
    enable: () => Promise.resolve(),
    async getSimpleAccount(chainId) {
      const { address, username } = await this.getAccount(chainId);
      return {
        namespace: 'cosmos',
        chainId,
        address,
        username,
      };
    },
    async getAccount(chainId) {
      const key = await this.client.getKey(chainId);
      return {
        username: key.name,
        address: key.bech32Address,
        algo: key.algo,
        pubkey: key.pubKey,
        isNanoLedger: key.isNanoLedger,
      };
    },
    async getKey(chainId) {
      return {
        name: 'keplr',
        bech32Address: `${chainId}AddressKeplr`,
        algo: 'secp256k1',
        pubKey: 'pubkey',
        isNanoLedger: false,
      };
    },
  },
  leap: {
    enable: () => Promise.resolve(),
    async getSimpleAccount(chainId) {
      const { address, username } = await this.getAccount(chainId);
      return {
        namespace: 'cosmos',
        chainId,
        address,
        username,
      };
    },
    async getAccount(chainId) {
      const key = await this.getKey(chainId);
      return {
        username: key.name,
        address: key.bech32Address,
        algo: key.algo,
        pubkey: key.pubKey,
        isNanoLedger: key.isNanoLedger,
      };
    },
    async getKey(chainId) {
      return {
        name: 'leap',
        bech32Address: `${chainId}AddressLeap`,
        algo: 'secp256k1',
        pubKey: 'pubkey',
        isNanoLedger: false,
      };
    },
    async disconnect() {
      return Promise.resolve();
    },
  },
  station: {
    connect: async () => ({
      name: 'station',
      addresses: {
        'juno-1': `juno-1AddressStation`,
        'osmosis-1': `osmosis-1AddressStation`,
        'stargaze-1': `stargaze-1AddressStation`,
      },
    }),
    async getSimpleAccount(chainId) {
      const { address, username } = await this.getAccount(chainId);
      return {
        namespace: 'cosmos',
        chainId,
        address,
        username,
      };
    },
    async getAccount(chainId) {
      const key = await this.client.getKey(chainId);
      return {
        username: key.name,
        address: key.bech32Address,
        algo: key.algo,
        pubkey: key.pubKey,
        isNanoLedger: key.isNanoLedger,
      };
    },
    async getKey() {
      return {
        name: 'station',
        bech32Address: `${chainId}AddressStation`,
        algo: 'secp256k1',
        pubKey: 'pubkey',
        isNanoLedger: false,
      };
    },
    async disconnect() {
      return Promise.resolve();
    },
  },
});
