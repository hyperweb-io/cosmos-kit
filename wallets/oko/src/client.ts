import type {
  OfflineAminoSigner,
  StdSignature,
  StdSignDoc,
  AminoSignResponse,
} from '@cosmjs/amino';
import type {
  Algo,
  OfflineDirectSigner,
  DirectSignResponse,
} from '@cosmjs/proto-signing';
import type {
  ChainRecord,
  DirectSignDoc,
  SignOptions,
  SignType,
  SuggestToken,
  WalletAccount,
  WalletClient,
} from '@cosmos-kit/core';
import { BroadcastMode } from '@keplr-wallet/types';
import type { OkoCosmosWalletInterface } from '@oko-wallet/oko-sdk-cosmos';
import type { OkoLoginProvider } from './types';

export class OkoWalletClient implements WalletClient {
  readonly client: OkoCosmosWalletInterface;
  readonly loginProvider: OkoLoginProvider;
  private _defaultSignOptions: SignOptions = {
    preferNoSetFee: false,
    preferNoSetMemo: false,
    disableBalanceCheck: false,
  };

  get defaultSignOptions() {
    return this._defaultSignOptions;
  }

  setDefaultSignOptions(options: SignOptions) {
    this._defaultSignOptions = options;
  }

  constructor(
    client: OkoCosmosWalletInterface,
    loginProvider: OkoLoginProvider
  ) {
    this.client = client;
    this.loginProvider = loginProvider;
  }

  // async startEmailSignIn(email: string) {
  //   if (this.loginProvider !== 'email') {
  //     throw new Error('Email login is not enabled for this wallet instance');
  //   }
  //   return await this.client.okoWallet.startEmailSignIn(email);
  // }

  // async completeEmailSignIn(email: string, code: string) {
  //   if (this.loginProvider !== 'email') {
  //     throw new Error('Email login is not enabled for this wallet instance');
  //   }
  //   return await this.client.okoWallet.completeEmailSignIn(email, code);
  // }

  async enable(_chainIds: string | string[]) {}

  async suggestToken(_suggestToken: SuggestToken) {}

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

  getOfflineSigner(chainId: string, preferredSignType?: SignType) {
    switch (preferredSignType) {
      case 'amino':
        return this.getOfflineSignerAmino(chainId);
      case 'direct':
        return this.getOfflineSignerDirect(chainId);
      default:
        return this.getOfflineSignerAmino(chainId);
    }
  }

  getOfflineSignerAmino(chainId: string): OfflineAminoSigner {
    return {
      getAccounts: async () => {
        return [await this.getAccount(chainId)];
      },
      signAmino: async (signerAddress, signDoc): Promise<AminoSignResponse> => {
        return this.signAmino(
          chainId,
          signerAddress,
          signDoc,
          this.defaultSignOptions
        );
      },
    };
  }

  getOfflineSignerDirect(chainId: string): OfflineDirectSigner {
    return {
      getAccounts: async () => {
        return [await this.getAccount(chainId)];
      },
      signDirect: async (
        signerAddress,
        signDoc
      ): Promise<DirectSignResponse> => {
        const resp = await this.signDirect(
          chainId,
          signerAddress,
          signDoc,
          this.defaultSignOptions
        );
        return {
          ...resp,
          signed: {
            ...resp.signed,
            accountNumber: BigInt(resp.signed.accountNumber.toString()),
          },
        };
      },
    };
  }

  async addChain(_chainInfo: ChainRecord) {}

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
    const resp = await this.client.signDirect(
      chainId,
      signer,
      {
        ...signDoc,
        bodyBytes: signDoc.bodyBytes ?? new Uint8Array(),
        authInfoBytes: signDoc.authInfoBytes ?? new Uint8Array(),
        chainId: signDoc.chainId ?? '',
        accountNumber: BigInt(signDoc.accountNumber ?? '0'),
      },
      signOptions || this.defaultSignOptions
    );
    return {
      ...resp,
      signed: {
        ...resp.signed,
        accountNumber: BigInt(resp.signed.accountNumber.toString()),
      },
    };
  }

  async sendTx(chainId: string, tx: Uint8Array, mode: BroadcastMode) {
    return await this.client.sendTx(chainId, tx, mode);
  }
}
