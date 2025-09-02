import { preferredEndpoints } from './config';
import {
  figureMarketsMobileInfo,
  FigureMarketsMobileWallet,
} from './wallet-connect';

const figureMarketsMobile = new FigureMarketsMobileWallet(
  figureMarketsMobileInfo,
  preferredEndpoints
);

export const wallets = [figureMarketsMobile];
