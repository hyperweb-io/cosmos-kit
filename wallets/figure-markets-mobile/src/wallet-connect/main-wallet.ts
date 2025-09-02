import { EndpointOptions, Wallet } from '@cosmos-kit/core';
import { WCWallet } from '@cosmos-kit/walletconnect';

import { ChainFigureMarketsMobile } from './chain-wallet';
import { FigureMarketsClient } from './client';

export class FigureMarketsMobileWallet extends WCWallet {
  constructor(
    walletInfo: Wallet,
    preferredEndpoints?: EndpointOptions['endpoints']
  ) {
    super(walletInfo, ChainFigureMarketsMobile, FigureMarketsClient);
    this.preferredEndpoints = preferredEndpoints;
  }
}
