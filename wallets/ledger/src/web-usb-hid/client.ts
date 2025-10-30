import {
  encodeSecp256k1Signature,
  OfflineAminoSigner,
  StdSignDoc,
} from '@cosmjs/amino';
import { Secp256k1Signature } from '@cosmjs/crypto';
import { fromHex } from '@cosmjs/encoding';
import { Algo } from '@cosmjs/proto-signing';
import { SignType, WalletClient } from '@cosmos-kit/core';
import Cosmos from '@ledgerhq/hw-app-cosmos';

import {
  ChainIdToBech32Prefix,
  getCosmosApp,
  getCosmosPath,
  sortedJsonStringify,
} from './utils';

export class LedgerClient implements WalletClient {
  client: Cosmos;

  constructor(client?: Cosmos) {
    this.client = client;
  }

  async initClient() {
    if (!this.client) {
      this.client = await getCosmosApp();
    }
  }

  async getSimpleAccount(chainId: string, accountIndex = 0) {
    const { address, username } = await this.getAccount(chainId, accountIndex);
    return {
      namespace: 'cosmos',
      chainId,
      address,
      username,
    };
  }

  async getAccount(chainId: string, accountIndex = 0, username?: string) {
    const prefix = ChainIdToBech32Prefix[chainId];
    if (!prefix) throw new Error(`Unsupported chainId: ${chainId}`);

    if (!this.client) await this.initClient();

    const path = getCosmosPath(accountIndex);
    const { address, publicKey } = await this.client.getAddress(path, prefix);
    return {
      username: username ?? path,
      address,
      algo: 'secp256k1' as Algo,
      pubkey: fromHex(publicKey),
      isNanoLedger: true,
    };
  }

  getOfflineSigner(chainId: string, preferredSignType?: SignType) {
    // Ledger doesn't support direct sign, only Amino sign
    if (preferredSignType === 'direct') {
      throw new Error('Unsupported sign type: direct');
    }
    return this.getOfflineSignerAmino(chainId);
  }

  getOfflineSignerAmino(chainId: string): OfflineAminoSigner {
    return {
      getAccounts: async () => {
        return [await this.getAccount(chainId)];
      },
      signAmino: async (_signerAddress, signDoc) => {
        const { pubkey } = await this.getAccount(chainId);
        const { signature: derSignature } = await this.sign(signDoc); // The signature is in DER format
        const signature = Secp256k1Signature.fromDer(derSignature); // Convert the DER signature to fixed length (64 bytes)
        return {
          signed: signDoc,
          signature: encodeSecp256k1Signature(
            pubkey,
            signature.toFixedLength()
          ),
        };
      },
    };
  }

  async sign(signDoc: StdSignDoc, accountIndex = 0) {
    if (!this.client) await this.initClient();
    return await this.client.sign(
      getCosmosPath(accountIndex),
      sortedJsonStringify(signDoc) // signDoc MUST be serialized in lexicographical key order
    );
  }
}
