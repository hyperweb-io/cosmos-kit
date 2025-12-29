import {
  AminoSignResponse,
  OfflineAminoSigner,
  StdSignDoc,
  StdSignature,
} from '@cosmjs/amino';
import { OfflineDirectSigner } from '@cosmjs/proto-signing';
import {
  BroadcastMode,
  ChainRecord,
  DirectSignDoc,
  SignOptions,
  SignType,
  SuggestToken,
  Wallet,
} from '@cosmos-kit/core';
import { WCClient } from '@cosmos-kit/walletconnect';

import {
  AriaKey,
  AriaWCCapabilities,
  BitcoinKey,
  ChainInfoWithoutEndpoints,
  ConnectedApp,
  DirectAuxSignResponse,
  EIP712Doc,
  EthSignType,
  ICNSAdr36Signatures,
  LedgerTransportType,
  SecretUtils,
  SettledResponse,
  SignPsbtOptions,
  SolanaKey,
  StarknetKey,
} from './types';

export class AriaClient extends WCClient {
  constructor(walletInfo: Wallet) {
    super(walletInfo);
  }

  // ============================================================================
  // Capability Detection
  // ============================================================================

  /**
   * Returns an object describing what features are available over WalletConnect.
   * dApps can check these capabilities before calling methods.
   */
  get capabilities(): AriaWCCapabilities {
    const hasCustomMethods =
      (this.walletInfo.walletconnect?.requiredNamespaces?.methods?.length ?? 0) > 0;

    return {
      // Core - always supported via standard WC
      supportsSignAmino: true,
      supportsSignDirect: true,
      supportsGetAccounts: true,

      // Extended - require custom WC methods
      supportsSignArbitrary: hasCustomMethods,
      supportsSendTx: hasCustomMethods,
      supportsVerifyArbitrary: hasCustomMethods,

      // Feature categories
      supportsEnigma: false, // Secret Network operations require local key material
      supportsEVM: hasCustomMethods,
      supportsBitcoin: false, // Different namespace needed
      supportsStarknet: false, // Different namespace needed
      supportsSolana: false, // Different namespace needed
      supportsLedger: false, // Hardware wallet operations cannot work over WC
      supportsAdvancedSigning: hasCustomMethods,
      supportsPowerFeatures: hasCustomMethods,
    };
  }

  // ============================================================================
  // Core Methods - Offline Signers (override to add type info)
  // ============================================================================

