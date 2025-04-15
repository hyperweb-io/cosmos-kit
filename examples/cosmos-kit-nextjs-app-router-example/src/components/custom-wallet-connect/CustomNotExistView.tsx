import React from 'react';
import Image from 'next/image';
import { WalletViewProps } from '@cosmos-kit/core';

export const CustomNotExistView = ({
  onClose,
  onReturn,
  wallet,
}: WalletViewProps) => {
  const { walletInfo } = wallet;
  const downloadInfo = walletInfo.downloads?.[0];
  const logoUrl = typeof walletInfo.logo === 'string' ? walletInfo.logo : walletInfo.logo?.major;

  return (
    <>
      <div className="flex items-center p-4 border-b border-border">
        <button
          onClick={onReturn}
          className="mr-4 p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <h3 className="flex-1 text-lg font-semibold text-foreground">
          {walletInfo.prettyName} Not Installed
        </h3>
        <button
          onClick={onClose}
          className="ml-4 p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

      <div className="p-6 flex flex-col items-center text-center gap-5">
        {logoUrl && (
          <Image
            src={logoUrl}
            alt={`${walletInfo.prettyName} logo`}
            width={64}
            height={64}
            className="rounded-lg size-16 mb-2"
          />
        )}
        <p className="font-medium text-foreground">
          It seems {walletInfo.prettyName} is not installed or active.
        </p>
        {downloadInfo?.link && (
          <a
            href={downloadInfo.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent bg-primary text-primary-foreground rounded-md text-sm font-medium transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none no-underline"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-4 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Install {walletInfo.prettyName}
          </a>
        )}
        <button
          onClick={onReturn}
          className="mt-2 w-full px-4 py-2 border border-border bg-background text-foreground rounded-md text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none"
        >
          Choose Another Wallet
        </button>
      </div>
    </>
  );
};
