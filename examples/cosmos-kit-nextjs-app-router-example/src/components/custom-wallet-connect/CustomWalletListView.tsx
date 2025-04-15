import React from 'react';
import { ChainWalletBase } from '@cosmos-kit/core';
import Image from 'next/image';

interface CustomWalletListViewProps {
  wallets: ChainWalletBase[];
  onClose: () => void;
}

export const CustomWalletListView = ({
  wallets,
  onClose,
}: CustomWalletListViewProps) => {

  const handleConnect = async (wallet: ChainWalletBase) => {
    try {
      await wallet.connect(wallet.walletStatus !== 'NotExist');
    } catch (error) {
      console.error(`Connection Error [${wallet.walletName}]:`, error);
    }
  };

  return (
    <>
      {/* Head Section */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">
          Select Wallet (Custom)
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
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
      <div className="p-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
        {wallets.map((wallet) => {
          const { name, prettyName, logo } = wallet.walletInfo;
          const logoUrl = typeof logo === 'string' ? logo : logo?.major;
          return (
            <button
              key={name}
              onClick={() => handleConnect(wallet)}
              className="flex items-center w-full gap-3 p-3 border border-border rounded-lg text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
            >
              {logoUrl && (
                <Image
                  src={logoUrl}
                  alt={`${prettyName} logo`}
                  width={32}
                  height={32}
                  className="rounded-md size-8"
                />
              )}
              <span className="flex-1 font-medium text-foreground">
                {prettyName}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-4 text-muted-foreground"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          );
        })}
        {wallets.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No wallets found.
          </p>
        )}
      </div>
    </>
  );
};
