import { Chain } from '@chain-registry/types';
import {
  AminoSignResponse,
  OfflineAminoSigner,
  StdSignDoc,
} from '@cosmjs/amino';
import {
  AccountData,
  DirectSignResponse,
  OfflineDirectSigner,
} from '@cosmjs/proto-signing';
import * as eccrypto from '@toruslabs/eccrypto';
import { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';

import { PromptSign, SignData, ToWorkerMessage } from './types';
import { hashObject, sendAndListenOnce } from './utils';

export class Web3AuthSigner implements OfflineDirectSigner, OfflineAminoSigner {
  chain: Chain;
  #worker: Worker;
  #clientPrivateKey: Buffer;
  #workerPublicKey: Buffer;
  #promptSign: PromptSign;

  constructor(
    chain: Chain,
    worker: Worker,
    clientPrivateKey: Buffer,
    workerPublicKey: Buffer,
    promptSign: PromptSign
  ) {
    this.chain = chain;
    this.#worker = worker;
    this.#clientPrivateKey = clientPrivateKey;
    this.#workerPublicKey = workerPublicKey;
    this.#promptSign = promptSign;
  }

  async getAccounts(): Promise<readonly AccountData[]> {
    let accounts: AccountData[] | undefined;
    const id = Date.now();
    // Should not resolve until accounts are received.
    await sendAndListenOnce(
      this.#worker,
      {
        type: 'request_accounts',
        payload: {
          id,
          chainBech32Prefix: this.chain.bech32_prefix || '',
        },
      },
      async (data) => {
        if (data.type === 'accounts' && data.payload.id === id) {
          // Verify signature.
          await eccrypto.verify(
            this.#workerPublicKey,
            hashObject(data.payload),
            Buffer.from(data.signature)
          );

          if (data.payload.response.type === 'success') {
            accounts = data.payload.response.accounts;
            return true;
          } else {
            throw new Error(data.payload.response.error);
          }
        }

        return false;
      }
    );

    if (!accounts) {
      throw new Error('Failed to get accounts');
    }

    return accounts;
  }

  async signDirect(
    signerAddress: string,
    signDoc: SignDoc
  ): Promise<DirectSignResponse> {
    if (signDoc.chainId !== this.chain.chain_id) {
      throw new Error('Chain ID mismatch');
    }

    const signData: SignData = {
      type: 'direct',
      value: signDoc,
    };
    if (!(await this.#promptSign(signerAddress, signData))) {
      throw new Error('Request rejected');
    }

    // Create and sign signature request.
    const id = Date.now();
    const message: ToWorkerMessage = {
      type: 'request_sign',
      payload: {
        id,
        signerAddress,
        chainBech32Prefix: this.chain.bech32_prefix || '',
        data: signData,
      },
      signature: new Uint8Array(),
    };
    message.signature = await eccrypto.sign(
      this.#clientPrivateKey,
      hashObject(message.payload)
    );

    let response: DirectSignResponse | undefined;
    // Should not resolve until response is received.
    await sendAndListenOnce(this.#worker, message, async (data) => {
      if (data.type === 'sign' && data.payload.id === id) {
        // Verify signature.
        await eccrypto.verify(
          this.#workerPublicKey,
          hashObject(data.payload),
          Buffer.from(data.signature)
        );

        if (data.payload.response.type === 'error') {
          throw new Error(data.payload.response.value);
        }

        // Type-check, should always be true.
        if (data.payload.response.type === 'direct') {
          response = data.payload.response.value;
        }

        return true;
      }

      return false;
    });

    if (!response) {
      throw new Error('Failed to get response');
    }

    return response;
  }

  async signAmino(
    signerAddress: string,
    signDoc: StdSignDoc
  ): Promise<AminoSignResponse> {
    if (signDoc.chain_id !== this.chain.chain_id) {
      throw new Error('Chain ID mismatch');
    }

    const signData: SignData = {
      type: 'amino',
      value: signDoc,
    };
    if (!(await this.#promptSign(signerAddress, signData))) {
      throw new Error('Request rejected');
    }

    // Create and sign signature request.
    const id = Date.now();
    const message: ToWorkerMessage = {
      type: 'request_sign',
      payload: {
        id,
        signerAddress,
        chainBech32Prefix: this.chain.bech32_prefix || '',
        data: signData,
      },
      signature: new Uint8Array(),
    };
    message.signature = await eccrypto.sign(
      this.#clientPrivateKey,
      hashObject(message.payload)
    );

    let response: AminoSignResponse | undefined;
    // Should not resolve until response is received.
    await sendAndListenOnce(this.#worker, message, async (data) => {
      if (data.type === 'sign' && data.payload.id === id) {
        // Verify signature.
        await eccrypto.verify(
          this.#workerPublicKey,
          hashObject(data.payload),
          Buffer.from(data.signature)
        );

        if (data.payload.response.type === 'error') {
          throw new Error(data.payload.response.value);
        }

        // Type-check, should always be true.
        if (data.payload.response.type === 'amino') {
          response = data.payload.response.value;
        }

        return true;
      }

      return false;
    });

    if (!response) {
      throw new Error('Failed to get response');
    }

    return response;
  }
}
