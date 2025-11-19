import type { Wallet } from '@cosmos-kit/core';

export type OkoLoginProvider = 'google' | 'email';

export interface OkoLoginMethod {
  provider: OkoLoginProvider;
  name: string;
  logo?: string;
}

export interface OkoWalletOptions {
  apiKey: string;
  sdkEndpoint?: string;
  loginProvider: OkoLoginProvider;
}

export type OkoWalletInfo = Wallet & { options: OkoWalletOptions };
