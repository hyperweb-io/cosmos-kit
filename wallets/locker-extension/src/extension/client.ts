import { StdSignature } from '@cosmjs/amino';
import { Algo, OfflineDirectSigner } from '@cosmjs/proto-signing';
import { BroadcastMode, SignType } from '@cosmos-kit/core';
import { DirectSignDoc, SignOptions, WalletClient } from '@cosmos-kit/core';
import Long from 'long';

import { Locker } from './types';

/** Why Locker Wallet has no amino signer: its offline screen reviews the protobuf SignDoc it signs. */
export const DIRECT_ONLY =
  'Locker Wallet signs SIGN_MODE_DIRECT only: its offline signer reviews the protobuf SignDoc, not an amino JSON document.';

export class LockerClient implements WalletClient {
  readonly client: Locker;
  private _defaultSignOptions: SignOptions = {
    preferNoSetFee: false,
    preferNoSetMemo: true,
    disableBalanceCheck: true,
  };

  get defaultSignOptions() {
    return this._defaultSignOptions;
  }

  setDefaultSignOptions(options: SignOptions) {
    this._defaultSignOptions = options;
  }

  constructor(client: Locker) {
    this.client = client;
  }

  async enable(chainIds: string | string[]) {
    await this.client.enable(chainIds);
  }

  async disconnect() {
    await this.client.disable();
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
    const key = await this.client.getKey(chainId);
    return {
      username: key.name,
      address: key.bech32Address,
      algo: key.algo as Algo,
      pubkey: key.pubKey,
    };
  }

  /** The direct signer; an amino request is refused by name rather than answered with another kind of signer. */
  getOfflineSigner(chainId: string, preferredSignType?: SignType) {
    if (preferredSignType === 'amino') {
      throw new Error(DIRECT_ONLY);
    }
    return this.getOfflineSignerDirect(chainId);
  }

  getOfflineSignerAmino(): never {
    throw new Error(DIRECT_ONLY);
  }

  getOfflineSignerDirect(chainId: string) {
    return this.client.getOfflineSigner(chainId) as OfflineDirectSigner;
  }

  async signAmino(): Promise<never> {
    throw new Error(DIRECT_ONLY);
  }

  async signDirect(
    chainId: string,
    signer: string,
    signDoc: DirectSignDoc,
    signOptions?: SignOptions
  ) {
    return await this.client.signDirect(
      chainId,
      signer,
      {
        ...signDoc,
        accountNumber: Long.fromString(signDoc.accountNumber.toString()),
      },
      signOptions || this.defaultSignOptions
    );
  }

  async signArbitrary(
    chainId: string,
    signer: string,
    data: string | Uint8Array
  ): Promise<StdSignature> {
    return await this.client.signArbitrary(chainId, signer, data);
  }

  async sendTx(chainId: string, tx: Uint8Array, mode: BroadcastMode) {
    return await this.client.sendTx(chainId, tx, mode);
  }
}
