"use client";

import {
  subscribeImportValidationFailure,
  subscribeStoragePersistenceStatus,
  type StorageWriteFailureReason,
} from "@/lib/storage/storage-notifications";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface GlobalNotificationContextValue {
  storageLimitReached: boolean;
  storageFailureReason?: StorageWriteFailureReason;
  importValidationMessage: string | null;
  dismissImportValidationMessage: () => void;
}

const GlobalNotificationContext =
  createContext<GlobalNotificationContextValue | null>(null);

export function GlobalNotificationProvider({ children }: { children: ReactNode }) {
  const [storageLimitReached, setStorageLimitReached] = useState(false);
  const [storageFailureReason, setStorageFailureReason] = useState<
    StorageWriteFailureReason | undefined
  >();
  const [importValidationMessage, setImportValidationMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    return subscribeStoragePersistenceStatus((blocked, reason) => {
      setStorageLimitReached(blocked);
      setStorageFailureReason(reason);
    });
  }, []);

  useEffect(() => {
    return subscribeImportValidationFailure((message) => {
      setImportValidationMessage(message);
    });
  }, []);

  const dismissImportValidationMessage = useCallback(() => {
    setImportValidationMessage(null);
  }, []);

  const value = useMemo(
    () => ({
      storageLimitReached,
      storageFailureReason,
      importValidationMessage,
      dismissImportValidationMessage,
    }),
    [
      storageLimitReached,
      storageFailureReason,
      importValidationMessage,
      dismissImportValidationMessage,
    ],
  );

  return (
    <GlobalNotificationContext.Provider value={value}>
      {children}
    </GlobalNotificationContext.Provider>
  );
}

export function useGlobalNotifications(): GlobalNotificationContextValue {
  const context = useContext(GlobalNotificationContext);
  if (!context) {
    throw new Error(
      "useGlobalNotifications must be used within GlobalNotificationProvider",
    );
  }
  return context;
}
