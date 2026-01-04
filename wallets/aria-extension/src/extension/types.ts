import {
  AminoSignResponse,
  OfflineAminoSigner,
  StdSignature,
  StdSignDoc,
} from '@cosmjs/amino';
import { DirectSignResponse, OfflineSigner } from '@cosmjs/proto-signing';
import { BroadcastMode, DirectSignDoc, SignOptions } from '@cosmos-kit/core';

// ============================================================================
// Phase 3C - Power Features Types
// ============================================================================

export interface SettledResponse<T> {
  status: 'fulfilled' | 'rejected';
  value?: T;
  reason?: string;
}

export interface AriaKey {
  name: string;
  algo: string;
  pubKey: Uint8Array;
  address: Uint8Array;
  bech32Address: string;
  isNanoLedger: boolean;
  isSmartContract?: boolean;
}

export interface ChainInfoWithoutEndpoints {
  chainId: string;
  chainName: string;
  bech32Prefix: string;
  bip44: { coinType: number };
  currencies: Array<{
    coinDenom: string;
    coinMinimalDenom: string;
    coinDecimals: number;
  }>;
}

export interface ConnectedApp {
  origin: string;
  connectedAt: number;
  chainIds: string[];
}

// ============================================================================
// Phase 4A - Secret Network (Enigma) Types
// ============================================================================

export interface SecretUtils {
  getPubkey: () => Promise<Uint8Array>;
  decrypt: (ciphertext: Uint8Array, nonce: Uint8Array) => Promise<Uint8Array>;
  encrypt: (contractCodeHash: string, msg: object) => Promise<Uint8Array>;
  getTxEncryptionKey: (nonce: Uint8Array) => Promise<Uint8Array>;
}

// ============================================================================
// Phase 4B - EVM/Ethereum Types
// ============================================================================

export type EthSignType = 'message' | 'transaction' | 'eip-712';

// ============================================================================
// Phase 4C - Advanced Signing Types
// ============================================================================

export interface DirectAuxSignResponse {
  signed: {
    bodyBytes: Uint8Array;
    publicKey: {
      typeUrl: string;
      value: Uint8Array;
    };
    chainId: string;
    accountNumber: bigint;
    sequence: bigint;
  };
  signature: StdSignature;
}

export interface EIP712Doc {
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  domain: Record<string, unknown>;
  message: Record<string, unknown>;
}

export interface ICNSAdr36Signatures {
  chainId: string;
  addressChainIds: string[];
  signatures: {
    [chainId: string]: {
      address: string;
      signature: StdSignature;
    };
  };
}

// ============================================================================
// Phase 4D - Multi-Chain Types (Bitcoin, Starknet)
// ============================================================================

export interface BitcoinKey {
  name: string;
  pubKey: Uint8Array;
  address: string;
  paymentType: 'native-segwit' | 'taproot';
  isNanoLedger: boolean;
}

export interface SignPsbtOptions {
  autoFinalized?: boolean;
  toSignInputs?: Array<{
    index: number;
    address?: string;
    publicKey?: string;
    sighashTypes?: number[];
    disableTweakSigner?: boolean;
    useTweakedSigner?: boolean;
  }>;
}

export interface StarknetKey {
  name: string;
  pubKey: Uint8Array;
  address: string;
  isNanoLedger: boolean;
}

// ============================================================================
// Phase 4E - SVM/Solana Types
// ============================================================================

export interface SolanaKey {
  name: string;
  pubKey: Uint8Array;
  address: string;
  isNanoLedger: boolean;
}

// ============================================================================
// Phase 4F - Ledger Types
// ============================================================================

