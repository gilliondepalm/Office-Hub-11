import { useQueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { checkConnection, onConnectionQuality, onNetworkError } from "./api";
import { useAuth } from "./AuthContext";

interface ConnectionBannerContextValue {
  bannerVisible: boolean;
  slowConnection: boolean;
  dismiss: () => void;
  dismissSlow: () => void;
  retry: () => Promise<void>;
}

const ConnectionBannerContext =
  createContext<ConnectionBannerContextValue | null>(null);

const POLL_INTERVAL = 5000;
const CONSECUTIVE_FAST_TO_CLEAR = 2;

export function ConnectionBannerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [bannerVisible, setBannerVisible] = useState(false);
  const [slowConnection, setSlowConnection] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dismissedRef = useRef(false);
  const slowDismissedRef = useRef(false);
  const consecutiveFastRef = useRef(0);

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

    const unsubNetwork = onNetworkError(() => {
      setSlowConnection(false);
      slowDismissedRef.current = false;
      consecutiveFastRef.current = 0;
      if (!dismissedRef.current) {
        setBannerVisible(true);
      }
      startPolling();
    });

    const unsubQuality = onConnectionQuality((slow) => {
      if (slow) {
        consecutiveFastRef.current = 0;
        if (!slowDismissedRef.current) {
          setSlowConnection(true);
        }
      } else {
        consecutiveFastRef.current += 1;
        if (consecutiveFastRef.current >= CONSECUTIVE_FAST_TO_CLEAR) {
          setSlowConnection(false);
          slowDismissedRef.current = false;
        }
      }
    });

    return () => {
      unsubNetwork();
      unsubQuality();
      stopPolling();
    };
  }, [user, startPolling, stopPolling]);

  useEffect(() => {
    if (!user) {
      setBannerVisible(false);
      setSlowConnection(false);
      dismissedRef.current = false;
      slowDismissedRef.current = false;
      consecutiveFastRef.current = 0;
      stopPolling();
    }
  }, [user, stopPolling]);

  const dismiss = useCallback(() => {
    setBannerVisible(false);
    dismissedRef.current = true;
  }, []);

  const dismissSlow = useCallback(() => {
    setSlowConnection(false);
    slowDismissedRef.current = true;
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
    <ConnectionBannerContext.Provider
      value={{ bannerVisible, slowConnection, dismiss, dismissSlow, retry }}
    >
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
