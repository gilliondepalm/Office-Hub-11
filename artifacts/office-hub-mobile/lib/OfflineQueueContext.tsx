import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { checkConnection, onNetworkError, replayFetch } from "./api";
import { useAuth } from "./AuthContext";
import { getQueue, onQueueChange, processQueue } from "./offlineQueue";

interface OfflineQueueContextValue {
  pendingCount: number;
}

const OfflineQueueContext = createContext<OfflineQueueContextValue>({
  pendingCount: 0,
});

const REPLAY_POLL_INTERVAL = 5000;

export function OfflineQueueProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    getQueue().then((q) => setPendingCount(q.length));
  }, [user]);

  useEffect(() => {
    return onQueueChange((count) => setPendingCount(count));
  }, []);

  const replay = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      await processQueue(replayFetch);
    } finally {
      processingRef.current = false;
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const q = await getQueue();
      if (q.length === 0) {
        stopPolling();
        return;
      }
      const ok = await checkConnection();
      if (ok) {
        await replay();
      }
    }, REPLAY_POLL_INTERVAL);
  }, [stopPolling, replay]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onNetworkError(() => {
      getQueue().then((q) => {
        if (q.length > 0) startPolling();
      });
    });

    return () => {
      unsubscribe();
      stopPolling();
    };
  }, [user, startPolling, stopPolling]);

  useEffect(() => {
    if (!user) {
      stopPolling();
      return;
    }
    getQueue().then((q) => {
      if (q.length > 0) startPolling();
    });
  }, [user, startPolling, stopPolling]);

  return (
    <OfflineQueueContext.Provider value={{ pendingCount }}>
      {children}
    </OfflineQueueContext.Provider>
  );
}

export function useOfflineQueue() {
  return useContext(OfflineQueueContext);
}
