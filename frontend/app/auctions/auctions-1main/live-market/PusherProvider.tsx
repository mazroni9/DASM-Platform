// Pusher provider for real-time updates
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for Pusher
const Pusher = dynamic(() => import('pusher-js'), { ssr: false });

interface PusherProviderProps {
  children: React.ReactNode;
}

export default function PusherProvider({ children }: PusherProviderProps) {
  const [pusher, setPusher] = useState<any>(null);

  useEffect(() => {
    // Only initialize Pusher on client side
    if (typeof window !== 'undefined' && Pusher) {
      const pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
      });

      setPusher(pusherInstance);

      // Cleanup on unmount
      return () => {
        pusherInstance.disconnect();
      };
    }
  }, []);

  // Provide pusher context if needed
  return <>{children}</>;
}
