import React from 'react';
import { WalletViewProps } from '@cosmos-kit/core';

const Spinner = () => (
  <svg
    className="animate-spin size-6 text-primary"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export const CustomConnectingView = ({
  onClose,
  onReturn,
  wallet,
}: WalletViewProps) => {
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
        <h3 className="flex-1 text-lg font-semibold text-foreground">
          Connecting...
        </h3>
        {/* Optional: Add Close button if needed during connection */}
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
        <Spinner />
        <p className="font-medium text-foreground">
          Connecting to {wallet.walletInfo.prettyName}...
        </p>
        <p className="text-sm text-muted-foreground">
          Approve the connection request in your wallet application.
        </p>
      </div>
    </>
  );
};
