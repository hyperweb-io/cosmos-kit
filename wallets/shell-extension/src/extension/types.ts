import {
  AminoSignResponse,
  OfflineAminoSigner,
  StdSignature,
  StdSignDoc,
} from '@cosmjs/amino';
import { DirectSignResponse } from '@cosmjs/proto-signing';
import { OfflineDirectSigner } from '@cosmjs/proto-signing';
import { BroadcastMode } from '@cosmos-kit/core';
import type { ChainInfo, EthSignType } from '@keplr-wallet/types';
import Long from 'long';
// @ts-ignore
import { SecretUtils } from 'secretjs/types/enigmautils';

export interface Key {
  readonly name: string;
  readonly algo: string;
  readonly pubKey: Uint8Array;
  readonly address: Uint8Array;
  readonly bech32Address: string;
  readonly isNanoLedger: boolean;
}
export declare type ShellMode =
  | 'core'
  | 'extension'
  | 'mobile-web'
  | 'walletconnect';
export interface ShellIntereactionOptions {
  readonly sign?: ShellSignOptions;
}
export interface ShellSignOptions {
  readonly preferNoSetFee?: boolean;
  readonly preferNoSetMemo?: boolean;
  readonly disableBalanceCheck?: boolean;
}
export interface Shell {
  readonly version: string;
  /**
   * mode means that how Keplr is connected.
   * If the connected Keplr is browser's extension, the mode should be "extension".
   * If the connected Keplr is on the mobile app with the embedded web browser, the mode should be "mobile-web".
   */
  readonly mode: ShellMode;
  defaultOptions: ShellIntereactionOptions;
  experimentalSuggestChain(chainInfo: ChainInfo): Promise<void>;
  enable(chainIds: string | string[]): Promise<void>;
  getKey(chainId: string): Promise<Key>;
  signAmino(
    chainId: string,
    signer: string,
    signDoc: StdSignDoc,
    signOptions?: ShellSignOptions
  ): Promise<AminoSignResponse>;
  signDirect(
    chainId: string,
    signer: string,
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
    signOptions?: ShellSignOptions
  ): Promise<DirectSignResponse>;
  sendTx(
    chainId: string,
    tx: Uint8Array,
    mode: BroadcastMode
  ): Promise<Uint8Array>;
  signArbitrary(
    chainId: string,
    signer: string,
    data: string | Uint8Array
  ): Promise<StdSignature>;
  verifyArbitrary(
    chainId: string,
    signer: string,
    data: string | Uint8Array,
    signature: StdSignature
  ): Promise<boolean>;
  signEthereum(
    chainId: string,
    signer: string,
    data: string | Uint8Array,
    type: EthSignType
  ): Promise<Uint8Array>;
  getOfflineSigner(chainId: string): OfflineAminoSigner & OfflineDirectSigner;
  getOfflineSignerOnlyAmino(chainId: string): OfflineAminoSigner;
  getOfflineSignerAuto(
    chainId: string
  ): Promise<OfflineAminoSigner | OfflineDirectSigner>;
  suggestToken(
    chainId: string,
    contractAddress: string,
    viewingKey?: string
  ): Promise<void>;
  getSecret20ViewingKey(
    chainId: string,
    contractAddress: string
  ): Promise<string>;
  getEnigmaUtils(chainId: string): SecretUtils;
  getEnigmaPubKey(chainId: string): Promise<Uint8Array>;
  getEnigmaTxEncryptionKey(
    chainId: string,
    nonce: Uint8Array
  ): Promise<Uint8Array>;
  enigmaEncrypt(
    chainId: string,
    contractCodeHash: string,
    msg: object
  ): Promise<Uint8Array>;
  enigmaDecrypt(
    chainId: string,
    ciphertext: Uint8Array,
    nonce: Uint8Array
  ): Promise<Uint8Array>;
  /**
   * Sign the sign doc with ethermint's EIP-712 format.
   * The difference from signEthereum(..., EthSignType.EIP712) is that this api returns a new sign doc changed by the user's fee setting and the signature for that sign doc.
   * Encoding tx to EIP-712 format should be done on the side using this api.
   * Not compatible with cosmjs.
   * The returned signature is (r | s | v) format which used in ethereum.
   * v should be 27 or 28 which is used in the ethereum mainnet regardless of chain.
   * @param chainId
   * @param signer
   * @param eip712
   * @param signDoc
   * @param signOptions
   */
  experimentalSignEIP712CosmosTx_v0(
    chainId: string,
    signer: string,
    eip712: {
      types: Record<
        string,
        | {
          name: string;
          type: string;
        }[]
        | undefined
      >;
      domain: Record<string, any>;
      primaryType: string;
    },
    signDoc: StdSignDoc,
    signOptions?: ShellSignOptions
  ): Promise<AminoSignResponse>;
}
