'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import LoadingLink from '@/components/LoadingLink';
import { Trash2, Edit, Plus, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AuctionSession {
  id: number;
  name: string;
  session_date: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  type: 'live' | 'instant' | 'silent';
  auctions_count: number;
  created_at: string;
  updated_at: string;
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
  scheduled: 'مجدولة',
  active: 'نشطة',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
};

const typeLabels = {
  live: 'مزاد مباشر',
  instant: 'مزاد فوري',
  silent: 'مزاد صامت',
};

export default function SessionsListPage() {
  const [sessions, setSessions] = useState<AuctionSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<AuctionSession | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/api/admin/sessions');
      if (response.data.success) {
        setSessions(response.data.data);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء جلب الجلسات');
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!sessionToDelete) return;

    try {
      const response = await api.delete(`/api/admin/sessions/${sessionToDelete.id}`);
      if (response.data.success) {
        toast.success('تم حذف الجلسة بنجاح');
        fetchSessions();
        setDeleteModalOpen(false);
        setSessionToDelete(null);
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('حدث خطأ أثناء حذف الجلسة');
      }
    }
  };

  const openDeleteModal = (session: AuctionSession) => {
    setSessionToDelete(session);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSessionToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">إدارة جلسات المزاد</h1>
          <LoadingLink
            href="/admin/sessions/new"
            className="text-white px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
          >
            <Plus size={20} />
            إضافة جلسة جديدة
          </LoadingLink>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">لا توجد جلسات مزاد حتى الآن</p>
            <LoadingLink
              href="/admin/sessions/new"
              className="text-primary hover:text-primary-dark mt-2 inline-block"
            >
              أضف أول جلسة
            </LoadingLink>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الاسم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    النوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عدد المزادات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {session.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(session.session_date), 'dd MMMM yyyy', { locale: ar })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[session.status]}`}>
                        {statusLabels[session.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeLabels[session.type]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users size={16} />
                        {session.auctions_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <LoadingLink
                          href={`/admin/sessions/edit/${session.id}`}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                        >
                          <Edit size={16} />
                          تعديل
                        </LoadingLink>
                        <button
                          onClick={() => openDeleteModal(session)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          disabled={session.auctions_count > 0}
                        >
                          <Trash2 size={16} />
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && sessionToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                تأكيد حذف الجلسة
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  هل أنت متأكد من رغبتك في حذف جلسة "{sessionToDelete.name}"؟
                </p>
              </div>
              <div className="items-center px-4 py-3 flex justify-between">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
