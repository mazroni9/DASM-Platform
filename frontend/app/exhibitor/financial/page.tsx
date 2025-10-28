'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Header } from '../../../components/exhibitor/Header';
import { Sidebar } from '../../../components/exhibitor/sidebar';
import { FiMenu } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  ReceiptText,
  Search,
  Filter,
  RefreshCw,
  Download,
  Copy,
  Link as LinkIcon,
} from 'lucide-react';

/* =========================
   Types
========================= */
type RawTxType = string;

interface Tx {
  id: number;
  wallet_id: number;
  type: RawTxType;        // 'credit' | 'debit' | 'auction' | 'adjustment' | ...
  amount: number;         // غالباً بالهللة إن كان النظام يعتمد هللات
  related_auction?: number | null;
  description?: string | null;
  created_at: string;
}

type Paginator<T> = {
  data: T[];
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
};

interface WalletResp {
  success: boolean;
  data?: {
    balance: number;
    balance_sar?: number; // وجودها يعني أن النظام يحسب بالهللة
    currency: string;
  };
}

/* =========================
   Page
========================= */
export default function FinancialPage() {
  const [isClient, setIsClient] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Server pagination (إن وجدت من الباك)
  const [serverPage, setServerPage] = useState(1);
  const [paginator, setPaginator] = useState<Paginator<Tx> | null>(null);

  // Data
  const [loading, setLoading] = useState(true);
  const [txs, setTxs] = useState<Tx[]>([]);

  // Units
  const [amountsInHalala, setAmountsInHalala] = useState<boolean>(false); // لو true نعرض بالقسمة على 100
  const [currency, setCurrency] = useState<string>('SAR');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit' | 'auction' | 'adjustment'>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Client-only
  useEffect(() => setIsClient(true), []);

  // Try to detect units quietly via wallet endpoint
  const detectUnits = async () => {
    try {
      const { data } = await api.get<WalletResp>('/api/exhibitor/wallet');
      if (data?.success && data?.data) {
        setCurrency(data.data.currency || 'SAR');
        setAmountsInHalala(typeof data.data.balance_sar === 'number');
      }
    } catch {
      // تجاهل الخطأ: لسنا في صفحة الرصيد، الهدف فقط كشف الوحدة
    }
  };

  // Fetch transactions (prefers /transactions then fallback to /transcations)
  const fetchTx = async (page: number = 1) => {
    setLoading(true);
    try {
      let resp: any;
      try {
        resp = await api.get(`/api/exhibitor/wallet/transactions?page=${page}`);
      } catch {
        resp = await api.get(`/api/exhibitor/wallet/transcations?page=${page}`);
      }

      const json = resp?.data;
      if (!json?.success || !json?.data) {
        throw new Error(json?.message || json?.code || 'EW-TX-500');
      }

      if (Array.isArray(json.data)) {
        setPaginator({
          data: json.data,
          current_page: 1,
          per_page: json.data.length || 15,
          last_page: 1,
          total: json.data.length,
        });
        setTxs(json.data);
        setServerPage(1);
      } else {
        const p: Paginator<Tx> = json.data;
        setPaginator(p);
        setTxs(p.data || []);
        setServerPage(p.current_page || 1);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('تعذر قراءة سجل المعاملات');
      setPaginator(null);
      setTxs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isClient) return;
    detectUnits();
    fetchTx(1);
  }, [isClient]);

  /* -------------------------
     Helpers & Computations
  ------------------------- */
  const fmtNum = (n: number) =>
    new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(Math.round(n));

  const asSar = (raw: number) => (amountsInHalala ? raw / 100 : raw);

  const badge = (raw: RawTxType) => {
    const t = (raw || '').toLowerCase();
    const base = 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border';
    if (t === 'credit' || t === 'deposit')
      return <span className={`${base} border-emerald-500/30 text-emerald-300 bg-emerald-500/10`}>إيداع</span>;
    if (t === 'debit' || t === 'withdraw')
      return <span className={`${base} border-rose-500/30 text-rose-300 bg-rose-500/10`}>سحب</span>;
    if (t === 'auction')
      return <span className={`${base} border-violet-500/30 text-violet-300 bg-violet-500/10`}>مزاد</span>;
    if (t === 'adjustment')
      return <span className={`${base} border-amber-500/30 text-amber-300 bg-amber-500/10`}>تسوية</span>;
    return <span className={`${base} border-slate-500/30 text-slate-300 bg-slate-500/10`}>{raw || 'غير معروف'}</span>;
  };

  const withinDate = (d: string) => {
    const t = new Date(d).getTime();
    if (dateFrom) {
      const f = new Date(dateFrom + 'T00:00:00').getTime();
      if (t < f) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59').getTime();
      if (t > to) return false;
    }
    return true;
  };

  const filtered = useMemo(() => {
    let list = [...txs];

    if (typeFilter !== 'all') {
      const t = typeFilter.toLowerCase();
      list = list.filter(
        (x) =>
          (x.type || '').toLowerCase() === t ||
          (t === 'credit' && (x.type || '').toLowerCase() === 'deposit') ||
          (t === 'debit' && (x.type || '').toLowerCase() === 'withdraw')
      );
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        (x) =>
          String(x.id).includes(q) ||
          (x.description || '').toLowerCase().includes(q) ||
          (x.related_auction ? String(x.related_auction).includes(q) : false) ||
          (x.type || '').toLowerCase().includes(q)
      );
    }

    if (dateFrom || dateTo) {
      list = list.filter((x) => withinDate(x.created_at));
    }

    // الأحدث أولاً
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [txs, typeFilter, searchTerm, dateFrom, dateTo]);

  const totals = useMemo(() => {
    let credits = 0;
    let debits = 0;
    for (const t of filtered) {
      const ty = (t.type || '').toLowerCase();
      if (ty === 'credit' || ty === 'deposit') credits += asSar(t.amount);
      else if (ty === 'debit' || ty === 'withdraw') debits += asSar(t.amount);
    }
    return {
      credits: Math.round(credits),
      debits: Math.round(debits),
      net: Math.round(credits - debits),
    };
  }, [filtered, amountsInHalala]);

  /* -------------------------
      Actions
  ------------------------- */
  const handleRefresh = async () => {
    await fetchTx(serverPage);
    toast.success('تم تحديث السجل');
  };

  const handlePrev = async () => {
    if (!paginator) return;
    if (paginator.current_page <= 1) return;
    await fetchTx(paginator.current_page - 1);
  };

  const handleNext = async () => {
    if (!paginator) return;
    if (paginator.current_page >= paginator.last_page) return;
    await fetchTx(paginator.current_page + 1);
  };

  const exportCSV = () => {
    const rows = [
      ['#', 'النوع', 'المبلغ (' + currency + ')', 'المزاد المرتبط', 'الوصف', 'التاريخ'],
      ...filtered.map((t) => [
        String(t.id),
        (t.type || '').toUpperCase(),
        String(asSar(t.amount)),
        t.related_auction ? `#${t.related_auction}` : '',
        (t.description || '').replace(/\n/g, ' '),
        new Date(t.created_at).toLocaleString('ar-SA'),
      ]),
    ];
    const csv = rows.map((r) =>
      r
        .map((c) => {
          const v = String(c ?? '');
          return /[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
        })
        .join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تنزيل CSV');
  };

  const copyTable = async () => {
    try {
      const header = ['#', 'النوع', `المبلغ (${currency})`, 'المزاد', 'الوصف', 'التاريخ'];
      const body = filtered.map(
        (t) =>
          `${t.id}\t${(t.type || '').toUpperCase()}\t${asSar(t.amount)}\t${t.related_auction ?? ''}\t${t.description ?? ''}\t${new Date(t.created_at).toLocaleString('ar-SA')}`
      );
      await navigator.clipboard.writeText([header.join('\t'), ...body].join('\n'));
      toast.success('تم نسخ الجدول');
    } catch {
      toast.error('تعذر النسخ للحافظة');
    }
  };

  /* -------------------------
      Skeleton (client)
  ------------------------- */
  if (!isClient) {
    return (
      <div dir="rtl" className="flex min-h-screen bg-slate-950 overflow-x-hidden">
        <div className="hidden md:block w-72 bg-slate-900/80 border-l border-slate-800 animate-pulse" />
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-slate-900/70 border-b border-slate-800 animate-pulse" />
          <main className="p-6 flex-1 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900" />
        </div>
      </div>
    );
  }

  /* -------------------------
      UI
  ------------------------- */
  return (
    <div
      dir="rtl"
      className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 relative overflow-x-hidden"
    >
      {/* زخارف */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl bg-violet-600/10" />
        <div className="absolute bottom-0 -right-24 w-72 h-72 rounded-full blur-3xl bg-fuchsia-500/10" />
      </div>

      {/* Sidebar Desktop */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar Mobile Drawer */}
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
      <div className="flex-1 flex flex-col w-0 relative z-10">
        <Header />

        <main className="p-4 md:p-6 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {/* Title + Actions */}
            <div className="mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <ReceiptText className="w-5 h-5 text-fuchsia-400" />
                  سجل المعاملات المالية
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  جميع العمليات الخاصة بصاحب المعرض. لإدارة الرصيد استخدم صفحة <Link href="/exhibitor/wallet" className="text-fuchsia-300 underline decoration-dotted underline-offset-4">محفظة المعرض</Link>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* زر الانتقال للمحفظة */}
                <Link
                  href="/exhibitor/wallet"
                  className="px-3 py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 border border-fuchsia-700/40 shadow-lg"
                  title="الذهاب لمحفظة المعرض"
                >
                  محفظة المعرض
                </Link>

                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 text-slate-200 hover:bg-slate-900/60"
                >
                  <RefreshCw className="w-4 h-4" />
                  تحديث
                </button>
              </div>
            </div>

            {/* Toolbar: Filters + units + export */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-4 md:p-5 mb-4">
              <div className="flex flex-col xl:flex-row gap-4 xl:items-end">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ابحث برقم العملية / وصف / نوع / رقم المزاد..."
                    className="w-full pr-9 pl-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30"
                  />
                </div>

                {/* Type Filter */}
                <div className="min-w-[180px]">
                  <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> النوع
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30"
                  >
                    <option value="all">كل الأنواع</option>
                    <option value="credit">إيداع</option>
                    <option value="debit">سحب</option>
                    <option value="auction">مزاد</option>
                    <option value="adjustment">تسوية</option>
                  </select>
                </div>

                {/* Date range */}
                <div className="flex gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">من تاريخ</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">إلى تاريخ</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30"
                    />
                  </div>
                </div>

                {/* Units toggle */}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-xs text-slate-400">عرض المبالغ بالريال</span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={!amountsInHalala}
                      onChange={() => setAmountsInHalala((v) => !v)}
                    />
                    <div className="h-5 w-9 rounded-full bg-slate-700 peer-checked:bg-fuchsia-600 transition-colors">
                      <div className="absolute top-1/2 -translate-y-1/2 left-1 peer-checked:left-5 h-3 w-3 rounded-full bg-white transition-all" />
                    </div>
                  </label>
                </div>

                {/* Export */}
                <div className="flex gap-2">
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

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-slate-400 text-sm">إجمالي الإيداعات</div>
                <div className="mt-1 text-2xl font-extrabold text-emerald-300">
                  {fmtNum(totals.credits)} <span className="text-sm text-emerald-400/80">{currency}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-slate-400 text-sm">إجمالي السحوبات</div>
                <div className="mt-1 text-2xl font-extrabold text-rose-300">
                  {fmtNum(totals.debits)} <span className="text-sm text-rose-400/80">{currency}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-slate-400 text-sm">صافي الحركة (المعروض)</div>
                <div className={`mt-1 text-2xl font-extrabold ${totals.net >= 0 ? 'text-fuchsia-300' : 'text-amber-300'}`}>
                  {fmtNum(totals.net)} <span className="text-sm text-slate-400/80">{currency}</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl overflow-hidden">
              <div className="w-full max-w-full overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead className="bg-slate-900/70 border-b border-slate-800 text-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-right w-[72px]">#</th>
                      <th className="px-4 py-3 text-right w-[110px]">النوع</th>
                      <th className="px-4 py-3 text-right w-[150px]">المبلغ</th>
                      <th className="px-4 py-3 text-right w-[140px]">المزاد المرتبط</th>
                      <th className="px-4 py-3 text-right">الوصف</th>
                      <th className="px-4 py-3 text-right w-[200px]">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {loading ? (
                      [...Array(8)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-4 py-3"><div className="h-4 w-10 bg-slate-800/70 rounded" /></td>
                          <td className="px-4 py-3"><div className="h-6 w-16 bg-slate-800/70 rounded-full" /></td>
                          <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-800/70 rounded" /></td>
                          <td className="px-4 py-3"><div className="h-4 w-14 bg-slate-800/70 rounded" /></td>
                          <td className="px-4 py-3"><div className="h-4 w-56 bg-slate-800/70 rounded" /></td>
                          <td className="px-4 py-3"><div className="h-4 w-32 bg-slate-800/70 rounded" /></td>
                        </tr>
                      ))
                    ) : filtered.length ? (
                      filtered.map((t) => {
                        const tType = (t.type || '').toLowerCase();
                        const isDebit = tType === 'debit' || tType === 'withdraw';
                        const amountSar = asSar(t.amount);
                        return (
                          <tr key={t.id} className="hover:bg-slate-900/40">
                            <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{t.id}</td>
                            <td className="px-4 py-3">{badge(t.type)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`font-bold ${isDebit ? 'text-rose-300' : 'text-emerald-300'}`}>
                                {fmtNum(amountSar)} <span className="text-xs text-slate-400">{currency}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                              {t.related_auction ? (
                                <span className="inline-flex items-center gap-1 text-violet-300">
                                  <LinkIcon className="w-3 h-3" />
                                  #{t.related_auction}
                                </span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              {t.description ? (
                                <span className="block truncate max-w-[520px]">{t.description}</span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                              {new Date(t.created_at).toLocaleString('ar-SA')}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="px-4 py-10 text-center text-slate-400" colSpan={6}>
                          لا توجد معاملات مطابقة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Server Pagination */}
              {!loading && paginator && paginator.last_page > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-slate-800 text-sm text-slate-300">
                  <button
                    onClick={handlePrev}
                    disabled={paginator.current_page <= 1}
                    className={`px-3 py-2 rounded-lg border ${
                      paginator.current_page <= 1
                        ? 'border-slate-800 text-slate-500 cursor-not-allowed'
                        : 'border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    السابق
                  </button>
                  <div className="text-slate-400">
                    صفحة <span className="text-slate-200">{paginator.current_page}</span> من{' '}
                    <span className="text-slate-200">{paginator.last_page}</span>
                  </div>
                  <button
                    onClick={handleNext}
                    disabled={paginator.current_page >= paginator.last_page}
                    className={`px-3 py-2 rounded-lg border ${
                      paginator.current_page >= paginator.last_page
                        ? 'border-slate-800 text-slate-500 cursor-not-allowed'
                        : 'border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    التالي
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* FAB (Mobile) لفتح القائمة */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 right-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-4 rounded-full shadow-xl z-50 hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200 flex items-center justify-center"
        style={{ boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.35), 0 4px 6px -4px rgba(0, 0, 0, 0.35)' }}
        aria-label="فتح القائمة"
        title="القائمة"
      >
        <FiMenu size={22} />
      </button>
    </div>
  );
}
