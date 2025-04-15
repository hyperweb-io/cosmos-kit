import "@interchain-ui/react/styles";
import "../styles/globals.css";
import { wallets } from "cosmos-kit";
import type { AppProps } from "next/app";
import { assets, chains } from "chain-registry";
import { ChainProvider } from "@cosmos-kit/react";
import { ThemeProvider, useTheme } from "@interchain-ui/react";
import { useNextraTheme } from "../components/hooks";
// import { makeWeb3AuthWallets } from "@cosmos-kit/web3auth";
import "nextra-theme-docs/style.css";
import React from "react";

function MyApp({ Component, pageProps }: AppProps) {
  // const web3AuthWallets = useMemo(
  //   () =>
  //     makeWeb3AuthWallets({
  //       loginMethods: [
  //         {
  //           provider: "google",
  //           name: "Google",
  //           logo: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg",
  //         },
  //       ],
  //       client: {
  //         clientId: "localhostid",
  //         web3AuthNetwork: "testnet",
  //       },
  //       promptSign: async (...args) =>
  //         // eslint-disable-next-line no-alert
  //         confirm("Sign transaction? \n" + JSON.stringify(args, null, 2)),
  //     }),
  //   []
  // );
  const { setTheme, themeClass, theme } = useTheme();

  // Sync nextra theme with interchain ui theme
  useNextraTheme({
    onThemeChange(theme) {
      setTheme(theme);
    },
  });

  return (
    <ThemeProvider>
      <ChainProvider
        chains={chains}
        assetLists={assets}
        wallets={[
          ...wallets.for(
            "keplr",
            "ledger",
            "trust",
            "station",
            "cosmostation",
            "omni",
            "shell",
            "vectis",
            "frontier",
            "leap",
            "ctrl",
            "coin98",
            "fin",
            "tailwind",
            "owallet",
            "cdcwallet",
            "foxwallet"
          ),
          // ...web3AuthWallets,
        ]}
        walletConnectOptions={{
          signClient: {
            projectId: "61e6745dc9a852e0ed9ba60d28212357",
            relayUrl: "wss://relay.walletconnect.org",
            metadata: {
              name: "CosmosKit Example",
              description: "CosmosKit Docs",
              url: "https://docs.cosmoskit.com/",
              icons: [
                "https://raw.githubusercontent.com/hyperweb-io/cosmos-kit/main/packages/docs/public/favicon-96x96.png",
              ],
            },
          },
        }}
      >
        <div className={themeClass}>
          <Component {...pageProps} />
        </div>
      </ChainProvider>
    </ThemeProvider>
  );
}

export default MyApp;
