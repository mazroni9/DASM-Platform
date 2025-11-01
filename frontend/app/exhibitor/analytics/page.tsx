'use client';

import { useEffect, useMemo, useState } from 'react';
import { Header } from '../../../components/exhibitor/Header';
import { Sidebar } from '../../../components/exhibitor/sidebar';
import { FiMenu, FiRefreshCw, FiTrendingUp, FiActivity, FiDollarSign, FiStar, FiPackage, FiBarChart2 } from 'react-icons/fi';
import { BsCarFront } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';

// recharts
import {
  ResponsiveContainer,
  AreaChart, Area,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

// =============== Helpers ===============
const nf = new Intl.NumberFormat('ar-EG');
const sar = new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 });
const fmtDate = (s: string) => new Date(s).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });

const daysAR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

// Skeleton block
function Skel({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-800/40 ${className}`} />;
}

// Small KPI card
function KpiCard({
  icon, label, value, sub,
}: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 p-4 shadow-lg"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-700/60">{icon}</div>
        <div className="flex-1">
          <div className="text-slate-300 text-xs">{label}</div>
          <div className="text-slate-100 font-extrabold text-xl">{value}</div>
          {sub && <div className="text-slate-400 text-xs mt-0.5">{sub}</div>}
        </div>
      </div>
    </motion.div>
  );
}

// =============== Page ===============
export default function ExhibitorDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<any | null>(null);
  const [seriesCars, setSeriesCars] = useState<any[]>([]);
  const [seriesAuctions, setSeriesAuctions] = useState<any[]>([]);
  const [seriesBids, setSeriesBids] = useState<any[]>([]);
  const [topModels, setTopModels] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]); // [{dow,hr,cnt}]

  // ensure client (hydrate fix)
  useEffect(() => { setIsClient(true); }, []);

  const fetchAll = async () => {
    setError(null);
    const run = async () => {
      const [ov, sCars, sAucs, sBids, tops, heat] = await Promise.all([
        api.get('/api/exhibitor/analytics/overview').then(r => r.data?.data),
        api.get('/api/exhibitor/analytics/timeseries', { params: { kind: 'cars', days: 30 } }).then(r => r.data?.data?.series ?? []),
        api.get('/api/exhibitor/analytics/timeseries', { params: { kind: 'auctions', days: 30 } }).then(r => r.data?.data?.series ?? []),
        api.get('/api/exhibitor/analytics/timeseries', { params: { kind: 'bids', days: 30 } }).then(r => r.data?.data?.series ?? []),
        api.get('/api/exhibitor/analytics/top-models', { params: { limit: 8 } }).then(r => r.data?.data ?? []),
        api.get('/api/exhibitor/analytics/bids-heatmap').then(r => r.data?.data ?? []),
      ]);
      setOverview(ov);
      setSeriesCars(sCars);
      setSeriesAuctions(sAucs);
      setSeriesBids(sBids);
      setTopModels(tops);
      setHeatmap(heat);
    };

    if (!overview) {
      setLoading(true);
      try { await run(); } catch (e: any) {
        setError(e?.response?.data?.message || 'فشل تحميل البيانات');
      } finally { setLoading(false); }
    } else {
      setRefreshing(true);
      try { await run(); } catch (e: any) {
        setError(e?.response?.data?.message || 'فشل تحديث البيانات');
      } finally { setRefreshing(false); }
    }
  };

  useEffect(() => { if (isClient) fetchAll(); /* eslint-disable-next-line */ }, [isClient]);

  // Heatmap matrix 7x24
  const heatMapMatrix = useMemo(() => {
    // dow: 0..6 (نفترض 0 الأحد كما أرسلناه من الباك)
    const map = new Map<string, number>();
    let max = 1;
    for (const r of heatmap) {
      const key = `${r.dow}-${r.hr}`;
      map.set(key, r.cnt);
      if (r.cnt > max) max = r.cnt;
    }
    return { map, max };
  }, [heatmap]);

  // Loading (first paint)
  if (!isClient) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <div className="hidden md:block w-72 bg-slate-900 animate-pulse" />
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-slate-900 animate-pulse" />
          <main className="p-6 flex-1 bg-slate-950" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 relative" dir="rtl">
      {/* Sidebar (desktop) */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar Drawer (mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-40 md:hidden flex"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.div className="relative w-72 bg-gradient-to-b from-slate-900 via-indigo-900 to-indigo-950 shadow-2xl">
              <Sidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col w-0">
        <Header />

        <main className="p-4 md:p-6 flex-1 overflow-auto">
          {/* Header row: Title + Refresh */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">تحليلات المعرض</h1>
              <p className="text-slate-400 text-sm mt-1">لوحة مؤشرات تفاعلية لأداء سياراتك ومزاداتك</p>
            </div>
            <button
              onClick={fetchAll}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 transition"
              disabled={refreshing}
            >
              <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'يُحدِّث...' : 'تحديث'}
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-700/50 bg-red-900/20 text-red-200 px-4 py-3">
              {error}
            </div>
          )}

          {/* KPIs */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {loading ? (
              <>
                <Skel className="h-24" /><Skel className="h-24" />
                <Skel className="h-24" /><Skel className="h-24" />
              </>
            ) : overview ? (
              <>
                <KpiCard
                  icon={<BsCarFront size={20} />}
                  label="إجمالي السيارات"
                  value={nf.format(overview.kpis.total_cars || 0)}
                />
                <KpiCard
                  icon={<FiActivity size={20} />}
                  label="مزادات نشطة"
                  value={nf.format(overview.kpis.active_auctions || 0)}
                />
                <KpiCard
                  icon={<FiTrendingUp size={20} />}
                  label="مزادات منتهية"
                  value={nf.format(overview.kpis.finished_auctions || 0)}
                />
                <KpiCard
                  icon={<FiDollarSign size={20} />}
                  label="متوسط السعر الختامي"
                  value={sar.format(overview.kpis.avg_final_price || 0)}
                />
              </>
            ) : null}
          </section>

          {/* Secondary KPIs */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {loading ? (
              <>
                <Skel className="h-24" /><Skel className="h-24" /><Skel className="h-24" />
              </>
            ) : overview ? (
              <>
                <KpiCard
                  icon={<FiBarChart2 size={20} />}
                  label="إجمالي المزايدات"
                  value={nf.format(overview.kpis.bids_count || 0)}
                />
                <KpiCard
                  icon={<FiDollarSign size={20} />}
                  label="إجمالي عمليات/عمولات"
                  value={sar.format(overview.kpis.commission_sum || 0)}
                />
                <KpiCard
                  icon={<FiStar size={20} />}
                  label="متوسط التقييم"
                  value={overview.kpis.ratings_avg != null ? String(overview.kpis.ratings_avg) : '—'}
                  sub={overview.kpis.ratings_count ? `${nf.format(overview.kpis.ratings_count)} مراجعة` : undefined}
                />
              </>
            ) : null}
          </section>

          {/* Charts grid */}
          <section className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
            {/* Cars timeseries */}
            <div className="2xl:col-span-1 rounded-2xl p-4 bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">السيارات المُضافة (30 يوم)</h3>
              </div>
              {loading ? (
                <Skel className="h-64" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={seriesCars}>
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#94a3b8" />
                      <YAxis allowDecimals={false} stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 12 }}
                        labelFormatter={(v: any) => `التاريخ: ${fmtDate(v)}`}
                        formatter={(v: any) => [v, 'عدد']}
                      />
                      <Area type="monotone" dataKey="value" stroke="#22d3ee" fill="url(#g1)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Auctions timeseries */}
            <div className="2xl:col-span-1 rounded-2xl p-4 bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">المزادات المنشأة (30 يوم)</h3>
              </div>
              {loading ? (
                <Skel className="h-64" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={seriesAuctions}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#94a3b8" />
                      <YAxis allowDecimals={false} stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 12 }}
                        labelFormatter={(v: any) => `التاريخ: ${fmtDate(v)}`}
                        formatter={(v: any) => [v, 'عدد']}
                      />
                      <Line type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Bids timeseries */}
            <div className="2xl:col-span-1 rounded-2xl p-4 bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">عدد المزايدات (30 يوم)</h3>
              </div>
              {loading ? (
                <Skel className="h-64" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={seriesBids}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#94a3b8" />
                      <YAxis allowDecimals={false} stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 12 }}
                        labelFormatter={(v: any) => `التاريخ: ${fmtDate(v)}`}
                        formatter={(v: any) => [v, 'عدد']}
                      />
                      <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Top models */}
            <div className="2xl:col-span-2 rounded-2xl p-4 bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">أكثر الموديلات تكرارًا</h3>
              </div>
              {loading ? (
                <Skel className="h-56" />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {topModels.length === 0 && (
                    <div className="text-slate-400">لا توجد بيانات حتى الآن.</div>
                  )}
                  {topModels.map((m, i) => (
                    <div key={`${m.make}-${m.model}-${i}`} className="rounded-xl border border-slate-800 bg-slate-800/40 p-4">
                      <div className="text-slate-300 text-xs mb-1">الماركة / الموديل</div>
                      <div className="font-extrabold">{m.make} {m.model}</div>
                      <div className="mt-1 text-slate-400 text-sm">
                        عدد: <span className="font-bold text-slate-200">{nf.format(m.cnt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bids heatmap */}
            <div className="rounded-2xl p-4 bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">كثافة المزايدات (حسب اليوم/الساعة)</h3>
              </div>
              {loading ? (
                <Skel className="h-72" />
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[720px]">
                    <div className="grid grid-cols-[80px_repeat(24,minmax(16px,1fr))] gap-1">
                      {/* header hours */}
                      <div />
                      {Array.from({ length: 24 }).map((_, hr) => (
                        <div key={`h-${hr}`} className="text-center text-xs text-slate-400">{hr}</div>
                      ))}
                      {/* rows */}
                      {Array.from({ length: 7 }).map((_, dow) => (
                        <div key={`r-${dow}`} className="contents">
                          <div className="text-xs text-slate-300 pr-2">{daysAR[dow]}</div>
                          {Array.from({ length: 24 }).map((__, hr) => {
                            const k = `${dow}-${hr}`;
                            const cnt = heatMapMatrix.map.get(k) ?? 0;
                            const ratio = heatMapMatrix.max ? cnt / heatMapMatrix.max : 0;
                            const bg = `rgba(59,130,246,${0.1 + ratio * 0.9})`; // blue with alpha
                            return (
                              <div
                                key={`c-${dow}-${hr}`}
                                title={`اليوم: ${daysAR[dow]}، الساعة: ${hr}:00 — ${cnt} مزايدة`}
                                className="h-6 rounded-sm transition-transform hover:scale-[1.08] border border-slate-800"
                                style={{ background: cnt ? bg : 'rgba(30,41,59,0.8)' }}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Recent cars list */}
          <section className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">أحدث السيارات</h3>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-800">
              {loading ? (
                <Skel className="h-40" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-slate-900/40">
                    <thead>
                      <tr className="bg-slate-900">
                        <th className="px-4 py-3 text-right text-slate-300 text-xs font-bold">#</th>
                        <th className="px-4 py-3 text-right text-slate-300 text-xs font-bold">السيارة</th>
                        <th className="px-4 py-3 text-right text-slate-300 text-xs font-bold">السنة</th>
                        <th className="px-4 py-3 text-right text-slate-300 text-xs font-bold">سعر التقييم</th>
                        <th className="px-4 py-3 text-right text-slate-300 text-xs font-bold">حالة المزاد</th>
                        <th className="px-4 py-3 text-right text-slate-300 text-xs font-bold">أضيفت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(overview?.lists?.recent_cars ?? []).map((c: any, idx: number) => (
                        <tr key={c.id} className="border-t border-slate-800/80 hover:bg-slate-800/40">
                          <td className="px-4 py-3 text-slate-300">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
                                <BsCarFront />
                              </div>
                              <div className="font-semibold">{c.make} {c.model}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{c.year ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-300">{c.evaluation_price != null ? sar.format(c.evaluation_price) : '—'}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-200">
                              {c.auction_status ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-sm">{c.created_at ? new Date(c.created_at).toLocaleDateString('ar-EG') : '—'}</td>
                        </tr>
                      ))}
                      {(!overview?.lists?.recent_cars || overview.lists.recent_cars.length === 0) && (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-slate-400">لا توجد سيارات حديثة.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 left-6 bg-gradient-to-r from-indigo-600 to-fuchsia-500 text-white p-4 rounded-full shadow-xl z-30 hover:from-indigo-700 hover:to-fuchsia-600 transition-all duration-200 flex items-center justify-center"
        style={{ boxShadow: '0 10px 15px -3px rgba(147, 51, 234, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)' }}
        aria-label="فتح القائمة"
      >
        <FiMenu size={24} />
      </button>
    </div>
  );
}
