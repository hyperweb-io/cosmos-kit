import { ChainRecord, Wallet } from '@cosmos-kit/core'
import { ChainWC } from '@cosmos-kit/walletconnect'
import { AriaClient } from './client'

export class ChainAriaMobile extends ChainWC {
  constructor(walletInfo: Wallet, chainInfo: ChainRecord) {
    super(walletInfo, chainInfo, AriaClient)
  }
}
