import React from 'react';
import { WalletViewProps } from '@cosmos-kit/core';

export const CustomErrorView = ({
  onClose,
  onReturn,
  wallet,
}: WalletViewProps) => {
  const errorMsg = wallet.message || 'An unknown error occurred.';

  return (
    <>
      {/* Head Section */}
      <div className="flex items-center p-4 border-b border-border">
        <button
          onClick={onReturn}
          className="mr-4 p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* Back Icon */}
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
        <h3 className="flex-1 text-lg font-semibold text-destructive">
          Connection Error
        </h3>
        <button
          onClick={onClose}
          className="ml-4 p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        {/* Error Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-10 text-destructive"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
        <p className="font-medium text-foreground">
          Failed to connect to {wallet.walletInfo.prettyName}
        </p>
        <p className="w-full text-sm text-destructive bg-destructive/10 p-3 rounded break-words border border-destructive/20">
          {errorMsg}
        </p>
        <button
          onClick={onReturn}
          className="mt-2 w-full px-4 py-2 border border-border bg-primary text-primary-foreground rounded-md text-sm font-medium transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none"
        >
          Try Again
        </button>
      </div>
    </>
  );
};
