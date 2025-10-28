'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '../../../components/exhibitor/sidebar';
import { FiMenu, FiRefreshCw, FiSearch, FiStar, FiUser } from 'react-icons/fi';
import { FaStar, FaRegStar, FaMedal, FaCheckCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

/** ================== إعدادات الاتصال ================== **/
const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const API_BASE = `${API_ROOT}/api`;
const TOKEN_KEY = 'token';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  return raw.replace(/^"(.+)"$/, '$1');
}

function authHeaders() {
  const token = getToken();
  const h: Record<string, string> = { Accept: 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function fetchJSON<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init?.headers || {}), ...authHeaders() },
  });
  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    const snippet = text?.slice(0, 200) || '';
    throw new Error(`HTTP ${res.status} @ ${url}\nالرد ليس JSON:\n${snippet}`);
  }
  if (!res.ok) {
    if (res.status === 401) throw new Error('غير مصرح: يرجى تسجيل الدخول مرة أخرى (401).');
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

/** ================== أنواع بيانات مرنة ================== **/
type ReviewApi = {
  id?: number | string | null;
  rating: number;
  comment?: string | null;
  created_at?: string | null;
  is_approved?: boolean;
  verified?: boolean;
  user?: { id?: number; name?: string };
  user_name?: string;
  reviewer_name?: string;
};

type Paged<T> = {
  data: T[];
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
};

type SummaryApi = {
  overall?: number;
  count?: number;
  total_reviews?: number;
  stars?: Record<string | number, number>; // {5: n,4:n...}
  platform_rating?: number;
  customer_rating?: number;
};

/** ================== عناصر UI صغيرة ================== **/
function Stars({ value, size = 5, className = '' }: { value: number; size?: number; className?: string }) {
  const rounded = Math.round(value ?? 0);
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: size }).map((_, i) =>
        i < rounded ? <FaStar key={`st-${i}`} className="text-yellow-400" /> : <FaRegStar key={`rst-${i}`} className="text-slate-500" />
      )}
    </div>
  );
}

function Avatar({ name }: { name?: string }) {
  const ch = (name?.trim()?.[0] || '؟').toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 text-white flex items-center justify-center font-bold shadow">
      {ch}
    </div>
  );
}

function numberFmt(n: number | undefined | null, digits = 1) {
  if (n == null || isNaN(n as any)) return '0';
  try {
    return Number(n).toLocaleString('ar-EG', { maximumFractionDigits: digits, minimumFractionDigits: digits });
  } catch {
    return String(n);
  }
}

/** ================== هيدر بسيط داخل الصفحة (بدون أنتل/مكتبات) ================== **/
function TopBar() {
  return (
    <div className="sticky top-0 z-10 bg-slate-950/60 backdrop-blur supports-[backdrop-filter]:bg-slate-950/40 border-b border-slate-800/60">
      <div className="px-4 md:px-6 lg:px-8 h-16 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600" />
          <span className="font-bold text-slate-100">لوحة المعرض</span>
        </div>
      </div>
    </div>
  );
}

