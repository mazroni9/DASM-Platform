// Request-level caching and batching utilities
import { useCallback, useRef, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface RequestCacheOptions {
  ttl?: number;
  maxSize?: number;
  staleWhileRevalidate?: boolean;
  enabled?: boolean;
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  private maxSize: number;
  private defaultTTL: number;
  private enabled: boolean;
  private staleWhileRevalidate: boolean;

  constructor(options: RequestCacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.ttl || 5 * 60 * 1000;
    this.enabled = options.enabled !== false;
    this.staleWhileRevalidate = options.staleWhileRevalidate !== false;
  }

  private getAuthScope(): string {
    if (typeof window === "undefined") return "server";
    const token = localStorage.getItem("token") || "";
    // keep short scope to avoid huge keys
    return token ? token.slice(0, 16) : "guest";
  }

  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || "GET";
    const body = options?.body ? JSON.stringify(options.body) : "";
    const authScope = this.getAuthScope();
    return `${authScope}:${method}:${url}:${body}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  private evictOldEntries(): void {
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = Math.floor(this.maxSize * 0.25);
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  async get<T>(url: string, options?: RequestInit, ttl?: number): Promise<T> {
    if (!this.enabled) {
      return this.fetchDirect<T>(url, options);
    }

    const key = this.generateKey(url, options);
    const entry = this.cache.get(key);

    if (entry && !this.isExpired(entry)) {
      return entry.data;
    }

    if (entry && this.isExpired(entry) && this.staleWhileRevalidate) {
      this.fetchAndCache(url, options, ttl);
      return entry.data;
    }

    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    return this.fetchAndCache(url, options, ttl);
  }

  private getAuthHeaders(): HeadersInit {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  private mergeHeaders(options?: RequestInit): HeadersInit {
    const authHeaders = this.getAuthHeaders();
    const existingHeaders = options?.headers || {};

    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders,
      ...(existingHeaders as Record<string, string>),
    };
  }

  private async fetchDirect<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: this.mergeHeaders(options),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private async fetchAndCache<T>(
    url: string,
    options?: RequestInit,
    ttl?: number
  ): Promise<T> {
    const key = this.generateKey(url, options);

    const promise = fetch(url, {
      ...options,
      headers: this.mergeHeaders(options),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        if (this.enabled) {
          this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + (ttl || this.defaultTTL),
          });
          this.evictOldEntries();
        }

        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.clear();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  delete(url: string, options?: RequestInit): boolean {
    const key = this.generateKey(url, options);
    return this.cache.delete(key);
  }

  async batch<T>(
    requests: Array<{ url: string; options?: RequestInit; ttl?: number }>
  ): Promise<T[]> {
    const promises = requests.map((req) =>
      this.get<T>(req.url, req.options, req.ttl)
    );
    return Promise.all(promises);
  }
}

// Global cache instance - DISABLED by default to prevent unwanted API caching
export const requestCache = new RequestCache({
  ttl: 5 * 60 * 1000,
  maxSize: 100,
  staleWhileRevalidate: true,
  enabled: false,
});

export function useCachedRequest<T>(
  url: string | null,
  options?: RequestInit,
  ttl?: number
) {
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (): Promise<T | null> => {
    if (!url) return null;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    const requestOptions = {
      ...options,
      signal: abortControllerRef.current.signal,
    };

    try {
      return await requestCache.get<T>(url, requestOptions, ttl);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return null;
      }
      throw error;
    }
  }, [url, options, ttl]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return fetchData;
}

export async function cachedApiRequest<T>(
  endpoint: string,
  options?: RequestInit,
  ttl?: number
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;
  return requestCache.get<T>(url, options, ttl);
}

export async function batchApiRequests<T>(
  requests: Array<{ endpoint: string; options?: RequestInit; ttl?: number }>
): Promise<T[]> {
  const formattedRequests = requests.map((req) => ({
    url: req.endpoint.startsWith("http")
      ? req.endpoint
      : `${API_BASE_URL}${req.endpoint}`,
    options: req.options,
    ttl: req.ttl,
  }));

  return requestCache.batch<T>(formattedRequests);
}

export function clearRequestCache(): void {
  requestCache.clear();
}

export function preloadCriticalData(): void {
  // ✅ only preload if cache is enabled (otherwise it's just extra requests)
  if (!requestCache.isEnabled()) return;

  const token = localStorage.getItem("token");
  if (token) {
    cachedApiRequest("/api/user/profile", undefined, 10 * 60 * 1000);
  }
}
