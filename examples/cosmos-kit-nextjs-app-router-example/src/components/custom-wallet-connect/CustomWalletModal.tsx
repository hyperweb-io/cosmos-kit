import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  WalletModalProps,
  ModalView,
  WalletStatus,
  ChainWalletBase,
} from '@cosmos-kit/core';

import { CustomWalletListView } from './CustomWalletListView';
import { CustomQRCodeView } from './CustomQRCodeView';
import { CustomConnectingView } from './CustomConnectingView';
import { CustomConnectedView } from './CustomConnectedView';
import { CustomErrorView } from './CustomErrorView';
import { CustomNotExistView } from './CustomNotExistView';
import { CustomRejectedView } from './CustomRejectedView';

const ModalShell = ({
  children,
  isOpen,
  onClose,
}: {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => {
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-0 duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-lg bg-background shadow-xl animate-in fade-in-0 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export const CustomWalletModal = ({
  isOpen,
  setOpen,
  walletRepo,
}: WalletModalProps) => {
  const [currentView, setCurrentView] = useState<ModalView>(ModalView.WalletList);

  const currentWallet: ChainWalletBase | undefined = useMemo(() => {
    if (walletRepo?.current) {
      return walletRepo.current;
    }
    return walletRepo?.wallets.find(
      (w) => w.isWalletConnecting || w.isWalletConnected
    );
  }, [walletRepo]);

  const walletStatus = currentWallet?.walletStatus;

  useEffect(() => {
    if (!isOpen) {
      setCurrentView(ModalView.WalletList);
      return;
    }
    if (currentWallet) {
      switch (walletStatus) {
        case WalletStatus.Connecting:
          const wcConnecting = currentWallet.walletInfo.mode === 'wallet-connect';
          if (wcConnecting && (currentWallet.client as any)?.qrUrl?.data) {
            setCurrentView(ModalView.QRCode);
          } else {
             setCurrentView(ModalView.Connecting);
          }
          break;
        case WalletStatus.Connected:
          setCurrentView(ModalView.Connected);
          break;
        case WalletStatus.Error:
          setCurrentView(ModalView.Error);
          break;
        case WalletStatus.Rejected:
          setCurrentView(ModalView.Rejected);
          break;
        case WalletStatus.NotExist:
          setCurrentView(ModalView.NotExist);
          break;
        case WalletStatus.Disconnected:
          setCurrentView(ModalView.WalletList);
          break;
        default:
          if (currentView !== ModalView.WalletList) {
            setCurrentView(ModalView.WalletList);
          }
          break;
      }
    } else {
      setCurrentView(ModalView.WalletList);
    }
  }, [isOpen, currentWallet, walletStatus, currentView]);

  const onCloseModal = useCallback(() => {
    setOpen(false);
    if (currentWallet?.isWalletConnecting) {
      currentWallet.disconnect(false).catch(console.error);
    }
  }, [setOpen, currentWallet]);

  const onReturn = useCallback(() => {
    const disconnectingWallet = currentWallet;
    setCurrentView(ModalView.WalletList);
    if (
      disconnectingWallet &&
      (disconnectingWallet.isWalletError || disconnectingWallet.isWalletRejected)
    ) {
      disconnectingWallet.disconnect(false).catch(console.error);
    }
  }, [setCurrentView, currentWallet]);

  const ViewComponent = useMemo(() => {
    if (currentWallet) {
      switch (currentView) {
        case ModalView.QRCode:
          return (
            <CustomQRCodeView
              wallet={currentWallet}
              onClose={onCloseModal}
              onReturn={onReturn}
            />
          );
        case ModalView.Connecting:
          return (
            <CustomConnectingView
              wallet={currentWallet}
              onClose={onCloseModal}
              onReturn={onReturn}
            />
          );
        case ModalView.Connected:
          return (
            <CustomConnectedView
              wallet={currentWallet}
              onClose={onCloseModal}
              onReturn={onReturn}
            />
          );
        case ModalView.Error:
          return (
            <CustomErrorView
              wallet={currentWallet}
              onClose={onCloseModal}
              onReturn={onReturn}
            />
          );
        case ModalView.NotExist:
          return (
            <CustomNotExistView
              wallet={currentWallet}
              onClose={onCloseModal}
              onReturn={onReturn}
            />
          );
        case ModalView.Rejected:
          return (
            <CustomRejectedView
              wallet={currentWallet}
              onClose={onCloseModal}
              onReturn={onReturn}
            />
          );
        case ModalView.WalletList:
        default:
         break;
      }
    }
    if (!walletRepo) {
       return <div className="p-6 text-center text-muted-foreground">Loading wallets...</div>;
    }
    return (
      <CustomWalletListView
        wallets={walletRepo.wallets}
        onClose={onCloseModal}
      />
    );

  }, [currentView, walletRepo, currentWallet, onCloseModal, onReturn]);

  return (
    <ModalShell isOpen={isOpen} onClose={onCloseModal}>
      {ViewComponent}
    </ModalShell>
  );
};
