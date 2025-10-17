import { EndpointOptions } from '@cosmos-kit/core';

export const preferredEndpoints: EndpointOptions['endpoints'] = {
  osmosis: {
    rpc: ['https://rpc-osmosis.keplr.app/'],
    rest: ['https://lcd-osmosis.keplr.app/'],
  },
  cosmoshub: {
    rpc: ['https://rpc-cosmoshub.keplr.app'],
    rest: ['https://lcd-cosmoshub.keplr.app'],
  },
  provenance: {
    rpc: ['https://rpc.provenance.io/'],
    rest: ['https://api.provenance.io'],
  },
};
