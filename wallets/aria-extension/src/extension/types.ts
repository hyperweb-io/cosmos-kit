import {
  AminoSignResponse,
  OfflineAminoSigner,
  StdSignature,
  StdSignDoc,
} from '@cosmjs/amino';
import { DirectSignResponse, OfflineSigner } from '@cosmjs/proto-signing';
import { BroadcastMode, DirectSignDoc, SignOptions } from '@cosmos-kit/core';

export interface Aria {
  // Account Methods
  getKey(chainId: string): Promise<{
    name: string;
    bech32Address: string;
    algo: string;
    pubKey: Uint8Array;
    isNanoLedger: boolean;
  }>;

  // Signing Methods
  signAmino(
    chainId: string,
    signer: string,
    signDoc: StdSignDoc,
    signOptions?: SignOptions
  ): Promise<AminoSignResponse>;

  signDirect(
    chainId: string,
    signer: string,
    signDoc: DirectSignDoc,
    signOptions?: SignOptions
  ): Promise<DirectSignResponse>;

  signArbitrary(
    chainId: string,
    signer: string,
    data: string | Uint8Array
  ): Promise<StdSignature>;

  // Transaction Methods
  sendTx(
    chainId: string,
    tx: Uint8Array,
    mode: BroadcastMode
  ): Promise<Uint8Array>;

  // Signer Methods
  getOfflineSigner(chainId: string): OfflineSigner;
  getOfflineSignerOnlyAmino(chainId: string): OfflineAminoSigner;

  // Token Support
  suggestCW20Token?(chainId: string, contractAddress: string): Promise<void>;

  // Optional Methods (if used)
  enable?(chainIds: string | string[]): Promise<void>;
  disconnect?(): Promise<void>;
}

declare global {
  interface Window {
    aria?: Aria;
  }
}
