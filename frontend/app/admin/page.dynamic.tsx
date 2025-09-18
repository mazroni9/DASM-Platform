// Dynamic version of AdminDashboard with lazy loading
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import GlobalLoader from '@/components/GlobalLoader';

// Dynamic imports for heavy admin components
const AdminDashboardContent = dynamic(() => import('./AdminDashboardContent').catch(() => ({ default: () => <div>Admin Dashboard</div> })), {
  loading: () => <GlobalLoader />,
  ssr: false
});

export default function AdminDashboard() {
  return (
    <Suspense fallback={<GlobalLoader />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
