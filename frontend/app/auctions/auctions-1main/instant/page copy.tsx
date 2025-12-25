'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import LoadingLink from '@/components/LoadingLink';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Shield,
  Clock,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLoadingRouter } from '@/hooks/useLoadingRouter';
import { formatCurrency } from '@/utils/formatCurrency';
import Pusher from 'pusher-js';
import Pagination from '@/components/Pagination';

// =====================
// أنواع البيانات
// =====================
interface Bid {
  bid_amount?: number;
  amount?: number; // في بعض الـ APIs
  increment?: number;
}

interface Broadcast {
  stream_url: string;
}

interface CarEntity {
  province: string;
  city: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  odometer: number;
  condition: string;
  color: string;
  engine: string; // نوع الوقود/المحرك
  auction_status: 'in_auction' | 'sold' | 'expired' | 'live' | string;
}

interface AuctionRow {
  auction_type: 'live' | 'instant' | 'silent' | string;
  car_id: number;
  broadcasts: Broadcast[];
  opening_price?: number;
  minimum_bid?: number;
  maximum_bid?: number;
  current_bid?: number;
  bids: Bid[];
  car: CarEntity;
}

interface ApiIndexResponse {
  data: {
    data: AuctionRow[];
    total: number;
  };
  brands?: string[];
}

// =====================
// أدوات مساعدة
// =====================
function getAuctionStatus(status: string): string {
  switch (status) {
    case 'in_auction':
      return 'جاري المزايدة';
    case 'sold':
      return 'تم البيع';
    case 'expired':
      return 'انتهى';
    case 'live':
      return 'مباشر';
    default:
      return 'غير محدد';
  }
}

async function isWithinAllowedTime(page: string): Promise<boolean> {
  try {
    const response = await api.get(`api/check-time?page=${page}`);
    return response.data.allowed;
  } catch (e) {
    return true; // في حال فشل التحقق، اسمح مؤقتًا
  }
}

const shimmer =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent';

