// Lazy loading wrapper for heavy components
'use client';

import React, { Suspense, lazy, ComponentType } from 'react';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

// Default loading fallback
const DefaultFallback = () => (
  <div className="flex items-center justify-center p-4">
    <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Default error fallback
const DefaultErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-lg">
    <div className="text-red-600 mb-2">حدث خطأ في تحميل المكون</div>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
    >
      إعادة المحاولة
    </button>
  </div>
);

export function LazyWrapper({ 
  children, 
  fallback = <DefaultFallback />,
  errorFallback
}: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

// Higher-order component for lazy loading
export function withLazyLoading<T extends object>(
  Component: ComponentType<T>,
  fallback?: React.ReactNode
) {
  return function LazyComponent(props: T) {
    return (
      <LazyWrapper fallback={fallback}>
        <Component {...props} />
      </LazyWrapper>
    );
  };
}

// Utility to create lazy components with error boundaries
export function createLazyComponent<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyComponentWithErrorBoundary(props: T) {
    return (
      <LazyWrapper fallback={fallback}>
        <LazyComponent {...props} />
      </LazyWrapper>
    );
  };
}

// Preload components on hover
export function usePreloadOnHover(importFn: () => Promise<any>) {
  const preload = () => {
    importFn();
  };

  return {
    onMouseEnter: preload,
    onFocus: preload,
  };
}

// Intersection observer for lazy loading
export function useIntersectionObserver(
  ref: React.RefObject<HTMLElement>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}
