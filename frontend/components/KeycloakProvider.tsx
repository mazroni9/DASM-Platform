"use client";

import { useEffect, useState } from 'react';

interface KeycloakProviderProps {
  children: React.ReactNode;
}

export default function KeycloakProvider({ children }: KeycloakProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        // Import the auth store dynamically to avoid SSR issues
        const { useAuthStore } = await import('@/store/authStore');
        const { initializeKeycloak, initializeFromStorage } = useAuthStore.getState();
        
        // First try to initialize from storage (for existing tokens)
        const hasExistingAuth = await initializeFromStorage();
        
        // If no existing auth, try Keycloak initialization
        if (!hasExistingAuth) {
          await initializeKeycloak();
        }
      } catch (error) {
        console.error('Failed to initialize Keycloak:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    // Only initialize on client side
    if (typeof window !== 'undefined') {
      initKeycloak();
    } else {
      setIsInitialized(true);
    }
  }, []);

  // Always render children - Keycloak initialization happens in background
  return <>{children}</>;
}
