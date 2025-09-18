// Extracted content from AdminDashboard for dynamic loading
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { cachedApiRequest } from "@/lib/request-cache";
import GlobalLoader from '@/components/GlobalLoader';

export default function AdminDashboardContent() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAuctions: 0,
    totalRevenue: 0,
    activeAuctions: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user, isLoggedIn } = useAuth();
  const router = useLoadingRouter();

  // Verify admin access
  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [isLoggedIn, user, router]);

  // Fetch admin stats with caching
  useEffect(() => {
    async function fetchStats() {
      if (!isLoggedIn || user?.role !== 'admin') return;
      
      try {
        setLoading(true);
        
        // Use cached API request for better performance
        const response = await cachedApiRequest('/api/admin/stats', undefined, 5000); // 5 seconds cache
        
        if (response && typeof response === 'object' && 'data' in response) {
          setStats(response.data as any);
        }
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, [isLoggedIn, user]);

  if (loading) {
    return <GlobalLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم الإدارية</h1>
              <p className="text-gray-600 mt-1">مرحباً بك، {user?.first_name}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">آخر تحديث</div>
              <div className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleTimeString('ar-SA')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">إجمالي المزادات</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAuctions.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()} ريال</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">المزادات النشطة</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeAuctions.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Content */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">لوحة التحكم الإدارية</h2>
          <p className="text-gray-600">مرحباً بك في لوحة التحكم الإدارية</p>
        </div>
      </div>
    </div>
  );
}
