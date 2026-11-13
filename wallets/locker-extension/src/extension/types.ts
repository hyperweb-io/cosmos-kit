import { StdSignature } from '@cosmjs/amino';
import { OfflineDirectSigner } from '@cosmjs/proto-signing';
import { DirectSignResponse } from '@cosmjs/proto-signing';
import { BroadcastMode, Key } from '@cosmos-kit/core';

export interface LockerSignOptions {
  readonly preferNoSetFee?: boolean;
  readonly preferNoSetMemo?: boolean;
  readonly disableBalanceCheck?: boolean;
}

/**
 * `window.lockerCosmos`, the Keplr-compatible API Locker Wallet defines on every page. It signs SIGN_MODE_DIRECT only:
 * `signAmino`, `getOfflineSignerOnlyAmino` and `signArbitrary` reject with a message that says so, because the offline
 * signer reviews the protobuf SignDoc and cannot display an amino JSON document or an arbitrary payload.
 */
export interface Locker {
  isLocker?: boolean;
  mode: 'extension';
  enable(chainIds: string | string[]): Promise<void>;
  disable(): Promise<void>;
  getKey(chainId: string): Promise<Key>;
  getOfflineSigner(chainId: string): OfflineDirectSigner;
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
    signOptions?: LockerSignOptions
  ): Promise<DirectSignResponse>;
  signArbitrary(
    chainId: string,
    signer: string,
    data: string | Uint8Array
  ): Promise<StdSignature>;
  sendTx(
    chainId: string,
    tx: Uint8Array,
    mode: BroadcastMode
  ): Promise<Uint8Array>;
}
