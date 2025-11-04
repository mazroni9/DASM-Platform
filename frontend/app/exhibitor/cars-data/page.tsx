'use client';

import { useEffect, useMemo, useState } from 'react';
import { Header } from '../../../components/exhibitor/Header';
import { Sidebar } from '../../../components/exhibitor/sidebar';
import { FiMenu } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Car,
  Gauge,
  Calendar,
  Layers,
  Eye,
} from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

/* =========================
   Types
========================= */
type Paginator<T> = {
  data: T[];
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
};

type MarketCar = {
  id: number;
  make: string | null;
  model: string | null;
  year: number | null;
  color?: string | null;
  engine?: string | null;
  transmission?: string | null;
  odometer?: number | null;
  condition?: string | null;
  evaluation_price?: number | null;
  auction_status?: string | null;
  created_at?: string | null;
  dealer_label?: string | null;
  description?: string | null;
};

/* =========================
   Helpers
========================= */
const fmtInt = (n?: number | null) =>
  typeof n === 'number' ? new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(n) : '—';

const fmtMoney = (n?: number | null) =>
  typeof n === 'number'
    ? new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(n)
    : '—';

const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('ar-SA') : '—');

/* =========================
   Page
========================= */
export default function ExhibitorDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // === Filters / query
  const [q, setQ] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [odoFrom, setOdoFrom] = useState('');
  const [odoTo, setOdoTo] = useState('');
  const [condition, setCondition] = useState('');
  const [auctionStatus, setAuctionStatus] = useState('');
  const [includeMine, setIncludeMine] = useState(true); // ✅ افتراضيًا مفعّل
  const [perPage, setPerPage] = useState(12);
  const [sortBy, setSortBy] = useState<'created_at' | 'year' | 'odometer' | 'evaluation_price'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // === Data
  const [loading, setLoading] = useState(true);
  const [pager, setPager] = useState<Paginator<MarketCar> | null>(null);
  const cars = useMemo(() => pager?.data ?? [], [pager]);

  // Details modal
  const [selected, setSelected] = useState<MarketCar | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => setIsClient(true), []);

  const buildParams = (page = 1, opts?: Partial<Record<string, any>>) => {
    const params: Record<string, any> = {
      per_page: perPage,
      page,
      sort_by: sortBy,
      sort_dir: sortDir,
      include_mine: includeMine ? 1 : 0,
      ...opts,
    };
    if (q.trim()) params.q = q.trim();
    if (make.trim()) params.make = make.trim();
    if (model.trim()) params.model = model.trim();
    if (yearFrom) params.year_from = yearFrom;
    if (yearTo) params.year_to = yearTo;
    if (priceFrom) params.price_from = priceFrom;
    if (priceTo) params.price_to = priceTo;
    if (odoFrom) params.odometer_from = odoFrom;
    if (odoTo) params.odometer_to = odoTo;
    if (condition.trim()) params.condition = condition.trim();
    if (auctionStatus.trim()) params.auction_status = auctionStatus.trim();
    return params;
  };

  const fetchCars = async (page = 1, opts?: Partial<Record<string, any>>) => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/exhibitor/market/cars', { params: buildParams(page, opts) });
      setPager({
        data: data.data ?? [],
        current_page: data.meta?.current_page ?? data.current_page ?? page,
        per_page: data.meta?.per_page ?? data.per_page ?? perPage,
        last_page: data.meta?.last_page ?? data.last_page ?? 1,
        total: data.meta?.total ?? data.total ?? (data.data?.length ?? 0),
      });
    } catch (e: any) {
      console.error(e);
      toast.error('تعذّر تحميل السيارات');
      setPager({ data: [], current_page: 1, per_page: perPage, last_page: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => fetchCars(pager?.current_page ?? 1);

  const applyFilters = () => fetchCars(1);

  const resetFilters = () => {
    setQ('');
    setMake('');
    setModel('');
    setYearFrom('');
    setYearTo('');
    setPriceFrom('');
    setPriceTo('');
    setOdoFrom('');
    setOdoTo('');
    setCondition('');
    setAuctionStatus('');
    setSortBy('created_at');
    setSortDir('desc');
    setPerPage(12);
    // نحتفظ بـ includeMine كما هو (مفعّل افتراضيًا)
    fetchCars(1, {
      q: '',
      make: '',
      model: '',
      year_from: '',
      year_to: '',
      price_from: '',
      price_to: '',
      odometer_from: '',
      odometer_to: '',
      condition: '',
      auction_status: '',
      sort_by: 'created_at',
      sort_dir: 'desc',
      per_page: 12,
    });
  };

  const openDetails = async (car: MarketCar) => {
    setSelected(car);
    setLoadingDetails(true);
    try {
      const { data } = await api.get(`/api/exhibitor/market/cars/${car.id}`);
      if (data?.data) setSelected(data.data as MarketCar);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const prevPage = () => {
    if (!pager || pager.current_page <= 1) return;
    fetchCars(pager.current_page - 1);
  };
  const nextPage = () => {
    if (!pager || pager.current_page >= pager.last_page) return;
    fetchCars(pager.current_page + 1);
  };

  // أول تحميل
  useEffect(() => {
    if (!isClient) return;
    fetchCars(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  // تحديث تلقائي عند تغيير هذه المفاتيح (يشمل تضمين سيارتي)
  useEffect(() => {
    if (!isClient) return;
    fetchCars(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeMine, perPage, sortBy, sortDir]);

  /* -------------------------
     Skeleton
  ------------------------- */
  if (!isClient) {
    return (
      <div dir="rtl" className="flex min-h-screen bg-slate-950 overflow-x-hidden">
        <div className="hidden md:block w-72 bg-slate-900/80 border-l border-slate-800 animate-pulse" />
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-slate-900/70 border-b border-slate-800 animate-pulse" />
          <main className="p-6 flex-1 bg-slate-950" />
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex min-h-screen bg-slate-950 relative overflow-x-hidden">
      {/* Sidebar (desktop) */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Drawer (mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-40 md:hidden flex"
          >
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="إغلاق القائمة"
            />
            <motion.div className="relative w-72 ml-auto h-full bg-slate-950 border-l border-slate-800 shadow-2xl">
              <Sidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col w-0">
        <Header />

        <main className="p-4 md:p-6 flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
          <div className="max-w-7xl mx-auto">
            {/* Title + refresh */}
            <div className="mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-violet-400" />
                  قاعدة بيانات السيارات (سوق المعارض)
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  تصميم داكن متّسق مع فلترة مرتبة بدون أي overflow.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={refresh}
                  className="h-11 inline-flex items-center gap-2 px-3 rounded-lg border border-slate-800 text-slate-200 hover:bg-slate-900/60"
                >
                  <RefreshCw className="w-4 h-4" />
                  تحديث
                </button>
              </div>
            </div>

            {/* ===================== FILTERS ===================== */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:p-5 mb-5">
              {/* Row 1 */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
                {/* Search */}
                <div className="xl:col-span-5">
                  <label className="sr-only">بحث</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                      placeholder="بحث عام (الماركة / الموديل / اللون / الوصف)"
                      className="w-full h-12 pr-9 pl-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                    />
                  </div>
                </div>

                {/* Make / Model */}
                <div className="xl:col-span-2">
                  <input
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="الماركة"
                    className="w-full h-12 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  />
                </div>
                <div className="xl:col-span-2">
                  <input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="الموديل"
                    className="w-full h-12 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  />
                </div>

                {/* Years */}
                <div className="xl:col-span-3 grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    placeholder="من سنة"
                    className="h-12 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    placeholder="إلى سنة"
                    className="h-12 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="mt-3 grid grid-cols-1 xl:grid-cols-12 gap-3">
                {/* Price */}
                <div className="xl:col-span-3 grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={priceFrom}
                    onChange={(e) => setPriceFrom(e.target.value)}
                    placeholder="سعر من"
                    className="h-12 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={priceTo}
                    onChange={(e) => setPriceTo(e.target.value)}
                    placeholder="سعر إلى"
                    className="h-12 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  />
                </div>

                {/* Odometer */}
                <div className="xl:col-span-3 grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={odoFrom}
                    onChange={(e) => setOdoFrom(e.target.value)}
                    placeholder="عداد من"
                    className="h-12 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={odoTo}
                    onChange={(e) => setOdoTo(e.target.value)}
                    placeholder="عداد إلى"
                    className="h-12 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  />
                </div>

                {/* Condition / Auction */}
                <div className="xl:col-span-2">
                  <input
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    placeholder="الحالة"
                    className="w-full h-12 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  />
                </div>
                <div className="xl:col-span-2">
                  <input
                    value={auctionStatus}
                    onChange={(e) => setAuctionStatus(e.target.value)}
                    placeholder="حالة المزاد"
                    className="w-full h-12 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  />
                </div>

                {/* Sort group */}
                <div className="xl:col-span-2 grid grid-cols-2 gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="h-12 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100"
                  >
                    <option value="created_at">الأحدث</option>
                    <option value="evaluation_price">السعر</option>
                    <option value="year">السنة</option>
                    <option value="odometer">العداد</option>
                  </select>
                  <select
                    value={sortDir}
                    onChange={(e) => setSortDir(e.target.value as any)}
                    className="h-12 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100"
                  >
                    <option value="desc">تنازلي</option>
                    <option value="asc">تصاعدي</option>
                  </select>
                </div>
              </div>

              {/* Row 3: include + perPage + actions */}
              <div className="mt-3 grid grid-cols-1 xl:grid-cols-12 gap-3">
                <div className="xl:col-span-4 grid grid-cols-2 gap-2">
                  <label className="h-12 inline-flex items-center gap-2 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeMine}
                      onChange={(e) => setIncludeMine(e.target.checked)} // auto refresh via useEffect
                      className="accent-fuchsia-500"
                    />
                    تضمين سيارتي
                  </label>
                  <select
                    value={perPage}
                    onChange={(e) => setPerPage(parseInt(e.target.value) || 12)}
                    className="h-12 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100"
                    title="لكل صفحة"
                  >
                    <option value={8}>8 / صفحة</option>
                    <option value={12}>12 / صفحة</option>
                    <option value={16}>16 / صفحة</option>
                    <option value={24}>24 / صفحة</option>
                  </select>
                </div>

                <div className="xl:col-span-8 flex gap-2 justify-start xl:justify-end">
                  <button
                    onClick={applyFilters}
                    className="h-12 inline-flex items-center justify-center gap-2 px-4 rounded-lg border border-slate-800 text-slate-200 hover:bg-slate-900/60"
                  >
                    <Filter className="w-4 h-4" />
                    تطبيق
                  </button>
                  <button
                    onClick={resetFilters}
                    className="h-12 inline-flex items-center justify-center gap-2 px-4 rounded-lg border border-slate-800 text-slate-200 hover:bg-slate-900/60"
                  >
                    إعادة
                  </button>
                </div>
              </div>
            </div>

            {/* ===================== TABLE ===================== */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full table-auto text-sm">
                  <thead className="bg-slate-900/80 backdrop-blur border-b border-slate-800 text-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-right">#</th>
                      <th className="px-4 py-3 text-right">السيارة</th>
                      <th className="px-4 py-3 text-right">السعر المرجعي</th>
                      <th className="px-4 py-3 text-right">العداد</th>
                      <th className="px-4 py-3 text-right">الحالة</th>
                      <th className="px-4 py-3 text-right">ناقل الحركة</th>
                      <th className="px-4 py-3 text-right">المحرك</th>
                      <th className="px-4 py-3 text-right">اللون</th>
                      <th className="px-4 py-3 text-right">حالة المزاد</th>
                      <th className="px-4 py-3 text-right">تاريخ الإضافة</th>
                      <th className="px-4 py-3 text-right">إجراء</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800">
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {Array.from({ length: 11 }).map((__, j) => (
                            <td key={j} className="px-4 py-3">
                              <div className="h-4 w-full bg-slate-800/70 rounded" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : cars.length ? (
                      cars.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-900/40">
                          <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{c.id}</td>
                          <td className="px-4 py-3 text-slate-200">
                            <div className="flex items-center gap-2">
                              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950/60 border border-slate-800 shrink-0">
                                <Car className="w-4 h-4 text-violet-300" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold truncate">
                                  {c.make || '—'} {c.model || ''} {c.year ? `• ${c.year}` : ''}
                                </div>
                                {c.dealer_label && (
                                  <div className="text-[10px] text-slate-400 truncate">{c.dealer_label}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-bold text-fuchsia-300">
                              {fmtMoney(c.evaluation_price)} <span className="text-xs text-slate-400">SAR</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <Gauge className="w-3.5 h-3.5 text-slate-400" />
                              {fmtInt(c.odometer)} كم
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{c.condition || '—'}</td>
                          <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{c.transmission || '—'}</td>
                          <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{c.engine || '—'}</td>
                          <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{c.color || '—'}</td>
                          <td className="px-4 py-3 text-slate-300">
                            <span className="px-2 py-0.5 rounded-full bg-slate-950/60 border border-slate-800 text-slate-400 inline-block">
                              {c.auction_status || 'غير محدد'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {fmtDate(c.created_at)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => openDetails(c)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-slate-200"
                            >
                              <Eye className="w-4 h-4" />
                              تفاصيل
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-10 text-center text-slate-400" colSpan={11}>
                          لا توجد نتائج مطابقة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {!loading && pager && pager.last_page > 1 && (
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-300">
                <button
                  onClick={prevPage}
                  disabled={pager.current_page <= 1}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border ${
                    pager.current_page <= 1
                      ? 'border-slate-800 text-slate-500 cursor-not-allowed'
                      : 'border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                  السابق
                </button>

                <div className="text-slate-400">
                  صفحة <span className="text-slate-200">{pager.current_page}</span> من{' '}
                  <span className="text-slate-200">{pager.last_page}</span> — إجمالي{' '}
                  <span className="text-slate-200">{fmtInt(pager.total)}</span>
                </div>

                <button
                  onClick={nextPage}
                  disabled={pager.current_page >= pager.last_page}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border ${
                    pager.current_page >= pager.last_page
                      ? 'border-slate-800 text-slate-500 cursor-not-allowed'
                      : 'border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* FAB (mobile) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 right-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-4 rounded-full shadow-xl z-40 hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200 flex items-center justify-center"
        style={{ boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.35), 0 4px 6px -4px rgba(0,0,0,.35)' }}
        aria-label="القائمة"
        title="القائمة"
      >
        <FiMenu size={22} />
      </button>

      {/* Details Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="w-full md:max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="text-slate-100 font-semibold truncate">
                  {selected.make || '—'} {selected.model || ''} {selected.year ? `• ${selected.year}` : ''}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg"
                  aria-label="إغلاق"
                >
                  ×
                </button>
              </div>

              <div className="p-4 md:p-5">
                <div className="h-40 rounded-xl mb-4 bg-gradient-to-r from-violet-700/20 via-fuchsia-600/20 to-indigo-600/10 border border-slate-800 flex items-center justify-center">
                  <Car className="w-10 h-10 text-violet-300/80" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow label="السعر المرجعي">
                    <span className="text-fuchsia-300 font-bold">
                      {fmtMoney(selected.evaluation_price)} <span className="text-xs text-slate-400">SAR</span>
                    </span>
                  </InfoRow>
                  <InfoRow label="العداد">{fmtInt(selected.odometer)} كم</InfoRow>
                  <InfoRow label="الحالة">{selected.condition || '—'}</InfoRow>
                  <InfoRow label="ناقل الحركة">{selected.transmission || '—'}</InfoRow>
                  <InfoRow label="المحرك">{selected.engine || '—'}</InfoRow>
                  <InfoRow label="اللون">{selected.color || '—'}</InfoRow>
                  <InfoRow label="تاريخ الإضافة">{fmtDate(selected.created_at)}</InfoRow>
                  <InfoRow label="حالة المزاد">{selected.auction_status || '—'}</InfoRow>
                </div>

                <div className="mt-4">
                  <div className="text-slate-300 text-sm mb-1">وصف مختصر</div>
                  <p className="text-slate-400 text-sm whitespace-pre-wrap">
                    {loadingDetails ? 'جارِ التحميل…' : selected.description || '—'}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================
   Small helper
========================= */
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 flex items-center justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-200 break-words text-left">{children}</span>
    </div>
  );
}
