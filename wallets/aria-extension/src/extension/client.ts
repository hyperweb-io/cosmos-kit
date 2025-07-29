import {
  AminoSignResponse,
  OfflineAminoSigner,
  StdSignDoc,
  StdSignature,
} from '@cosmjs/amino';
import {
  Algo,
  DirectSignResponse,
  OfflineDirectSigner,
  OfflineSigner,
} from '@cosmjs/proto-signing';
import {
  BroadcastMode,
  DirectSignDoc,
  SignOptions,
  SignType,
  SuggestToken,
  WalletAccount,
  WalletClient,
} from '@cosmos-kit/core';
import { Aria } from './types';

export class AriaClient implements WalletClient {
  readonly client: Aria;
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

  constructor(client: any) {
    if (!client) throw new Error('Aria client not initialized');
    this.client = client;
  }

  async suggestToken({ chainId, tokens, type }: SuggestToken) {
    if (type === 'cw20') {
      for (const { contractAddress } of tokens) {
        await this.client.suggestCW20Token(chainId, contractAddress);
      }
    }
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

  async getAccount(chainId: string): Promise<WalletAccount> {
    const key = await this.client.getKey(chainId);
    return {
      username: key.name,
      address: key.bech32Address,
      algo: key.algo as Algo,
      pubkey: key.pubKey,
      isNanoLedger: key.isNanoLedger,
    };
  }

  async signAmino(
    chainId: string,
    signer: string,
    signDoc: StdSignDoc,
    signOptions?: SignOptions
  ): Promise<AminoSignResponse> {
    return await this.client.signAmino(
      chainId,
      signer,
      signDoc,
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

  async signDirect(
    chainId: string,
    signer: string,
    signDoc: DirectSignDoc,
    signOptions?: SignOptions
  ): Promise<DirectSignResponse> {
    return await this.client.signDirect(
      chainId,
      signer,
      signDoc,
      signOptions || this.defaultSignOptions
    );
  }

  getOfflineSigner(
    chainId: string,
    preferredSignType?: SignType
  ): OfflineSigner {
    switch (preferredSignType) {
      case 'amino':
        return this.getOfflineSignerAmino(chainId);
      case 'direct':
        return this.getOfflineSignerDirect(chainId);
      default:
        return this.getOfflineSignerAmino(chainId);
    }
    // return this.client.getOfflineSignerAuto(chainId);
  }

  getOfflineSignerAmino(chainId: string): OfflineAminoSigner {
    return this.client.getOfflineSignerOnlyAmino(chainId);
  }

  getOfflineSignerDirect(chainId: string): OfflineDirectSigner {
    return this.client.getOfflineSigner(chainId) as OfflineDirectSigner;
  }

  async sendTx(chainId: string, tx: Uint8Array, mode: BroadcastMode) {
    return this.client.sendTx(chainId, tx, mode);
  }
}