  async getOfflineSigner(
    chainId: string,
    preferredSignType?: SignType
  ): Promise<OfflineAminoSigner | OfflineDirectSigner> {
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
      getAccounts: async () => [await this.getAccount(chainId)],
      signAmino: (signerAddress: string, signDoc: StdSignDoc) =>
        this.signAmino(chainId, signerAddress, signDoc),
    } as OfflineAminoSigner;
  }

  getOfflineSignerDirect(chainId: string): OfflineDirectSigner {
    return {
      getAccounts: async () => [await this.getAccount(chainId)],
      signDirect: (signerAddress: string, signDoc: DirectSignDoc) =>
        this.signDirect(chainId, signerAddress, signDoc),
    } as OfflineDirectSigner;
  }

  // ============================================================================
  // Core Methods - Custom WC Methods
  // ============================================================================

  async signArbitrary(
    chainId: string,
    signer: string,
    data: string | Uint8Array
  ): Promise<StdSignature> {
    if (!this.capabilities.supportsSignArbitrary) {
      throw new Error(
        'signArbitrary is not supported over WalletConnect. ' +
          'This method requires running inside the Aria mobile app.'
      );
    }

    const session = await this.getSession('cosmos', chainId);
    if (!session) {
      throw new Error(`Session for ${chainId} not established yet.`);
    }

    if (this.redirect) this.openApp();

    const dataToSign =
      typeof data === 'string'
        ? data
        : Buffer.from(data).toString(this.wcEncoding);

    const resp = await this.signClient!.request({
      topic: session.topic,
      chainId: `cosmos:${chainId}`,
      request: {
        method: 'aria_signArbitrary',
        params: {
          signerAddress: signer,
          data: dataToSign,
        },
      },
    });

    return resp as StdSignature;
  }

  async sendTx(
    chainId: string,
    tx: Uint8Array,
    mode: BroadcastMode
  ): Promise<Uint8Array> {
    if (!this.capabilities.supportsSendTx) {
      throw new Error(
        'sendTx is not supported over WalletConnect. ' +
          'Use a local RPC endpoint to broadcast transactions.'
      );
    }

    const session = await this.getSession('cosmos', chainId);
    if (!session) {
      throw new Error(`Session for ${chainId} not established yet.`);
    }

    if (this.redirect) this.openApp();

    const resp = await this.signClient!.request({
      topic: session.topic,
      chainId: `cosmos:${chainId}`,
      request: {
        method: 'aria_sendTx',
        params: {
          tx: Buffer.from(tx).toString(this.wcEncoding),
          mode,
        },
      },
    });

    return new Uint8Array(Buffer.from(resp as string, this.wcEncoding));
  }

  async verifyArbitrary(
    chainId: string,
    signer: string,
    data: string | Uint8Array,
    signature: StdSignature
  ): Promise<boolean> {
    if (!this.capabilities.supportsVerifyArbitrary) {
      throw new Error(
        'verifyArbitrary is not supported over WalletConnect. ' +
          'Use a local verification library instead.'
      );
    }

    const session = await this.getSession('cosmos', chainId);
    if (!session) {
      throw new Error(`Session for ${chainId} not established yet.`);
    }

    const dataToVerify =
      typeof data === 'string'
        ? data
        : Buffer.from(data).toString(this.wcEncoding);

    const resp = await this.signClient!.request({
      topic: session.topic,
      chainId: `cosmos:${chainId}`,
      request: {
        method: 'aria_verifyArbitrary',
        params: {
          signerAddress: signer,
          data: dataToVerify,
          signature,
        },
      },
    });

    return resp as boolean;
  }

  // ============================================================================
  // Connectivity Methods
  // ============================================================================

  async enable(_chainIds: string | string[]): Promise<void> {
    // For WC, enable is handled during connect - this is a no-op
  }

  async disable(_chainIds?: string | string[]): Promise<void> {
    // For WC, we don't have per-chain disable - this is a no-op
  }

  // disconnect is inherited from WCClient

  async addChain(_chainInfo: ChainRecord): Promise<void> {
    throw new Error(
      'addChain is not supported over WalletConnect. ' +
        'Chain suggestions must be done through the Aria mobile app directly.'
    );
  }

  async ping(): Promise<void> {
    if (this.signClient && this.sessions.length > 0) {
      await this.signClient.ping({ topic: this.sessions[0].topic });
    }
  }

  on(type: string, listener: EventListenerOrEventListenerObject): void {
    // WC event handling is done through signClient events
    this.signClient?.on(type as any, listener as any);
  }

  off(type: string, listener: EventListenerOrEventListenerObject): void {
    this.signClient?.off(type as any, listener as any);
  }

  async suggestToken(_suggestToken: SuggestToken): Promise<void> {
    throw new Error(
      'suggestToken is not supported over WalletConnect. ' +
        'Token suggestions must be done through the Aria mobile app directly.'
    );
  }

  // ============================================================================
  // Power Features
  // ============================================================================

  async getKeysSettled(chainIds: string[]): Promise<SettledResponse<AriaKey>[]> {
    // Fallback: call getAccount for each chain
    const results = await Promise.allSettled(
      chainIds.map((chainId) => this.getAccount(chainId))
    );
    return results.map((result) =>
      result.status === 'fulfilled'
        ? {
            status: 'fulfilled' as const,
            value: {
              name: result.value.username || '',
              algo: result.value.algo,
              pubKey: result.value.pubkey,
              address: new Uint8Array(),
              bech32Address: result.value.address,
              isNanoLedger: result.value.isNanoLedger || false,
            } as AriaKey,
          }
        : { status: 'rejected' as const, reason: String(result.reason) }
    );
  }

  async getChainInfosWithoutEndpoints(): Promise<ChainInfoWithoutEndpoints[]> {
    if (!this.capabilities.supportsPowerFeatures) {
      return []; // No way to get this over standard WC
    }

    const session = this.sessions[0];
    if (!session) {
      return [];
    }

    try {
      const resp = await this.signClient!.request({
        topic: session.topic,
        chainId: `cosmos:cosmoshub-4`, // Default chain for wallet-level queries
        request: {
          method: 'aria_getChainInfosWithoutEndpoints',
          params: {},
        },
      });

      return resp as ChainInfoWithoutEndpoints[];
    } catch {
      return [];
    }
  }

  async getChainInfoWithoutEndpoints(
    chainId: string
  ): Promise<ChainInfoWithoutEndpoints | undefined> {
    const infos = await this.getChainInfosWithoutEndpoints();
    return infos.find((info) => info.chainId === chainId);
  }

  async getConnectedApps(): Promise<ConnectedApp[]> {
    throw new Error(
      'getConnectedApps is not supported over WalletConnect. ' +
        'This is a wallet-internal feature.'
    );
  }

  async disconnectApp(_origin: string): Promise<void> {
    throw new Error(
      'disconnectApp is not supported over WalletConnect. ' +
        'This is a wallet-internal feature.'
    );
  }

  // ============================================================================
  // Secret Network (Enigma) - NOT SUPPORTED over WC
  // ============================================================================

  async getEnigmaPubKey(_chainId: string): Promise<Uint8Array> {
    throw new Error(
      'Enigma operations are not supported over WalletConnect. ' +
        'Secret Network encryption requires running inside the Aria mobile app.'
    );
  }

  async getEnigmaTxEncryptionKey(
    _chainId: string,
    _nonce: Uint8Array
  ): Promise<Uint8Array> {
    throw new Error(
      'Enigma operations are not supported over WalletConnect. ' +
        'Secret Network encryption requires running inside the Aria mobile app.'
    );
  }

  async enigmaEncrypt(
    _chainId: string,
    _contractCodeHash: string,
    _msg: object
  ): Promise<Uint8Array> {
    throw new Error(
      'Enigma operations are not supported over WalletConnect. ' +
        'Secret Network encryption requires running inside the Aria mobile app.'
    );
  }

  async enigmaDecrypt(
    _chainId: string,
    _ciphertext: Uint8Array,
    _nonce: Uint8Array
  ): Promise<Uint8Array> {
    throw new Error(
      'Enigma operations are not supported over WalletConnect. ' +
        'Secret Network encryption requires running inside the Aria mobile app.'
    );
  }

  async getSecret20ViewingKey(
    _chainId: string,
    _contractAddress: string
  ): Promise<string> {
    throw new Error(
      'Enigma operations are not supported over WalletConnect. ' +
        'Secret Network operations require running inside the Aria mobile app.'
    );
  }

  getEnigmaUtils(_chainId: string): SecretUtils | undefined {
    return undefined; // Not available over WC
  }

  // ============================================================================
  // EVM/Ethereum Support
  // ============================================================================

  async signEthereum(
    chainId: string,
    signer: string,
    data: string | Uint8Array,
    type: EthSignType
  ): Promise<Uint8Array> {
    if (!this.capabilities.supportsEVM) {
      throw new Error(
        'EVM signing is not supported over WalletConnect. ' +
          'This requires running inside the Aria mobile app.'
      );
    }

    const session = await this.getSession('cosmos', chainId);
    if (!session) {
      throw new Error(`Session for ${chainId} not established yet.`);
    }

    if (this.redirect) this.openApp();

    const dataToSign =
      typeof data === 'string'
        ? data
        : Buffer.from(data).toString(this.wcEncoding);

    const resp = await this.signClient!.request({
      topic: session.topic,
      chainId: `cosmos:${chainId}`,
      request: {
        method: 'aria_signEthereum',
        params: {
          signerAddress: signer,
          data: dataToSign,
          type,
        },
      },
    });

    return new Uint8Array(Buffer.from(resp as string, this.wcEncoding));
  }

  async sendEthereumTx(_chainId: string, _tx: Uint8Array): Promise<string> {
    throw new Error(
      'sendEthereumTx is not supported over WalletConnect. ' +
        'Use a local RPC endpoint to broadcast Ethereum transactions.'
    );
  }

  async suggestERC20(_chainId: string, _contractAddress: string): Promise<void> {
    throw new Error(
      'suggestERC20 is not supported over WalletConnect. ' +
        'Token suggestions must be done through the Aria mobile app directly.'
    );
  }

  // ============================================================================
  // Advanced Signing
  // ============================================================================

  async signDirectAux(
    chainId: string,
    signer: string,
    signDoc: DirectSignDoc
  ): Promise<DirectAuxSignResponse> {
    if (!this.capabilities.supportsAdvancedSigning) {
      throw new Error(
        'signDirectAux is not supported over WalletConnect. ' +
          'This requires running inside the Aria mobile app.'
      );
    }

    const session = await this.getSession('cosmos', chainId);
    if (!session) {
      throw new Error(`Session for ${chainId} not established yet.`);
    }

    if (this.redirect) this.openApp();

    const resp = await this.signClient!.request({
      topic: session.topic,
      chainId: `cosmos:${chainId}`,
      request: {
        method: 'aria_signDirectAux',
        params: {
          signerAddress: signer,
          signDoc: {
            chainId: signDoc.chainId,
            bodyBytes: signDoc.bodyBytes
              ? Buffer.from(signDoc.bodyBytes).toString(this.wcEncoding)
              : null,
            authInfoBytes: signDoc.authInfoBytes
              ? Buffer.from(signDoc.authInfoBytes).toString(this.wcEncoding)
              : null,
            accountNumber: signDoc.accountNumber?.toString() ?? null,
          },
        },
      },
    });

    return resp as DirectAuxSignResponse;
  }

  async experimentalSignEIP712CosmosTx_v0(
    chainId: string,
    signer: string,
    eip712: EIP712Doc,
    signDoc: StdSignDoc,
    signOptions?: SignOptions
  ): Promise<AminoSignResponse> {
    if (!this.capabilities.supportsAdvancedSigning) {
      throw new Error(
        'EIP-712 signing is not supported over WalletConnect. ' +
          'This requires running inside the Aria mobile app.'
      );
    }

    const session = await this.getSession('cosmos', chainId);
    if (!session) {
      throw new Error(`Session for ${chainId} not established yet.`);
    }

    if (this.redirect) this.openApp();

    const resp = await this.signClient!.request({
      topic: session.topic,
      chainId: `cosmos:${chainId}`,
      request: {
        method: 'aria_experimentalSignEIP712CosmosTx_v0',
        params: {
          signerAddress: signer,
          eip712,
          signDoc,
          signOptions: signOptions || this.defaultSignOptions,
        },
      },
    });

    return resp as AminoSignResponse;
  }

  async signICNSAdr36(
    _chainId: string,
    _contractAddress: string,
    _owner: string,
    _username: string,
    _addressChainIds: string[]
  ): Promise<ICNSAdr36Signatures> {
    throw new Error(
      'ICNS signing is not supported over WalletConnect. ' +
        'This requires running inside the Aria mobile app.'
    );
  }

  // ============================================================================
  // Bitcoin Support - NOT SUPPORTED over standard cosmos WC
  // ============================================================================

  async getBitcoinKey(_chainId: string): Promise<BitcoinKey> {
    throw new Error(
      'Bitcoin operations are not supported over WalletConnect. ' +
        'Bitcoin requires a separate WalletConnect namespace. ' +
        'This requires running inside the Aria mobile app.'
    );
  }

  async getBitcoinKeysSettled(
    chainIds: string[]
  ): Promise<SettledResponse<BitcoinKey>[]> {
    return chainIds.map(() => ({
      status: 'rejected' as const,
      reason: 'Bitcoin not supported over WalletConnect',
    }));
  }

  async signPsbt(
    _chainId: string,
    _psbtHex: string,
    _options?: SignPsbtOptions
  ): Promise<string> {
    throw new Error(
      'Bitcoin PSBT signing is not supported over WalletConnect. ' +
        'This requires running inside the Aria mobile app.'
    );
  }

  async signPsbts(
    _chainId: string,
    _psbtsHexes: string[],
    _options?: SignPsbtOptions
  ): Promise<string[]> {
    throw new Error(
      'Bitcoin PSBT signing is not supported over WalletConnect. ' +
        'This requires running inside the Aria mobile app.'
    );
  }

  // ============================================================================
  // Starknet Support - NOT SUPPORTED over standard cosmos WC
  // ============================================================================

  async getStarknetKey(_chainId: string): Promise<StarknetKey> {
    throw new Error(
      'Starknet operations are not supported over WalletConnect. ' +
        'Starknet requires a separate WalletConnect namespace. ' +
        'This requires running inside the Aria mobile app.'
    );
  }

  async signStarknetTx(
    _chainId: string,
    _signer: string,
    _transactions: unknown[]
  ): Promise<unknown> {
    throw new Error(
      'Starknet signing is not supported over WalletConnect. ' +
        'This requires running inside the Aria mobile app.'
    );
  }

  // ============================================================================
  // Solana Support - NOT SUPPORTED over standard cosmos WC
  // ============================================================================

  async getSolanaKey(_chainId: string): Promise<SolanaKey> {
    throw new Error(
      'Solana operations are not supported over WalletConnect. ' +
        'Solana requires a separate WalletConnect namespace. ' +
        'This requires running inside the Aria mobile app.'
    );
  }

  async signSolanaTransaction(
    _chainId: string,
    _transaction: Uint8Array
  ): Promise<Uint8Array> {
    throw new Error(
      'Solana signing is not supported over WalletConnect. ' +
        'This requires running inside the Aria mobile app.'
    );
  }

  async signSolanaMessage(
    _chainId: string,
    _message: Uint8Array
  ): Promise<Uint8Array> {
    throw new Error(
      'Solana message signing is not supported over WalletConnect. ' +
        'This requires running inside the Aria mobile app.'
    );
  }

  async sendSolanaTransaction(
    _chainId: string,
    _transaction: Uint8Array
  ): Promise<string> {
    throw new Error(
      'Solana transactions are not supported over WalletConnect. ' +
        'This requires running inside the Aria mobile app.'
    );
  }

  // ============================================================================
  // Ledger Support - NOT SUPPORTED over WC
  // ============================================================================

  async initLedger(_transport?: LedgerTransportType): Promise<void> {
    throw new Error(
      'Ledger operations are not supported over WalletConnect. ' +
        'Hardware wallet operations require direct USB/Bluetooth access.'
    );
  }

  async getLedgerAddress(
    _path: string,
    _bech32Prefix: string
  ): Promise<{ address: string; publicKey: string }> {
    throw new Error(
      'Ledger operations are not supported over WalletConnect. ' +
        'Hardware wallet operations require direct USB/Bluetooth access.'
    );
  }

  async signWithLedger(
    _signDoc: StdSignDoc,
    _accountIndex?: number
  ): Promise<Uint8Array> {
    throw new Error(
      'Ledger operations are not supported over WalletConnect. ' +
        'Hardware wallet operations require direct USB/Bluetooth access.'
    );
  }

  isLedgerConnected(): boolean {
    return false; // Never connected over WC
  }
}
