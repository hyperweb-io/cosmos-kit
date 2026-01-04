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
  ChainRecord,
  DirectSignDoc,
  SignOptions,
  SignType,
  SuggestToken,
  WalletAccount,
  WalletClient,
} from '@cosmos-kit/core';
import {
  Aria,
  AriaKey,
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

  constructor(client: Aria) {
    this.client = client;
  }

  async disconnect() {
    if (this.client.disconnect) {
      await this.client.disconnect();
    }
  }

  async enable(chainIds: string | string[]) {
    await this.client.enable?.(chainIds);
  }

  async addChain(chainInfo: ChainRecord) {
    if (this.client.addChain) {
      await this.client.addChain(chainInfo);
    }
  }

  on(type: string, listener: EventListenerOrEventListenerObject): void {
    if (this.client.on) {
      this.client.on(type, listener);
    }
  }

  off(type: string, listener: EventListenerOrEventListenerObject): void {
    if (this.client.off) {
      this.client.off(type, listener);
    }
  }

  async disable(chainIds?: string | string[]) {
    if (this.client.disable) {
      await this.client.disable(chainIds);
    }
  }

  async ping() {
    if (this.client.ping) {
      await this.client.ping();
    }
  }

  async verifyArbitrary(
    chainId: string,
    signer: string,
    data: string | Uint8Array,
    signature: StdSignature
  ): Promise<boolean> {
    if (this.client.verifyArbitrary) {
      return await this.client.verifyArbitrary(chainId, signer, data, signature);
    }
    return false;
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

  async suggestToken({ chainId, tokens, type }: SuggestToken) {
    if (type === 'cw20') {
      for (const { contractAddress, viewingKey } of tokens) {
        if (viewingKey && this.client.suggestToken) {
          await this.client.suggestToken(chainId, contractAddress, viewingKey);
        } else if (this.client.suggestCW20Token) {
          await this.client.suggestCW20Token(chainId, contractAddress);
        }
      }
    }
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

  // ============================================================================
  // Phase 3C - Power Features
  // ============================================================================

  async getKeysSettled(chainIds: string[]): Promise<SettledResponse<AriaKey>[]> {
    if (this.client.getKeysSettled) {
      return await this.client.getKeysSettled(chainIds);
    }
    // Fallback: call getKey for each chain and settle
    const results = await Promise.allSettled(
      chainIds.map((chainId) => this.client.getKey(chainId))
    );
    return results.map((result) =>
      result.status === 'fulfilled'
        ? { status: 'fulfilled' as const, value: result.value as unknown as AriaKey }
        : { status: 'rejected' as const, reason: String(result.reason) }
    );
  }

  async getChainInfosWithoutEndpoints(): Promise<ChainInfoWithoutEndpoints[]> {
    if (this.client.getChainInfosWithoutEndpoints) {
      return await this.client.getChainInfosWithoutEndpoints();
    }
    return [];
  }

  async getChainInfoWithoutEndpoints(
    chainId: string
  ): Promise<ChainInfoWithoutEndpoints | undefined> {
    if (this.client.getChainInfoWithoutEndpoints) {
      return await this.client.getChainInfoWithoutEndpoints(chainId);
    }
    return undefined;
  }

  async getConnectedApps(): Promise<ConnectedApp[]> {
    if (this.client.getConnectedApps) {
      return await this.client.getConnectedApps();
    }
    return [];
  }

  async disconnectApp(origin: string): Promise<void> {
    if (this.client.disconnectApp) {
      await this.client.disconnectApp(origin);
    }
  }

  // ============================================================================
  // Phase 4A - Secret Network (Enigma) Support
  // ============================================================================

  async getEnigmaPubKey(chainId: string): Promise<Uint8Array> {
    if (this.client.getEnigmaPubKey) {
      return await this.client.getEnigmaPubKey(chainId);
    }
    throw new Error('Enigma not supported');
  }

  async getEnigmaTxEncryptionKey(
    chainId: string,
    nonce: Uint8Array
  ): Promise<Uint8Array> {
    if (this.client.getEnigmaTxEncryptionKey) {
      return await this.client.getEnigmaTxEncryptionKey(chainId, nonce);
    }
    throw new Error('Enigma not supported');
  }

  async enigmaEncrypt(
    chainId: string,
    contractCodeHash: string,
    msg: object
  ): Promise<Uint8Array> {
    if (this.client.enigmaEncrypt) {
      return await this.client.enigmaEncrypt(chainId, contractCodeHash, msg);
    }
    throw new Error('Enigma not supported');
  }

  async enigmaDecrypt(
    chainId: string,
    ciphertext: Uint8Array,
    nonce: Uint8Array
  ): Promise<Uint8Array> {
    if (this.client.enigmaDecrypt) {
      return await this.client.enigmaDecrypt(chainId, ciphertext, nonce);
    }
    throw new Error('Enigma not supported');
  }

  async getSecret20ViewingKey(
    chainId: string,
    contractAddress: string
  ): Promise<string> {
    if (this.client.getSecret20ViewingKey) {
      return await this.client.getSecret20ViewingKey(chainId, contractAddress);
    }
    throw new Error('Enigma not supported');
  }

  getEnigmaUtils(chainId: string): SecretUtils | undefined {
    if (this.client.getEnigmaUtils) {
      return this.client.getEnigmaUtils(chainId);
    }
    return undefined;
  }

  // ============================================================================
  // Phase 4B - EVM/Ethereum Support
  // ============================================================================

  async signEthereum(
    chainId: string,
    signer: string,
    data: string | Uint8Array,
    type: EthSignType
  ): Promise<Uint8Array> {
    if (this.client.signEthereum) {
      return await this.client.signEthereum(chainId, signer, data, type);
    }
    throw new Error('Ethereum signing not supported');
  }

  async sendEthereumTx(chainId: string, tx: Uint8Array): Promise<string> {
    if (this.client.sendEthereumTx) {
      return await this.client.sendEthereumTx(chainId, tx);
    }
    throw new Error('Ethereum transactions not supported');
  }

  async suggestERC20(chainId: string, contractAddress: string): Promise<void> {
    if (this.client.suggestERC20) {
      await this.client.suggestERC20(chainId, contractAddress);
    }
  }

  // ============================================================================
  // Phase 4C - Advanced Signing
  // ============================================================================

  async signDirectAux(
    chainId: string,
    signer: string,
    signDoc: DirectSignDoc
  ): Promise<DirectAuxSignResponse> {
    if (this.client.signDirectAux) {
      return await this.client.signDirectAux(chainId, signer, signDoc);
    }
    throw new Error('signDirectAux not supported');
  }

  async experimentalSignEIP712CosmosTx_v0(
    chainId: string,
    signer: string,
    eip712: EIP712Doc,
    signDoc: StdSignDoc,
    signOptions?: SignOptions
  ): Promise<AminoSignResponse> {
    if (this.client.experimentalSignEIP712CosmosTx_v0) {
      return await this.client.experimentalSignEIP712CosmosTx_v0(
        chainId,
        signer,
        eip712,
        signDoc,
        signOptions || this.defaultSignOptions
      );
    }
    throw new Error('EIP-712 signing not supported');
  }

  async signICNSAdr36(
    chainId: string,
    contractAddress: string,
    owner: string,
    username: string,
    addressChainIds: string[]
  ): Promise<ICNSAdr36Signatures> {
    if (this.client.signICNSAdr36) {
      return await this.client.signICNSAdr36(
        chainId,
        contractAddress,
        owner,
        username,
        addressChainIds
      );
    }
    throw new Error('ICNS signing not supported');
  }

  // ============================================================================
  // Phase 4D - Multi-Chain (Bitcoin, Starknet)
  // ============================================================================

  // Starknet
  async getStarknetKey(chainId: string): Promise<StarknetKey> {
    if (this.client.getStarknetKey) {
      return await this.client.getStarknetKey(chainId);
    }
    throw new Error('Starknet not supported');
  }

  async signStarknetTx(
    chainId: string,
    signer: string,
    transactions: unknown[]
  ): Promise<unknown> {
    if (this.client.signStarknetTx) {
      return await this.client.signStarknetTx(chainId, signer, transactions);
    }
    throw new Error('Starknet not supported');
  }

  // Bitcoin
  async getBitcoinKey(chainId: string): Promise<BitcoinKey> {
    if (this.client.getBitcoinKey) {
      return await this.client.getBitcoinKey(chainId);
    }
    throw new Error('Bitcoin not supported');
  }

  async getBitcoinKeysSettled(
    chainIds: string[]
  ): Promise<SettledResponse<BitcoinKey>[]> {
    if (this.client.getBitcoinKeysSettled) {
      return await this.client.getBitcoinKeysSettled(chainIds);
    }
    // Fallback: call getBitcoinKey for each chain and settle
    if (this.client.getBitcoinKey) {
      const results = await Promise.allSettled(
        chainIds.map((chainId) => this.client.getBitcoinKey!(chainId))
      );
      return results.map((result) =>
        result.status === 'fulfilled'
          ? { status: 'fulfilled' as const, value: result.value }
          : { status: 'rejected' as const, reason: String(result.reason) }
      );
    }
    return chainIds.map(() => ({
      status: 'rejected' as const,
      reason: 'Bitcoin not supported',
    }));
  }

  async signPsbt(
    chainId: string,
    psbtHex: string,
    options?: SignPsbtOptions
  ): Promise<string> {
    if (this.client.signPsbt) {
      return await this.client.signPsbt(chainId, psbtHex, options);
    }
    throw new Error('Bitcoin PSBT signing not supported');
  }

  async signPsbts(
    chainId: string,
    psbtsHexes: string[],
    options?: SignPsbtOptions
  ): Promise<string[]> {
    if (this.client.signPsbts) {
      return await this.client.signPsbts(chainId, psbtsHexes, options);
    }
    throw new Error('Bitcoin PSBT signing not supported');
  }

  // ============================================================================
  // Phase 4E - SVM/Solana Support
  // ============================================================================

  async getSolanaKey(chainId: string): Promise<SolanaKey> {
    if (this.client.getSolanaKey) {
      return await this.client.getSolanaKey(chainId);
    }
    throw new Error('Solana not supported');
  }

  async signSolanaTransaction(
    chainId: string,
    transaction: Uint8Array
  ): Promise<Uint8Array> {
    if (this.client.signSolanaTransaction) {
      return await this.client.signSolanaTransaction(chainId, transaction);
    }
    throw new Error('Solana not supported');
  }

  async signSolanaMessage(
    chainId: string,
    message: Uint8Array
  ): Promise<Uint8Array> {
    if (this.client.signSolanaMessage) {
      return await this.client.signSolanaMessage(chainId, message);
    }
    throw new Error('Solana not supported');
  }

  async sendSolanaTransaction(
    chainId: string,
    transaction: Uint8Array
  ): Promise<string> {
    if (this.client.sendSolanaTransaction) {
      return await this.client.sendSolanaTransaction(chainId, transaction);
    }
    throw new Error('Solana not supported');
  }

  // ============================================================================
  // Phase 4F - Ledger Hardware Wallet Support
  // ============================================================================

  async initLedger(transport?: LedgerTransportType): Promise<void> {
    if (this.client.initLedger) {
      await this.client.initLedger(transport);
    } else {
      throw new Error('Ledger not supported');
    }
  }

  async getLedgerAddress(
    path: string,
    bech32Prefix: string
  ): Promise<{ address: string; publicKey: string }> {
    if (this.client.getLedgerAddress) {
      return await this.client.getLedgerAddress(path, bech32Prefix);
    }
    throw new Error('Ledger not supported');
  }

  async signWithLedger(
    signDoc: StdSignDoc,
    accountIndex?: number
  ): Promise<Uint8Array> {
    if (this.client.signWithLedger) {
      return await this.client.signWithLedger(signDoc, accountIndex);
    }
    throw new Error('Ledger not supported');
  }

  isLedgerConnected(): boolean {
    if (this.client.isLedgerConnected) {
      return this.client.isLedgerConnected();
    }
    return false;
  }
}
