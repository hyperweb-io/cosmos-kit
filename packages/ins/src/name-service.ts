import { Chains } from '@chain-registry/types';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';

export type NameServiceName = string;

export interface NameServiceInfo {
  name: NameServiceName;
  contract: string;
  chainName: string;
  getNameQueryMsg: (address: string) => any;
  getAddressQueryMsg: (name: string, bech32_prefix?: string) => any;
  normalizeAddressResponse: (response: any) => string;
  normalizeNameResponse: (response: any) => string;
  slip173: string;
}

export type NameServiceRegistry = NameServiceInfo[];

export type ParsedInsName =
  | {
      name: string;
      resolver: string;
      nameservice: string;
    }
  | undefined;

/**
 * Parse a name into its components.
 *
 * The format is [name]@[chain_prefix].[resolver], similar to an email address.
 * For example, `meow@juno.sns` would resolve a Juno address using the Stargaze
 *
 * @param {String} name A fully compliant INS name.
 * @returns {ParsedInsName} The parsed name.
 **/
export const parseINSName = (name: string): ParsedInsName => {
  const insRegEx = /(?<name>[a-z0-9]+)@(?<resolver>[a-z]+)\.(?<nameservice>[a-z]{2,})/;
  return name.match(insRegEx)?.groups as ParsedInsName;
};

/**
 * This class is used to resolve names and addresses across the Interchain Name System.
 *
 * @Module INS
 */
export class INS {
  chains: Chains;
  ins_registry: NameServiceRegistry;

  /**
   * This class is used to resolve names and addresses.
   */
  constructor(chains: Chains, ins_registry: NameServiceRegistry) {
    this.chains = chains;
    this.ins_registry = ins_registry;
  }

  /**
   * Resolve a name to an address using a specific nameservice.
   *
   * @param {string} address The address to resolve a name for.
   */
  async resolveInsName(
    address: string,
    nameservice: string
  ): Promise<string | undefined> {
    // Find item in list of objects with a certatin key value pair
    const registry = this.ins_registry.find(
      (item) => item.name === nameservice
    );

    // Check if registry exists
    if (!registry) throw new Error('Nameservice not found');

    // Get the chain info for the registry
    const chain = this.chains.find(
      (item) => item.chain_name === registry.chainName
    );

    // Load the client for the appropriate chain
    // TODO better logic for loading RPCs and handling errors
    // NOTE in production a wallet provider will likely want to use their own RPCs
    let client: CosmWasmClient;
    for (let i = 0; i < chain.apis.rpc.length; i++) {
      try {
        client = await CosmWasmClient.connect(chain.apis.rpc[i]?.address);
        break;
      } catch (e) {
        continue;
      }
    }

    const { contract, getNameQueryMsg, normalizeNameResponse } = registry;
    const result = await client.queryContractSmart(
      contract,
      getNameQueryMsg(address)
    );
    return normalizeNameResponse(result);
  }

  /**
   * Resolve a full INS name to an address.
   *
   * The format is [name]@[chain_prefix].[resolver], similar to an email address.
   * For example, `jake@juno.sns` would resolve the address using the Stargaze
   *
   * @param {String} name A fully compliant INS name.
   **/
  async resolveINSAddress(insName: string): Promise<string | undefined> {
    // Parse ins name
    const { name, resolver, nameservice } = parseINSName(insName);

    // Find item in list of objects with a certatin key value pair
    const registry = this.ins_registry.find(
      (item) => item.name === nameservice
    );

    // Check if registry exists
    if (!registry) throw new Error('Nameservice not found');

    // Get the chain info for the registry
    const chain = this.chains.find(
      (item) => item.chain_name === registry.chainName
    );

    // Load the client for the appropriate chain
    // TODO better logic for loading RPCs and handling errors
    // NOTE in production a wallet provider will likely want to use their own RPCs
    let client: CosmWasmClient;
    for (let i = 0; i < chain.apis.rpc.length; i++) {
      try {
        client = await CosmWasmClient.connect(chain.apis.rpc[i]?.address);
        break;
      } catch (e) {
        continue;
      }
    }

    // try {
    const { contract, getAddressQueryMsg, normalizeAddressResponse } = registry;

    const result = await client.queryContractSmart(
      contract,
      getAddressQueryMsg(name, resolver)
    );

    return normalizeAddressResponse(result);
  }
}
