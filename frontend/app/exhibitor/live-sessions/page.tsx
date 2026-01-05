"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Header } from "../../../components/exhibitor/Header";
import { Sidebar } from "../../../components/exhibitor/sidebar";
import api from "@/lib/axios";
import {
  Video,
  Radio,
  RefreshCw,
  ExternalLink,
  Pause,
  Trash2,
  Search,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

/** ========= الأنواع ========= **/
interface CarLite {
  id: number;
  make?: string;
  model?: string;
  year?: number;
}

interface BroadcastLite {
  id: number;
  title: string;
  description?: string | null;
  is_live: boolean;
  stream_url?: string | null;
  youtube_embed_url?: string | null;
  youtube_chat_embed_url?: string | null;
  scheduled_start_time?: string | null;
  created_at?: string | null;
  created_by?: number | null;
}

interface AuctionLite {
  id: number;
  car?: CarLite | null;
  broadcasts?: BroadcastLite[] | null;
}

type UiBroadcast = BroadcastLite & {
  auction_id: number;
  auction?: { id: number; car?: CarLite | null } | null;
};

/** ========= أدوات مساعدة: Parsing Response ========= **/
type LaravelPaginator<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  per_page?: number;
  total?: number;
};

/**
 * يدعم أشكال الاستجابة الشائعة في Laravel:
 * - { status, data: { data: [...], last_page } }
 * - { data: { data: [...], last_page } }
 * - { data: [...] }
 * - { ...paginator }
 */
function extractPaged<T = any>(js: any): { rows: T[]; last_page: number } {
  const root = js?.data ?? js;

  // شكل paginator مباشر
  const maybePaginator =
    (root && typeof root === "object" && Array.isArray(root.data) && root.last_page != null
      ? root
      : null) as LaravelPaginator<T> | null;

  if (maybePaginator) {
    return {
      rows: Array.isArray(maybePaginator.data) ? maybePaginator.data : [],
      last_page: Number(maybePaginator.last_page || 1),
    };
  }

  // { data: { data: [...] , last_page } }
  const nested = root?.data;
  if (nested && Array.isArray(nested.data)) {
    return {
      rows: nested.data,
      last_page: Number(nested.last_page || 1),
    };
  }

  // { data: [...] }
  if (Array.isArray(root)) {
    return { rows: root, last_page: 1 };
  }
  if (Array.isArray(root?.data)) {
    return { rows: root.data, last_page: 1 };
  }

  return { rows: [], last_page: 1 };
}

/** ========= تطبيع شكل المزاد/البث (عشان اختلافات الباك) ========= **/
function normalizeCar(raw: any): CarLite | null {
  const c = raw?.car ?? raw?.data?.car ?? raw?.vehicle ?? raw?.data?.vehicle ?? raw ?? null;
  if (!c || typeof c !== "object") return null;

  const id = Number(c.id);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    make: c.make ?? c.brand ?? c.manufacturer ?? "",
    model: c.model ?? c.name ?? "",
    year: c.year != null ? Number(c.year) : undefined,
  };
}

function normalizeBroadcast(raw: any): BroadcastLite | null {
  const b = raw?.broadcast ?? raw?.data?.broadcast ?? raw ?? null;
  if (!b || typeof b !== "object") return null;

  const id = Number(b.id);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    title: String(b.title ?? b.name ?? "بدون عنوان"),
    description: b.description ?? null,
    is_live: Boolean(b.is_live ?? b.live ?? b.status === "live"),
    stream_url: b.stream_url ?? b.youtube_url ?? b.url ?? null,
    youtube_embed_url: b.youtube_embed_url ?? b.embed_url ?? null,
    youtube_chat_embed_url: b.youtube_chat_embed_url ?? b.chat_embed_url ?? null,
    scheduled_start_time: b.scheduled_start_time ?? b.start_time ?? null,
    created_at: b.created_at ?? null,
    created_by: b.created_by != null ? Number(b.created_by) : null,
  };
}

function normalizeAuction(raw: any): AuctionLite | null {
  const a = raw?.auction ?? raw?.data?.auction ?? raw ?? null;
  if (!a || typeof a !== "object") return null;

  const id = Number(a.id);
  if (!Number.isFinite(id)) return null;

  const car = normalizeCar(a);
  const broadcastsRaw =
    a.broadcasts ?? a.data?.broadcasts ?? a.live_broadcasts ?? a.data?.live_broadcasts ?? [];
  const broadcasts = Array.isArray(broadcastsRaw)
    ? broadcastsRaw.map(normalizeBroadcast).filter(Boolean) as BroadcastLite[]
    : [];

  return {
    id,
    car,
    broadcasts,
  };
}

