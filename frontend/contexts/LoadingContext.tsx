"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useLayoutEffect } from 'react';

interface LoadingContextType {
  loadingCount: number;
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [loadingCount, setLoadingCount] = useState(0);
  const isMountedRef = useRef(false);

  // Track if component is mounted to prevent updates during unmount
  useLayoutEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const startLoading = useCallback(() => {
    if (isMountedRef.current) {
      setLoadingCount(prev => prev + 1);
    }
  }, []);

  const stopLoading = useCallback(() => {
    // Always allow stopLoading to work, even during unmount
    // This ensures loading states are properly cleaned up
    setLoadingCount(prev => Math.max(0, prev - 1));
  }, []);

  const isLoading = loadingCount > 0;

  const value: LoadingContextType = {
    loadingCount,
    isLoading,
    startLoading,
    stopLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingContextType {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

// Export functions for use in non-React contexts (like axios interceptors)
let loadingFunctions: { startLoading: () => void; stopLoading: () => void } | null = null;

export function setLoadingFunctions(functions: { startLoading: () => void; stopLoading: () => void }) {
  loadingFunctions = functions;
}

export function getLoadingFunctions() {
  return loadingFunctions;
}
