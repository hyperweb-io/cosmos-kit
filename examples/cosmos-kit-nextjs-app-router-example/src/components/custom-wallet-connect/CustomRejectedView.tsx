import React from 'react';
import { WalletViewProps } from '@cosmos-kit/core';

export const CustomRejectedView = ({
  onClose,
  onReturn,
  wallet,
}: WalletViewProps) => {
  const errorMsg = wallet.message || 'Connection permission was denied.';

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
        <h3 className="flex-1 text-lg font-semibold text-orange-500">
          Request Rejected
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
        {/* Warning Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-10 text-orange-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.008v.008H12v-.008Z"
          />
        </svg>
        <p className="font-medium text-foreground">
          Connection request for {wallet.walletInfo.prettyName} was rejected.
        </p>
        <p className="w-full text-sm text-orange-600 dark:text-orange-300 bg-orange-500/10 p-3 rounded break-words border border-orange-500/20">
          {errorMsg}
        </p>
        <button
          onClick={onReturn} // Or wallet.connect(false) to retry?
          className="mt-2 w-full px-4 py-2 border border-border bg-primary text-primary-foreground rounded-md text-sm font-medium transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none"
        >
          Try Again
        </button>
      </div>
    </>
  );
};
