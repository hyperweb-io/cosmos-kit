import { lockerExtensionInfo, LockerExtensionWallet } from './extension';

const lockerExtension = new LockerExtensionWallet(lockerExtensionInfo);

export const wallets = [lockerExtension];
