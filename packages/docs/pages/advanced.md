# Advanced

## Code Structure

To make user better understand the whole design structure of CosmosKit, here to briefly introduce some important classes from `@cosmos-kit/core`.

There are four important classes.

- WalletManager
- MainWalletBase
- ChainWalletBase
- WalletRepo

Before all, we need to clarify that there are two types of entities in CosmosKit as a wallet adapter: **Chain** and **Wallet**. Chain is identified by chain name i.e. `cosmoshub`, `osmosis` etc. And wallet is identified by wallet name i.e. `keplr-extension`, `keplr-mobile`, `cosmostation-extension` etc.

> Note that we're taking a single wallet application as a wallet in CosmosKit rather than the wallet product name. Taking `Keplr` as an example, we diffientiate `extension` and `mobile` in our code because they are connected via totally different codes. So for product `Keplr`, we have two wallets `keplr-extension` and `keplr-mobile` in CosmosKit.

### WalletManager

`WalletManager` is the entrance of the whole code and it manages all `WalletRepo`, `MainWalletBase`, `ChainWalletBase` instances in it. It also corresponds to `ChainProvider` in `@cosmos-kit/react-lite` and `@cosmos-kit/react`. You can find that the properties of JSX element `ChainProvider` are almost the same with the constructor arguments of `WalletManager`. All necessary chain information and wallet information from `ChainProvider` will be passed to corresponding wallet classes via `WalletManager`.

Three important properties/arguments in `ChainProvider`/`WalletManager` are `chains`, `assetLists` and `wallets`. `chains` and `assetLists` provide chain information, and `wallets` provides wallet information. Actually `wallets` is an array of `MainWalletBase` instances. Here leads to the second class `MainWalletBase`.

### MainWalletBase

`MainWalletBase` is meant to provide a base implementation and unified interface for all different wallets like `keplr-extension`, `keplr-mobile` and `cosmostation-extension`. Basically every wallet has it's own `MainWallet` class, which extends `MainWalletBase` in common, but with `WalletClient` implemented in different ways. In this way `WalletManager` can handle all different wallets no matter how different they're inside.

> For practice you can take a look at [How to Integrate New Wallets into CosmosKit](/integrating-wallets/adding-new-wallets)

`MainWalletBase` is only about wallet and it's not about any specifical chain. And it's responsible for initializing wallet client and managing all chain wallets. Here brings in the third class `ChainWalletBase`.

> So far `MainWalletBase` is dealing with four different broadcast/synchronization events for chain wallets.
>
> - broadcast_client
> - broadcast_env
> - sync_connect
> - sync_disconnect
>
> See details below.

### ChainWalletBase

When you're trying to connect to a wallet, you always need to provide a target chain name so that the wallet knows what to response. So `ChainWalletBase` is the class actually being used for real connection. It's the finest grain of functionality that with chain specified and also wallet specified.

We're separating `MainWalletBase` and `ChainWalletBase` because it's clearer to put some common properties like `wallet client` and `env` in the `MainWalletBase` to enable
centralized management and distribution (events `broadcast_client` and `broadcast_env`), and put only chain specified functionalities in `ChainWalletBase`.

Basically how many `chains` are provided in `ChainProvider` or `WalletManager`, how many `ChainWalletBase` instances will be constructed for a wallet. `ChainWalletBase` instances are independent with each other unless `sync` is set `true`. All the synchronization are also handled in `MainWalletBase` (events `sync_connect` and `sync_disconnect`).

### WalletRepo

We have a class `MainWalletBase` with wallet specified to manage all chain wallets. All these chain wallets are with the same wallet name but different chain name. Accordingly we also have another class `WalletRepo`, which with chain specified to manage all chain wallets that with the same chain name but different wallet name.

### MainWalletBase vs. WalletRepo

#### 1. **MainWalletBase**
- **Purpose**: Manages a collection of chain wallets.
- **Key Identifier**: Wallet name.
- **Example**: It handles wallets like cosmoshub/keplr-extension, osmosis/keplr-extension, etc. These are wallets from different chains but with the same wallet name.
  
#### 2. **WalletRepo**
- **Purpose**: Manages chain wallets too, but with a different approach.
- **Key Identifier**: Chain name.
- **Example**: It manages wallets like cosmoshub/keplr-extension, cosmoshub/keplr-mobile, etc. These are wallets from the same chain but with different wallet names.
  
#### Common Point
- **Both MainWalletBase and WalletRepo** are involved in managing chain wallets, which are wallets associated with different blockchain networks.
  
#### Key Differences
- **MainWalletBase**: Focuses on managing wallets based on the wallet’s name. It doesn’t matter what chain the wallet is from; as long as they share the same wallet name, MainWalletBase manages them.
- **WalletRepo**: Concentrates on managing wallets based on the chain’s name. Here, the specific wallet names don’t matter; WalletRepo groups and manages wallets that are on the same blockchain network.
  
#### Practical Use
- **In some decentralized applications (dapps)**, the focus might be more on the blockchain network (chain) rather than the wallet itself. In such cases, WalletRepo is particularly useful because it provides a perspective based on the chain, allowing different wallets on the same chain to be managed together.
  
#### Summary
- **MainWalletBase**: Manages wallets across different chains but with the same wallet name.
- **WalletRepo**: Manages different wallets on the same chain.
  
In essence, these two classes offer different ways of organizing and accessing chain wallets, based on what the primary point of interest is (wallet name or chain name).

So far `WalletRepo` is only used in [`WalletModal`](https://docs.hyperweb.io/cosmos-kit/provider/chain-provider#walletmodal) properties.
