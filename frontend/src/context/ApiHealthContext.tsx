import {
  createContext, useContext, useEffect, useState, useCallback, useRef,
  type ReactNode,
} from 'react';

export type ApiStatus = 'online' | 'offline' | 'recovering';

interface ApiHealthState {
  status: ApiStatus;
  lastOnlineAt: Date | null;
  retryIn: number;          // seconds until next auto-retry
  retryNow: () => void;
}

const ApiHealthContext = createContext<ApiHealthState>({
  status: 'online',
  lastOnlineAt: null,
  retryIn: 0,
  retryNow: () => {},
});

export function useApiHealth() {
  return useContext(ApiHealthContext);
}

const RETRY_INTERVAL = 12; // seconds between auto-retries

export function ApiHealthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus]           = useState<ApiStatus>('online');
  const [lastOnlineAt, setLastOnline] = useState<Date | null>(null);
  const [retryIn, setRetryIn]         = useState(0);
  const countdownRef                  = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimerRef                 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (countdownRef.current)  clearInterval(countdownRef.current);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }, []);

  // Probe the server — try a lightweight HEAD request
  const probe = useCallback(async () => {
    try {
      const res = await fetch('/api/health', { method: 'GET', signal: AbortSignal.timeout(5000) });
      // Any response (even 404) means the server is reachable
      if (res.status < 500) {
        window.dispatchEvent(new CustomEvent('api:online'));
        return true;
      }
    } catch {
      // Network error — still offline
    }
    return false;
  }, []);

  const startCountdown = useCallback(() => {
    clearTimers();
    setRetryIn(RETRY_INTERVAL);

    // Tick countdown every second
    countdownRef.current = setInterval(() => {
      setRetryIn((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-probe after RETRY_INTERVAL seconds
    retryTimerRef.current = setTimeout(async () => {
      setStatus('recovering');
      const ok = await probe();
      if (!ok) {
        // Still down — start another countdown
        setStatus('offline');
        startCountdown();
      }
    }, RETRY_INTERVAL * 1000);
  }, [clearTimers, probe]);

  const retryNow = useCallback(async () => {
    clearTimers();
    setRetryIn(0);
    setStatus('recovering');
    const ok = await probe();
    if (!ok) {
      setStatus('offline');
      startCountdown();
    }
  }, [clearTimers, probe, startCountdown]);

  useEffect(() => {
    const onOffline = () => {
      setStatus('offline');
      startCountdown();
    };

    const onOnline = () => {
      clearTimers();
      setRetryIn(0);
      setLastOnline(new Date());
      setStatus('online');
    };

    window.addEventListener('api:offline', onOffline);
    window.addEventListener('api:online',  onOnline);

    return () => {
      window.removeEventListener('api:offline', onOffline);
      window.removeEventListener('api:online',  onOnline);
      clearTimers();
    };
  }, [startCountdown, clearTimers]);

  return (
    <ApiHealthContext.Provider value={{ status, lastOnlineAt, retryIn, retryNow }}>
      {children}
    </ApiHealthContext.Provider>
  );
}
