'use client';

import { useEffect, useMemo, useState } from 'react';
import { Header } from '../../../components/exhibitor/Header';
import { Sidebar } from '../../../components/exhibitor/sidebar';
import { FiMenu } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  RefreshCw,
  Download,
  Copy,
  Truck,
  PackageOpen,
  CheckCircle2,
  Clock,
  Barcode,
  MapPin,
  User,
} from 'lucide-react';

/* =========================
   Types
========================= */
type ShipmentItem = { name: string; qty: number };

type Shipment = {
  id: number;
  recipient: string;
  address: string;
  trackingNumber: string | null;
  shippingStatus: number; // 0..3
  paymentStatus: string;
  createdAt: string;
  items: ShipmentItem[];
};

type Paginated<T> = {
  data: T[];
  links: { first: string | null; last: string | null; next?: string | null; prev?: string | null };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url?: string | null; label: string; active: boolean; page?: number }>;
    path: string;
  };
};

/* =========================
   UI Helpers
========================= */
const steps = [
  { label: 'تم استلام الطلب', icon: PackageOpen },
  { label: 'جاري الشحن', icon: Truck },
  { label: 'في الطريق', icon: Clock },
  { label: 'تم التسليم', icon: CheckCircle2 },
];

function formatDate(d?: string) {
  if (!d) return '';
  try {
    return new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }).format(
      new Date(d)
    );
  } catch {
    return d;
  }
}

