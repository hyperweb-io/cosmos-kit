import type { Wallet } from '@cosmos-kit/core';

export type OkoLoginProvider = 'google'; // 'google' | 'email';

export interface OkoLoginMethod {
  provider: OkoLoginProvider;
}

export interface OkoWalletOptions {
  apiKey: string;
  sdkEndpoint?: string;
  loginMethods?: OkoLoginMethod[];
}

export interface OkoWalletInternalOptions {
  apiKey: string;
  sdkEndpoint?: string;
  loginProvider: OkoLoginProvider;
}

export type OkoWalletInfo = Wallet & { options: OkoWalletInternalOptions };
