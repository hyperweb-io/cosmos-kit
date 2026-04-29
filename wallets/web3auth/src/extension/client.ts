import { Chain } from '@chain-registry/types';
import { OfflineAminoSigner, StdSignature } from '@cosmjs/amino';
import { OfflineDirectSigner } from '@cosmjs/proto-signing';
import { DappEnv, WalletClient } from '@cosmos-kit/core';
import { makeADR36AminoSignDoc } from '@keplr-wallet/cosmos';
import * as eccrypto from '@toruslabs/eccrypto';
import { AUTH_CONNECTION, UserInfo } from '@web3auth/modal';

import { Web3AuthSigner } from './signer';
import { Web3AuthClientOptions } from './types';
import {
  connectClientAndProvider,
  decrypt,
  sendAndListenOnce,
  WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY,
} from './utils';

// In case these get overwritten by an attacker.
const terminate =
  typeof Worker !== 'undefined' ? Worker.prototype.terminate : undefined;

export class Web3AuthClient implements WalletClient {
  env: DappEnv;
  getChain: (chainId: string) => Chain | undefined;

  #worker?: Worker;
  #clientPrivateKey?: Buffer;
  #workerPublicKey?: Buffer;
  #userInfo?: Partial<UserInfo>;
  #options?: Web3AuthClientOptions;

  // Map chain ID to signer.
  #signers: Record<string, Web3AuthSigner | undefined> = {};

  ready = false;

  #loginHint?: string;

  constructor(
    env: DappEnv,
    options: Web3AuthClientOptions,
    getChain: (chainId: string) => Chain | undefined
  ) {
    this.env = env;
    this.#options = Object.freeze(options);
    this.getChain = getChain;
  }

  setLoginHint(hint: string) {
    this.#loginHint = hint;
  }

  getLoginHint() {
    return this.#loginHint;
  }

  async ensureSetup(): Promise<void> {
    if (this.ready) {
      return;
    }

    if (
      (this.#options?.loginProvider === AUTH_CONNECTION.EMAIL_PASSWORDLESS ||
        this.#options?.loginProvider === AUTH_CONNECTION.SMS_PASSWORDLESS) &&
      this.#loginHint === undefined
    ) {
      throw new Error(
        'Login hint is required for email/sms passwordless login'
      );
    }

    if (!this.#options) {
      throw new Error('Web3Auth client not initialized');
    }

    // Don't keep any reference to these around after this function since they
    // internally store a reference to the private key. Once we have the private
    // key, send it to the worker and forget about it. After this function, the
    // only reference to the private key is in the worker, and this client and
    // provider will be destroyed by the garbage collector, hopefully ASAP.
    const { client, provider } = await connectClientAndProvider(
      this.env.device === 'mobile',
      {
        ...this.#options,
        getLoginHint: () => this.#loginHint,
      }
    );

    // Get connected user info.
    const userInfo = await client.getUserInfo();

    // Get the private key.
    const privateKeyHex = await provider?.request({
      method: 'private_key',
    });
    if (typeof privateKeyHex !== 'string') {
      throw new Error(`Failed to connect to ${this.#options.loginProvider}`);
    }

    // Generate a private key for this client to interact with the worker.
    const clientPrivateKey = eccrypto.generatePrivate();
    const clientPublicKey = eccrypto
      .getPublic(clientPrivateKey)
      .toString('hex');

    // Spawn a new worker that will handle the private key and signing.
    const worker = new Worker(new URL('./web3auth.worker.js', import.meta.url));

    // Begin two-step handshake to authenticate with the worker and exchange
    // communication public keys as well as the wallet private key.

    // 1. Send client public key so the worker can verify our signatures, and
    //    get the worker public key for encrypting the wallet private key in the
    //    next init step.
    let workerPublicKey: Buffer | undefined;
    await sendAndListenOnce(
      worker,
      {
        type: 'init_1',
        payload: {
          publicKey: clientPublicKey,
        },
      },
      async (data) => {
        if (data.type === 'ready_1') {
          workerPublicKey = await decrypt(
            clientPrivateKey,
            data.payload.encryptedPublicKey
          );
          return true;
        } else if (data.type === 'init_error') {
          throw new Error(data.payload.error);
        }

        return false;
      }
    );
    if (!workerPublicKey) {
      throw new Error('Failed to authenticate with worker');
    }

    // 2. Encrypt and send the wallet private key to the worker. This is the
    //    last usage of `workerPublicKey`, so it should get garbage collected
    //    ASAP once this function ends.
    const encryptedPrivateKey = await eccrypto.encrypt(
      workerPublicKey,
      Buffer.from(privateKeyHex, 'hex')
    );
    await sendAndListenOnce(
      worker,
      {
        type: 'init_2',
        payload: {
          encryptedPrivateKey,
        },
      },
      (data) => {
        if (data.type === 'ready_2') {
          return true;
        } else if (data.type === 'init_error') {
          throw new Error(data.payload.error);
        }

        return false;
      }
    );

    // Store the setup instances.
    this.#worker = worker;
    this.#clientPrivateKey = clientPrivateKey;
    this.#workerPublicKey = workerPublicKey;
    this.#userInfo = userInfo;
    this.ready = true;
  }

  async connect(_chainIds: string | string[]) {
    await this.ensureSetup();

    const _chains = [_chainIds].flat().map((chainId) => {
      const chain = this.getChain(chainId);
      if (!chain) {
        throw new Error(`Chain ID ${chainId} not found`);
      }

      return chain;
    });

    // Create signers.
    _chains.forEach((chain) => {
      if (
        !this.#worker ||
        !this.#clientPrivateKey ||
        !this.#workerPublicKey ||
        !this.#options
      ) {
        throw new Error('Web3Auth client not initialized');
      }

      this.#signers[chain.chain_id] = new Web3AuthSigner(
        chain,
        this.#worker,
        this.#clientPrivateKey,
        this.#workerPublicKey,
        this.#options.promptSign
      );
    });
  }

