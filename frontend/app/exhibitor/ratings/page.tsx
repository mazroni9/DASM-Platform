"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../../../components/exhibitor/sidebar";
import { FiMenu, FiRefreshCw, FiSearch, FiStar, FiClock } from "react-icons/fi";
import { FaStar, FaRegStar, FaMedal, FaCheckCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

/** ================== إعدادات الاتصال ================== **/
const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");
const API_BASE = `${API_ROOT}/api`;
const TOKEN_KEY = "token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  return raw.replace(/^"(.+)"$/, "$1");
}

function authHeaders() {
  const token = getToken();
  const h: Record<string, string> = { Accept: "application/json" };
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
    const snippet = text?.slice(0, 200) || "";
    throw new Error(`HTTP ${res.status} @ ${url}\nالرد ليس JSON:\n${snippet}`);
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("غير مصرح: يرجى تسجيل الدخول مرة أخرى (401).");
    }
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

/** ================== أنواع بيانات ================== **/
type ReviewApi = {
  id?: number | string | null;
  rating?: number | string | null;
  comment?: string | null;
  created_at?: string | null;
  verified?: boolean | null;
  user?: { id?: number; name?: string };
  user_name?: string | null;
  reviewer_name?: string | null;
};

type Paged<T> = {
  data: T[];
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
};

type SummaryState = {
  overall: number;
  platform: number;
  customer: number;
  totalReviews: number;
  counts: Record<string, number>; // keys "1".."5"
};

/** ================== UI helpers ================== **/
function Stars({
  value,
  size = 5,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const v = Number(value || 0);
  const rounded = Math.round(v);
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: size }).map((_, i) =>
        i < rounded ? (
          <FaStar key={`st-${i}`} className="text-amber-500" />
        ) : (
          <FaRegStar key={`rst-${i}`} className="text-muted-foreground" />
        )
      )}
    </div>
  );
}

function Avatar({ name }: { name?: string }) {
  const ch = (name?.trim()?.[0] || "؟").toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow">
      {ch}
    </div>
  );
}

function numberFmt(n: number | undefined | null, digits = 1) {
  const x = Number(n ?? 0);
  if (Number.isNaN(x)) return "0";
  try {
    return x.toLocaleString("ar-EG", {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    });
  } catch {
    return String(x);
  }
}

function safeFormatDate(iso?: string | null) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return format(d, "d MMM yyyy, h:mm a", { locale: ar });
  } catch {
    return "";
  }
}

/** ================== هيدر بسيط داخل الصفحة ================== **/
function TopBar() {
  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="px-4 md:px-6 lg:px-8 h-16 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary" />
          <span className="font-bold text-foreground">لوحة المعرض</span>
        </div>
      </div>
    </div>
  );
}

/** ================== Normalizers (أهم جزء للربط الصح) ================== **/
function normalizeCounts(raw: any): Record<string, number> {
  const out: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

  const src =
    raw?.counts ||
    raw?.distribution ||
    raw?.stars ||
    raw?.data?.counts ||
    raw?.data?.distribution ||
    raw?.data?.stars ||
    {};

  Object.entries(src || {}).forEach(([k, v]) => {
    const key = String(k);
    if (out[key] != null) out[key] = Number(v || 0);
  });

  return out;
}

function sumCounts(counts: Record<string, number>) {
  return Object.values(counts).reduce((a, b) => a + Number(b || 0), 0);
}

function normalizeSummaryFromSummaryEndpoint(js: any): SummaryState {
  const payload = js?.data ?? js ?? {};

  const counts = normalizeCounts(payload);

  const overall = Number(payload?.overall ?? 0);
  const platform = Number(payload?.platform ?? payload?.platform_rating ?? 0);
  const customer = Number(payload?.customer ?? payload?.customer_rating ?? 0);

  const totalReviews =
    Number(payload?.totalReviews ?? payload?.total_reviews ?? payload?.count ?? 0) ||
    sumCounts(counts);

  return {
    overall: Number.isFinite(overall) ? overall : 0,
    platform: Number.isFinite(platform) ? platform : 0,
    customer: Number.isFinite(customer) ? customer : 0,
    totalReviews: Number.isFinite(totalReviews) ? totalReviews : sumCounts(counts),
    counts,
  };
}

