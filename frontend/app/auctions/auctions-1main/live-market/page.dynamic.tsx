// Dynamic version of LiveMarketPage with lazy loading
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports for heavy components
const LiveMarketContent = dynamic(() => import('./LiveMarketContent'), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 p-4 py-6 flex items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">جاري تحميل السوق المباشر...</p>
      </div>
    </div>
  ),
  ssr: false
});

const PusherProvider = dynamic(() => import('./PusherProvider'), {
  loading: () => null,
  ssr: false
});

export default function LiveMarketPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-4 py-6 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل السوق المباشر...</p>
        </div>
      </div>
    }>
      <PusherProvider>
        <LiveMarketContent />
      </PusherProvider>
    </Suspense>
  );
}