function ShippingProgress({ value }: { value: number }) {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex items-center justify-between w-full max-w-md mx-auto">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const active = i <= value;
          return (
            <div key={i} className="flex flex-col items-center flex-1 min-w-0">
              <div
                className={`w-9 h-9 flex items-center justify-center rounded-full border-2 transition-all duration-300
                ${active ? 'bg-emerald-600/15 border-emerald-500 text-emerald-300' : 'bg-slate-900/60 border-slate-700 text-slate-500'}`}
              >
                <Icon className="w-4.5 h-4.5" />
              </div>
              <span className={`mt-2 text-[11px] font-bold ${active ? 'text-emerald-300' : 'text-slate-500'} truncate max-w-[92px]`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={`h-1 w-10 md:w-16 rounded-full my-1 transition-all duration-300
                  ${i < value ? 'bg-emerald-500/60' : 'bg-slate-700'}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DetailsModal({ order, onClose }: { order: Shipment | null; onClose: () => void }) {
  if (!order) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-rose-300 transition text-2xl leading-none"
          aria-label="إغلاق"
        >
          ×
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Truck className="text-fuchsia-400 w-6 h-6" />
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-100">تفاصيل الشحنة</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col gap-3 text-slate-300">
            <div className="flex items-center gap-2 min-w-0">
              <User className="text-fuchsia-300 w-4 h-4" />
              <span className="font-bold text-slate-200">المستلم:</span>
              <span className="truncate">{order.recipient}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="text-violet-300 w-4 h-4" />
              <span className="font-bold text-slate-200">العنوان:</span>
              <span className="truncate">{order.address}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Barcode className="text-blue-300 w-4 h-4" />
              <span className="font-bold text-slate-200">رقم التتبع:</span>
              <span className="truncate">{order.trackingNumber || '—'}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="text-slate-400 w-4 h-4" />
              <span className="font-bold text-slate-200">تاريخ الطلب:</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-slate-200">الدفع:</span>
              <span className={`font-bold ${order.paymentStatus === 'محجوز' ? 'text-amber-300' : 'text-emerald-300'}`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <ShippingProgress value={order.shippingStatus} />
            <div className="mt-6">
              <span className="font-bold text-slate-200">العناصر المشحونة:</span>
              <ul className="list-disc pr-6 mt-2 text-slate-300 text-sm">
                {order.items?.map((it, i) => (
                  <li key={i} className="min-w-0">
                    <span className="truncate">{it.name}</span>{' '}
                    <span className="text-slate-500">x{it.qty}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => order.trackingNumber && window.open(`https://track.example.com/${order.trackingNumber}`, '_blank')}
            disabled={!order.trackingNumber}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition
            ${order.trackingNumber
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
          >
            تتبع الشحنة
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Page
========================= */
export default function ExhibitorShippingPage() {
  const [isClient, setIsClient] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [orders, setOrders] = useState<Shipment[]>([]);
  const [selected, setSelected] = useState<Shipment | null>(null);

  // server pagination
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(10);

  // filters (match backend)
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<number | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => setIsClient(true), []);

  const canPrev = useMemo(() => page > 1, [page]);
  const canNext = useMemo(() => page < lastPage, [page, lastPage]);

  async function load(p = 1) {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Paginated<Shipment>>('/api/exhibitor/shipments', {
        params: {
          page: p,
          per_page: perPage,
          q: q || undefined,
          status: status === '' ? undefined : status,
          from: from || undefined,
          to: to || undefined,
        },
      });

      setOrders(data.data || []);
      setPage(data.meta?.current_page || 1);
      setLastPage(data.meta?.last_page || 1);
      setPerPage(data.meta?.per_page || 10);
      setTotal(data.meta?.total || 0);
    } catch (e: any) {
      console.error(e);
      setOrders([]);
      setPage(1);
      setLastPage(1);
      setTotal(0);
      setError(e?.message || 'تعذر تحميل الشحنات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isClient) return;
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  const applyFilters = () => load(1);
  const resetFilters = () => {
    setQ('');
    setStatus('');
    setFrom('');
    setTo('');
    setPerPage(10);
    load(1);
  };

  const exportCSV = () => {
    if (!orders.length) return toast.error('لا توجد بيانات للتصدير');
    const rows = [
      ['#', 'المستلم', 'العنوان', 'رقم التتبع', 'الحالة', 'الدفع', 'التاريخ'],
      ...orders.map((o) => [
        String(o.id),
        o.recipient,
        o.address,
        o.trackingNumber ?? '',
        steps[o.shippingStatus]?.label ?? '',
        o.paymentStatus,
        new Date(o.createdAt).toLocaleString('ar-SA'),
      ]),
    ];
    const csv = rows
      .map((r) =>
        r
          .map((c) => {
            const v = String(c ?? '');
            return /[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipments_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تنزيل CSV');
  };

  const copyTable = async () => {
    try {
      if (!orders.length) return toast.error('لا توجد بيانات للنسخ');
      const header = ['#', 'المستلم', 'العنوان', 'التتبع', 'الحالة', 'الدفع', 'التاريخ'];
      const body = orders.map(
        (o) =>
          `${o.id}\t${o.recipient}\t${o.address}\t${o.trackingNumber ?? ''}\t${steps[o.shippingStatus]?.label ?? ''}\t${o.paymentStatus}\t${new Date(o.createdAt).toLocaleString('ar-SA')}`
      );
      await navigator.clipboard.writeText([header.join('\t'), ...body].join('\n'));
      toast.success('تم نسخ الجدول');
    } catch {
      toast.error('تعذر النسخ للحافظة');
    }
  };

  /* ============== Skeleton (no layout shift) ============== */
  if (!isClient) {
    return (
      <div dir="rtl" className="flex min-h-screen bg-slate-950">
        <div className="hidden md:block w-72 bg-slate-950 border-l border-slate-800" />
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-slate-950 border-b border-slate-800" />
          <main className="p-6 flex-1" />
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex min-h-screen bg-slate-950">
      {/* Sidebar (desktop) */}
      <div className="hidden md:block w-72 flex-shrink-0 bg-slate-950 border-l border-slate-800">
        <Sidebar />
      </div>

      {/* Sidebar (mobile drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 md:hidden flex"
            role="dialog"
            aria-modal="true"
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
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
            {/* Title + actions */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-fuchsia-400" />
                  شحنات المعرض
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  عرض وتتبع حالات الشحن الخاصة بالمعرض.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => load(page)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 text-slate-200 hover:bg-slate-900/60"
                >
                  <RefreshCw className="w-4 h-4" />
                  تحديث
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:p-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:items-end">
                {/* Search */}
                <div className="relative lg:col-span-5 min-w-0">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="ابحث بالاسم / العنوان / رقم التتبع…"
                    className="w-full pr-9 pl-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30"
                  />
                </div>

                {/* Status */}
                <div className="lg:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">
                    <span className="inline-flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" /> الحالة
                    </span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30"
                  >
                    <option value="">كل الحالات</option>
                    <option value={0}>تم استلام الطلب</option>
                    <option value={1}>جاري الشحن</option>
                    <option value={2}>في الطريق</option>
                    <option value={3}>تم التسليم</option>
                  </select>
                </div>

                {/* Date range */}
                <div className="lg:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">من تاريخ</label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">إلى تاريخ</label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30"
                  />
                </div>

                {/* Per page */}
                <div className="lg:col-span-1">
                  <label className="block text-xs text-slate-400 mb-1">لكل صفحة</label>
                  <select
                    value={perPage}
                    onChange={(e) => setPerPage(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30"
                  >
                    {[10, 15, 20, 30, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="lg:col-span-12 flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={applyFilters}
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow"
                  >
                    تطبيق
                  </button>
                  <button
                    onClick={resetFilters}
                    className="bg-slate-950/60 border border-slate-800 text-slate-200 text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-slate-900/60"
                  >
                    تصفية
                  </button>
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={exportCSV}
                      className="px-3 py-2.5 rounded-lg border border-slate-800 text-slate-200 hover:bg-slate-900/60 inline-flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      CSV
                    </button>
                    <button
                      onClick={copyTable}
                      className="px-3 py-2.5 rounded-lg border border-slate-800 text-slate-200 hover:bg-slate-900/60 inline-flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      نسخ
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-44 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-800/40 bg-rose-950/40 text-rose-200 p-4">
                حدث خطأ: {error}
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 p-6 text-center">
                لا توجد شحنات مطابقة.
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  {orders.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setSelected(o)}
                      className="text-right group rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/80 transition p-5 relative min-w-0 overflow-hidden"
                      aria-label={`تفاصيل شحنة ${o.trackingNumber || o.id}`}
                    >
                      {/* Badge */}
                      <div className="absolute top-4 left-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border
                          ${o.shippingStatus === 3
                              ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-blue-600/10 text-blue-300 border-blue-500/30'}`}
                        >
                          {o.shippingStatus === 3 ? 'تم التسليم' : 'قيد الشحن'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-2 text-slate-200 min-w-0">
                        <User className="w-4 h-4 text-fuchsia-300 flex-shrink-0" />
                        <span className="font-bold">المستلم:</span>
                        <span className="text-slate-300 truncate">{o.recipient}</span>
                      </div>

                      <div className="flex items-center gap-2 mb-2 text-slate-200 min-w-0">
                        <MapPin className="w-4 h-4 text-violet-300 flex-shrink-0" />
                        <span className="font-bold">العنوان:</span>
                        <span className="text-slate-300 truncate">{o.address}</span>
                      </div>

                      <div className="flex items-center gap-2 mb-2 text-slate-200 min-w-0">
                        <Barcode className="w-4 h-4 text-blue-300 flex-shrink-0" />
                        <span className="font-bold">التتبع:</span>
                        <span className="text-slate-300 truncate">{o.trackingNumber || '—'}</span>
                      </div>

                      <div className="flex items-center gap-2 mb-2 text-slate-200 min-w-0">
                        <span className="font-bold">الدفع:</span>
                        <span
                          className={`font-bold ${
                            o.paymentStatus === 'محجوز' ? 'text-amber-300' : 'text-emerald-300'
                          }`}
                        >
                          {o.paymentStatus}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-3 text-slate-200 min-w-0">
                        <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="font-bold">الحالة:</span>
                        <span className={`${o.shippingStatus === 3 ? 'text-emerald-300' : 'text-blue-300'} font-bold truncate`}>
                          {steps[o.shippingStatus]?.label ?? '—'}
                        </span>
                      </div>

                      <ShippingProgress value={o.shippingStatus} />

                      <div className="flex justify-end mt-2">
                        <span className="text-[11px] text-slate-500">{formatDate(o.createdAt)}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6 text-slate-300">
                  <div className="text-sm">
                    إجمالي: <span className="font-semibold text-slate-200">{total}</span> عنصر
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => canPrev && load(page - 1)}
                      disabled={!canPrev}
                      className={`px-3 py-2 rounded-lg text-sm border ${
                        canPrev ? 'border-slate-700 hover:bg-slate-800/60' : 'border-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      السابق
                    </button>
                    <span className="text-sm text-slate-400">
                      صفحة <span className="text-slate-200">{page}</span> من <span className="text-slate-200">{lastPage}</span>
                    </span>
                    <button
                      onClick={() => canNext && load(page + 1)}
                      disabled={!canNext}
                      className={`px-3 py-2 rounded-lg text-sm border ${
                        canNext ? 'border-slate-700 hover:bg-slate-800/60' : 'border-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      التالي
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* FAB (Mobile) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 right-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-4 rounded-full shadow-xl z-50 hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200 flex items-center justify-center"
        style={{ boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.35), 0 4px 6px -4px rgba(0, 0, 0, 0.35)' }}
        aria-label="فتح القائمة"
        title="القائمة"
      >
        <FiMenu size={22} />
      </button>

      {/* Modal */}
      {selected && <DetailsModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
