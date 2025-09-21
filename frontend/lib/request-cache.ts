// Request-level caching and batching utilities
import { useCallback, useRef, useEffect } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface RequestCacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
  staleWhileRevalidate?: boolean; // Return stale data while revalidating
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(options: RequestCacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
  }

  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  private evictOldEntries(): void {
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest 25% of entries
      const toRemove = Math.floor(this.maxSize * 0.25);
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  async get<T>(url: string, options?: RequestInit, ttl?: number): Promise<T> {
    const key = this.generateKey(url, options);
    const entry = this.cache.get(key);
    
    // Return cached data if not expired
    if (entry && !this.isExpired(entry)) {
      return entry.data;
    }

    // Return stale data while revalidating if available
    if (entry && this.isExpired(entry)) {
      // Start revalidation in background
      this.fetchAndCache(url, options, ttl);
      return entry.data;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Fetch and cache new data
    return this.fetchAndCache(url, options, ttl);
  }

  private async fetchAndCache<T>(url: string, options?: RequestInit, ttl?: number): Promise<T> {
    const key = this.generateKey(url, options);
    
    const promise = fetch(url, options)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        // Cache the response
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + (ttl || this.defaultTTL)
        });
        
        this.evictOldEntries();
        this.pendingRequests.delete(key);
        
        return data;
      })
      .catch(error => {
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

  delete(url: string, options?: RequestInit): boolean {
    const key = this.generateKey(url, options);
    return this.cache.delete(key);
  }

  // Batch multiple requests
  async batch<T>(requests: Array<{ url: string; options?: RequestInit; ttl?: number }>): Promise<T[]> {
    const promises = requests.map(req => this.get<T>(req.url, req.options, req.ttl));
    return Promise.all(promises);
  }
}

// Global cache instance
export const requestCache = new RequestCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  staleWhileRevalidate: true
});

// React hook for cached requests
export function useCachedRequest<T>(
  url: string | null,
  options?: RequestInit,
  ttl?: number
) {
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (): Promise<T | null> => {
    if (!url) return null;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    const requestOptions = {
      ...options,
      signal: abortControllerRef.current.signal
    };

    try {
      return await requestCache.get<T>(url, requestOptions, ttl);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null; // Request was cancelled
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

// Utility for API requests with caching
export async function cachedApiRequest<T>(
  endpoint: string,
  options?: RequestInit,
  ttl?: number
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint}`;
  return requestCache.get<T>(url, options, ttl);
}

// Batch API requests
export async function batchApiRequests<T>(
  requests: Array<{ endpoint: string; options?: RequestInit; ttl?: number }>
): Promise<T[]> {
  const formattedRequests = requests.map(req => ({
    url: req.endpoint.startsWith('http') ? req.endpoint : `/api${req.endpoint}`,
    options: req.options,
    ttl: req.ttl
  }));
  
  return requestCache.batch<T>(formattedRequests);
}

// Clear cache on logout
export function clearRequestCache(): void {
  requestCache.clear();
}

// Preload critical data
export function preloadCriticalData(): void {
  // Preload user profile if authenticated
  const token = localStorage.getItem('token');
  if (token) {
    cachedApiRequest('/api/user/profile', undefined, 10 * 60 * 1000); // 10 minutes
  }
}
