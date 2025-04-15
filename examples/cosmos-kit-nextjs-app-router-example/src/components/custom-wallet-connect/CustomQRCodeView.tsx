import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { WalletViewProps } from '@cosmos-kit/core';

const QRCodeDisplay = ({ uri }: { uri?: string }) => {
  if (!uri) {
    return (
      <div className="p-4 border border-dashed border-border flex items-center justify-center text-sm text-destructive">
        QR code URI not available.
      </div>
    );
  }
  return (
    <div className="p-2 bg-white rounded-lg">
      <QRCode
        value={uri}
        size={200}
        level="M"
        bgColor="#FFFFFF"
        fgColor="#000000"
      />
    </div>
  );
};

export const CustomQRCodeView = ({ onClose, onReturn, wallet }: WalletViewProps) => {
  const [copied, setCopied] = useState(false);
  const wcUri = (wallet.client as any)?.qrUrl?.data as string | undefined;

  const handleCopy = () => {
    if (wcUri) {
      navigator.clipboard.writeText(wcUri).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  };

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
          Scan with {wallet.walletInfo.prettyName}
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
      <div className="p-6 flex flex-col items-center gap-5">
        <p className="text-sm text-muted-foreground text-center">
          Scan this QR code with your {wallet.walletInfo.prettyName} mobile app.
        </p>
        <QRCodeDisplay uri={wcUri} />
        <button
          onClick={handleCopy}
          disabled={!wcUri || copied}
          className="mt-2 w-full px-4 py-2 border border-border bg-background text-foreground rounded-md text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none"
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </>
  );
};
