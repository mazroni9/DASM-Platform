'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '../../../../../components/exhibitor/Header';
import { Sidebar } from '../../../../../components/exhibitor/sidebar';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  Loader2,
  Play,
  Square,
  XCircle,
  CheckCircle,
  Calendar,
  Users,
  Clock,
  Zap,
  Volume2,
  Eye,
  RefreshCw,
  Car as CarIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
}

interface Auction {
  id: number;
  car: Car;
  status: 'scheduled' | 'live' | 'ended' | 'completed' | 'cancelled' | 'failed';
  opening_price?: number;
  approved_for_live?: boolean;
}

interface AuctionSession {
  id: number;
  name: string;
  session_date: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  type: 'live' | 'instant' | 'silent';
  auctions: Auction[];
}

const statusConfig: Record<Auction['status'], { label: string; color: string }> = {
  scheduled: { label: 'مجدولة', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  live: { label: 'نشطة', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  ended: { label: 'منتهية', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  completed: { label: 'مكتملة', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  cancelled: { label: 'ملغاة', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  failed: { label: 'فاشلة', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
};

const sessionStatusConfig = {
  scheduled: { label: 'مجدولة', icon: Clock, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  active: { label: 'نشطة', icon: Play, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  completed: { label: 'مكتملة', icon: CheckCircle, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  cancelled: { label: 'ملغاة', icon: XCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function ExhibitorSessionViewPage() {
  const params = useParams();
  const id = params?.id as string;

  const [session, setSession] = useState<AuctionSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionActionLoading, setSessionActionLoading] = useState(false);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/exhibitor/sessions/${id}`);
      const row = res?.data?.data ?? res?.data;
      setSession(row);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'فشل في جلب تفاصيل الجلسة');
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchSession(); }, [id]);

  const updateStatus = async (status: 'active' | 'completed' | 'cancelled') => {
    if (!session) return;
    setSessionActionLoading(true);
    try {
      await api.post(`/api/exhibitor/sessions/${session.id}/status`, { status });
      toast.success('تم تحديث حالة الجلسة');
      await fetchSession();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'فشل تحديث الحالة');
    } finally {
      setSessionActionLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!session) return { total: 0, live: 0, scheduled: 0, finished: 0 };
    const total = session.auctions.length;
    const live = session.auctions.filter(a => a.status === 'live').length;
    const scheduled = session.auctions.filter(a => a.status === 'scheduled').length;
    const finished = session.auctions.filter(a => a.status === 'completed' || a.status === 'ended').length;
    return { total, live, scheduled, finished };
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white flex items-center justify-center p-6">
        <Calendar className="w-16 h-16 text-amber-500 mb-4" />
        <p className="text-gray-400">الجلسة غير موجودة.</p>
      </div>
    );
  }

  const SessionIcon = sessionStatusConfig[session.status].icon;

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-3 rounded-xl">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{session.name}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${sessionStatusConfig[session.status].color}`}>
                      <SessionIcon className="w-4 h-4 ml-1" />
                      {sessionStatusConfig[session.status].label}
                    </span>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Clock className="w-4 h-4 ml-1" />
                      {session.session_date ? format(new Date(session.session_date), 'eeee, dd MMMM yyyy', { locale: ar }) : '-'}
                    </div>
                    <div className="flex items-center text-cyan-400 text-sm">
                      <Users className="w-4 h-4 ml-1" />
                      {session.auctions.length} مزاد
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchSession}
                  className="bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300 px-4 py-2 rounded-xl flex items-center"
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  تحديث
                </button>

                {session.status === 'scheduled' && (
                  <button
                    onClick={() => updateStatus('active')}
                    disabled={sessionActionLoading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center disabled:opacity-50"
                  >
                    {sessionActionLoading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Play className="w-4 h-4 ml-2" />}
                    بدء الجلسة
                  </button>
                )}

                {session.status === 'active' && (
                  <button
                    onClick={() => updateStatus('completed')}
                    disabled={sessionActionLoading}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center disabled:opacity-50"
                  >
                    {sessionActionLoading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Square className="w-4 h-4 ml-2" />}
                    إنهاء الجلسة
                  </button>
                )}

                {session.status !== 'completed' && session.status !== 'cancelled' && (
                  <button
                    onClick={() => updateStatus('cancelled')}
                    disabled={sessionActionLoading}
                    className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center disabled:opacity-50"
                  >
                    {sessionActionLoading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <XCircle className="w-4 h-4 ml-2" />}
                    إلغاء الجلسة
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">إجمالي المزادات</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-xl">
                  <Eye className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">نشطة</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">{stats.live}</p>
                </div>
                <div className="bg-green-500/10 p-3 rounded-xl">
                  <Zap className="w-6 h-6 text-green-400" />
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
                  <p className="text-gray-400 text-sm">مكتملة/منتهية</p>
                  <p className="text-2xl font-bold text-purple-400 mt-1">{stats.finished}</p>
                </div>
                <div className="bg-purple-500/10 p-3 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Auctions Table */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-700/50">
              <h2 className="text-lg font-semibold">مزادات الجلسة ({session.auctions.length})</h2>
            </div>

            {session.auctions.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                لا توجد مزادات مضافة إلى هذه الجلسة بعد.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-750 border-b border-gray-700/50">
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">السيارة</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">سعر الافتتاح</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {session.auctions.map(a => (
                      <tr key={a.id} className="hover:bg-gray-750/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-xl">
                              <CarIcon className="w-4 h-4 text-white" />
                            </div>
                            <div className="mr-4">
                              <div className="text-sm font-medium">
                                {a.car.make} {a.car.model}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {a.car.year} • Auction ID: {a.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-cyan-400 font-semibold">
                          {(a.opening_price ?? 0).toLocaleString()} ر.س
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[a.status]?.color ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                            {statusConfig[a.status]?.label ?? a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
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
