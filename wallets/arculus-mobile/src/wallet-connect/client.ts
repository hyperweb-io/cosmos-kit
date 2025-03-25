import { Wallet } from '@cosmos-kit/core'
import { WCClient } from '@cosmos-kit/walletconnect'

export class ArculusClient extends WCClient {
  constructor(walletInfo: Wallet) {
    super(walletInfo)
  }
}
