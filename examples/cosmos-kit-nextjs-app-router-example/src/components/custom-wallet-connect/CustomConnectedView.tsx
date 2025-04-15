import React, { useState } from 'react';
import { WalletViewProps } from '@cosmos-kit/core';

function truncateAddress(address: string = '', start = 6, end = 4) {
  if (!address) return '';
  return `${address.substring(0, start)}...${address.substring(
    address.length - end
  )}`;
}

export const CustomConnectedView = ({
  onClose,
  wallet,
}: WalletViewProps) => {
  const [copied, setCopied] = useState(false);
  const address = typeof wallet.address === 'string' ? wallet.address : undefined;
  const truncatedAddress = truncateAddress(address);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  };

  return (
    <>
      {/* Head Section */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Wallet Connected</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* Close Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col items-center text-center gap-5">
        {/* Success Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-10 text-green-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>

        <p className="font-medium text-foreground">Connected with {wallet.walletInfo.prettyName}</p>

        {address && (
          <div className="w-full flex items-center justify-center gap-2 p-2 border border-border rounded-md bg-background">
            <span className="font-mono text-sm text-muted-foreground">
              {truncatedAddress}
            </span>
            <button
              title="Copy address"
              onClick={handleCopy}
              className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={copied}
            >
              {copied ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-4 text-green-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375v-3.375a1.125 1.125 0 0 0-1.125-1.125h-1.5a1.125 1.125 0 0 0-1.125 1.125v3.375m-7.5-10.375h3.375a1.125 1.125 0 0 1 1.125 1.125v1.5a1.125 1.125 0 0 1-1.125 1.125h-3.375a1.125 1.125 0 0 1-1.125-1.125v-1.5a1.125 1.125 0 0 1 1.125-1.125"
                  />
                </svg>
              )}
            </button>
          </div>
        )}

        <button
          onClick={() => wallet.disconnect(false)} // Disconnect without clearing pairings for WC
          className="mt-2 w-full px-4 py-2 border border-border bg-background text-destructive rounded-md text-sm font-medium transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none"
        >
          Disconnect
        </button>
      </div>
    </>
  );
};