/** ================== Helpers ================== **/
function pageNumbers(current: number, last: number, max = 5) {
  if (last <= 0) return [1];
  const half = Math.floor(max / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(last, start + max - 1);
  start = Math.max(1, end - max + 1);
  const arr: number[] = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}

/** ================== الصفحة ================== **/
export default function ExhibitorRatingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // بيانات الملخص
  const [summary, setSummary] = useState<SummaryApi | null>(null);
  const totalReviews = summary?.total_reviews ?? summary?.count ?? 0;
  const overall = summary?.overall ?? 0;

  // قائمة المراجعات
  const [list, setList] = useState<ReviewApi[]>([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // حالة
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [bgLoading, setBgLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // بحث محلي
  const [q, setQ] = useState('');

  useEffect(() => setIsClient(true), []);

  // جلب الملخص
  const loadSummary = async () => {
    setLoadingSummary(true);
    setError(null);
    try {
      const js = await fetchJSON<any>(`${API_BASE}/exhibitor/ratings/summary`);
      const data: SummaryApi = js?.data ?? js ?? {};
      setSummary(data);
    } catch (e: any) {
      setError(e?.message || 'تعذر جلب الملخص');
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  // جلب المراجعات
  const loadReviews = async (p = 1, silent = false) => {
    if (!silent) setLoadingList(true);
    else setBgLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE}/exhibitor/ratings`);
      url.searchParams.set('page', String(p));
      url.searchParams.set('per_page', String(perPage));
      const js = await fetchJSON<any>(url.toString());

      // دعم عدة أشكال ردود (Resource/Paginator)
      const payload: Paged<ReviewApi> =
        js?.data?.data
          ? {
              data: js.data.data,
              current_page: js.data.current_page,
              per_page: js.data.per_page,
              last_page: js.data.last_page,
              total: js.data.total,
            }
          : js?.data?.current_page
          ? js.data
          : js?.current_page
          ? js
          : {
              data: js?.data ?? js ?? [],
              current_page: p,
              per_page: perPage,
              last_page: 1,
              total: (js?.data ?? js ?? [])?.length ?? 0,
            };

      setList(Array.isArray(payload.data) ? payload.data : []);
      setPage(payload.current_page || p);
      setLastPage(payload.last_page || 1);
      setTotal(payload.total || 0);
    } catch (e: any) {
      setError(e?.message || 'تعذر جلب المراجعات');
      setList([]);
    } finally {
      if (!silent) setLoadingList(false);
      else setBgLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    loadReviews(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // فلترة محلية
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((r) => {
      const name = r.user?.name || r.user_name || r.reviewer_name || '';
      const body = r.comment || '';
      return name.toLowerCase().includes(term) || body.toLowerCase().includes(term);
    });
  }, [list, q]);

  // توزيع النجوم مهيأ
  const starDist = useMemo(() => {
    const src = summary?.stars || {};
    const map = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
    Object.entries(src).forEach(([k, v]) => {
      const key = Number(k);
      if (map[key as 1 | 2 | 3 | 4 | 5] != null) map[key] = Number(v || 0);
    });
    return map;
  }, [summary]);

  // نسبة العرض لكل شريط
  const starBarPct = (n: number) => {
    const base = totalReviews || 1;
    return Math.round(((n || 0) / base) * 100);
  };

  // منع العرض حتى يبدأ الكلاينت (DOM)
  if (!isClient) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <div className="hidden md:block w-72 bg-slate-900 animate-pulse"></div>
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-slate-900 animate-pulse"></div>
          <main className="p-6 flex-1 bg-slate-950"></main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-[#090914] relative text-slate-100">
      {/* الشريط الجانبي - ديسكتوب */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* الشريط الجانبي - موبايل (Drawer) */}
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
            <motion.div className="relative w-72 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 shadow-2xl">
              <Sidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex flex-col w-0">
        <TopBar />

        <main className="p-4 md:p-6 lg:p-8 flex-1 overflow-auto">
          {/* شريط علوي: عنوان + بحث + تحديث */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-2xl md:text-3xl font-extrabold tracking-tight"
              >
                تقييمات المعرض
              </motion.h1>
              <p className="text-slate-400 mt-1">راجع آراء العملاء وملخص الأداء العام.</p>
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FiSearch className="text-slate-500" />
                </div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="ابحث بالاسم أو التعليق..."
                  className="w-64 md:w-72 pl-4 pr-10 py-2.5 rounded-xl bg-slate-900/70 border border-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-500"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  loadSummary();
                  loadReviews(page, true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:bg-slate-900 transition-colors"
                title="تحديث"
              >
                <FiRefreshCw className={`${bgLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{bgLoading ? 'جارٍ التحديث...' : 'تحديث'}</span>
              </motion.button>

              {/* زر القائمة للجوال */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden bg-gradient-to-r from-indigo-600 to-fuchsia-500 text-white px-4 rounded-xl shadow-lg hover:from-indigo-700 hover:to-fuchsia-600 transition-all"
                aria-label="فتح القائمة"
              >
                <FiMenu size={20} />
              </button>
            </div>
          </div>

          {/* Cards: الملخص + التوزيع */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* بطاقة المتوسط */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-400 mb-1">المتوسط العام</div>
                  <div className="flex items-center gap-3">
                    <div className="text-4xl font-extrabold text-yellow-300">
                      {loadingSummary ? '—' : numberFmt(overall, 1)}
                    </div>
                    {!loadingSummary && <Stars value={overall} className="text-xl" />}
                  </div>
                </div>
                <FaMedal className="text-yellow-400 text-3xl" />
              </div>
              <div className="mt-4 text-slate-400 text-sm">
                {loadingSummary ? (
                  <div className="h-4 w-40 rounded bg-slate-800 animate-pulse" />
                ) : (
                  <>مبني على {totalReviews} مراجعة</>
                )}
              </div>
            </motion.div>

            {/* بطاقة التوزيع */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-sm lg:col-span-2"
            >
              <div className="text-sm text-slate-400 mb-3">توزيع النجوم</div>
              {loadingSummary ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={`sk-dist-${i}`} className="h-4 w-full rounded bg-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = starDist[star] || 0;
                    const pct = starBarPct(count);
                    return (
                      <div key={`sd-${star}`} className="flex items-center gap-3">
                        <div className="w-10 shrink-0 text-sm text-slate-300 flex items-center gap-1">
                          <FiStar className="text-yellow-400" />
                          <span>{star}</span>
                        </div>
                        <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="w-16 text-right text-sm text-slate-400">{count}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* قائمة المراجعات */}
          <section className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">آراء العملاء</h2>
              <div className="text-sm text-slate-400">
                صفحة <span className="text-slate-200 font-semibold">{page}</span> من{' '}
                <span className="text-slate-200 font-semibold">{lastPage}</span> — إجمالي{' '}
                <span className="text-slate-200 font-semibold">{total}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-900/40 border border-rose-700 text-rose-100 text-sm">
                {error}
              </div>
            )}

            {loadingList ? (
              <div className="grid md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={`sk-item-${i}`} className="rounded-xl p-5 bg-slate-900/60 border border-slate-800 animate-pulse h-28" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-slate-400 text-sm py-12 text-center">لا توجد مراجعات مطابقة.</div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  {filtered.map((r, idx) => {
                    const name = r.user?.name || r.user_name || r.reviewer_name || 'مستخدم';
                    const created = r.created_at
                      ? format(new Date(r.created_at), 'd MMM yyyy, h:mm a', { locale: ar })
                      : '';
                    const verified = r.verified === true;
                    const key = `rev-${String(r.id ?? 'x')}-${String(r.created_at ?? '')}-${idx}`;

                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl p-5 bg-slate-900/60 border border-slate-800 hover:border-indigo-700/50 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar name={name} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-100 truncate">{name}</span>
                              {verified && (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                                  <FaCheckCircle /> مُعتمَد
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Stars value={r.rating || 0} />
                              <span className="text-xs text-slate-400">{numberFmt(r.rating, 1)}</span>
                            </div>
                            {r.comment && <p className="mt-2 text-sm text-slate-300 leading-6">{r.comment}</p>}
                            <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                              <FiUser /> <span>{created}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* ترقيم صفحات */}
                {lastPage > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        const p = Math.max(1, page - 1);
                        if (p !== page) {
                          setPage(p);
                          loadReviews(p, false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-800 hover:bg-slate-900 disabled:opacity-50"
                      disabled={page === 1}
                    >
                      السابق
                    </button>

                    {pageNumbers(page, lastPage, 5).map((n) => {
                      const active = n === page;
                      return (
                        <button
                          key={`p-${n}`}
                          onClick={() => {
                            if (n !== page) {
                              setPage(n);
                              loadReviews(n, false);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className={`w-10 h-10 rounded-xl border ${
                            active
                              ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white border-transparent'
                              : 'bg-slate-900/70 border-slate-800 hover:bg-slate-900'
                          }`}
                        >
                          {n}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => {
                        const p = Math.min(lastPage, page + 1);
                        if (p !== page) {
                          setPage(p);
                          loadReviews(p, false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-800 hover:bg-slate-900 disabled:opacity-50"
                      disabled={page === lastPage}
                    >
                      التالي
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
