// Dynamic import utilities for code splitting and lazy loading
import dynamic from 'next/dynamic';
import React, { ComponentType } from 'react';

// Higher-order component for dynamic imports with loading fallback
export function createDynamicComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: ComponentType
) {
  return dynamic(importFn, {
    loading: fallback ? () => React.createElement(fallback) : () => React.createElement('div', {
      className: "flex items-center justify-center p-4"
    }, React.createElement('div', {
      className: "h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
    })),
    ssr: false, // Disable SSR for better performance
  });
}

// Pre-configured dynamic imports for common components
export const DynamicModal = createDynamicComponent(() => import('@/components/Modal'));
export const DynamicToast = createDynamicComponent(() => import('react-hot-toast').then(m => ({ default: m.Toaster })));

// Dynamic imports for heavy components (simplified)
export const DynamicPusher = dynamic(() => import('pusher-js'), { ssr: false });
export const DynamicFramerMotion = dynamic(() => import('framer-motion'), { ssr: false });

// Dynamic imports for form components
export const DynamicFormComponents = {
  LoginForm: createDynamicComponent(() => import('@/components/auth/login-form').then(m => ({ default: m.LoginForm }))),
  RegisterForm: createDynamicComponent(() => import('@/app/auth/register/Form')),
  ForgotPasswordForm: createDynamicComponent(() => import('@/app/auth/forgot-password/Form')),
  ResetPasswordForm: createDynamicComponent(() => import('@/app/auth/reset-password/Form')),
};

// Dynamic imports for dashboard components
export const DynamicDashboardComponents = {
  UserMenu: createDynamicComponent(() => import('@/components/UserMenu')),
  NotificationMenu: createDynamicComponent(() => import('@/components/NotificationMenu')),
  GlobalLoader: createDynamicComponent(() => import('@/components/GlobalLoader')),
};

// Dynamic imports for auction components
export const DynamicAuctionComponents = {
  AuctionCard: createDynamicComponent(() => import('@/components/AuctionCard')),
  BidForm: createDynamicComponent(() => import('@/components/BidForm')),
  LiveBidding: createDynamicComponent(() => import('@/components/LiveBidding')),
  CountdownTimer: createDynamicComponent(() => import('@/components/CountdownTimer')),
  BidTimer: createDynamicComponent(() => import('@/components/BidTimer')),
};

// Dynamic imports for admin components
export const DynamicAdminComponents = {
  AdminLayout: createDynamicComponent(() => import('@/app/admin/layout')),
  ModeratorLayout: createDynamicComponent(() => import('@/app/moderator/layout')),
};

// Dynamic imports for heavy pages
export const DynamicPages = {
  // Auth pages
  LoginPage: createDynamicComponent(() => import('@/app/auth/login/page')),
  RegisterPage: createDynamicComponent(() => import('@/app/auth/register/page')),
  
  // Dashboard pages
  DashboardPage: createDynamicComponent(() => import('@/app/dashboard/page')),
  MyCarsPage: createDynamicComponent(() => import('@/app/dashboard/mycars/page')),
  
  // Auction pages
  LiveMarketPage: createDynamicComponent(() => import('@/app/auctions/auctions-1main/live-market/page')),
  InstantAuctionPage: createDynamicComponent(() => import('@/app/auctions/auctions-1main/instant/page')),
  SilentAuctionPage: createDynamicComponent(() => import('@/app/auctions/auctions-1main/silent/page')),
  
  // Admin pages
  AdminDashboard: createDynamicComponent(() => import('@/app/admin/page')),
  ModeratorDashboard: createDynamicComponent(() => import('@/app/moderator/dashboard/page')),
  
  // Form pages
  CarAuctionRequest: createDynamicComponent(() => import('@/app/forms/car-auction-request/page')),
  ClassicCarAuctionRequest: createDynamicComponent(() => import('@/app/forms/classic-car-auction-request/page')),
  GeneralAuctionRequest: createDynamicComponent(() => import('@/app/forms/general-auction-request/page')),
};

// Utility to preload components on hover/focus
export function preloadComponent(importFn: () => Promise<any>) {
  return () => {
    importFn();
  };
}

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
