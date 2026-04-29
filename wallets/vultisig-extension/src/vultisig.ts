import { vultisigExtensionInfo, VultisigExtensionWallet } from './extension';

const vultisigExtension = new VultisigExtensionWallet(vultisigExtensionInfo);

export const wallets = [vultisigExtension];
