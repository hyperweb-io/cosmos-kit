import { AssetList, Chain } from '@chain-registry/types';
import { chains } from 'chain-registry';

import { ChainName, ChainRecord, Endpoints, SignerOptions } from '../types';
import { getIsLazy } from './endpoint';
import { Logger } from './logger';

export function convertChain(
  chain: Chain | ChainName,
  assetLists: AssetList[],
  signerOptions?: SignerOptions,
  preferredEndpoints?: Endpoints,
  isLazy?: boolean,
  logger?: Logger
): ChainRecord {
  const chainName = typeof chain === 'string' ? chain : chain.chain_name;
  const assetList = assetLists.find((list) => list.chain_name === chainName);
  const _preferredEndpoints = {
    ...preferredEndpoints,
    isLazy: getIsLazy(
      isLazy,
      preferredEndpoints?.isLazy,
      void 0,
      void 0,
      logger
    ),
  };
  const converted = {
    name: chainName,
    chain:
      typeof chain === 'string'
        ? chains.find((prev) => prev.chain_name === chainName)
        : chain,
    assetList,
    clientOptions: {
      stargate: signerOptions?.stargate?.(chain),
      signingStargate: signerOptions?.signingStargate?.(chain),
      signingCosmwasm: signerOptions?.signingCosmwasm?.(chain),
      preferredSignType: signerOptions?.preferredSignType?.(chain) || 'amino',
    },
    preferredEndpoints: _preferredEndpoints,
  };

  return converted;
}
