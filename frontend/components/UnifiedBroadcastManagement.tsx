// src/components/UnifiedBroadcastManagement.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import {
  Video,
  Play,
  Pause,
  Users,
  Eye,
  Car as CarIcon,
  Search,
  RefreshCw,
  Link as LinkIcon,
} from "lucide-react";

// ===== Types =====
type Role = "admin" | "moderator";

type CarBrief = {
  make: string;
  model: string;
  year: number;
  condition?: string;
  evaluation_price?: number;
};

type AuctionOption = {
  id: number;
  car: CarBrief;
  broadcasts?: any[];
  title?: string; // احتياط لو رجع العنوان
};

type BroadcastItem = {
  id: number;
  title?: string;
  description?: string | null;
  stream_url?: string | null;
  youtube_embed_url?: string | null;
  youtube_chat_embed_url?: string | null;
  is_live?: boolean;
  scheduled_start_time?: string | null;
  auction?: { id: number; car?: CarBrief } | null;
};

type BroadcastInfo = {
  is_live: boolean;
  title?: string;
  description?: string;
  youtube_video_id?: string;
  viewers_count?: number;
  bidders_count?: number;
  current_auction_id?: number | null;
};

type OfflineBidForm = {
  auction_id: string;
  bidder_name: string;
  amount: string;
};

// ===== Helpers =====
const extractYoutubeId = (url?: string | null): string | undefined => {
  if (!url) return;
  try {
    const u = new URL(url);
    // watch?v=ID
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      // embed/ID
      const parts = u.pathname.split("/");
      const embedIdx = parts.findIndex((p) => p === "embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
    }
    // youtu.be/ID
    if (u.hostname === "youtu.be") {
      return u.pathname.replace("/", "") || undefined;
    }
  } catch {
    // ignore
  }
  return;
};

const friendlyCar = (car?: CarBrief) =>
  car ? `${car.make} ${car.model} ${car.year}` : "—";

// ===== Validation Schemas =====
const startBroadcastSchema = z.object({
  title: z.string().min(1, "عنوان البث مطلوب"),
  youtube_url: z.string().url("رابط يوتيوب غير صحيح"),
  auction_id: z.string().min(1, "اختيار المزاد مطلوب"),
  description: z.string().optional(),
});

const offlineBidSchema = z.object({
  auction_id: z.string().min(1, "اختيار المزاد مطلوب"),
  bidder_name: z.string().min(1, "اسم المزايد مطلوب"),
  amount: z.string().min(1, "مبلغ المزايدة مطلوب"),
});

interface Props {
  role: Role;
}

