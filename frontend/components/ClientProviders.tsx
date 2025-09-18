// Client-side providers with dynamic imports
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports for heavy components (client-side only)
const Toaster = dynamic(() => import("react-hot-toast").then(m => ({ default: m.Toaster })), {
  ssr: false,
  loading: () => null
});

const FirebaseMessagingProvider = dynamic(() => import("@/components/FirebaseMessagingProvider"), {
  ssr: false,
  loading: () => null
});

const NotificationProvider = dynamic(() => import("context/NotificationContext"), {
  ssr: false,
  loading: () => null
});

const GlobalLoader = dynamic(() => import("@/components/GlobalLoader"), {
  ssr: false,
  loading: () => null
});

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <>
      <Suspense fallback={null}>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 5000,
            style: {
              background: "#363636",
              color: "#fff",
            },
          }}
        />
      </Suspense>
      <Suspense fallback={null}>
        <NotificationProvider>
          <FirebaseMessagingProvider>
            {children}
          </FirebaseMessagingProvider>
        </NotificationProvider>
      </Suspense>
      <Suspense fallback={null}>
        <GlobalLoader />
      </Suspense>
    </>
  );
}
