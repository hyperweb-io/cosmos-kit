import {
  BitgetwalletExtensionInfo,
  BitgetwalletExtensionWallet,
} from './extension';

const bitgetwalletExtension = new BitgetwalletExtensionWallet(
  BitgetwalletExtensionInfo
);

export const wallets = [bitgetwalletExtension];
