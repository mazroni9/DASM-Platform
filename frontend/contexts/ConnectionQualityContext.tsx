"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  computeConnectionQuality,
  ConnectionQualityResult,
} from "@/lib/connectionQuality";

const PING_INTERVAL_MS = 10_000;
const PING_TIMEOUT_MS = 2_000;
const DEFER_FIRST_PING_MS = 800;
const MAX_RECENT = 6;

// Same-origin /ping - outside /api, bypasses Laravel rewrite
const getPingUrl = () =>
  typeof window === "undefined" ? "/ping" : `/ping?t=${Date.now()}`;

type ContextValue = ConnectionQualityResult & {
  isChecking: boolean;
  latencyMs: number | null;
};

const ConnectionQualityContext = createContext<ContextValue | null>(null);

export function ConnectionQualityProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [recentLatencies, setRecentLatencies] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(true);
  const [networkInfo, setNetworkInfo] = useState<{
    downlink?: number;
    effectiveType?: string;
    rtt?: number;
  } | null>(null);
  const mountedRef = useRef(true);

  const inFlightRef = useRef(false);

  const ping = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.onLine) return -1;
    const start = Date.now();
    const url = getPingUrl();
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), PING_TIMEOUT_MS);
      await fetch(url, { method: "GET", signal: ctrl.signal, cache: "no-store" });
      clearTimeout(t);
      return Date.now() - start;
    } catch {
      return -1;
    }
  }, []);

  const runCheck = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!mountedRef.current) return;
    if (!navigator.onLine) {
      setIsOnline(false);
      setLatencyMs(null);
      return;
    }
    if (inFlightRef.current) return; // prevent overlap
    inFlightRef.current = true;
    setIsChecking(true);
    try {
      const ms = await ping();
      if (!mountedRef.current) return;
      setLatencyMs(ms >= 0 ? ms : null);
      setRecentLatencies((prev) => {
        const next = [...prev, ms];
        return next.slice(-MAX_RECENT);
      });
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setIsChecking(false);
    }
  }, [ping]);

  useEffect(() => {
    mountedRef.current = true;
    if (typeof window === "undefined") return;

    const conn = (navigator as any).connection;
    const updateNetworkInfo = () => {
      if (conn && mountedRef.current) {
        setNetworkInfo({
          downlink: conn.downlink,
          effectiveType: conn.effectiveType,
          rtt: conn.rtt,
        });
      }
    };
    updateNetworkInfo();
    if (conn) conn.addEventListener("change", updateNetworkInfo);

    const handleOnline = () => {
      if (!mountedRef.current) return;
      setIsOnline(true);
      runCheck();
    };
    const handleOffline = () => {
      if (!mountedRef.current) return;
      setIsOnline(false);
      setLatencyMs(null);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Defer first ping to avoid competing with initial page load
    const defer = (fn: () => void) => {
      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(() => fn(), { timeout: DEFER_FIRST_PING_MS });
      } else {
        setTimeout(fn, DEFER_FIRST_PING_MS);
      }
    };

    if (!navigator.onLine) {
      setIsOnline(false);
    } else {
      defer(runCheck);
    }

    const interval = setInterval(() => {
      if (navigator.onLine && mountedRef.current) runCheck();
    }, PING_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (conn) conn.removeEventListener("change", updateNetworkInfo);
    };
  }, [runCheck]);

  const result = computeConnectionQuality(
    isOnline,
    latencyMs,
    recentLatencies,
    networkInfo
  );

  return (
    <ConnectionQualityContext.Provider
      value={{
        ...result,
        isChecking,
        latencyMs,
      }}
    >
      {children}
    </ConnectionQualityContext.Provider>
  );
}

export function useConnectionQuality(): ContextValue {
  const ctx = useContext(ConnectionQualityContext);
  if (!ctx) throw new Error("useConnectionQuality must be used within ConnectionQualityProvider");
  return ctx;
}
