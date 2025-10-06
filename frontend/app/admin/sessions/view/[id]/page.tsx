'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
    Loader2, 
    Play, 
    Square, 
    XCircle,
    CheckCheck, 
    SaudiRiyal,
    Calendar,
    Users,
    TrendingUp,
    CheckCircle,
    Clock,
    Zap,
    Volume2,
    Eye,
    Filter,
    Download,
    MoreVertical,
    AlertTriangle,
    Sparkles,
    BarChart3,
    Target,
    Crown,
    RefreshCw
} from 'lucide-react';

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
  [key: string]: any;
}

interface AuctionSession {
  id: number;
  name: string;
  session_date: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  auctions: Auction[];
}

// --- UI HELPERS ---
const statusConfig: { [key in Auction['status']]: { label: string; color: string; icon: any } } = {
  scheduled: { label: 'مجدولة', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
  live: { label: 'نشطة', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Zap },
  ended: { label: 'منتهية', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: CheckCircle },
  completed: { label: 'مكتملة', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: CheckCircle },
  cancelled: { label: 'ملغاة', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  failed: { label: 'فاشلة', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: AlertTriangle },
};

const sessionStatusConfig = {
  scheduled: { label: 'مجدولة', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
  active: { label: 'نشطة', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Play },
  completed: { label: 'مكتملة', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: CheckCircle },
  cancelled: { label: 'ملغاة', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
};

const bulkStatuses: { value: 'live' | 'ended' | 'completed' | 'cancelled' | 'failed'; label: string; icon: any }[] = [
    { value: 'live', label: 'تفعيل البث', icon: Volume2 },
    { value: 'ended', label: 'إنهاء المزاد', icon: Square },
    { value: 'cancelled', label: 'إلغاء المزاد', icon: XCircle },
    { value: 'failed', label: 'تعيين كفاشل', icon: AlertTriangle },
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
      setSession(null);
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
      await fetchSession();
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
      return { total: 0, active: 0, completed: 0, remaining: 0, totalValue: 0 };
    }
    const total = session.auctions.length;
    const active = session.auctions.filter(a => a.status === 'live').length;
    const completed = session.auctions.filter(a => a.status === 'completed' || a.status === 'ended').length;
    const remaining = session.auctions.filter(a => a.status === 'scheduled').length;
    const totalValue = session.auctions.reduce((sum, auction) => sum + (auction.opening_price || 0), 0);
    
    return { total, active, completed, remaining, totalValue };
  }, [session]);

  const isAllSelected = useMemo(() => {
    if (!session || session.auctions.length === 0) return false;
    return selectedAuctions.length === session.auctions.length;
  }, [selectedAuctions, session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">جاري تحميل تفاصيل الجلسة...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex flex-col items-center justify-center p-6">
        <Calendar className="w-20 h-20 text-amber-500 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-4 text-center">لم يتم العثور على الجلسة</h1>
        <p className="text-gray-400 mb-8 text-center">
          قد تكون الجلسة التي تبحث عنها قد تم حذفها أو أن الرابط غير صحيح.
        </p>
      </div>
    );
  }

  const SessionStatusIcon = sessionStatusConfig[session.status].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 md:p-6">
      {/* --- Session Header --- */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-3 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{session.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${sessionStatusConfig[session.status].color}`}>
                  <SessionStatusIcon className="w-3 h-3 ml-1" />
                  {sessionStatusConfig[session.status].label}
                </span>
                <div className="flex items-center text-gray-400 text-sm">
                  <Clock className="w-4 h-4 ml-1" />
                  {format(new Date(session.session_date), 'eeee, dd MMMM yyyy', { locale: ar })}
                </div>
                <div className="flex items-center text-cyan-400 text-sm">
                  <Target className="w-4 h-4 ml-1" />
                  {session.auctions.length} مزاد
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse">
            <button 
              onClick={fetchSession}
              className="bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300 px-4 py-2 rounded-xl flex items-center"
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث
            </button>
            
            {session.status === 'scheduled' && (
              <button 
                onClick={() => handleUpdateSessionStatus('active')} 
                disabled={sessionActionLoading}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center disabled:opacity-50"
              >
                {sessionActionLoading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Play className="w-4 h-4 ml-2" />}
                بدء الجلسة
              </button>
            )}
            
            {session.status === 'active' && (
              <button 
                onClick={() => handleUpdateSessionStatus('completed')} 
                disabled={sessionActionLoading}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center disabled:opacity-50"
              >
                {sessionActionLoading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Square className="w-4 h-4 ml-2" />}
                إنهاء الجلسة
              </button>
            )}
            
            {session.status !== 'completed' && session.status !== 'cancelled' && (
              <button 
                onClick={() => handleUpdateSessionStatus('cancelled')} 
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

      {/* --- Statistics Summary Bar --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">إجمالي المزادات</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-xl">
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">المزادات النشطة</p>
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
              <p className="text-gray-400 text-sm">المزادات المكتملة</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">{stats.completed}</p>
            </div>
            <div className="bg-purple-500/10 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">المزادات المتبقية</p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">{stats.remaining}</p>
            </div>
            <div className="bg-cyan-500/10 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">القيمة الإجمالية</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {(stats.totalValue / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="bg-amber-500/10 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* --- Auctions Section --- */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg overflow-hidden">
        {/* --- Bulk Actions Bar --- */}
        {selectedAuctions.length > 0 && (
          <div className="p-6 bg-gray-750 border-b border-gray-700/50 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="bg-cyan-500/20 p-2 rounded-xl">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white">
                  {selectedAuctions.length} مزاد محدد
                </span>
                <p className="text-xs text-gray-400">اختر الإجراء المناسب للتطبيق</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse flex-wrap gap-3">
              {/* Status Update */}
              <div className="flex items-center space-x-3 space-x-reverse">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as typeof bulkStatus)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  {bulkStatuses.map(status => {
                    const Icon = status.icon;
                    return (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    );
                  })}
                </select>
                <button
                  onClick={handleBulkUpdate}
                  disabled={bulkActionLoading}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center disabled:opacity-50"
                >
                  {bulkActionLoading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : 'تطبيق الحالة'}
                </button>
              </div>

              {/* Divider */}
              <div className="h-8 border-r border-gray-600"></div>

              {/* Approval/Rejection */}
              <div className="flex items-center space-x-2 space-x-reverse">
                <button 
                  onClick={() => handleBulkApproveReject(true)} 
                  disabled={bulkActionLoading}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 disabled:opacity-50"
                >
                  قبول المحدد
                </button>
                <button 
                  onClick={() => handleBulkApproveReject(false)} 
                  disabled={bulkActionLoading}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 disabled:opacity-50"
                >
                  رفض المحدد
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- Auctions Table --- */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-750 border-b border-gray-700/50">
                <th scope="col" className="p-4">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-cyan-500 border-gray-600 rounded focus:ring-cyan-500 bg-gray-700"
                  />
                </th>
                <th scope="col" className="px-6 py-4 text-right text-sm font-medium text-gray-400 uppercase tracking-wider">السيارة</th>
                <th scope="col" className="px-6 py-4 text-right text-sm font-medium text-gray-400 uppercase tracking-wider">سعر الافتتاح</th>
                <th scope="col" className="px-6 py-4 text-right text-sm font-medium text-gray-400 uppercase tracking-wider">حالة الموافقة</th>
                <th scope="col" className="px-6 py-4 text-right text-sm font-medium text-gray-400 uppercase tracking-wider">الحالة</th>
                <th scope="col" className="px-6 py-4 text-right text-sm font-medium text-gray-400 uppercase tracking-wider">البث المباشر</th>
                <th scope="col" className="px-6 py-4 text-right text-sm font-medium text-gray-400 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {session.auctions.map((auction) => {
                const StatusIcon = statusConfig[auction.status]?.icon || Clock;
                return (
                  <tr key={auction.id} className="hover:bg-gray-750/50 transition-colors duration-200 group">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedAuctions.includes(auction.id)}
                        onChange={(e) => handleSelectOne(e, auction.id)}
                        className="h-4 w-4 text-cyan-500 border-gray-600 rounded focus:ring-cyan-500 bg-gray-700"
                      />
                    </td>
                    
                    {/* Car Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-xl">
                          <Crown className="w-4 h-4 text-white" />
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-white">
                            {auction.car.make} {auction.car.model}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {auction.car.year} • ID: {auction.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Opening Price */}
                    <td className="px-6 py-4">
                      {editingAuctionId === auction.id ? (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <input
                            type="number"
                            value={editingPrice}
                            onChange={(e) => setEditingPrice(e.target.value)}
                            onBlur={() => handlePriceUpdate(auction.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePriceUpdate(auction.id)}
                            autoFocus
                            className="w-32 px-3 py-1 bg-gray-700 border border-cyan-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                          <SaudiRiyal className="w-4 h-4 text-cyan-400" />
                        </div>
                      ) : (
                        <div 
                          onClick={() => { setEditingAuctionId(auction.id); setEditingPrice(String(auction.opening_price)); }} 
                          className="cursor-pointer hover:bg-gray-700/50 p-2 rounded-lg transition-all duration-300 flex items-center space-x-2 space-x-reverse"
                        >
                          <span className="text-cyan-400 font-semibold">
                            {auction.opening_price?.toLocaleString() || 0}
                          </span>
                          <SaudiRiyal className="w-4 h-4 text-cyan-400" />
                        </div>
                      )}
                    </td>

                    {/* Approval Status */}
                    <td className="px-6 py-4">
                      {auction.control_room_approved ? (
                        <div className="flex items-center space-x-2 space-x-reverse text-green-400" title="مقبول">
                          <CheckCheck className="w-5 h-5" />
                          <span className="text-sm">مقبول</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 space-x-reverse text-red-400" title="مرفوض">
                          <XCircle className="w-5 h-5" />
                          <span className="text-sm">مرفوض</span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[auction.status]?.color || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                        <StatusIcon className="w-3 h-3 ml-1" />
                        {statusConfig[auction.status]?.label || auction.status}
                      </span>
                    </td>

                    {/* Live Stream Status */}
                    <td className="px-6 py-4">
                      {auction.approved_for_live && (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                          <span className="text-sm font-medium text-red-400">مباشر</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {actionLoading[auction.id] ? (
                          <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
                        ) : (
                          auction.status === 'live' && (
                            auction.approved_for_live ? (
                              <button 
                                onClick={() => handleStreamToggle(auction.id, false)} 
                                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center space-x-1 space-x-reverse"
                              >
                                <Square className="w-3 h-3" />
                                <span>إيقاف البث</span>
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleStreamToggle(auction.id, true)} 
                                disabled={!auction.control_room_approved}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center space-x-1 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
                                title={!auction.control_room_approved ? "غير مسموح - يحتاج موافقة" : "بدء البث المباشر"}
                              >
                                <Volume2 className="w-3 h-3" />
                                <span>بدء البث</span>
                              </button>
                            )
                          )
                        )}
                        
                        <button className="text-gray-400 hover:text-white hover:bg-gray-700/50 p-2 rounded-lg transition-all duration-300">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {session.auctions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Target className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-2">لا توجد مزادات في هذه الجلسة</p>
            <p className="text-gray-500 text-sm">يمكنك إضافة مزادات جديدة إلى الجلسة</p>
          </div>
        )}
      </div>
    </div>
  );
}