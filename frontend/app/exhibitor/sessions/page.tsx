'use client';

import { useEffect, useMemo, useState } from 'react';
import { Header } from '../../../components/exhibitor/Header';
import { Sidebar } from '../../../components/exhibitor/sidebar';
import api from '@/lib/axios';
import LoadingLink from '@/components/LoadingLink';
import toast from 'react-hot-toast';
import {
  Calendar,
  Plus,
  RefreshCw,
  Search,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Volume2,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AuctionSession {
  id: number;
  name: string;
  session_date: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  type: 'live' | 'instant' | 'silent';
  auctions_count?: number;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

const statusColors: Record<AuctionSession['status'], string> = {
  scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusLabels: Record<AuctionSession['status'], string> = {
  scheduled: 'مجدولة',
  active: 'نشطة',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
};

const typeLabels: Record<AuctionSession['type'], string> = {
  live: 'مباشر',
  instant: 'فوري',
  silent: 'صامت',
};

const typeIcons = {
  live: Volume2,
  instant: Zap,
  silent: Clock,
};

export default function ExhibitorSessionsListPage() {
  const [sessions, setSessions] = useState<AuctionSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AuctionSession['status']>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | AuctionSession['type']>('all');

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/exhibitor/sessions');
      const rows: AuctionSession[] = res?.data?.data ?? res?.data ?? [];
      setSessions(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'فشل في جلب الجلسات');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return sessions.filter(s => {
      const bySearch = !q || s.name.toLowerCase().includes(q);
      const byStatus = statusFilter === 'all' || s.status === statusFilter;
      const byType = typeFilter === 'all' || s.type === typeFilter;
      return bySearch && byStatus && byType;
    });
  }, [sessions, searchTerm, statusFilter, typeFilter]);

  const stats = useMemo(() => ({
    total: sessions.length,
    scheduled: sessions.filter(s => s.status === 'scheduled').length,
    active: sessions.filter(s => s.status === 'active').length,
    completed: sessions.filter(s => s.status === 'completed').length,
  }), [sessions]);

  const remove = async (row: AuctionSession) => {
    if (row.auctions_count && row.auctions_count > 0) {
      return toast.error('لا يمكن حذف جلسة تحتوي على مزادات.');
    }
    const ok = confirm(`تأكيد حذف الجلسة "${row.name}" ؟`);
    if (!ok) return;
    try {
      const res = await api.delete(`/api/exhibitor/sessions/${row.id}`);
      if (res?.status === 200) {
        toast.success(res?.data?.message || 'تم حذف الجلسة');
        fetchSessions();
      } else {
        toast.error(res?.data?.message || 'تعذر حذف الجلسة');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'فشل حذف الجلسة');
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">جلسات المزاد الخاصة بي</h1>
                <p className="text-gray-400">إدارة وإنشاء جلساتك وربط سياراتك بها</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchSessions}
                className="bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300 px-4 py-2 rounded-xl flex items-center"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                تحديث
              </button>
              <LoadingLink
                href="/exhibitor/sessions/new"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة جلسة جديدة
              </LoadingLink>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">إجمالي الجلسات</p>
                  <p className="text-2xl font-bold mt-1">{stats.total}</p>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-xl">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">مجدولة</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{stats.scheduled}</p>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-xl">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">نشطة</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">{stats.active}</p>
                </div>
                <div className="bg-green-500/10 p-3 rounded-xl">
                  <Zap className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">مكتملة</p>
                  <p className="text-2xl font-bold text-gray-300 mt-1">{stats.completed}</p>
                </div>
                <div className="bg-gray-500/10 p-3 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-gray-300" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="relative flex-grow">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ابحث باسم الجلسة..."
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-2 pr-10 pl-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="p-2 border border-gray-600 rounded-lg bg-gray-700 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="all">كل الحالات</option>
                  <option value="scheduled">مجدولة</option>
                  <option value="active">نشطة</option>
                  <option value="completed">مكتملة</option>
                  <option value="cancelled">ملغاة</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="p-2 border border-gray-600 rounded-lg bg-gray-700 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="all">كل الأنواع</option>
                  <option value="live">مباشر</option>
                  <option value="instant">فوري</option>
                  <option value="silent">صامت</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold">قائمة الجلسات ({filtered.length})</h2>
              <div className="text-sm text-gray-400">إجمالي {sessions.length} جلسة</div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                لا توجد جلسات مطابقة
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-750 border-b border-gray-700/50">
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">الجلسة</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">التاريخ</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">الحالة</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">النوع</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">عدد المزادات</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filtered.map((s) => {
                      const TypeIcon = typeIcons[s.type];
                      return (
                        <tr key={s.id} className="hover:bg-gray-750/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-xl">
                                <Calendar className="w-4 h-4 text-white" />
                              </div>
                              <div className="mr-4">
                                <div className="text-sm font-medium">{s.name}</div>
                                <div className="text-xs text-gray-400 mt-1">ID: {s.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {s.session_date ? format(new Date(s.session_date), 'dd MMMM yyyy', { locale: ar }) : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[s.status]}`}>
                              {statusLabels[s.status]}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-sm text-gray-300">
                              <TypeIcon className="w-4 h-4 ml-1" />
                              {typeLabels[s.type]}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-sm text-cyan-400">
                              <Users className="w-4 h-4 ml-1" />
                              {s.auctions_count ?? 0}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <LoadingLink
                                href={`/exhibitor/sessions/view/${s.id}`}
                                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 p-2 rounded-lg transition-all"
                              >
                                <Eye size={16} />
                              </LoadingLink>
                              <LoadingLink
                                href={`/exhibitor/sessions/edit/${s.id}`}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-2 rounded-lg transition-all"
                              >
                                <Edit size={16} />
                              </LoadingLink>
                              <button
                                onClick={() => remove(s)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-all disabled:opacity-50"
                                disabled={(s.auctions_count ?? 0) > 0}
                                title={(s.auctions_count ?? 0) > 0 ? 'لا يمكن حذف جلسة تحتوي على مزادات' : 'حذف الجلسة'}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
