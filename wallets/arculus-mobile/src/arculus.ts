import { preferredEndpoints } from './config';
import { ArculusMobileInfo, ArculusMobileWallet } from './wallet-connect';

const arculusMobile = new ArculusMobileWallet(ArculusMobileInfo, preferredEndpoints);

export const wallets = [arculusMobile];
