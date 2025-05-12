import { OS } from '@cosmos-kit/core';

const WALLETCONNECT_DEEPLINK_CHOICE = 'WALLETCONNECT_DEEPLINK_CHOICE';

export const CoreUtil = {
  isHttpUrl(url: string) {
    return url.startsWith('http://') || url.startsWith('https://');
  },

  formatNativeUrl(appUrl: string, wcUri: string, os: OS, name: string): string {
    if (CoreUtil.isHttpUrl(appUrl)) {
      return this.formatUniversalUrl(appUrl, wcUri, name);
    }
    const plainAppUrl = appUrl.replaceAll('/', '').replaceAll(':', '');
    CoreUtil.setWalletConnectDeepLink(plainAppUrl, name);
    const encodedWcUrl = encodeURIComponent(wcUri);

    return `${plainAppUrl}://wc?uri=${encodedWcUrl}`;
  },

  formatUniversalUrl(appUrl: string, wcUri: string, name: string): string {
    if (!CoreUtil.isHttpUrl(appUrl)) {
      return this.formatNativeUrl(appUrl, wcUri, name);
    }
    let plainAppUrl = appUrl;
    if (appUrl.endsWith('/')) {
      plainAppUrl = appUrl.slice(0, -1);
    }
    CoreUtil.setWalletConnectDeepLink(plainAppUrl, name);
    const encodedWcUrl = encodeURIComponent(wcUri);

    return `${plainAppUrl}/wc?uri=${encodedWcUrl}`;
  },

  async wait(milliseconds: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  },

  openHref(href: string, target = '_self') {
    window.open(href, target, 'noreferrer noopener');
  },

  setWalletConnectDeepLink(href: string, name: string) {
    localStorage.setItem(
      WALLETCONNECT_DEEPLINK_CHOICE,
      JSON.stringify({ href, name })
    );
  },

  removeWalletConnectDeepLink() {
    localStorage.removeItem(WALLETCONNECT_DEEPLINK_CHOICE);
  },
};
