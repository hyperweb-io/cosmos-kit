import { EndpointOptions, Wallet } from '@cosmos-kit/core'
import { WCWallet } from '@cosmos-kit/walletconnect'

import { ChainArculusMobile } from './chain-wallet'
import { ArculusClient } from './client'

export class ArculusMobileWallet extends WCWallet {
  constructor(walletInfo: Wallet, preferredEndpoints?: EndpointOptions['endpoints']) {
    super(walletInfo, ChainArculusMobile, ArculusClient)
    this.preferredEndpoints = preferredEndpoints
  }
}
