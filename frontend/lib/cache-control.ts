// Cache control utilities for managing API caching behavior

import { requestCache } from './request-cache';

/**
 * Cache control configuration
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize: number;
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: false, // Disabled by default to prevent unwanted caching
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
};

/**
 * Cache control manager
 */
export class CacheControl {
  private static instance: CacheControl;
  private config: CacheConfig;

  private constructor() {
    this.config = { ...DEFAULT_CACHE_CONFIG };
  }

  public static getInstance(): CacheControl {
    if (!CacheControl.instance) {
      CacheControl.instance = new CacheControl();
    }
    return CacheControl.instance;
  }

  /**
   * Enable or disable caching
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    requestCache.setEnabled(enabled);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`API caching ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Check if caching is enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get current cache configuration
   */
  public getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  public updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.enabled !== undefined) {
      requestCache.setEnabled(config.enabled);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Cache configuration updated:', this.config);
    }
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    requestCache.clear();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): { enabled: boolean; size: number } {
    return {
      enabled: this.isEnabled(),
      size: 0, // RequestCache doesn't expose size, but we can add it if needed
    };
  }
}

// Export singleton instance
export const cacheControl = CacheControl.getInstance();

// Development helpers
if (process.env.NODE_ENV === 'development') {
  // Make cache control available globally for debugging
  (window as any).cacheControl = cacheControl;
  
  console.log('Cache control available globally as window.cacheControl');
  console.log('Usage:');
  console.log('  cacheControl.setEnabled(true/false) - Enable/disable caching');
  console.log('  cacheControl.clearCache() - Clear all cached data');
  console.log('  cacheControl.getStats() - Get cache statistics');
}
