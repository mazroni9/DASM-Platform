// Dynamic version of CarAuctionRequest with lazy loading
'use client';

import { Suspense } from 'react';
import GlobalLoader from '@/components/GlobalLoader';

export default function CarAuctionRequestPage() {
  return (
    <Suspense fallback={<GlobalLoader />}>
      <div className="min-h-screen bg-gray-50 p-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">طلب مزاد السيارة</h1>
            <p className="text-gray-600">نموذج طلب مزاد السيارة</p>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