function normalizeListResponse(js: any): { reviews: Paged<ReviewApi>; summary?: SummaryState } {
  // الشكل الحقيقي عندك: { success:true, data:{ ... , reviews: paginator } }
  const data = js?.data ?? js ?? {};
  const pag = data?.reviews ?? data?.data ?? js?.data ?? js ?? null;

  const reviews: Paged<ReviewApi> =
    pag?.data && Array.isArray(pag.data)
      ? {
          data: pag.data,
          current_page: Number(pag.current_page ?? 1),
          per_page: Number(pag.per_page ?? 10),
          last_page: Number(pag.last_page ?? 1),
          total: Number(pag.total ?? pag.data.length ?? 0),
        }
      : {
          data: Array.isArray(pag) ? pag : [],
          current_page: 1,
          per_page: 10,
          last_page: 1,
          total: Array.isArray(pag) ? pag.length : 0,
        };

  // لو الاندبوينت بيرجع كمان ملخص في نفس الرد (وده عندك فعلاً)
  const counts = normalizeCounts(data);
  const overall = Number(data?.overall ?? 0);
  const platform = Number(data?.platform ?? data?.platform_rating ?? 0);
  const customer = Number(data?.customer ?? data?.customer_rating ?? 0);

  const computedSummary: SummaryState = {
    overall: Number.isFinite(overall) ? overall : 0,
    platform: Number.isFinite(platform) ? platform : 0,
    customer: Number.isFinite(customer) ? customer : 0,
    totalReviews: Number.isFinite(reviews.total) ? reviews.total : sumCounts(counts),
    counts,
  };

  // لو مفيش أي بيانات ملخص رجّع undefined
  const hasAny =
    computedSummary.overall ||
    computedSummary.platform ||
    computedSummary.customer ||
    sumCounts(computedSummary.counts) > 0;

  return { reviews, summary: hasAny ? computedSummary : undefined };
}