  async disconnect() {
    if (!this.#options) {
      throw new Error('Web3Auth client not initialized');
    }

    // In case this web3auth client uses the redirect auto connect method, clear
    // it so that it does not automatically connect on the next page load.
    localStorage.removeItem(WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY);

    // Attempt to logout by first connecting a new client and then logging out
    // if connected. It does not attempt to log in if it cannot automatically
    // login from the cached session. This removes the need to keep the client
    // around, which internally keeps a reference to the private key.
    try {
      const { client } = await connectClientAndProvider(
        this.env.device === 'mobile',
        this.#options,
        { dontAttemptLogin: true }
      );

      if (client.connected) {
        await client.logout({
          cleanup: true,
        });
      }
    } catch (err) {
      console.warn('Web3Auth failed to logout:', err);
    }
    this.#signers = {};
    this.#userInfo = {};
    if (this.#worker) {
      terminate?.call(this.#worker);
      this.#worker = undefined;
    }
    this.ready = false;
  }

  async getSimpleAccount(chainId: string) {
    const { address, username } = await this.getAccount(chainId);
    return {
      namespace: 'cosmos',
      chainId,
      address,
      username,
    };
  }

  async getAccount(chainId: string) {
    if (!this.#userInfo) {
      throw new Error('Web3Auth client not initialized');
    }

    const { address, algo, pubkey } = (
      await this.getOfflineSigner(chainId).getAccounts()
    )[0];

    return {
      username: this.#userInfo.name || this.#userInfo.email || address,
      algo,
      pubkey,
      address,
    };
  }

  getOfflineSigner(chainId: string) {
    const signer = this.#signers[chainId];
    if (!signer) {
      throw new Error('Signer not enabled');
    }
    return signer;
  }

  getOfflineSignerAmino(chainId: string): OfflineAminoSigner {
    return this.getOfflineSigner(chainId);
  }

  getOfflineSignerDirect(chainId: string): OfflineDirectSigner {
    return this.getOfflineSigner(chainId);
  }

  async signArbitrary(
    chainId: string,
    signer: string,
    data: string | Uint8Array
  ): Promise<StdSignature> {
    // ADR 036
    // https://docs.cosmos.network/v0.47/architecture/adr-036-arbitrary-signature
    const signDoc = makeADR36AminoSignDoc(signer, data);

    const offlineSigner = await this.getOfflineSignerAmino(chainId);
    const { signature } = await offlineSigner.signAmino(signer, signDoc);

    return signature;
  }
}
