import { EndpointOptions, Wallet } from '@cosmos-kit/core'
import { WCWallet } from '@cosmos-kit/walletconnect'

import { ChainAriaMobile } from './chain-wallet'
import { AriaClient } from './client'

export class AriaMobileWallet extends WCWallet {
  constructor(walletInfo: Wallet, preferredEndpoints?: EndpointOptions['endpoints']) {
    super(walletInfo, ChainAriaMobile, AriaClient)
    this.preferredEndpoints = preferredEndpoints
  }
}