// =====================
// الصفحة
// =====================
export default function InstantAuctionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);

  const [isAllowed, setIsAllowed] = useState(true);
  const [rows, setRows] = useState<AuctionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 30;
  const [brandFilter, setBrandFilter] = useState('');

  const { isLoggedIn } = useAuth();
  const router = useLoadingRouter();

  // Removed client-side authentication redirect - now handled by middleware
  // Public page: authentication only required for bidding actions

  // Debounce للبحث
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // جلب البيانات
  const fetchAuctions = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      setLoading(true);
      setError(null);

      const allowed = await isWithinAllowedTime('instant_auction');
      setIsAllowed(allowed);

      const params = new URLSearchParams();
      if (debouncedTerm) params.append('search', debouncedTerm);
      if (brandFilter) params.append('brand', brandFilter);

      const url = `/api/approved-auctions/live_instant?page=${currentPage}&pageSize=${pageSize}&${params.toString()}`;
      const response = await api.get<ApiIndexResponse>(url, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          Accept: 'application/json; charset=UTF-8',
        },
      });

      const data = response.data?.data;
      const list = (data?.data ?? []) as AuctionRow[];
      setRows(list);
      setTotalCount(data?.total ?? list.length);
      setBrands(response.data?.brands ?? []);
    } catch (err: any) {
      console.error('فشل تحميل بيانات السوق الفوري', err);
      setRows([]);
      setError('تعذر الاتصال بالخادم. يرجى المحاولة لاحقًا.');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, debouncedTerm, brandFilter, currentPage]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  // Pusher للتحديث اللحظي
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_APP_KEY) return;
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
    });

    const channel = pusher.subscribe('auction.instant');

    const refresh = () => fetchAuctions();

    channel.bind('CarMovedBetweenAuctionsEvent', (data: any) => {
      console.log('Car moved to auction:', data);
      refresh();
      // toast.success('تم تحديث السيارات في السوق الفوري');
    });

    channel.bind('AuctionStatusChangedEvent', (data: any) => {
      console.log('Auction status changed:', data);
      refresh();
      const labels: Record<string, string> = {
        live: 'مباشر',
        ended: 'منتهي',
        completed: 'مكتمل',
        cancelled: 'ملغي',
        failed: 'فاشل',
        scheduled: 'مجدول',
      };
      toast(
        `تم تغيير حالة مزاد ${data.car_make} ${data.car_model} من ${
          labels[data.old_status] || data.old_status
        } إلى ${labels[data.new_status] || data.new_status}`
      );
    });

    return () => {
      pusher.unsubscribe('auction.instant');
      pusher.disconnect();
    };
  }, [fetchAuctions]);

  // تصفية إضافية على الواجهة (بالإضافة للـ API)
  const filteredRows = useMemo(() => {
    return rows.filter((r) => !brandFilter || r.car?.make === brandFilter);
  }, [rows, brandFilter]);

  // عناصر واجهة
  const headerStats = (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/10 text-white border border-white/10">
        <Shield className="w-4 h-4" /> بيئة موثوقة
      </span>
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/10 text-white border border-white/10">
        <Clock className="w-4 h-4" /> يوميًا 7–10 مساءً
      </span>
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/10 text-white border border-white/10">
        <TrendingUp className="w-4 h-4" /> مزايدات لحظية
      </span>
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white" dir="rtl">
      {/* Hero */}
      <div className="border-b border-white/10 bg-gray-900/60 backdrop-blur relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.18),transparent_45%),radial-gradient(circle_at_70%_30%,rgba(168,85,247,0.16),transparent_40%)]" aria-hidden="true"/>
        <div className="container mx-auto px-4 py-6 relative z-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">السوق الفوري المباشر — جميع السيارات</h1>
            <p className="text-blue-200 mt-1">وقت السوق من 7 مساءً إلى 10 مساءً كل يوم</p>
          </div>
          {headerStats}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* عودة */}
        <div className="flex justify-end mb-4">
          <LoadingLink
            href="/auctions"
            className="inline-flex items-center gap-2 text-blue-200 hover:text-white px-3 py-1 rounded-xl bg-white/10 border border-white/10"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" /> العودة
          </LoadingLink>
        </div>

        {/* البحث والفلاتر */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="ابحث بالماركة، الموديل، أو رقم اللوحة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20"
            aria-expanded={showFilters}
          >
            <Filter size={18} /> فلاتر
            <ChevronDown className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} size={16} />
          </button>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10">
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
              <select
                value={brandFilter}
                onChange={(e) => {
                  setBrandFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="p-2 rounded-xl bg-black/30 border border-white/10"
              >
                <option value="">كل السيارات</option>
                {brands.map((b, i) => (
                  <option key={i} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* حالات لا توجد بيانات */}
        {!loading && !error && filteredRows.length === 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-yellow-500/10 text-yellow-100 border border-yellow-500/30">
            لا توجد سيارات متاحة في السوق الفوري حاليًا.
          </div>
        )}

        {/* حالة غير مسموح بالوقت */}
        {!isAllowed && (
          <div className="mt-4 p-4 rounded-2xl bg-red-500/10 text-red-100 border border-red-500/30 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> السوق غير مفتوح الآن. سيفتح بحسب الأوقات الموضحة أعلاه.
          </div>
        )}

        {/* جدول السيارات */}
        <div className="mt-6 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
          {/* Skeleton */}
          {loading && (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className={`h-[120px] rounded-xl bg-white/5 border border-white/10 ${shimmer}`}></div>
              <div className={`h-[120px] rounded-xl bg-white/5 border border-white/10 ${shimmer}`}></div>
              <div className={`h-[120px] rounded-xl bg-white/5 border border-white/10 ${shimmer}`}></div>
            </div>
          )}

          {!loading && !error && filteredRows.length > 0 && isAllowed && (
            <div className="overflow-x-auto">
              <div className="max-h-[70vh] overflow-auto">
                <table className="min-w-full text-sm text-gray-100">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-r from-blue-900/40 to-purple-900/30 text-white text-xs uppercase tracking-wide">
                      {[
                        'رابط بث',
                        'المنطقة',
                        'المدينة',
                        'الماركة',
                        'الموديل',
                        'سنة الصنع',
                        'رقم اللوحة',
                        'العداد',
                        'حالة السيارة',
                        'لون السيارة',
                        'نوع الوقود',
                        'عدد المزايدات',
                        'سعر الافتتاح',
                        'أقل سعر',
                        'أعلى سعر',
                        'آخر سعر',
                        'مبلغ الزيادة',
                        'نسبة التغير',
                        'نتيجة',
                        'تفاصيل',
                      ].map((h, i) => (
                        <th key={i} className="px-4 py-3 text-center font-semibold whitespace-nowrap border-b border-white/10">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => {
                      const last = row.bids?.[row.bids.length - 1];
                      const inc = last?.increment ?? 0;
                      const base = last?.bid_amount ?? last?.amount ?? 0;
                      const pct = base > 0 ? ((inc / base) * 100).toFixed(2) + '%' : '0%';

                      // عرض الصفوف للحالات المطلوبة فقط
                      if (row.auction_type === 'live' || row.car?.auction_status !== 'in_auction') {
                        return null;
                      }

                      return (
                        <tr key={idx} className="odd:bg-white/0 even:bg-white/[0.02] hover:bg-white/[0.06] transition-colors">
                          <td className="px-4 py-3 text-center">
                            {row.broadcasts?.length > 0 ? (
                              <LoadingLink
                                target="_blank"
                                href={row.broadcasts[0].stream_url}
                                className="text-blue-300 hover:text-white font-medium"
                              >
                                بث
                              </LoadingLink>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">{row.car?.province ?? '—'}</td>
                          <td className="px-4 py-3 text-center">{row.car?.city ?? '—'}</td>
                          <td className="px-4 py-3 text-center">{row.car?.make ?? '—'}</td>
                          <td className="px-4 py-3 text-center">{row.car?.model ?? '—'}</td>
                          <td className="px-4 py-3 text-center">{row.car?.year ?? '—'}</td>
                          <td className="px-4 py-3 text-center">{row.car?.plate ?? '—'}</td>
                          <td className="px-4 py-3 text-center">{row.car?.odometer ?? '—'}</td>
                          <td className="px-4 py-3 text-center">{row.car?.condition ?? '—'}</td>
                          <td className="px-4 py-3 text-center">{row.car?.color ?? '—'}</td>
                          <td className="px-4 py-3 text-center">{row.car?.engine ?? '—'}</td>
                          <td className="px-4 py-3 text-center">{row.bids?.length ?? 0}</td>
                          <td className="px-4 py-3 text-center font-medium">{formatCurrency(row.opening_price || 0)}</td>
                          <td className="px-4 py-3 text-center font-medium">{formatCurrency(row.minimum_bid || 0)}</td>
                          <td className="px-4 py-3 text-center font-medium">{formatCurrency(row.maximum_bid || 0)}</td>
                          <td className="px-4 py-3 text-center font-medium">{formatCurrency(row.current_bid || 0)}</td>
                          <td className="px-4 py-3 text-center text-green-300">{inc}</td>
                          <td className="px-4 py-3 text-center text-green-300">{pct}</td>
                          <td className="px-4 py-3 text-center">{getAuctionStatus(row.car?.auction_status)}</td>
                          <td className="px-4 py-3 text-center">
                            <LoadingLink
                              href={`/auctions/auctions-1main/instant/${row.car_id}`}
                              className="text-blue-300 hover:text-white underline"
                            >
                              عرض
                            </LoadingLink>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* خطأ */}
          {!loading && error && (
            <div className="p-6 text-red-100 bg-red-500/10 border-t border-red-500/30">
              {error}
            </div>
          )}
        </div>

        {/* ترقيم الصفحات */}
        {!loading && !error && totalCount > pageSize && (
          <Pagination
            className="pagination-bar mt-4"
            currentPage={currentPage}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
          />
        )}
      </div>
    </main>
  );
}