/** ================== الصفحة ================== **/
export default function ExhibitorRatingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Summary
  const [summary, setSummary] = useState<SummaryState | null>(null);

  // List
  const [list, setList] = useState<ReviewApi[]>([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // state
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [bgLoading, setBgLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // local search
  const [q, setQ] = useState("");

  useEffect(() => setIsClient(true), []);

  const overall = summary?.overall ?? 0;
  const totalReviews = summary?.totalReviews ?? total ?? 0;

  // جلب الملخص
  const loadSummary = async () => {
    setLoadingSummary(true);
    setError(null);
    try {
      const js = await fetchJSON<any>(`${API_BASE}/exhibitor/ratings/summary`);
      const s = normalizeSummaryFromSummaryEndpoint(js);
      setSummary(s);
    } catch (e: any) {
      setError(e?.message || "تعذر جلب الملخص");
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
      url.searchParams.set("page", String(p));
      url.searchParams.set("per_page", String(perPage));

      const js = await fetchJSON<any>(url.toString());

      const { reviews, summary: s2 } = normalizeListResponse(js);

      setList(Array.isArray(reviews.data) ? reviews.data : []);
      setPage(reviews.current_page || p);
      setLastPage(reviews.last_page || 1);
      setTotal(reviews.total || 0);

      // ✅ مزامنة الملخص من نفس الرد لو موجود
      if (s2) setSummary((prev) => ({ ...(prev ?? s2), ...s2 }));
    } catch (e: any) {
      setError(e?.message || "تعذر جلب المراجعات");
      setList([]);
      setTotal(0);
      setLastPage(1);
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
      const name = r.user?.name || r.user_name || r.reviewer_name || "";
      const body = r.comment || "";
      return (
        name.toLowerCase().includes(term) || body.toLowerCase().includes(term)
      );
    });
  }, [list, q]);

  // توزيع النجوم (من counts)
  const starDist = useMemo(() => {
    const counts = summary?.counts ?? { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    return {
      5: Number(counts["5"] || 0),
      4: Number(counts["4"] || 0),
      3: Number(counts["3"] || 0),
      2: Number(counts["2"] || 0),
      1: Number(counts["1"] || 0),
    } as Record<number, number>;
  }, [summary]);

  const starBarPct = (n: number) => {
    const base = totalReviews || 1;
    return Math.round(((n || 0) / base) * 100);
  };

  const pageNumbers = (currentPage: number, last: number, maxPages: number) => {
    const delta = Math.floor(maxPages / 2);
    let start = currentPage - delta;
    let end = currentPage + delta;

    if (start < 1) {
      end += 1 - start;
      start = 1;
    }
    if (end > last) {
      start -= end - last;
      end = last;
    }
    start = Math.max(1, start);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  if (!isClient) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="hidden md:block w-72 bg-card border-r border-border animate-pulse" />
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-card border-b border-border animate-pulse" />
          <main className="p-6 flex-1 bg-background" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground relative">
      {/* Sidebar desktop */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Drawer mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-40 md:hidden flex"
          >
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="إغلاق القائمة"
            />
            <motion.div className="relative w-72 h-full">
              <Sidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col w-0">
        <TopBar />

        <main className="p-4 md:p-6 lg:p-8 flex-1 overflow-auto">
          {/* Header */}
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
              <p className="text-muted-foreground mt-1">
                راجع آراء العملاء وملخص الأداء العام.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FiSearch className="text-muted-foreground" />
                </div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="ابحث بالاسم أو التعليق..."
                  className="w-64 md:w-72 pl-4 pr-10 py-2.5 rounded-xl bg-card border border-border outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground text-foreground"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  loadSummary();
                  loadReviews(page, true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border hover:bg-muted transition-colors text-foreground"
                title="تحديث"
              >
                <FiRefreshCw className={`${bgLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">
                  {bgLoading ? "جارٍ التحديث..." : "تحديث"}
                </span>
              </motion.button>

              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden bg-primary text-primary-foreground px-4 rounded-xl shadow-lg hover:bg-primary/90 transition-all"
                aria-label="فتح القائمة"
              >
                <FiMenu size={20} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6 bg-card border border-border shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    المتوسط العام
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-4xl font-extrabold text-amber-500">
                      {loadingSummary ? "—" : numberFmt(overall, 1)}
                    </div>
                    {!loadingSummary && <Stars value={overall} className="text-xl" />}
                  </div>
                </div>
                <FaMedal className="text-amber-500 text-3xl" />
              </div>
              <div className="mt-4 text-muted-foreground text-sm">
                {loadingSummary ? (
                  <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                ) : (
                  <>مبني على {totalReviews} مراجعة</>
                )}
              </div>

              {/* (اختياري) عرض تقييم المنصة/العملاء */}
              {!loadingSummary && summary && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="text-muted-foreground text-xs">تقييم العملاء</div>
                    <div className="font-semibold">{numberFmt(summary.customer, 1)}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="text-muted-foreground text-xs">تقييم المنصة</div>
                    <div className="font-semibold">{numberFmt(summary.platform, 1)}</div>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6 bg-card border border-border shadow-sm lg:col-span-2"
            >
              <div className="text-sm text-muted-foreground mb-3">
                توزيع النجوم
              </div>

              {loadingSummary ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={`sk-dist-${i}`}
                      className="h-4 w-full rounded bg-muted animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = starDist[star] || 0;
                    const pct = starBarPct(count);
                    return (
                      <div key={`sd-${star}`} className="flex items-center gap-3">
                        <div className="w-10 shrink-0 text-sm text-muted-foreground flex items-center gap-1">
                          <FiStar className="text-amber-500" />
                          <span>{star}</span>
                        </div>
                        <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="w-16 text-right text-sm text-muted-foreground">
                          {count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Reviews list */}
          <section className="rounded-2xl p-6 bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">آراء العملاء</h2>
              <div className="text-sm text-muted-foreground">
                صفحة{" "}
                <span className="text-foreground font-semibold">{page}</span> من{" "}
                <span className="text-foreground font-semibold">{lastPage}</span>{" "}
                — إجمالي{" "}
                <span className="text-foreground font-semibold">{total}</span>
              </div>
            </div>

            {loadingList ? (
              <div className="grid md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`sk-item-${i}`}
                    className="rounded-xl p-5 bg-card border border-border animate-pulse h-28"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-muted-foreground text-sm py-12 text-center">
                لا توجد مراجعات مطابقة.
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  {filtered.map((r, idx) => {
                    const name =
                      r.user?.name ||
                      r.user_name ||
                      r.reviewer_name ||
                      "مستخدم";

                    const created = safeFormatDate(r.created_at);
                    const rating = Number(r.rating ?? 0) || 0;
                    const verified = r.verified === true;

                    const key = `rev-${String(r.id ?? "x")}-${String(
                      r.created_at ?? ""
                    )}-${idx}`;

                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl p-5 bg-background border border-border hover:border-primary/50 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar name={name} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground truncate">
                                {name}
                              </span>
                              {verified && (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
                                  <FaCheckCircle /> مُعتمَد
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <Stars value={rating} />
                              <span className="text-xs text-muted-foreground">
                                {numberFmt(rating, 1)}
                              </span>
                            </div>

                            {r.comment && (
                              <p className="mt-2 text-sm text-foreground leading-6">
                                {r.comment}
                              </p>
                            )}

                            {!!created && (
                              <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                                <FiClock />
                                <span>{created}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {lastPage > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        const p = Math.max(1, page - 1);
                        if (p !== page) {
                          setPage(p);
                          loadReviews(p, false);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-card border border-border hover:bg-muted disabled:opacity-50 text-foreground"
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
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }
                          }}
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                            active
                              ? "bg-primary text-primary-foreground border-transparent"
                              : "bg-card border-border hover:bg-muted text-foreground"
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
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-card border border-border hover:bg-muted disabled:opacity-50 text-foreground"
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
