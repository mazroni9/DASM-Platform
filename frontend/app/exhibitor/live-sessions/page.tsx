"use client";

import { useEffect, useMemo, useState } from "react";
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

interface AuctionLite {
  id: number;
  car?: CarLite | null;
  broadcasts?: BroadcastLite[] | null;
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

type UiBroadcast = {
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
  auction_id: number;
  auction?: AuctionLite | null;
};

/** ========= أدوات مساعدة ========= **/
function extractPaged(js: any) {
  // يدعم أشكال استجابة Laravel الشائعة
  const data = js?.data?.data ?? js?.data ?? js;
  const last_page =
    js?.data?.last_page ?? js?.last_page ?? data?.last_page ?? 1;
  const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  return { rows, last_page: Number(last_page || 1) };
}

function parseYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "") || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      return v || null;
    }
  } catch {
    /* ignore */
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

    // الصفحة الأولى لمعرفة عدد الصفحات
    const first = await api.get("/api/my-auctions", {
      params: {
        page: 1,
        per_page: perPage,
        sort_by: "created_at",
        sort_dir: "desc",
      },
    });

    const { rows: firstRows, last_page } = extractPaged(first.data);

    const allAuctions: AuctionLite[] = [...firstRows];

    // باقي الصفحات (لو موجود)
    if (last_page > 1) {
      const jobs = [];
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
              const { rows } = extractPaged(res.data);
              allAuctions.push(...rows);
            })
            .catch(() => {
              /* تجاهل صفحة فاشلة */
            })
        );
      }
      if (jobs.length) await Promise.all(jobs);
    }

    // نفكّ البثوث من كل مزاد ونحوّلها لشكل موحد
    const flattened: UiBroadcast[] = [];
    for (const a of allAuctions) {
      const list = (a?.broadcasts || []) as BroadcastLite[];
      if (Array.isArray(list) && list.length) {
        for (const b of list) {
          flattened.push({
            ...b,
            auction_id: a.id,
            auction: { id: a.id, car: a.car ?? null, broadcasts: null },
          });
        }
      }
    }

    // ترتيب أحدث أولاً
    flattened.sort((x, y) => {
      const t1 =
        new Date(x.scheduled_start_time || x.created_at || 0).getTime() || 0;
      const t2 =
        new Date(y.scheduled_start_time || y.created_at || 0).getTime() || 0;
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
          e?.response?.data?.message || e?.message || "تعذر تحميل الجلسات"
        );
        setBroadcasts([]);
      } finally {
        setLoading(false);
      }
    };
    boot();
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
      }`.toLowerCase();
      return title.includes(q) || desc.includes(q) || carTxt.includes(q);
    });
  }, [broadcasts, search]);

  const liveCount = filtered.filter((b) => b.is_live).length;

  // إيقاف البث (مسموح فقط للمشرفين/الأدمن لأن الروت Admin)
  const stopBroadcast = async () => {
    if (!canModerate) {
      return toast("لا تملك صلاحية إيقاف البث. تواصل مع الإدارة.", { icon: "ℹ️" });
    }
    try {
      const ok = window.confirm("هل تريد إيقاف البث المباشر؟");
      if (!ok) return;
      const res = await api.put("/api/admin/broadcast/status", { is_live: false });
      if (res?.data?.status === "success" || res?.status === 200) {
        toast.success(res?.data?.message || "تم إيقاف البث");
        await refresh();
      } else {
        toast.error(res?.data?.message || "تعذر إيقاف البث");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "فشل إيقاف البث");
    }
  };

  // حذف جلسة بث محددة (مسموح فقط للمشرفين/الأدمن)
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
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* العنوان والشريط العلوي */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600">
                <Video size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold">جلسات البث المباشر</h1>
                <p className="text-slate-400">تعرض فقط البثوث المرتبطة بمزادات سياراتك.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="ابحث بعنوان البث أو السيارة..."
                  className="pl-10 pr-3 py-2 rounded-lg bg-slate-900/70 border border-slate-700 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={refresh}
                className="flex items-center justify-center px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-200 hover:bg-slate-900"
                title="تحديث"
              >
                <RefreshCw className={`ml-2 ${bgLoading ? "animate-spin" : ""}`} />
                {bgLoading ? "جارٍ التحديث..." : "تحديث"}
              </button>
            </div>
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-900/70 p-6 rounded-xl shadow-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">إجمالي جلساتي</p>
                  <p className="text-3xl font-bold text-slate-100">{filtered.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-sky-500/10">
                  <Video className="text-sky-400" />
                </div>
              </div>
            </div>
            <div className="bg-slate-900/70 p-6 rounded-xl shadow-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">مباشر الآن</p>
                  <p className="text-3xl font-bold text-emerald-400">{liveCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <Radio className="text-emerald-400" />
                </div>
              </div>
            </div>
            <div className="bg-slate-900/70 p-6 rounded-xl shadow-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">غير مباشر</p>
                  <p className="text-3xl font-bold text-rose-400">{filtered.length - liveCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10">
                  <Pause className="text-rose-400" />
                </div>
              </div>
            </div>
          </div>

          {/* رسائل الأخطاء */}
          {error && (
            <div className="mb-6 p-4 bg-rose-900/30 border border-rose-700 text-rose-200 rounded-lg whitespace-pre-wrap">
              {error}
            </div>
          )}

          {/* هيكل تحميل */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-56 bg-slate-900/60 border border-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {/* لا توجد جلسات */}
          {!loading && filtered.length === 0 && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl shadow-xl p-12 text-center">
              <div className="text-slate-500 mb-4">
                <AlertTriangle size={48} className="mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-slate-100 mb-2">لا توجد جلسات بث خاصة بك</h3>
              <p className="text-slate-400">عند إنشاء بث لأي مزاد من مزاداتك، سيظهر هنا تلقائيًا.</p>
            </div>
          )}

          {/* الشبكة */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((b, idx) => {
                const embed = toEmbedUrl(b);
                const carTxt = b?.auction?.car
                  ? `${b.auction.car.make || ""} ${b.auction.car.model || ""} ${b.auction.car.year || ""}`.trim()
                  : `#${b.auction_id}`;

                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`rounded-2xl overflow-hidden shadow-2xl border ${
                      b.is_live ? "border-emerald-700/40" : "border-slate-800"
                    } bg-slate-900/70`}
                  >
                    {/* رأس البطاقة */}
                    <div
                      className={`px-5 py-3 flex items-center justify-between ${
                        b.is_live ? "bg-gradient-to-r from-emerald-600/20 to-teal-600/20" : "bg-slate-900/40"
                      } border-b border-slate-800`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            b.is_live ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                          }`}
                        />
                        <span className="text-sm">{b.is_live ? "مباشر الآن" : "غير مباشر"}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {b.scheduled_start_time
                          ? new Date(b.scheduled_start_time).toLocaleString("ar-SA")
                          : b.created_at
                          ? new Date(b.created_at).toLocaleString("ar-SA")
                          : ""}
                      </span>
                    </div>

                    {/* المحتوى */}
                    <div className="p-5 space-y-3">
                      <h3 className="text-lg font-bold text-slate-100">{b.title}</h3>
                      <p className="text-slate-300 text-sm">
                        السيارة: <span className="text-slate-100">{carTxt}</span>
                      </p>
                      {b.description && <p className="text-slate-400 text-sm line-clamp-3">{b.description}</p>}

                      {/* معاينة */}
                      {embed && (
                        <div className="mt-3 aspect-video rounded-lg overflow-hidden border border-slate-800">
                          <iframe
                            width="100%"
                            height="100%"
                            src={`${embed}${b.is_live ? "?autoplay=0" : ""}`}
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
                          className="flex-1 py-2 rounded-lg text-white bg-sky-600 hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
                          title="فتح البث"
                        >
                          <ExternalLink size={16} />
                          فتح البث
                        </button>

                        {b.is_live ? (
                          <button
                            onClick={stopBroadcast}
                            disabled={!canModerate}
                            className={`px-3 py-2 rounded-lg text-white flex items-center gap-2 ${
                              canModerate
                                ? "bg-rose-600 hover:bg-rose-700"
                                : "bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed"
                            }`}
                            title={canModerate ? "إيقاف البث" : "غير متاح — يتطلب صلاحيات مشرف"}
                          >
                            <Pause size={16} />
                            إيقاف
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed flex items-center gap-2"
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
                              ? "bg-slate-900 border border-slate-800 hover:bg-slate-800 text-rose-300 hover:text-rose-200"
                              : "bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed"
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
