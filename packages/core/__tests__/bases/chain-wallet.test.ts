import { Decimal } from '@cosmjs/math';
import { EncodeObject } from '@cosmjs/proto-signing';
import { CosmWasmClient, SigningCosmWasmClientOptions } from '@cosmjs/cosmwasm-stargate';
import { StargateClientOptions } from '@cosmjs/stargate';
import { mockExtensionInfo as walletInfo } from '../../test-utils/mock-extension/extension/registry';
import { chains, assets } from 'chain-registry'
import { AssetList, Chain } from "@chain-registry/types";
import { ChainWalletBase } from '../../src/bases/chain-wallet';
import { ChainRecord, Endpoints, State } from '../../src/types';
import nock from 'nock'
import { nameServiceRegistries } from '../../src/config';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';



function storageMock() {
  let storage = {};

  return {
    setItem: function (key, value) {
      storage[key] = value || '';
    },
    getItem: function (key) {
      return key in storage ? storage[key] : null;
    },
    removeItem: function (key) {
      delete storage[key];
    },
    get length() {
      return Object.keys(storage).length;
    },
    key: function (i) {
      const keys = Object.keys(storage);
      return keys[i] || null;
    }
  };
}

const storageMockInstance = storageMock()

// Mock global window object
global.window = {
  // @ts-ignore
  localStorage: storageMockInstance
}

