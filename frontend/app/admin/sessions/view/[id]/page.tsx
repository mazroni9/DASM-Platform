'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Loader2, Play, Square, XCircle,CheckCheck, SaudiRiyal } from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface Car {
  id: string | number;
  make: string;
  model: string;
  year: number;
}

interface Auction {
  id: number;
  car: Car;
  status: 'scheduled' | 'live' | 'ended' | 'completed' | 'cancelled' | 'failed';
  approved_for_live: boolean;
  control_room_approved: boolean;
  opening_price: number;
  [key: string]: any; // Allow other properties
}

interface AuctionSession {
  id: number;
  name: string;
  session_date: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  auctions: Auction[];
}

// --- UI HELPERS ---
const statusConfig: { [key in Auction['status']]: { label: string; color: string } } = {
  scheduled: { label: 'مجدولة', color: 'bg-blue-100 text-blue-800' },
  live: { label: 'نشطة', color: 'bg-green-100 text-green-800' },
  ended: { label: 'منتهية', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'مكتملة', color: 'bg-gray-100 text-gray-800' },
  cancelled: { label: 'ملغاة', color: 'bg-red-100 text-red-800' },
  failed: { label: 'فاشلة', color: 'bg-yellow-100 text-yellow-800' },
};

const bulkStatuses: { value: 'live' | 'ended' | 'completed' | 'cancelled' | 'failed'; label: string }[] = [
    { value: 'live', label: 'تنشيط (تحويل إلى Live)' },
    { value: 'ended', label: 'إنهاء' },
    //{ value: 'completed', label: 'إكمال' },
    { value: 'cancelled', label: 'إلغاء' },
    { value: 'failed', label: 'فشل' },
];

