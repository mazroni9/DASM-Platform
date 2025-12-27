'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { AlertCircle, Search, Filter, CheckCircle } from 'lucide-react';

interface ErrorLog {
  id: number;
  type: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  endpoint: string;
  created_at: string;
  is_resolved: boolean;
}

export default function ErrorLogsPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [resolvedFilter, setResolvedFilter] = useState<string>('unresolved');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [resolving, setResolving] = useState<number | null>(null);

  useEffect(() => {
    fetchErrors();
  }, [page, searchTerm, severityFilter, resolvedFilter]);

  const fetchErrors = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (resolvedFilter !== 'all') {
        params.append('is_resolved', resolvedFilter === 'resolved' ? 'true' : 'false');
      }
      params.append('page', page.toString());

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/monitoring/error-logs?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        setErrors(response.data.data.data || []);
        setTotalPages(response.data.data.last_page || 1);
        setError(null);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        router.push('/admin');
      } else {
        setError('Failed to load error logs');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResolveError = async (errorId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setResolving(errorId);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/monitoring/error-logs/${errorId}/resolve`,
        { notes: 'تم حل الخطأ من لوحة المراقبة' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        setErrors(errors.map(e => e.id === errorId ? { ...e, is_resolved: true } : e));
      }
    } catch (err) {
      console.error('Failed to resolve error:', err);
    } finally {
      setResolving(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔵';
      default:
        return '⚪';
    }
  };

  if (loading && errors.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">سجلات الأخطاء</h1>
          <p className="text-gray-600 mt-2">
            مراقبة وإدارة جميع أخطاء النظام
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ابحث عن الأخطاء..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">جميع الأولويات</option>
              <option value="critical">حرجة</option>
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>

            {/* Resolved Filter */}
            <select
              value={resolvedFilter}
              onChange={(e) => {
                setResolvedFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">الكل</option>
              <option value="unresolved">غير محلولة</option>
              <option value="resolved">محلولة</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={() => fetchErrors()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              تحديث
            </button>
          </div>
        </div>

        {/* Error List */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {errors.length > 0 ? (
          <div className="space-y-4">
            {errors.map((err) => (
              <div
                key={err.id}
                className={`bg-white p-6 rounded-lg shadow border-l-4 ${
                  err.severity === 'critical'
                    ? 'border-red-500'
                    : err.severity === 'high'
                    ? 'border-orange-500'
                    : err.severity === 'medium'
                    ? 'border-yellow-500'
                    : 'border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">
                        {getSeverityIcon(err.severity)}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {err.type}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(
                          err.severity
                        )}`}
                      >
                        {err.severity === 'critical'
                          ? 'حرجة'
                          : err.severity === 'high'
                          ? 'عالية'
                          : err.severity === 'medium'
                          ? 'متوسطة'
                          : 'منخفضة'}
                      </span>
                      {err.is_resolved && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300 flex items-center gap-1">
                          <CheckCircle size={14} />
                          محلول
                        </span>
                      )}
                    </div>

                    <p className="text-gray-700 mb-2">{err.message}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        <strong>Endpoint:</strong> {err.endpoint}
                      </span>
                      <span>
                        <strong>الوقت:</strong>{' '}
                        {new Date(err.created_at).toLocaleString('ar-SA')}
                      </span>
                    </div>
                  </div>

                  {!err.is_resolved && (
                    <button
                      onClick={() => handleResolveError(err.id)}
                      disabled={resolving === err.id}
                      className="ml-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors whitespace-nowrap"
                    >
                      {resolving === err.id ? 'جاري الحل...' : 'حل الخطأ'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                السابق
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, page - 2) + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-4 py-2 rounded-lg ${
                      page === pageNum
                        ? 'bg-primary text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                التالي
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">لا توجد أخطاء مطابقة للمعايير المحددة</p>
          </div>
        )}
      </div>
    </div>
  );
}
