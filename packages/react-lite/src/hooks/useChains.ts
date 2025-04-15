import { ChainContext, ChainName } from '@cosmos-kit/core';
import { useContext } from 'react';

import { walletContext } from '../provider';
import { getChainWalletContext } from '../utils';

export function useChains(chainNames: ChainName[], sync = true) {
  const names = Array.from(new Set(chainNames));
  const context = useContext(walletContext);

  if (!context) {
    throw new Error('You have forgotten to use ChainProvider.');
  }

  const { walletManager, modalProvided } = context;

  if (!modalProvided) {
    throw new Error(
      'You have to provide `walletModal` to use `useChains`, or use `useChainWallet` instead.'
    );
  }

  const repos = names.map((name) => walletManager.getWalletRepo(name));
  const ids = repos.map((repo) => repo.chainRecord.chain.chain_id);

  return names.reduce((result, chainName, index) => {
    const walletRepo = repos[index];

    walletRepo.activate();

    walletRepo.wallets.forEach((wallet) => {
      if (wallet.isModeExtension) {
        wallet.callbacks.beforeConnect = async () => {
          try {
            await wallet.client?.enable?.(ids);
          } catch (e) {
            for (const repo of repos) {
              await wallet.client?.addChain?.(repo.chainRecord);
            }
            await wallet.client?.enable?.(ids);
          }
        };
      }

      if (wallet.isModeWalletConnect) {
        wallet.connectChains = async () => {
          await wallet?.client?.connect?.(ids);
          for (const name of names.filter((name) => name !== chainName)) {
            await wallet.mainWallet
              .getChainWallet(name)
              .update({ connect: false });
          }
        };
      }
    });

    const {
      connect,
      disconnect,
      openView,
      closeView,
      current,
      chainRecord: { chain, assetList },
      getRpcEndpoint,
      getRestEndpoint,
      getStargateClient,
      getCosmWasmClient,
      getNameService,
    } = walletRepo;

    const chainWalletContext = getChainWalletContext(
      chain.chain_id,
      current,
      sync
    );

    result[chainName] = {
      ...chainWalletContext,
      walletRepo,
      chain,
      assets: assetList,
      openView,
      closeView,
      connect: () =>
        connect(
          localStorage.getItem('cosmos-kit@2:core//current-wallet'),
          sync
        ),
      disconnect: () => disconnect(void 0, sync),
      getRpcEndpoint,
      getRestEndpoint,
      getStargateClient,
      getCosmWasmClient,
      getNameService,
    };

    return result;
  }, {} as Record<ChainName, ChainContext>);
}
