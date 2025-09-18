// Dynamic version of LiveMarketPage with lazy loading
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import GlobalLoader from '@/components/GlobalLoader';

// Dynamic imports for heavy components
const LiveMarketContent = dynamic(() => import('./LiveMarketContent'), {
  loading: () => <GlobalLoader />,
  ssr: false
});

const PusherProvider = dynamic(() => import('./PusherProvider'), {
  loading: () => null,
  ssr: false
});

export default function LiveMarketPage() {
  return (
    <Suspense fallback={<GlobalLoader />}>
      <PusherProvider>
        <LiveMarketContent />
      </PusherProvider>
    </Suspense>
  );
}