export default function UnifiedBroadcastManagement({ role }: Props) {
  const isAdmin = role === "admin";
  const apiPrefix = isAdmin ? "/api/admin" : "/api/moderator";

  // UI/Data state
  const [loading, setLoading] = useState(false);
  const [loadingBroadcast, setLoadingBroadcast] = useState(false);
  const [loadingAuctions, setLoadingAuctions] = useState(false);

  const [info, setInfo] = useState<BroadcastInfo>({
    is_live: false,
    title: "",
    description: "",
    youtube_video_id: undefined,
    current_auction_id: null,
    viewers_count: 0,
    bidders_count: 0,
  });

  const [availableAuctions, setAvailableAuctions] = useState<AuctionOption[]>(
    []
  );

  // Forms
  const {
    register: registerStart,
    handleSubmit: handleSubmitStart,
    reset: resetStartForm,
    formState: { errors: startErrors },
  } = useForm<z.infer<typeof startBroadcastSchema>>({
    resolver: zodResolver(startBroadcastSchema),
    defaultValues: { title: "", youtube_url: "", auction_id: "", description: "" },
  });

  const {
    register: registerOffline,
    handleSubmit: handleSubmitOffline,
    reset: resetOfflineForm,
    formState: { errors: offlineErrors },
  } = useForm<OfflineBidForm>({
    resolver: zodResolver(offlineBidSchema),
    defaultValues: { auction_id: "", bidder_name: "", amount: "" },
  });

  // ===== Fetch: broadcasts =====
  const fetchBroadcastInfo = async () => {
    setLoadingBroadcast(true);
    try {
      if (!isAdmin) {
        // لو حابب تربط نسخة المشرف لاحقاً، ممكن تعمل endpoint خاص
        // حاليًا هنقرأ نفس مصدر الأدمن (أبسط وربما متاح للجميع بصلاحيات)
      }
      const res = await api.get(`${apiPrefix}/all-broadcasts`.replace("/moderator", "/admin"));
      const payload: BroadcastItem[] =
        res?.data?.data?.data ?? res?.data?.data ?? res?.data ?? [];

      const active =
        (Array.isArray(payload) ? payload.find((b) => b.is_live) : undefined) ||
        (Array.isArray(payload) ? payload[0] : undefined);

      if (!active) {
        setInfo({
          is_live: false,
          title: "",
          description: "",
          youtube_video_id: undefined,
          viewers_count: 0,
          bidders_count: 0,
          current_auction_id: null,
        });
        return;
      }

      const videoId =
        extractYoutubeId(active.youtube_embed_url) ||
        extractYoutubeId(active.stream_url);

      setInfo({
        is_live: !!active.is_live,
        title: active.title || "",
        description: active.description || "",
        youtube_video_id: videoId,
        viewers_count: 0, // ممكن تربط لاحقًا لو فيه endpoint
        bidders_count: 0, // ممكن تربط لاحقًا لو فيه endpoint
        current_auction_id: active.auction?.id ?? null,
      });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "فشل جلب بيانات البث");
      setInfo({
        is_live: false,
        title: "",
        description: "",
        youtube_video_id: undefined,
        viewers_count: 0,
        bidders_count: 0,
        current_auction_id: null,
      });
    } finally {
      setLoadingBroadcast(false);
    }
  };

  // ===== Fetch: available auctions to broadcast =====
  const fetchAvailableAuctions = async () => {
    setLoadingAuctions(true);
    try {
      const res = await api.get("/api/approved-auctions-ids");
      const list: AuctionOption[] =
        res?.data?.data?.data ?? res?.data?.data ?? res?.data ?? [];
      // فقط المزادات اللي ما عليها بث
      setAvailableAuctions(list.filter((a) => (a.broadcasts?.length ?? 0) === 0));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "فشل تحميل المزادات المتاحة");
      setAvailableAuctions([]);
    } finally {
      setLoadingAuctions(false);
    }
  };

  useEffect(() => {
    fetchBroadcastInfo();
    fetchAvailableAuctions();
  }, []);

  const selectedAuction = useMemo(
    () =>
      (id: string) =>
        availableAuctions.find((a) => a.id === Number(id)),
    [availableAuctions]
  );

  // ===== Actions =====
  const onStart = async (values: z.infer<typeof startBroadcastSchema>) => {
    if (!isAdmin) {
      toast.error("هذه العملية للمشرف العام فقط");
      return;
    }
    setLoading(true);
    try {
      const picked = selectedAuction(values.auction_id);
      const autoDesc = picked ? friendlyCar(picked.car) : "";

      const res = await api.post("/api/admin/broadcast", {
        title: values.title.trim(),
        auction_id: Number(values.auction_id),
        stream_url: values.youtube_url.trim(),
        description: values.description?.trim() || autoDesc,
      });

      if (res?.data?.status === "success") {
        toast.success(res?.data?.message || "تم بدء البث بنجاح");
        resetStartForm();
        await Promise.all([fetchBroadcastInfo(), fetchAvailableAuctions()]);
      } else {
        toast.error(res?.data?.message || "تعذر بدء البث");
      }
    } catch (e: any) {
      console.error(e);
      if (e?.response?.status === 201 && e?.response?.data?.status === "error") {
        // حالة "تم إدخاله مسبقاً" من الكنترولر
        toast.error(e?.response?.data?.message || "هذا المزاد لديه بث بالفعل");
      } else {
        toast.error(e?.response?.data?.message || "فشل بدء البث");
      }
    } finally {
      setLoading(false);
    }
  };

  const onStop = async () => {
    if (!isAdmin) {
      toast.error("هذه العملية للمشرف العام فقط");
      return;
    }
    setLoading(true);
    try {
      const res = await api.put("/api/admin/broadcast/status", { is_live: false });
      if (res?.data?.status === "success") {
        toast.success(res?.data?.message || "تم إيقاف البث");
        await Promise.all([fetchBroadcastInfo(), fetchAvailableAuctions()]);
      } else {
        toast.error(res?.data?.message || "تعذر إيقاف البث");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "فشل إيقاف البث");
    } finally {
      setLoading(false);
    }
  };

  const onAddOfflineBid = async (values: OfflineBidForm) => {
    // لو عندك إندبوينت للمزايدة الخارجية فعلاً خلّيه شغّال، وإلا احذف البلوك كله
    setLoading(true);
    try {
      const res = await api.post("/api/admin/bids/offline", {
        auction_id: Number(values.auction_id),
        bid_amount: Number(values.amount),
        bidder_name: values.bidder_name.trim(),
      });
      if (res?.data?.status === "success") {
        toast.success("تمت إضافة المزايدة بنجاح");
        resetOfflineForm();
      } else {
        toast.error(res?.data?.message || "تعذر إضافة المزايدة");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "فشل إضافة المزايدة");
    } finally {
      setLoading(false);
    }
  };

  // ===== UI =====
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-xl">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">إدارة البث</h2>
            <p className="text-gray-400 text-sm">
              {isAdmin ? "لوحة تحكم المشرف العام" : "لوحة تحكم المشرف"}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchBroadcastInfo();
            fetchAvailableAuctions();
          }}
          className="flex items-center gap-2 bg-gray-800 text-gray-200 hover:text-white border border-gray-700 px-3 py-2 rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading || loadingBroadcast || loadingAuctions ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      {/* If NO live broadcast: Start form */}
      {!info.is_live ? (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-xl">
                <Play className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">بدء بث مباشر جديد</h3>
                <p className="text-gray-400 text-sm">اختر المزاد وأدخل رابط يوتيوب</p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmitStart(onStart)}
            className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                عنوان البث <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...registerStart("title")}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: بث مزاد — تويوتا كامري 2021"
                disabled={loading}
              />
              {startErrors.title && (
                <p className="mt-1 text-sm text-red-400">{startErrors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                المزاد <span className="text-red-500">*</span>
              </label>
              <select
                {...registerStart("auction_id")}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading || loadingAuctions}
              >
                <option value="">
                  {loadingAuctions ? "جاري تحميل المزادات..." : "اختر مزاداً جاهزاً للبث"}
                </option>
                {availableAuctions.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    #{a.id} — {friendlyCar(a.car)}
                  </option>
                ))}
              </select>
              {startErrors.auction_id && (
                <p className="mt-1 text-sm text-red-400">{startErrors.auction_id.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">
                رابط يوتيوب <span className="text-red-500">*</span>
              </label>
              <input
                dir="ltr"
                type="url"
                {...registerStart("youtube_url")}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX"
                disabled={loading}
              />
              {startErrors.youtube_url && (
                <p className="mt-1 text-sm text-red-400">{startErrors.youtube_url.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                أدخل رابط فيديو يوتيوب مباشر أو عادي (نستخرج المعرّف تلقائياً).
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">الوصف</label>
              <input
                type="text"
                {...registerStart("description")}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="وصف مختصر للبث (اختياري)"
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => resetStartForm()}
                className="px-4 py-2 rounded-xl bg-gray-700 text-white hover:bg-gray-600"
              >
                إعادة تعيين
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {loading ? "جاري البدء..." : "بدء البث"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // ===== Live Section =====
        <div className="space-y-6">
          {/* Header Live */}
          <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-5 border border-red-500/30 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-white">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="font-semibold">البث مباشر الآن</span>
              </div>
              <h3 className="text-white text-lg mt-1">{info.title || "—"}</h3>
              <p className="text-red-100 text-sm">{info.description || ""}</p>
            </div>
            <div className="flex items-center gap-5 text-white">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{info.viewers_count ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{info.bidders_count ?? 0}</span>
              </div>
              {isAdmin && (
                <button
                  onClick={onStop}
                  disabled={loading}
                  className="bg-white/15 hover:bg-white/25 px-4 py-2 rounded-xl flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  {loading ? "جاري الإيقاف..." : "إيقاف البث"}
                </button>
              )}
            </div>
          </div>

          {/* Player */}
          {info.youtube_video_id ? (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 overflow-hidden">
              <div className="aspect-video">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${info.youtube_video_id}?autoplay=1&mute=0`}
                  title="البث المباشر"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 text-gray-300 rounded-2xl p-6 border border-gray-700/50">
              لا يوجد رابط يوتيوب صالح لعرضه (تحقّق من stream_url في الباك).
            </div>
          )}

          {/* Optional: Offline bid (لو الإندبوينت عندك جاهز) */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 overflow-hidden">
            <div className="p-5 border-b border-gray-700/50 flex items-center gap-3">
              <div className="bg-green-500/15 p-2 rounded-xl">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h4 className="text-white font-semibold">إضافة مزايدة خارجية</h4>
                <p className="text-gray-400 text-sm">أدخل تفاصيل المزايد والمبلغ</p>
              </div>
            </div>

            <form
              onSubmit={handleSubmitOffline(onAddOfflineBid)}
              className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-sm text-gray-300 mb-2">المزاد <span className="text-red-500">*</span></label>
                <select
                  {...registerOffline("auction_id")}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={loading || loadingAuctions || availableAuctions.length === 0}
                >
                  <option value="">
                    {loadingAuctions ? "جاري تحميل المزادات..." : availableAuctions.length ? "اختر مزاد" : "لا توجد مزادات متاحة"}
                  </option>
                  {availableAuctions.map((a) => (
                    <option key={a.id} value={String(a.id)}>
                      #{a.id} — {friendlyCar(a.car)}
                    </option>
                  ))}
                </select>
                {offlineErrors.auction_id && (
                  <p className="mt-1 text-sm text-red-400">{offlineErrors.auction_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">اسم المزايد <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  {...registerOffline("bidder_name")}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="اسم المزايد"
                />
                {offlineErrors.bidder_name && (
                  <p className="mt-1 text-sm text-red-400">{offlineErrors.bidder_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">مبلغ المزايدة <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  {...registerOffline("amount")}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="مثال: 1000"
                />
                {offlineErrors.amount && (
                  <p className="mt-1 text-sm text-red-400">{offlineErrors.amount.message}</p>
                )}
              </div>

              <div className="md:col-span-3 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={loading || availableAuctions.length === 0}
                  className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  {loading ? "جاري الإضافة..." : "إضافة مزايدة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
