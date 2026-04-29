import { Secp256k1Wallet } from '@cosmjs/amino';
import { DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import * as eccrypto from '@toruslabs/eccrypto';

import { ToWorkerMessage } from './types';
import { decrypt, hashObject } from './utils';

let clientPublicKey: Buffer | undefined;
let workerPrivateKey: Buffer | undefined;
let walletPrivateKey: Uint8Array | undefined;

self.onmessage = async ({ data }: MessageEvent<ToWorkerMessage>) => {
  if (data.type === 'init_1') {
    try {
      // Store the client's public key.
      clientPublicKey = Buffer.from(data.payload.publicKey, 'hex');

      // Generate a private key for this worker.
      workerPrivateKey = eccrypto.generatePrivate();

      // Encrypt the worker's public key for the client.
      const encryptedPublicKey = await eccrypto.encrypt(
        clientPublicKey,
        eccrypto.getPublic(workerPrivateKey)
      );

      return self.postMessage({
        type: 'ready_1',
        payload: {
          encryptedPublicKey,
        },
      });
    } catch (err) {
      console.error('Web3Auth worker init_1 error', err);
      return self.postMessage({
        type: 'init_error',
        payload: {
          error: err instanceof Error ? err.message : `${err}`,
        },
      });
    }
  }

  if (!clientPublicKey || !workerPrivateKey) {
    throw new Error('Web3Auth worker not initialized');
  }

  if (data.type === 'init_2') {
    try {
      // Decrypt the private key encrypted by the client.
      walletPrivateKey = await decrypt(
        workerPrivateKey,
        data.payload.encryptedPrivateKey
      );

      return self.postMessage({
        type: 'ready_2',
      });
    } catch (err) {
      console.error('Web3Auth worker init_2 error', err);
      return self.postMessage({
        type: 'init_error',
        payload: {
          error: err instanceof Error ? err.message : `${err}`,
        },
      });
    }
  }

  if (!walletPrivateKey) {
    throw new Error('Web3Auth client not initialized');
  }

  if (data.type === 'request_accounts') {
    let payload;
    try {
      const accounts = await (
        await DirectSecp256k1Wallet.fromKey(
          walletPrivateKey,
          data.payload.chainBech32Prefix
        )
      ).getAccounts();

      payload = {
        id: data.payload.id,
        response: {
          type: 'success',
          accounts,
        },
      };
    } catch (err) {
      console.error('Web3Auth worker accounts error', err);
      payload = {
        id: data.payload.id,
        response: {
          type: 'error',
          error: err instanceof Error ? err.message : `${err}`,
        },
      };
    }

    const signature = await eccrypto.sign(
      workerPrivateKey,
      hashObject(payload)
    );
    return self.postMessage({
      type: 'accounts',
      payload,
      signature,
    });
  }

  if (data.type === 'request_sign') {
    let payload;
    try {
      // Verify signature.
      await eccrypto.verify(
        clientPublicKey,
        hashObject(data.payload),
        Buffer.from(data.signature)
      );

      if (data.payload.data.type === 'direct') {
        const response = await (
          await DirectSecp256k1Wallet.fromKey(
            walletPrivateKey,
            data.payload.chainBech32Prefix
          )
        )
          // @ts-ignore
          .signDirect(data.payload.signerAddress, data.payload.data.value);

        payload = {
          id: data.payload.id,
          response: {
            type: 'direct',
            value: response,
          },
        };
      } else if (data.payload.data.type === 'amino') {
        const response = await (
          await Secp256k1Wallet.fromKey(
            walletPrivateKey,
            data.payload.chainBech32Prefix
          )
        ).signAmino(data.payload.signerAddress, data.payload.data.value);

        payload = {
          id: data.payload.id,
          response: {
            type: 'amino',
            value: response,
          },
        };
      } else {
        throw new Error('Invalid sign data type');
      }
    } catch (err) {
      console.error('Web3Auth worker sign error', err);

      payload = {
        id: data.payload.id,
        response: {
          type: 'error',
          value: err instanceof Error ? err.message : `${err}`,
        },
      };
    }

    const signature = await eccrypto.sign(
      workerPrivateKey,
      hashObject(payload)
    );
    return self.postMessage({
      type: 'sign',
      payload,
      signature,
    });
  }
};
