import { useQueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { checkConnection, onNetworkError } from "./api";
import { useAuth } from "./AuthContext";

interface ConnectionBannerContextValue {
  bannerVisible: boolean;
  dismiss: () => void;
  retry: () => Promise<void>;
}

const ConnectionBannerContext =
  createContext<ConnectionBannerContextValue | null>(null);

const POLL_INTERVAL = 5000;

export function ConnectionBannerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [bannerVisible, setBannerVisible] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dismissedRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const ok = await checkConnection();
      if (ok) {
        setBannerVisible(false);
        dismissedRef.current = false;
        stopPolling();
        queryClient.invalidateQueries();
      }
    }, POLL_INTERVAL);
  }, [stopPolling, queryClient]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onNetworkError(() => {
      if (!dismissedRef.current) {
        setBannerVisible(true);
      }
      startPolling();
    });

    return () => {
      unsubscribe();
      stopPolling();
    };
  }, [user, startPolling, stopPolling]);

  useEffect(() => {
    if (!user) {
      setBannerVisible(false);
      dismissedRef.current = false;
      stopPolling();
    }
  }, [user, stopPolling]);

  const dismiss = useCallback(() => {
    setBannerVisible(false);
    dismissedRef.current = true;
  }, []);

  const retry = useCallback(async () => {
    const ok = await checkConnection();
    if (ok) {
      setBannerVisible(false);
      dismissedRef.current = false;
      stopPolling();
      queryClient.invalidateQueries();
    }
  }, [stopPolling, queryClient]);

  return (
    <ConnectionBannerContext.Provider value={{ bannerVisible, dismiss, retry }}>
      {children}
    </ConnectionBannerContext.Provider>
  );
}

export function useConnectionBanner() {
  const ctx = useContext(ConnectionBannerContext);
  if (!ctx)
    throw new Error(
      "useConnectionBanner must be used inside ConnectionBannerProvider",
    );
  return ctx;
}
