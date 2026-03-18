// Performance monitoring and optimization utilities
'use client';

import React from 'react';

// Performance metrics tracking
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track page load performance
  trackPageLoad(pageName: string) {
    if (typeof window === 'undefined') return;

    const startTime = performance.now();
    
    window.addEventListener('load', () => {
      const loadTime = performance.now() - startTime;
      this.metrics.set(`${pageName}_load_time`, loadTime);
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`${pageName} load time: ${loadTime.toFixed(2)}ms`);
      }
    });
  }

  // Track component render time
  trackComponentRender(componentName: string, renderFn: () => void) {
    const startTime = performance.now();
    renderFn();
    const renderTime = performance.now() - startTime;
    
    this.metrics.set(`${componentName}_render_time`, renderTime);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
    }
  }

  // Track API request performance
  trackApiRequest(endpoint: string, requestFn: () => Promise<any>) {
    const startTime = performance.now();
    
    return requestFn().then(response => {
      const requestTime = performance.now() - startTime;
      this.metrics.set(`api_${endpoint}_time`, requestTime);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`API ${endpoint} time: ${requestTime.toFixed(2)}ms`);
      }
      
      return response;
    });
  }

  // Get performance metrics
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear();
  }

  // Monitor Core Web Vitals
  monitorWebVitals() {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.set('lcp', lastEntry.startTime);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`LCP: ${lastEntry.startTime.toFixed(2)}ms`);
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.push(lcpObserver);

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        this.metrics.set('fid', entry.processingStart - entry.startTime);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`FID: ${(entry.processingStart - entry.startTime).toFixed(2)}ms`);
        }
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
    this.observers.push(fidObserver);

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.metrics.set('cls', clsValue);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`CLS: ${clsValue.toFixed(4)}`);
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    this.observers.push(clsObserver);
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// React hook for performance tracking
export function usePerformanceTracking(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  React.useEffect(() => {
    monitor.trackPageLoad(componentName);
  }, [componentName, monitor]);
}

// Higher-order component for performance tracking
export function withPerformanceTracking<T extends object>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: T) {
    const monitor = PerformanceMonitor.getInstance();
    
    React.useEffect(() => {
      monitor.trackPageLoad(componentName);
    }, [componentName, monitor]);

    return <Component {...props} />;
  };
}

// Utility to measure function execution time
export function measureTime<T>(fn: () => T, label: string): T {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${label}: ${(endTime - startTime).toFixed(2)}ms`);
  }
  
  return result;
}

// Utility to debounce expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Utility to throttle expensive operations
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Initialize performance monitoring
export function initializePerformanceMonitoring() {
  if (typeof window === 'undefined') return;
  
  const monitor = PerformanceMonitor.getInstance();
  monitor.monitorWebVitals();
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    monitor.cleanup();
  });
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
