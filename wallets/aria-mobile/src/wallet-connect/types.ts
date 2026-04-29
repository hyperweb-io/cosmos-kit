// Re-export all types from aria-extension for consistency
export type {
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
} from '@cosmos-kit/aria-extension';

// ============================================================================
// WalletConnect Capability Detection
// ============================================================================

/**
 * Describes what features are available when using Aria via WalletConnect.
 * dApps can check these capabilities before calling methods to provide
 * better user experiences.
 */
export interface AriaWCCapabilities {
  // Core signing - always available via standard WC
  supportsSignAmino: boolean;
  supportsSignDirect: boolean;
  supportsGetAccounts: boolean;

  // Extended core - require custom WC methods
  supportsSignArbitrary: boolean;
  supportsSendTx: boolean;
  supportsVerifyArbitrary: boolean;

  // Feature categories
  supportsEnigma: boolean; // Secret Network - always false over WC
  supportsEVM: boolean;
  supportsBitcoin: boolean; // Always false - needs different namespace
  supportsStarknet: boolean; // Always false - needs different namespace
  supportsSolana: boolean; // Always false - needs different namespace
  supportsLedger: boolean; // Always false - requires hardware
  supportsAdvancedSigning: boolean;
  supportsPowerFeatures: boolean;
}
