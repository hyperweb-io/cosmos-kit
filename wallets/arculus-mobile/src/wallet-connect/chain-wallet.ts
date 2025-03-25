import { ChainRecord, Wallet } from '@cosmos-kit/core'
import { ChainWC } from '@cosmos-kit/walletconnect'
import { ArculusClient } from './client'

export class ChainArculusMobile extends ChainWC {
  constructor(walletInfo: Wallet, chainInfo: ChainRecord) {
    super(walletInfo, chainInfo, ArculusClient)
  }
}