export type LedgerTransportType = 'WebUSB' | 'WebHID';

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
  suggestToken?(
    chainId: string,
    contractAddress: string,
    viewingKey?: string
  ): Promise<void>;

  // Chain Management
  addChain?(chainInfo: unknown): Promise<void>;

  // Event Listeners
  on?(type: string, listener: EventListenerOrEventListenerObject): void;
  off?(type: string, listener: EventListenerOrEventListenerObject): void;

  // Signature Verification
  verifyArbitrary?(
    chainId: string,
    signer: string,
    data: string | Uint8Array,
    signature: StdSignature
  ): Promise<boolean>;

  // Connectivity
  ping?(): Promise<void>;

  // Optional Methods (if used)
  enable?(chainIds: string | string[]): Promise<void>;
  disable?(chainIds?: string | string[]): Promise<void>;
  disconnect?(): Promise<void>;

  // ============================================================================
  // Phase 3C - Power Features
  // ============================================================================

  getKeysSettled?(chainIds: string[]): Promise<SettledResponse<AriaKey>[]>;
  getChainInfosWithoutEndpoints?(): Promise<ChainInfoWithoutEndpoints[]>;
  getChainInfoWithoutEndpoints?(chainId: string): Promise<ChainInfoWithoutEndpoints>;
  getConnectedApps?(): Promise<ConnectedApp[]>;
  disconnectApp?(origin: string): Promise<void>;

  // ============================================================================
  // Phase 4A - Secret Network (Enigma) Support
  // ============================================================================

  getEnigmaPubKey?(chainId: string): Promise<Uint8Array>;
  getEnigmaTxEncryptionKey?(chainId: string, nonce: Uint8Array): Promise<Uint8Array>;
  enigmaEncrypt?(
    chainId: string,
    contractCodeHash: string,
    msg: object
  ): Promise<Uint8Array>;
  enigmaDecrypt?(
    chainId: string,
    ciphertext: Uint8Array,
    nonce: Uint8Array
  ): Promise<Uint8Array>;
  getSecret20ViewingKey?(chainId: string, contractAddress: string): Promise<string>;
  getEnigmaUtils?(chainId: string): SecretUtils;

  // ============================================================================
  // Phase 4B - EVM/Ethereum Support
  // ============================================================================

  signEthereum?(
    chainId: string,
    signer: string,
    data: string | Uint8Array,
    type: EthSignType
  ): Promise<Uint8Array>;
  sendEthereumTx?(chainId: string, tx: Uint8Array): Promise<string>;
  suggestERC20?(chainId: string, contractAddress: string): Promise<void>;

  // ============================================================================
  // Phase 4C - Advanced Signing
  // ============================================================================

  signDirectAux?(
    chainId: string,
    signer: string,
    signDoc: DirectSignDoc
  ): Promise<DirectAuxSignResponse>;
  experimentalSignEIP712CosmosTx_v0?(
    chainId: string,
    signer: string,
    eip712: EIP712Doc,
    signDoc: StdSignDoc,
    signOptions?: SignOptions
  ): Promise<AminoSignResponse>;
  signICNSAdr36?(
    chainId: string,
    contractAddress: string,
    owner: string,
    username: string,
    addressChainIds: string[]
  ): Promise<ICNSAdr36Signatures>;

  // ============================================================================
  // Phase 4D - Multi-Chain (Bitcoin, Starknet)
  // ============================================================================

  // Starknet
  getStarknetKey?(chainId: string): Promise<StarknetKey>;
  signStarknetTx?(
    chainId: string,
    signer: string,
    transactions: unknown[]
  ): Promise<unknown>;

  // Bitcoin
  getBitcoinKey?(chainId: string): Promise<BitcoinKey>;
  getBitcoinKeysSettled?(chainIds: string[]): Promise<SettledResponse<BitcoinKey>[]>;
  signPsbt?(
    chainId: string,
    psbtHex: string,
    options?: SignPsbtOptions
  ): Promise<string>;
  signPsbts?(
    chainId: string,
    psbtsHexes: string[],
    options?: SignPsbtOptions
  ): Promise<string[]>;

  // ============================================================================
  // Phase 4E - SVM/Solana Support
  // ============================================================================

  getSolanaKey?(chainId: string): Promise<SolanaKey>;
  signSolanaTransaction?(
    chainId: string,
    transaction: Uint8Array
  ): Promise<Uint8Array>;
  signSolanaMessage?(
    chainId: string,
    message: Uint8Array
  ): Promise<Uint8Array>;
  sendSolanaTransaction?(
    chainId: string,
    transaction: Uint8Array
  ): Promise<string>;

  // ============================================================================
  // Phase 4F - Ledger Hardware Wallet Support
  // ============================================================================

  initLedger?(transport?: LedgerTransportType): Promise<void>;
  getLedgerAddress?(
    path: string,
    bech32Prefix: string
  ): Promise<{ address: string; publicKey: string }>;
  signWithLedger?(
    signDoc: StdSignDoc,
    accountIndex?: number
  ): Promise<Uint8Array>;
  isLedgerConnected?(): boolean;
}

declare global {
  interface Window {
    aria?: Aria;
  }
}
