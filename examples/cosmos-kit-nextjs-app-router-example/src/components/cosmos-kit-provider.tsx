"use client";

import { ChainProvider } from "@cosmos-kit/react-lite";
import { chains, assets } from "chain-registry";
import { wallets as keplrWallets } from "@cosmos-kit/keplr";
import { wallets as keplrMobileWallets } from "@cosmos-kit/keplr-mobile";
import { CustomWalletModal } from "./custom-wallet-connect/CustomWalletModal";

const combinedWallets = [...keplrWallets, ...keplrMobileWallets];
const uniqueWalletsMap = new Map();
combinedWallets.forEach((wallet) => {
  if (!uniqueWalletsMap.has(wallet.walletInfo.name)) {
    uniqueWalletsMap.set(wallet.walletInfo.name, wallet);
  }
});
const uniqueWallets = Array.from(uniqueWalletsMap.values());

export function CosmosKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <ChainProvider
      chains={chains}
      assetLists={assets}
      wallets={uniqueWallets}
      walletModal={CustomWalletModal}
      logLevel={"DEBUG"}
      throwErrors="connect_only"
      subscribeConnectEvents={true}
      defaultNameService={"stargaze"}
      walletConnectOptions={{
        signClient: {
          projectId: "a8510432ebb71e6948cfd6cde54b70f7",
          relayUrl: "wss://relay.walletconnect.org",
          metadata: {
            name: "CosmosKit Example",
            description: "CosmosKit test dapp",
            url: "https://test.cosmoskit.com/",
            icons: [
              "https://raw.githubusercontent.com/hyperweb-io/cosmos-kit/main/packages/docs/public/favicon-96x96.png",
            ],
          },
        },
      }}
    >
      {children}
    </ChainProvider>
  );
}
