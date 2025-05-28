/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-imports */
import "bootstrap/dist/css/bootstrap.min.css";
import "@leapwallet/cosmos-social-login-capsule-provider-ui/styles.css";
import "../style/global.css";
import "@interchain-ui/react/styles";

import { Chain } from "@chain-registry/types";
import { Decimal } from "@cosmjs/math";
import { GasPrice } from "@cosmjs/stargate";
import { wallets as coin98Wallets } from "@cosmos-kit/coin98";
import { ChainName } from "@cosmos-kit/core";
import { MainWalletBase } from "@cosmos-kit/core";
import { wallets as keplrWallets } from "@cosmos-kit/keplr";
import { wallets as leapWallets } from "@cosmos-kit/leap";
import { wallets as owalletWallets } from "@cosmos-kit/owallet";
import { wallets as foxWallets } from "@cosmos-kit/foxwallet";
// Show how to custom modal views
import { ChainProvider, defaultModalViews } from "@cosmos-kit/react";
import { wallets as stationWallets } from "@cosmos-kit/station";
import { wallets as ctrlWallets } from "@cosmos-kit/ctrl";
import { useTheme } from "@interchain-ui/react";
import { assets, chains } from "chain-registry";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useState } from "react";

// import { CustomConnectedView } from "../components/custom-connected";
import { RootLayout } from "../components/layout";
// import { useTheme } from "@interchain-ui/react";

function MyApp({ Component, pageProps }: AppProps) {
  const defaultWallets: MainWalletBase[] = [
    ...keplrWallets,
    ...leapWallets,
    ...owalletWallets,
  ];
  const [wallets, setWallets] = useState<MainWalletBase[]>(defaultWallets);
  const [loadingWallets, setLoadingWallet] = useState<boolean>(false);
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

  useEffect(() => {
    setLoadingWallet(true);
    import("@cosmos-kit/leap-capsule-social-login")
      .then((CapsuleModule) => {
        return CapsuleModule.wallets;
      })
      .then((leapSocialLogin) => {
        setWallets([...keplrWallets, ...leapWallets, ...leapSocialLogin]);
        setLoadingWallet(false);
      });
  }, []);

  if (loadingWallets) {
    return <>Loading...</>;
  }

  return (
    <RootLayout>
      <ChainProvider
        // chains={chains}
        // assetLists={[...assets]}
        chains={["cosmoshub", "secretnetwork"]}
        assetLists={[]}
        wallets={[
          // ...wallets,
          ...owalletWallets,
          ...keplrWallets,
          ...leapWallets,

          // ...ninjiWallets,
          // ...snapWallet,
          // ...ledgerWallets,
          // ...web3AuthWallets,
          // ...trustWallets,
          ...stationWallets,
          // ...tailwindWallet,
          // ...cosmostationWallets,
          // ...omniWallets,
          // ...exodusWallets,
          // ...shellWallets,
          // ...vectisWallets,
          ...ctrlWallets,
          // ...frontierWallets,
          ...coin98Wallets,
          ...foxWallets,
          // ...finWallets,
          // ...cdcwalletWallets,
        ]}
        // throwErrors={"connect_only"}
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
        signerOptions={{
          signingStargate: (chain: Chain | ChainName) => {
            const chainName =
              typeof chain === "string" ? chain : chain.chain_name;
            switch (chainName) {
              case "osmosis":
                return {
                  // @ts-ignore
                  gasPrice: new GasPrice(Decimal.zero(1), "uosmo"),
                };
              default:
                return void 0;
            }
          },
        }}
        logLevel={"DEBUG"}
        endpointOptions={{
          isLazy: true,
          endpoints: {
            cosmoshub: {
              rpc: [
                {
                  url: "https://rpc.cosmos.directory/cosmoshub",
                  headers: {},
                },
              ],
            },
            // terra2: {
            //   rpc: ["https://terra-rpc.lavenderfive.com/"],
            //   rest: ["https://phoenix-lcd.terra.dev/"],
            // },
            // terra2testnet: {
            //   rpc: ["https://terra-testnet-rpc.polkachu.com/"],
            //   rest: ["https://pisco-lcd.terra.dev/"],
            // },
          },
        }}
      // // ==== Custom base modal customization
      // // modalTheme={{
      // //   modalContentClassName: "my-custom-modal-content",
      // }}
      // // ==== Custom components
      // // modalViews={{
      // //   ...defaultModalViews,
      // //   Connected: CustomConnectedView,
      // // }}
      // walletModal={CustomModal}
      // modalOptions={{ mobile: { displayQRCodeEveryTime: true } }}
      >
        <Component {...pageProps} />
      </ChainProvider>
      <CustomCapsuleModalViewX />
    </RootLayout>
  );
}

export default MyApp;

const LeapSocialLogin = dynamic(
  () =>
    import("@leapwallet/cosmos-social-login-capsule-provider-ui").then(
      (m) => m.CustomCapsuleModalView
    ),
  { ssr: false }
);

export function CustomCapsuleModalViewX() {
  const [showCapsuleModal, setShowCapsuleModal] = useState(false);
  const [oAuthMethods, setOAuthMethods] = useState<Array<any>>([]);

  useEffect(() => {
    import("@leapwallet/cosmos-social-login-capsule-provider").then(
      (capsuleProvider) => {
        setOAuthMethods([
          capsuleProvider.OAuthMethod.GOOGLE,
          capsuleProvider.OAuthMethod.FACEBOOK,
          capsuleProvider.OAuthMethod.TWITTER,
        ]);
      }
    );
  }, []);

  const { theme } = useTheme();

  return (
    <div className={`leap-ui z-[9999] fixed ${theme === "dark" ? "dark" : ""}`}>
      <LeapSocialLogin
        showCapsuleModal={showCapsuleModal}
        setShowCapsuleModal={setShowCapsuleModal}
        // theme={currentTheme.theme}
        theme={"light"}
        onAfterLoginSuccessful={() => {
          window.successFromCapsuleModal?.();
        }}
        onLoginFailure={() => {
          window.failureFromCapsuleModal?.();
        }}
        logoUrl="https://raw.githubusercontent.com/hyperweb-io/cosmos-kit/main/packages/docs/public/favicon-96x96.png"
        appName="CosmosKit"
        oAuthMethods={oAuthMethods}
      />
    </div>
  );
}
