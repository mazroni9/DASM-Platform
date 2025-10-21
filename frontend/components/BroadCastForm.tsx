// src/components/BroadcastForm.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Radio,
  Satellite,
  PlayCircle,
  Video,
  Trash2,
  RefreshCw,
  Link as LinkIcon,
} from "lucide-react";

type CarBrief = {
  make: string;
  model: string;
  year: number;
};

type AuctionOption = {
  id: number;
  car: CarBrief;
  broadcasts?: any[];
};

type BroadcastRow = {
  id: number;
  title?: string;
  description?: string | null;
  stream_url?: string | null;
  is_live?: boolean;
  auction?: {
    id: number;
    car?: CarBrief;
  };
};

const BroadcastForm: React.FC = () => {
  // Form states
  const [title, setTitle] = useState<string>("");
  const [auctionId, setAuctionId] = useState<number | "">("");
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Data/UX states
  const [auctionOptions, setAuctionOptions] = useState<AuctionOption[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastRow[]>([]);
  const [loadingAuctions, setLoadingAuctions] = useState<boolean>(false);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [processingBroadcastId, setProcessingBroadcastId] = useState<number | null>(null);

  // ===== Helpers =====
  const friendlyCar = (car?: CarBrief) =>
    car ? `${car.make} ${car.model} ${car.year}` : "—";

  const selectedAuction = useMemo(
    () => auctionOptions.find((a) => a.id === auctionId),
    [auctionOptions, auctionId]
  );

  // عند تغيير المزاد، نعبي العنوان/الوصف تلقائيًا لو فاضية
  useEffect(() => {
    if (selectedAuction) {
      const autoText = friendlyCar(selectedAuction.car);
      if (!title) setTitle(autoText);
      if (!description) setDescription(autoText);
    }
  }, [selectedAuction]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== API Calls =====
  const fetchAuctionIds = async () => {
    try {
      setLoadingAuctions(true);
      const res = await api.get("/api/approved-auctions-ids");
      const payload = res?.data?.data?.data ?? res?.data?.data ?? res?.data ?? [];
      // نعرض المزادات اللي ما عليها بث (broadcasts.length == 0)
      const cleaned: AuctionOption[] = Array.isArray(payload) ? payload : [];
      setAuctionOptions(cleaned.filter((a) => (a.broadcasts?.length ?? 0) === 0));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "فشل تحميل المزادات المتاحة للبث");
    } finally {
      setLoadingAuctions(false);
    }
  };

  const fetchBroadcasts = async () => {
    try {
      setLoadingBroadcasts(true);
      const res = await api.get("/api/admin/all-broadcasts");
      const payload = res?.data?.data?.data ?? res?.data?.data ?? res?.data ?? [];
      const rows: BroadcastRow[] = Array.isArray(payload) ? payload : [];
      setBroadcasts(rows);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "فشل تحميل قائمة البثوث");
    } finally {
      setLoadingBroadcasts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !youtubeUrl.trim() || !auctionId) {
      toast.error("من فضلك أكمل الحقول المطلوبة");
      return;
    }

    // تحقق بسيط أن الرابط يبدو URL صالح
    try {
      // eslint-disable-next-line no-new
      new URL(youtubeUrl);
    } catch {
      toast.error("رابط البث غير صالح");
      return;
    }

    const auctionObj = auctionOptions.find((a) => a.id === auctionId);
    const autoDesc = auctionObj ? friendlyCar(auctionObj.car) : "";
    const finalDescription = description?.trim() || autoDesc;

    const formData = {
      title: title.trim(),
      auction_id: auctionId,
      stream_url: youtubeUrl.trim(),
      description: finalDescription,
    };

    try {
      setSubmitting(true);
      const res = await api.post("/api/admin/broadcast", formData);
      if (res?.data?.status === "success") {
        toast.success(res?.data?.message || "تم إنشاء البث بنجاح");
        setTitle("");
        setAuctionId("");
        setYoutubeUrl("");
        setDescription("");
        await Promise.all([fetchBroadcasts(), fetchAuctionIds()]);
      } else {
        toast.error(res?.data?.message || "تعذر إنشاء البث");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "فشل إنشاء البث");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = confirm("هل أنت متأكد من حذف هذا البث؟");
    if (!ok) return;

    try {
      setProcessingBroadcastId(id);
      const res = await api.delete(`/api/admin/broadcast/${id}`);
      if (res?.status === 200) {
        toast.success(res?.data?.message || "تم حذف البث");
        await Promise.all([fetchBroadcasts(), fetchAuctionIds()]);
      } else {
        toast.error(res?.data?.message || "تعذر حذف البث");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "فشل الحذف");
    } finally {
      setProcessingBroadcastId(null);
    }
  };

  // mount
  useEffect(() => {
    fetchAuctionIds();
    fetchBroadcasts();
  }, []);

  // ===== UI =====
  return (
    <div className="space-y-8">
      {/* Form Card */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
        <div className="border-b border-gray-700/50 p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-xl">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">إنشاء بث مباشر</h3>
              <p className="text-gray-400 text-sm">
                اختر المزاد وأدخل رابط البث والعنوان ثم اضغط إرسال.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              fetchAuctionIds();
              fetchBroadcasts();
            }}
            className="flex items-center gap-2 text-gray-300 hover:text-white bg-gray-800 border border-gray-700 px-3 py-2 rounded-lg"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loadingAuctions || loadingBroadcasts ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Title */}
          <div className="col-span-1">
            <label className="block text-sm text-gray-300 mb-2">العنوان<span className="text-red-500">*</span></label>
            <input
              dir="auto"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: بث مزاد — تويوتا كامري 2021"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Auction */}
          <div className="col-span-1">
            <label className="block text-sm text-gray-300 mb-2">المزاد<span className="text-red-500">*</span></label>
            <select
              value={auctionId}
              onChange={(e) => setAuctionId(e.target.value ? Number(e.target.value) : "")}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loadingAuctions}
            >
              <option value="" disabled>
                {loadingAuctions ? "جاري التحميل..." : "اختر المزاد الذي لا يحتوي على بث"}
              </option>
              {auctionOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  #{a.id} — {friendlyCar(a.car)}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-2">
              يظهر هنا فقط المزادات التي لا يوجد لها بث نشط/مسجل.
            </p>
          </div>

          {/* Stream URL */}
          <div className="col-span-1">
            <label className="block text-sm text-gray-300 mb-2">رابط البث (YouTube/RTMP)<span className="text-red-500">*</span></label>
            <input
              dir="ltr"
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=XXXX أو rtmp://..."
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Description */}
          <div className="col-span-1">
            <label className="block text-sm text-gray-300 mb-2">الوصف</label>
            <input
              dir="auto"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للبث"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-3 mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setTitle("");
                setAuctionId("");
                setYoutubeUrl("");
                setDescription("");
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white rounded-xl"
            >
              إعادة تعيين
            </Button>
            <Button
              type="submit"
              disabled={submitting || !title.trim() || !youtubeUrl.trim() || !auctionId}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
            >
              {submitting ? "جارٍ الإرسال..." : "إرسال"}
            </Button>
          </div>
        </form>
      </div>

      {/* List Card */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
        <div className="border-b border-gray-700/50 p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-xl">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">قائمة البثوث</h3>
              <p className="text-gray-400 text-sm">عرض جميع البثوث المسجلة في النظام</p>
            </div>
          </div>
          <button
            onClick={fetchBroadcasts}
            className="flex items-center gap-2 text-gray-300 hover:text-white bg-gray-800 border border-gray-700 px-3 py-2 rounded-lg"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${loadingBroadcasts ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-900/60">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">العنوان</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">المزاد</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">الوصف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">رابط البث</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {loadingBroadcasts ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                    جارٍ التحميل...
                  </td>
                </tr>
              ) : broadcasts.length > 0 ? (
                broadcasts.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">{b.id}</td>
                    <td className="px-6 py-4 text-sm text-white">{b.title || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {b.auction?.id ? `#${b.auction.id} — ${friendlyCar(b.auction.car)}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{b.description || "—"}</td>
                    <td className="px-6 py-4 text-sm">
                      {b.stream_url ? (
                        <a
                          href={b.stream_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                        >
                          <LinkIcon className="w-4 h-4" />
                          فتح الرابط
                        </a>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {b.is_live ? (
                        <span className="inline-flex items-center gap-2 text-red-400">
                          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                          مباشر
                        </span>
                      ) : (
                        <span className="text-gray-400">غير مباشر</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Button
                        onClick={() => handleDelete(b.id)}
                        size="sm"
                        variant="destructive"
                        disabled={processingBroadcastId === b.id}
                        className="rounded-lg"
                        title="حذف البث"
                      >
                        <Trash2 className="w-4 h-4 ml-1" />
                        حذف
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                    لا توجد بثوث مسجّلة حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BroadcastForm;