/** ========= YouTube helpers ========= **/
function parseYouTubeId(url?: string | null): string | null {
  if (!url) return null;

  // لو هو embed جاهز
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (embedMatch?.[1]) return embedMatch[1];

  try {
    const u = new URL(url);

    // youtu.be/<id>
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "").trim();
      return id || null;
    }

    // youtube.com/watch?v=<id>
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;

      // /shorts/<id>
      const shorts = u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/);
      if (shorts?.[1]) return shorts[1];

      // /live/<id>
      const live = u.pathname.match(/\/live\/([a-zA-Z0-9_-]{6,})/);
      if (live?.[1]) return live[1];
    }
  } catch {
    // fallback regex
    const m = url.match(/(?:v=|\/shorts\/|\/live\/|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
    if (m?.[1]) return m[1];
  }

  return null;
}

function toEmbedUrl(b: UiBroadcast): string | null {
  if (b.youtube_embed_url) return b.youtube_embed_url;
  const vid = parseYouTubeId(b.stream_url);
  return vid ? `https://www.youtube.com/embed/${vid}` : null;
}

/** ========= الصفحة ========= **/
export default function ExhibitorLiveSessionsPage() {
  const { user } = useAuth();
  const role = (user?.type || "").toString().toLowerCase();
  const canModerate = role === "admin" || role === "moderator";

  const [loading, setLoading] = useState(true);
  const [bgLoading, setBgLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [broadcasts, setBroadcasts] = useState<UiBroadcast[]>([]);
  const [search, setSearch] = useState("");

  /** ===== جلب مزاداتي مع البثوث وتهيئتها لقائمة موحدة ===== **/
  const fetchMyAuctionsBroadcasts = async (): Promise<UiBroadcast[]> => {
    const perPage = 50;

    // 1) first page to get last_page
    const firstRes = await api.get("/api/my-auctions", {
      params: {
        page: 1,
        per_page: perPage,
        sort_by: "created_at",
        sort_dir: "desc",
        // لو الباك بيدعم include/with تقدر تسيبهم أو تشيلهم
        // include: "car,broadcasts",
        // with: "car,broadcasts",
      },
    });

    const { rows: firstRowsRaw, last_page } = extractPaged<any>(firstRes.data);
    const firstRows = firstRowsRaw
      .map(normalizeAuction)
      .filter(Boolean) as AuctionLite[];

    const allAuctions: AuctionLite[] = [...firstRows];

    // 2) باقي الصفحات
    if (last_page > 1) {
      const jobs: Promise<void>[] = [];
      for (let p = 2; p <= last_page; p++) {
        jobs.push(
          api
            .get("/api/my-auctions", {
              params: {
                page: p,
                per_page: perPage,
                sort_by: "created_at",
                sort_dir: "desc",
              },
            })
            .then((res) => {
              const { rows } = extractPaged<any>(res.data);
              const normalized = (rows || [])
                .map(normalizeAuction)
                .filter(Boolean) as AuctionLite[];
              allAuctions.push(...normalized);
            })
            .catch(() => {
              /* تجاهل صفحة فاشلة */
            })
        );
      }
      if (jobs.length) await Promise.all(jobs);
    }

    // 3) flatten broadcasts
    const flattened: UiBroadcast[] = [];
    for (const a of allAuctions) {
      const list = Array.isArray(a?.broadcasts) ? a.broadcasts : [];
      for (const b of list) {
        flattened.push({
          ...b,
          auction_id: a.id,
          auction: { id: a.id, car: a.car ?? null },
        });
      }
    }

    // 4) sort newest first (scheduled_start_time then created_at)
    flattened.sort((x, y) => {
      const t1 = new Date(x.scheduled_start_time || x.created_at || 0).getTime() || 0;
      const t2 = new Date(y.scheduled_start_time || y.created_at || 0).getTime() || 0;
      return t2 - t1;
    });

    return flattened;
  };

  // تحميل أولي
  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchMyAuctionsBroadcasts();
        setBroadcasts(list);
      } catch (e: any) {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "تعذر تحميل الجلسات (تحقق من التوكن/CORS/المسار)"
        );
        setBroadcasts([]);
      } finally {
        setLoading(false);
      }
    };
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async () => {
    setBgLoading(true);
    setError(null);
    try {
      const list = await fetchMyAuctionsBroadcasts();
      setBroadcasts(list);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "تعذر تحديث القائمة");
    } finally {
      setBgLoading(false);
    }
  };

  // بحث بالنص
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return broadcasts;
    return broadcasts.filter((b) => {
      const title = (b.title || "").toLowerCase();
      const desc = (b.description || "").toLowerCase();
      const carTxt = `${b.auction?.car?.make || ""} ${b.auction?.car?.model || ""} ${
        b.auction?.car?.year || ""
      }`
        .trim()
        .toLowerCase();
      return title.includes(q) || desc.includes(q) || carTxt.includes(q);
    });
  }, [broadcasts, search]);

  const liveCount = filtered.filter((b) => b.is_live).length;

  // إيقاف البث (Admin/Moderator)
  const stopBroadcast = async (b?: UiBroadcast) => {
    if (!canModerate) {
      return toast("لا تملك صلاحية إيقاف البث. تواصل مع الإدارة.", { icon: "ℹ️" });
    }
    try {
      const ok = window.confirm("هل تريد إيقاف البث المباشر؟");
      if (!ok) return;

      // بعض الباك-إندز تتطلب broadcast_id، وبعضها لا
      // نجرب بالـ id الأول، لو فشل نجرب بدون id
      try {
        const res = await api.put("/api/admin/broadcast/status", {
          broadcast_id: b?.id,
          is_live: false,
        });
        if (res?.data?.status === "success" || res?.status === 200) {
          toast.success(res?.data?.message || "تم إيقاف البث");
          await refresh();
          return;
        }
      } catch {
        /* fallback below */
      }

      const res2 = await api.put("/api/admin/broadcast/status", { is_live: false });
      if (res2?.data?.status === "success" || res2?.status === 200) {
        toast.success(res2?.data?.message || "تم إيقاف البث");
        await refresh();
      } else {
        toast.error(res2?.data?.message || "تعذر إيقاف البث");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "فشل إيقاف البث");
    }
  };

  // حذف جلسة بث محددة
  const deleteBroadcast = async (b: UiBroadcast) => {
    if (!canModerate) {
      return toast("لا تملك صلاحية حذف البث. تواصل مع الإدارة.", { icon: "ℹ️" });
    }
    try {
      const ok = window.confirm("هل أنت متأكد من حذف هذه الجلسة؟ لا يمكن التراجع.");
      if (!ok) return;

      const res = await api.delete(`/api/admin/broadcast/${b.id}`);
      if (res?.status === 200) {
        toast.success(res?.data?.message || "تم حذف الجلسة");
        await refresh();
      } else {
        toast.error(res?.data?.message || "تعذر حذف الجلسة");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "فشل حذف الجلسة");
    }
  };

  // فتح رابط البث
  const openStream = (b: UiBroadcast) => {
    const url = b.stream_url || b.youtube_embed_url;
    if (!url) return toast("لا يوجد رابط بث متاح", { icon: "ℹ️" });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* العنوان والشريط العلوي */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Video size={22} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
                  جلسات البث المباشر
                </h1>
                <p className="text-muted-foreground">تعرض فقط البثوث المرتبطة بمزادات سياراتك.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="ابحث بعنوان البث أو السيارة..."
                  className="pl-10 pr-3 py-2 rounded-lg bg-background border border-border outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button
                onClick={refresh}
                className="flex items-center justify-center px-4 py-2 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80"
                title="تحديث"
              >
                <RefreshCw className={`ml-2 ${bgLoading ? "animate-spin" : ""}`} />
                {bgLoading ? "جارٍ التحديث..." : "تحديث"}
              </button>
            </div>
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card p-6 rounded-xl shadow-xl border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">إجمالي جلساتي</p>
                  <p className="text-3xl font-bold text-foreground">{filtered.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <Video className="text-primary" />
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-xl border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">مباشر الآن</p>
                  <p className="text-3xl font-bold text-emerald-500">{liveCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <Radio className="text-emerald-500" />
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-xl border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">غير مباشر</p>
                  <p className="text-3xl font-bold text-destructive">
                    {filtered.length - liveCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-destructive/10">
                  <Pause className="text-destructive" />
                </div>
              </div>
            </div>
          </div>

          {/* رسائل الأخطاء */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg whitespace-pre-wrap">
              {error}
            </div>
          )}

          {/* هيكل تحميل */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-56 bg-card border border-border rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {/* لا توجد جلسات */}
          {!loading && filtered.length === 0 && (
            <div className="bg-card border border-border rounded-xl shadow-xl p-12 text-center">
              <div className="text-muted-foreground mb-4">
                <AlertTriangle size={48} className="mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">لا توجد جلسات بث خاصة بك</h3>
              <p className="text-muted-foreground">
                عند إنشاء بث لأي مزاد من مزاداتك، سيظهر هنا تلقائيًا.
              </p>
            </div>
          )}

          {/* الشبكة */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((b, idx) => {
                const embed = toEmbedUrl(b);
                const carTxt = b?.auction?.car
                  ? `${b.auction.car.make || ""} ${b.auction.car.model || ""} ${
                      b.auction.car.year || ""
                    }`.trim()
                  : `#${b.auction_id}`;

                const timeTxt = b.scheduled_start_time
                  ? new Date(b.scheduled_start_time).toLocaleString("ar-SA")
                  : b.created_at
                  ? new Date(b.created_at).toLocaleString("ar-SA")
                  : "";

                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`rounded-2xl overflow-hidden shadow-2xl border ${
                      b.is_live ? "border-emerald-500/40" : "border-border"
                    } bg-card`}
                  >
                    {/* رأس البطاقة */}
                    <div
                      className={`px-5 py-3 flex items-center justify-between ${
                        b.is_live ? "bg-emerald-500/10" : "bg-secondary/40"
                      } border-b border-border`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            b.is_live ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                          }`}
                        />
                        <span className="text-sm">{b.is_live ? "مباشر الآن" : "غير مباشر"}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{timeTxt}</span>
                    </div>

                    {/* المحتوى */}
                    <div className="p-5 space-y-3">
                      <h3 className="text-lg font-bold text-foreground">{b.title}</h3>

                      <p className="text-muted-foreground text-sm">
                        السيارة: <span className="text-foreground">{carTxt}</span>
                      </p>

                      {b.description && (
                        <p className="text-muted-foreground text-sm line-clamp-3">{b.description}</p>
                      )}

                      {/* معاينة */}
                      {embed && (
                        <div className="mt-3 aspect-video rounded-lg overflow-hidden border border-border">
                          <iframe
                            width="100%"
                            height="100%"
                            src={embed}
                            title={b.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}

                      {/* الأزرار */}
                      <div className="pt-3 flex items-center gap-2">
                        <button
                          onClick={() => openStream(b)}
                          className="flex-1 py-2 rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                          title="فتح البث"
                        >
                          <ExternalLink size={16} />
                          فتح البث
                        </button>

                        {b.is_live ? (
                          <button
                            onClick={() => stopBroadcast(b)}
                            disabled={!canModerate}
                            className={`px-3 py-2 rounded-lg text-white flex items-center gap-2 ${
                              canModerate
                                ? "bg-destructive hover:bg-destructive/90"
                                : "bg-muted border border-border text-muted-foreground cursor-not-allowed"
                            }`}
                            title={canModerate ? "إيقاف البث" : "غير متاح — يتطلب صلاحيات مشرف"}
                          >
                            <Pause size={16} />
                            إيقاف
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-2 rounded-lg bg-secondary border border-border text-muted-foreground cursor-not-allowed flex items-center gap-2"
                            title="متوقّف"
                          >
                            <Pause size={16} />
                            متوقّف
                          </button>
                        )}

                        <button
                          onClick={() => deleteBroadcast(b)}
                          disabled={!canModerate}
                          className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
                            canModerate
                              ? "bg-secondary border border-border hover:bg-secondary/80 text-destructive hover:text-destructive/80"
                              : "bg-muted border border-border text-muted-foreground cursor-not-allowed"
                          }`}
                          title={canModerate ? "حذف الجلسة" : "غير متاح — يتطلب صلاحيات مشرف"}
                        >
                          <Trash2 size={16} />
                          حذف
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
