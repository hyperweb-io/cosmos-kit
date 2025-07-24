import { wallets as ext } from '@cosmos-kit/aria-extension';
import { wallets as mobile } from '@cosmos-kit/aria-mobile';

export const wallets = [...ext, ...mobile];
