import { AminoSignResponse, StdSignature, StdSignDoc } from '@cosmjs/amino';
import { OfflineDirectSigner, OfflineSigner } from '@cosmjs/proto-signing';
import { DirectSignResponse } from '@cosmjs/proto-signing';
import { SignOptions } from '@cosmos-kit/core';
import { BroadcastMode, Key, StdTx } from '@keplr-wallet/types';

export interface FoxWallet {
  enable(chainIds: string | string[]): Promise<void>;
  mode: 'extension';
  getKey(chainId: string): Promise<Key>;
  getOfflineSigner(chainId: string): OfflineSigner & OfflineDirectSigner;
  getOfflineSignerOnlyAmino(chainId: string): OfflineSigner;
  getOfflineSignerAuto(
    chainId: string
  ): Promise<OfflineSigner | OfflineDirectSigner>;
  signAmino(
    chainId: string,
    signerAddress: string,
    signDoc: StdSignDoc,
    signOptions?: SignOptions
  ): Promise<AminoSignResponse>;
  signDirect(
    chainId: string,
    signerAddress: string,
    signDoc: {
      /** SignDoc bodyBytes */
      bodyBytes?: Uint8Array | null;
      /** SignDoc authInfoBytes */
      authInfoBytes?: Uint8Array | null;
      /** SignDoc chainId */
      chainId?: string | null;
      /** SignDoc accountNumber */
      accountNumber?: Long | null;
    },
    signOptions?: SignOptions
  ): Promise<DirectSignResponse>;
  signArbitrary: (
    chainId: string,
    signer: string,
    data: string | Uint8Array
  ) => Promise<StdSignature>;
  sendTx(
    chainId: string,
    tx: StdTx | Uint8Array,
    mode: BroadcastMode
  ): Promise<Uint8Array>;
}
