// Dynamic import utilities for code splitting and lazy loading
import dynamic from 'next/dynamic';
import React, { ComponentType } from 'react';
import GlobalLoader from '@/components/GlobalLoader';

// Higher-order component for dynamic imports with loading fallback
function createDynamicComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: ComponentType
) {
  return dynamic(importFn, {
    loading: fallback ? () => React.createElement(fallback) : () => React.createElement(GlobalLoader),
    ssr: false, // Disable SSR for better performance
  });
}

// Dynamic imports for heavy components (only the ones actually used)
export const DynamicComponents = {
  // Heavy exhibitor components (actually used)
  ExhibitorHeader: createDynamicComponent(() => import('@/components/exhibitor/Header').then(m => ({ default: m.Header }))),
  ExhibitorSidebar: createDynamicComponent(() => import('@/components/exhibitor/sidebar').then(m => ({ default: m.Sidebar }))),
  ExhibitorDashboardHome: createDynamicComponent(() => import('@/components/exhibitor/DashboardHome').then(m => ({ default: m.DashboardHome }))),
  
  // Heavy UI components (used in ClientProviders)
  UserMenu: createDynamicComponent(() => import('@/components/UserMenu')),
  NotificationMenu: createDynamicComponent(() => import('@/components/NotificationMenu')),
};

// Preload critical components on user interaction
export const preloadCriticalComponents = () => {
  if (typeof window === 'undefined') return;

  // Preload on mouse move (user is active)
  const preload = () => {
    import('@/components/Modal');
    import('@/components/UserMenu');
    import('@/components/NotificationMenu');
  };

  let hasPreloaded = false;
  const handleInteraction = () => {
    if (!hasPreloaded) {
      hasPreloaded = true;
      preload();
      document.removeEventListener('mousemove', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    }
  };

  document.addEventListener('mousemove', handleInteraction, { passive: true });
  document.addEventListener('touchstart', handleInteraction, { passive: true });
};

// Preload critical data
export function preloadCriticalData(): void {
  if (typeof window === 'undefined') return;

  // Preload user profile if authenticated
  const token = localStorage.getItem('token');
  if (token) {
    // Import and use cached API request
    import('@/lib/request-cache').then(({ cachedApiRequest }) => {
      cachedApiRequest('/api/user/profile', undefined, 10 * 60 * 1000); // 10 minutes
    });
  }
}