// --- MAIN COMPONENT ---
export default function SessionDetailsPage() {
  const params = useParams();
  const sessionId = params?.id as string;

  const [session, setSession] = useState<AuctionSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAuctions, setSelectedAuctions] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});
  const [sessionActionLoading, setSessionActionLoading] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<'live' | 'ended' | 'completed' | 'cancelled' | 'failed'>('live');
  const [editingAuctionId, setEditingAuctionId] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');

  const fetchSession = async () => {
    if (!sessionId) return;
    try {
      const response = await api.get(`/api/admin/sessions/${sessionId}`);
        setSession(response.data.data);
    } catch (error) {
      console.error("Failed to fetch session details:", error);
      toast.error('فشل في جلب تفاصيل الجلسة.');
      setSession(null); // Set to null on error to show not found message
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSession();
  }, [sessionId]);

  const handleUpdateSessionStatus = async (status: 'active' | 'completed' | 'cancelled') => {
    setSessionActionLoading(true);
    try {
      await api.post(`/api/admin/sessions/${sessionId}/status`, { status });
      toast.success('تم تحديث حالة الجلسة بنجاح!');
      await fetchSession(); // Re-fetch to update UI
    } catch (error: any) {
      console.error("Failed to update session status:", error);
      const message = error.response?.data?.message || 'فشل في تحديث حالة الجلسة.';
      toast.error(message);
    } finally {
      setSessionActionLoading(false);
    }
  };

  const handleBulkApproveReject = async (approve: boolean) => {
    if (selectedAuctions.length === 0) {
      toast.error('الرجاء تحديد مزاد واحد على الأقل.');
      return;
    }
    const selectedCars = session?.auctions
      .filter(a => selectedAuctions.includes(a.id))
      .map(a => a.car.id) || [];

    setBulkActionLoading(true);
    try {
      await api.put('/api/admin/cars/bulk/approve-reject', {
        ids: selectedCars,
        action: approve,
      });
      toast.success(approve ? 'تم قبول المزادات المحددة بنجاح.' : 'تم رفض المزادات المحددة بنجاح.');
      setSelectedAuctions([]);
      await fetchSession();
    } catch (error: any) {
      console.error("Failed to perform bulk approve/reject:", error);
      const message = error.response?.data?.message || 'فشل في تنفيذ الإجراء الجماعي.';
      toast.error(message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handlePriceUpdate = async (auctionId: number) => {
    if (editingPrice === '' || isNaN(Number(editingPrice))) {
      toast.error('الرجاء إدخال سعر صحيح.');
      setEditingAuctionId(null);
      return;
    }
    
    setActionLoading(prev => ({ ...prev, [auctionId]: true }));
    try {
      await api.put(`/api/admin/auctions/${auctionId}/set-open-price`, {
        price: Number(editingPrice),
      });
      toast.success('تم تحديث سعر الافتتاح بنجاح.');
      // No full re-fetch needed, just update local state for snappiness
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          auctions: prev.auctions.map(a => 
            a.id === auctionId ? { ...a, opening_price: Number(editingPrice) } : a
          ),
        };
      });
    } catch (error: any) {
      console.error("Failed to update price:", error);
      const message = error.response?.data?.message || 'فشل في تحديث السعر.';
      toast.error(message);
    } finally {
      setEditingAuctionId(null);
      setActionLoading(prev => ({ ...prev, [auctionId]: false }));
    }
  };

  const handleStreamToggle = async (auctionId: number, startStream: boolean) => {
    setActionLoading(prev => ({ ...prev, [auctionId]: true }));
    try {
      await api.put(`/api/admin/auctions/${auctionId}/auction-type`, {
        auction_type: 'live',
        approved_for_live: startStream,
      });
      toast.success(startStream ? 'تم بدء البث المباشر بنجاح!' : 'تم إيقاف البث المباشر بنجاح!');
      await fetchSession();
    } catch (error: any) {
      console.error("Failed to toggle stream:", error);
      const message = error.response?.data?.message || (startStream ? 'فشل في بدء البث' : 'فشل في إيقاف البث');
      toast.error(message);
    } finally {
      setActionLoading(prev => ({ ...prev, [auctionId]: false }));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedAuctions.length === 0) {
      toast.error('الرجاء تحديد مزاد واحد على الأقل.');
      return;
    }
    setBulkActionLoading(true);
    try {
      await api.post('/api/admin/auctions/bulk-status', {
        auction_ids: selectedAuctions,
        status: bulkStatus,
      });
      toast.success(`تم تحديث حالة المزادات المحددة بنجاح.`);
      setSelectedAuctions([]);
      await fetchSession();
    } catch (error: any) {
      console.error("Failed to perform bulk update:", error);
      const message = error.response?.data?.message || 'فشل في تنفيذ الإجراء الجماعي.';
      toast.error(message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAuctions(session?.auctions.map(a => a.id) || []);
    } else {
      setSelectedAuctions([]);
    }
  };

  const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
    if (e.target.checked) {
      setSelectedAuctions(prev => [...prev, id]);
    } else {
      setSelectedAuctions(prev => prev.filter(selectedId => selectedId !== id));
    }
  };
  
  // Calculate statistics using useMemo for efficiency
  const stats = useMemo(() => {
    if (!session) {
      return { total: 0, active: 0, completed: 0, remaining: 0 };
    }
    const total = session.auctions.length;
    const active = session.auctions.filter(a => a.status === 'live').length;
    const completed = session.auctions.filter(a => a.status === 'completed' || a.status === 'ended').length;
    const remaining = session.auctions.filter(a => a.status === 'scheduled').length;
    return { total, active, completed, remaining };
  }, [session]);

  const isAllSelected = useMemo(() => {
    if (!session || session.auctions.length === 0) return false;
    return selectedAuctions.length === session.auctions.length;
  }, [selectedAuctions, session]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800">لم يتم العثور على الجلسة</h1>
        <p className="text-gray-600 mt-2">قد تكون الجلسة التي تبحث عنها قد تم حذفها أو أن الرابط غير صحيح.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* --- Session Header --- */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{session.name}</h1>
                <p className="text-lg text-gray-600 mt-1">
                {format(new Date(session.session_date), 'eeee, dd MMMM yyyy', { locale: ar })}
                </p>
            </div>
            <div className="flex items-center gap-2">
                {session.status === 'scheduled' && (
                    <button onClick={() => handleUpdateSessionStatus('active')} disabled={sessionActionLoading} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                        {sessionActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        بدء الجلسة
                    </button>
                )}
                {session.status === 'active' && (
                    <button onClick={() => handleUpdateSessionStatus('completed')} disabled={sessionActionLoading} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                        {sessionActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                        إنهاء الجلسة
                    </button>
                )}
                {session.status !== 'completed' && session.status !== 'cancelled' && (
                     <button onClick={() => handleUpdateSessionStatus('cancelled')} disabled={sessionActionLoading} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2">
                        {sessionActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        إلغاء الجلسة
                </button>
                )}
            </div>
          </div>
        </div>

      {/* --- Statistics Summary Bar --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <h3 className="text-sm font-medium text-gray-500">إجمالي المزادات</h3>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</p>
                </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <h3 className="text-sm font-medium text-gray-500">المزادات النشطة</h3>
            <p className="mt-1 text-3xl font-semibold text-green-600">{stats.active}</p>
              </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <h3 className="text-sm font-medium text-gray-500">المزادات المكتملة</h3>
            <p className="mt-1 text-3xl font-semibold text-purple-600">{stats.completed}</p>
            </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <h3 className="text-sm font-medium text-gray-500">المزادات المتبقية</h3>
            <p className="mt-1 text-3xl font-semibold text-blue-600">{stats.remaining}</p>
          </div>
        </div>

      {/* --- Auctions Section --- */}
      <div className="bg-white rounded-lg shadow-md">
        {/* --- Bulk Actions Bar --- */}
        {selectedAuctions.length > 0 && (
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-4">
            <span className="text-sm font-semibold text-gray-700">
              {selectedAuctions.length} مزاد محدد
            </span>
            <div className="flex items-center gap-4 flex-wrap">
                {/* Status Update */}
            <div className="flex items-center gap-2">
              <select
                        value={bulkStatus}
                        onChange={(e) => setBulkStatus(e.target.value as typeof bulkStatus)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {bulkStatuses.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
              </select>
                    <button
                        onClick={handleBulkUpdate}
                        disabled={bulkActionLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تطبيق'}
                    </button>
                </div>
                 {/* Divider */}
                <div className="h-6 border-l border-gray-300"></div>
                {/* Approval/Rejection */}
                <div className="flex items-center gap-2">
                     <button onClick={() => handleBulkApproveReject(true)} disabled={bulkActionLoading} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                        قبول في المزاد
                    </button>
                    <button onClick={() => handleBulkApproveReject(false)} disabled={bulkActionLoading} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                        رفض من المزاد
                    </button>
                </div>
            </div>
          </div>
        )}

        {/* --- Auctions Table --- */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="p-4">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السيارة</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">سعر الافتتاح</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">حالة الموافقة</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">حالة البث</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {session.auctions.map((auction) => (
                <tr key={auction.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedAuctions.includes(auction.id)}
                      onChange={(e) => handleSelectOne(e, auction.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {auction.car.make} {auction.car.model} ({auction.car.year})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {editingAuctionId === auction.id ? (
                      <input
                        type="number"
                        value={editingPrice}
                        onChange={(e) => setEditingPrice(e.target.value)}
                        onBlur={() => handlePriceUpdate(auction.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePriceUpdate(auction.id)}
                        autoFocus
                        className="w-24 px-2 py-1 border border-blue-500 rounded-md"
                          />
                        ) : (
                      <span onClick={() => { setEditingAuctionId(auction.id); setEditingPrice(String(auction.opening_price)); }} className="cursor-pointer hover:bg-gray-100 p-1 flex items-center gap-1 rounded-md">
                        {auction.opening_price?.toLocaleString() || 0} <SaudiRiyal size={16}/>
                            </span>
                          )}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-2xl">
                    {auction.control_room_approved ? (
                      <span title="مقبول" className="text-green-500"><CheckCheck/></span>
                    ) : (
                      <span title="مرفوض" className="text-red-500"><XCircle/></span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusConfig[auction.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                      {statusConfig[auction.status]?.label || auction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {auction.approved_for_live && (
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <span className="text-sm font-medium text-red-600">مباشر</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {actionLoading[auction.id] ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                      ) : (
                        auction.status === 'live' && (
                          auction.approved_for_live ? (
                            <button onClick={() => handleStreamToggle(auction.id, false)} className="px-3 py-1 bg-red-600 text-white rounded-md text-xs font-semibold hover:bg-red-700">
                              إيقاف البث
                            </button>
                          ) : (
                            <button onClick={() => handleStreamToggle(auction.id, true)} disabled={!auction.control_room_approved} className="px-3 py-1 bg-green-600 text-white rounded-md text-xs font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                              بدء البث
                            </button>
                          )
                        )
                          )}
                        </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