describe('ChainWalletBase', () => {
  let chainWallet: ChainWalletBase;
  let chainMock: Chain;
  let assetListMock: AssetList;
  let preferredEndpointsMock: Endpoints;
  let chainRecordMock: ChainRecord;
  let stargateMock: StargateClientOptions = expect.any(Object);
  let signingCosmwasmMock: SigningCosmWasmClientOptions = expect.any(Object);

  const stargateClientConnectMock = jest.fn()
  const stargateClientConnectWithSignerMock = jest.fn()
  const stargateCalculateFeeMock = jest.fn()
  jest.mock('@cosmjs/stargate', () => {
    return {
      StargateClient: {
        connect: stargateClientConnectMock,
      },
      SigningStargateClient: {
        connectWithSigner: stargateClientConnectWithSignerMock
      },
      calculateFee: stargateCalculateFeeMock
    }
  })
  const cosmwasmClientConnectMock = jest.fn()
  const cosmwasmClientConnectWithSignerMock = jest.fn()
  jest.mock('@cosmjs/cosmwasm-stargate', () => {
    return {
      CosmWasmClient: {
        connect: cosmwasmClientConnectMock
      },
      SigningCosmWasmClient: {
        connectWithSigner: cosmwasmClientConnectWithSignerMock
      }
    }
  })
  const NameServiceMock = jest.fn()
  jest.mock('../../src/name-service.ts', () => {
    return {
      NameService: NameServiceMock
    }
  })

  const slowRpcURL = 'http://fake-rpc-endpoint.slow'
  const fastRpcURL = 'http://fake-rpc-endpoint.fast'
  const slowRestURL = 'http://fake-rest-endpoint.slow'
  const fastRestURL = 'http://fake-rest-endpoint.fast'

  beforeEach(() => {
    nock(slowRestURL).persist().get('/cosmos/base/tendermint/v1beta1/node_info').delayConnection(5).reply(200, 'ok')
    nock(fastRestURL).persist().get('/cosmos/base/tendermint/v1beta1/node_info').reply(200, 'ok')
    nock(slowRpcURL).persist().post('/').delayConnection(5).reply(200, 'ok')
    nock(fastRpcURL).persist().post('/').reply(200, 'ok')
  })

  afterAll(() => {
    nock.restore()
  })

  beforeEach(() => {
    chainMock = chains.find((c) => c.chain_name === 'osmosis') as Chain;
    assetListMock = assets.find((a) => a.chain_name === 'osmosis') as AssetList;
    preferredEndpointsMock = {
      isLazy: false,
      rpc: [slowRpcURL, fastRpcURL],
      rest: [slowRestURL, fastRestURL]
    }
    chainRecordMock = {
      name: 'osmosis',
      chain: chainMock,
      assetList: assetListMock,
      preferredEndpoints: preferredEndpointsMock,
      clientOptions: {
        signingStargate: undefined,
        stargate: stargateMock,
        signingCosmwasm: signingCosmwasmMock
      }
    };
    chainWallet = new ChainWalletBase(walletInfo, chainRecordMock);
  });

  afterEach(() => {
    storageMockInstance.removeItem('cosmos-kit@2:core//accounts');
    jest.clearAllMocks();
    nock.cleanAll();
  })

  it('should have the correct assets', () => {
    expect(chainWallet.assets).toBe(assetListMock.assets);
  });

  it('should have the correct isTestNet', () => {
    expect(chainWallet.isTestNet).toBeFalsy();
  })

  it('should have the correct preferred endpoints', () => {
    expect(chainWallet.preferredEndpoints).toBe(preferredEndpointsMock);
  })

  it('should get right rpc endpoint', () => {
    expect(chainWallet.rpcEndpoints).toBe(preferredEndpointsMock.rpc);
  })

  it('should get right rest endpoint', () => {
    expect(chainWallet.restEndpoints).toBe(preferredEndpointsMock.rest);
  })

  it('should get right isLazy', () => {
    expect(chainWallet.isLazy).toBe(preferredEndpointsMock.isLazy);
  })

  it('should have the correct addEndpoints function', () => {
    const newEndpoints = {
      isLazy: true,
      rpc: ['http://rpc.testnet.osmosis.zone:26657'],
    }
    chainWallet.addEndpoints(newEndpoints);
    expect(chainWallet.preferredEndpoints.rpc?.length).toEqual(3);
  })

  it('should have the correct chain name', () => {
    expect(chainWallet.chainName).toBe(chainRecordMock.name);
  })

  it('should have the correct chain logo URL', () => {
    expect(chainWallet.chainLogoUrl).toBe(assetListMock.assets[0]?.logo_URIs?.svg || assetListMock.assets[0].logo_URIs?.png || undefined);
  });

  it('should have the correct chain ID', () => {
    expect(chainWallet.chainId).toBe(chainMock.chain_id);
  });

  it('should have the stargateOptions', () => {
    expect(chainWallet.stargateOptions).toEqual(chainRecordMock.clientOptions?.stargate);
  })

  it('should have the correct signing options', () => {
    expect(chainWallet.signingStargateOptions).toEqual(chainRecordMock.clientOptions?.stargate)
  });

  it('should have the correct signing cosmwasm options', () => {
    expect(chainWallet.signingCosmwasmOptions).toEqual(chainRecordMock.clientOptions?.signingCosmwasm);
  })

  it('should have the correct assets', () => {
    expect(chainWallet.assets).toEqual(assetListMock.assets);
  })

  it('should have the correct chainId', () => {
    expect(chainWallet.chainId).toBe(chainMock.chain_id);
  })

  it('should have cosmwasm enabled', () => {
    expect(chainWallet.cosmwasmEnabled).toBe(chainMock.codebase?.cosmwasm_enabled);
  });

  it('should have the correct address', () => {
    const mockData = {
      namespace: 'cosmos',
      chainId: 'cosmoshub-4',
      address: 'cosmos1...'
    };
    chainWallet.setData(mockData)
    expect(chainWallet.address).toBe(mockData.address);
  })

  it('should have the correct namespace', () => {
    const mockData = {
      namespace: 'cosmos',
      chainId: 'cosmoshub-4',
      address: 'cosmos1...'
    };
    chainWallet.setData(mockData)
    expect(chainWallet.namespace).toBe(mockData.namespace);
  })

  it('should set Data correctly', () => {
    const data = {
      namespace: 'cosmos',
      chainId: 'cosmoshub-4',
      address: 'cosmos1...'
    };

    const localStorageSetItemMock = jest.spyOn(window.localStorage, 'setItem');
    chainWallet.setData(data);
    expect(chainWallet.mutable.data).toEqual(data);
    expect(localStorageSetItemMock).toHaveBeenCalled()
    expect(window.localStorage.getItem('cosmos-kit@2:core//accounts')).toEqual(JSON.stringify([data]));
  })

  it('should throw an error when calling initClient', () => {
    expect(() => chainWallet.initClient()).toThrow('initClient not implemented');
  });

  it('should update state and data correctly', async () => {
    const mockData = {
      namespace: 'cosmos',
      chainId: 'cosmoshub-4',
      address: 'cosmos1...'
    };
    jest.spyOn(chainWallet, 'client', 'get').mockReturnValue({
      getSimpleAccount: jest.fn().mockResolvedValue(mockData),
    });
    const setStateMock = jest.spyOn(chainWallet, 'setState')
    await chainWallet.update();

    expect(setStateMock.mock.calls[0][0]).toBe(State.Pending);
    expect(setStateMock.mock.calls[1][0]).toBe(State.Done);
    expect(chainWallet.data.namespace).toBe(mockData.namespace);
  });

  it('should set error state when update failed', async () => {
    const errorMessageFromWalletInfo = (walletInfo.rejectMessage as { source: string }).source
    const mockError = new Error(errorMessageFromWalletInfo);
    jest.spyOn(chainWallet, 'client', 'get').mockReturnValue({
      getSimpleAccount: jest.fn().mockRejectedValue(mockError),
    })
    expect(chainWallet.state).toBe(State.Init);
    await chainWallet.update();
    expect(chainWallet.state).toBe(State.Error);
    expect(chainWallet.rejectMessageSource).toBe(errorMessageFromWalletInfo);
    expect(chainWallet.rejectMatched(mockError)).toBeTruthy()
  });

  it('should call connectChains when update passing connect: true', () => {
    const connectChainsMockFn = jest.fn()
    chainWallet.connectChains = connectChainsMockFn;
    chainWallet.update({ connect: true });
    expect(connectChainsMockFn).toHaveBeenCalled()
  })

  it('should get rpc endpoint', async () => {
    expect(await chainWallet.getRpcEndpoint(true)).toBe(slowRpcURL);
  })

  it('should get rest endpoint', async () => {
    expect(await chainWallet.getRestEndpoint(true)).toBe(slowRestURL);
  })

  it('should get fastest rpc endpoint', async () => {
    expect(await chainWallet.getRpcEndpoint()).toBe(fastRpcURL);
  })

  it('should get fastest rest endpoint', async () => {
    expect(await chainWallet.getRestEndpoint()).toBe(fastRestURL);
  })

  it('should call getStargateClient correctly', async () => {
    await chainWallet.getStargateClient()
    expect(stargateClientConnectMock).toHaveBeenCalledWith(fastRpcURL, stargateMock)
  })

  it.skip('should call getCosmWasmClient correctly', async () => {
    await chainWallet.getCosmWasmClient()
    expect(cosmwasmClientConnectMock).toHaveBeenCalledWith(fastRpcURL)
  })

  it('should call getNameService correctly', async () => {
    const clientMock = expect.any(CosmWasmClient)
    chainWallet.getCosmWasmClient = jest.fn().mockResolvedValue(clientMock)
    await chainWallet.getNameService()
    expect(NameServiceMock).toBeCalledWith(clientMock, nameServiceRegistries[0])
  })

  it('should call initOfflineSigner correctly', async () => {
    expect(() => chainWallet.initOfflineSigner()).rejects.toThrow('WalletClient is not initialized')
    //mock initial client
    const walletClient = {
      getSimpleAccount: jest.fn(),
      getOfflineSigner: jest.fn(),
    }
    jest.spyOn(chainWallet, 'client', 'get').mockReturnValue(walletClient);
    await chainWallet.initOfflineSigner('amino')
    expect(chainWallet.preferredSignType).toBe('amino')
    expect(chainWallet.client.getOfflineSigner).toHaveBeenCalledWith(chainWallet.chainId, 'amino')
  })

  it('should call getSigningStargateClient correctly', async () => {
    //mock initial client
    const walletClient = {
      getSimpleAccount: jest.fn(),
      getOfflineSigner: jest.fn(),
    }
    chainWallet.offlineSigner = { getAccounts: jest.fn(), signAmino: jest.fn() }
    jest.spyOn(chainWallet, 'client', 'get').mockReturnValue(walletClient);
    await chainWallet.getSigningStargateClient()
    expect(stargateClientConnectWithSignerMock).toBeCalledWith(fastRpcURL, chainWallet.offlineSigner, signingCosmwasmMock)
  })

  it('should call getSigningCosmWasmClient correctly', async () => {
    //mock initial client
    const walletClient = {
      getSimpleAccount: jest.fn(),
      getOfflineSigner: jest.fn(),
    }
    jest.spyOn(chainWallet, 'client', 'get').mockReturnValue(walletClient);

    //without offlineSigner
    chainWallet.initOfflineSigner = jest.fn()
    await chainWallet.getSigningCosmWasmClient()
    expect(chainWallet.initOfflineSigner).toBeCalled()

    //with offlineSigner
    chainWallet.offlineSigner = { getAccounts: jest.fn(), signAmino: jest.fn() }
    await chainWallet.getSigningCosmWasmClient()
    expect(cosmwasmClientConnectWithSignerMock).toBeCalledWith(fastRpcURL, chainWallet.offlineSigner, signingCosmwasmMock)
  })

  it('should call estimateFee correctly', async () => {
    const encode: EncodeObject[] = [{
      typeUrl: 'typeUrl',
      value: 'value'
    }]
    expect(() => chainWallet.estimateFee(encode)).rejects.toThrow('Address is required to estimate fee. Try connect to fetch address.')

    jest.spyOn(chainWallet, 'address', 'get').mockReturnValue('cosmos1...')
    expect(() => chainWallet.estimateFee(encode)).rejects.toThrow("Gas price must be set in the client options when auto gas is used.")

    const stargateGasPrice = {
      amount: expect.any(Decimal),
      denom: 'uatom'
    }
    const simulateMock = jest.fn().mockResolvedValue(10000)
    jest.spyOn(chainWallet, 'signingStargateOptions', 'get').mockReturnValue({
      gasPrice: stargateGasPrice
    })
    jest.spyOn(chainWallet, 'getSigningStargateClient').mockResolvedValue({
      simulate: simulateMock
    } as any)
    await chainWallet.estimateFee(encode, 'stargate', 'memo', 5)
    expect(simulateMock).toBeCalledWith("cosmos1...", encode, expect.any(String))
    expect(stargateCalculateFeeMock).toBeCalledWith(5 * 10000, stargateGasPrice)
  })

  it('should call sign correctly', async () => {
    const encode: EncodeObject[] = [{
      typeUrl: 'typeUrl',
      value: 'value'
    }]
    expect(() => chainWallet.sign(encode)).rejects.toThrow('Address is required to estimate fee. Try connect to fetch address.')

    const signMock = jest.fn()
    const estimateFee = { amount: { denom: 'uatom', amount: 1000 } } as any
    jest.spyOn(chainWallet, 'getSigningStargateClient').mockResolvedValue({
      sign: signMock
    } as any)
    jest.spyOn(chainWallet, 'address', 'get').mockReturnValue('cosmos1...')
    jest.spyOn(chainWallet, 'estimateFee').mockResolvedValue(estimateFee)

    await chainWallet.sign(encode, 1000, 'memo', 'stargate')
    expect(signMock).toBeCalledWith('cosmos1...', encode, estimateFee, 'memo')

    const fee = { amount: [{ denom: 'uatom', amount: '100000' }], gas: 'gas' }
    await chainWallet.sign(encode, fee, 'memo', 'stargate')
    expect(signMock).toBeCalledWith('cosmos1...', encode, fee, 'memo')
  })


  it('should call broadcast correctly', async () => {
    const broadcastTxMock = jest.fn()
    const txRaw = { typeUrl: 'typeUrl' } as unknown as TxRaw
    const signingStargateOptions = {
      broadcastTimeoutMs: 1,
      broadcastPollIntervalMs: 11
    }

    jest.spyOn(chainWallet, 'getSigningStargateClient').mockResolvedValue({
      broadcastTx: broadcastTxMock
    } as any)
    jest.mock('cosmjs-types/cosmos/tx/v1beta1/tx', () => ({
      TxRaw: {
        encode: jest.fn().mockImplementation(() => ({
          finish: jest.fn().mockReturnValue('txRaw')
        }))
      }
    }))
    jest.spyOn(chainWallet, 'signingStargateOptions', 'get').mockReturnValue(signingStargateOptions)

    await chainWallet.broadcast(txRaw)
    expect(broadcastTxMock).toBeCalledWith(
      'txRaw',
      signingStargateOptions.broadcastTimeoutMs,
      signingStargateOptions.broadcastPollIntervalMs
    )
  })

  it('should call signAndBroadcast correctly', async () => {
    const encode: EncodeObject[] = [{
      typeUrl: 'typeUrl',
      value: 'value'
    }]
    chainWallet.sign = jest.fn().mockResolvedValue('txRaw')
    chainWallet.broadcast = jest.fn()
    await chainWallet.signAndBroadcast(encode, 1000, 'memo', 'stargate')

    expect(chainWallet.sign).toBeCalledWith(encode, 1000, 'memo', 'stargate')
    expect(chainWallet.broadcast).toBeCalledWith('txRaw', 'stargate')
  })

});

