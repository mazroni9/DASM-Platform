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
const MAX_RECENT = 6;

const getPingUrl = () => {
  if (typeof window === "undefined") return "/api/_diag/health";
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  const basePath = base ? `${base.replace(/\/$/, "")}/api/_diag/health` : "/api/_diag/health";
  return `${basePath}?t=${Date.now()}`;
};

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

  const ping = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.onLine) return -1;
    const start = Date.now();
    const url = getPingUrl();
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
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
    setIsChecking(true);
    const ms = await ping();
    if (!mountedRef.current) return;
    setLatencyMs(ms >= 0 ? ms : null);
    setRecentLatencies((prev) => {
      const next = [...prev, ms];
      return next.slice(-MAX_RECENT);
    });
    setIsChecking(false);
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

    runCheck();
    const interval = setInterval(runCheck, PING_INTERVAL_MS);

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
