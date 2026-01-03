// src/components/BroadcastForm.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Radio, Video, Trash2, RefreshCw, Link as LinkIcon } from "lucide-react";

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

const cn = (...xs: Array<string | false | undefined | null>) =>
  xs.filter(Boolean).join(" ");

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
  const friendlyCar = (car?: CarBrief) => (car ? `${car.make} ${car.model} ${car.year}` : "—");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAuction]);

  // ===== API Calls =====
  const fetchAuctionIds = async () => {
    try {
      setLoadingAuctions(true);
      const res = await api.get("/api/approved-auctions-ids");
      const payload = res?.data?.data?.data ?? res?.data?.data ?? res?.data ?? [];
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

  const resetForm = () => {
    setTitle("");
    setAuctionId("");
    setYoutubeUrl("");
    setDescription("");
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
        resetForm();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardClass =
    "rounded-2xl border shadow-sm overflow-hidden " +
    "bg-white/70 border-gray-200 " +
    "dark:bg-gray-900/40 dark:border-white/10";

  const headerClass =
    "border-b p-5 flex items-center justify-between " +
    "bg-white/60 border-gray-200 " +
    "dark:bg-gray-900/30 dark:border-white/10";

  const inputClass =
    "w-full rounded-xl border px-4 py-2 outline-none transition text-sm " +
    "bg-white text-gray-900 border-gray-200 placeholder-gray-400 " +
    "focus:ring-2 focus:ring-purple-500 focus:border-transparent " +
    "dark:bg-gray-900/50 dark:text-white dark:border-white/10 dark:placeholder-gray-500";

  const selectClass =
    "w-full rounded-xl border px-4 py-2 outline-none transition text-sm " +
    "bg-white text-gray-900 border-gray-200 " +
    "focus:ring-2 focus:ring-purple-500 focus:border-transparent " +
    "dark:bg-gray-900/50 dark:text-white dark:border-white/10";

  const mutedText = "text-gray-600 dark:text-gray-400";
  const headingText = "text-gray-900 dark:text-white";

  return (
    <div dir="rtl" className="space-y-8">
      {/* Form Card */}
      <div className={cardClass}>
        <div className={headerClass}>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-xl">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={cn("text-lg font-semibold", headingText)}>إنشاء بث مباشر</h3>
              <p className={cn("text-sm", mutedText)}>
                اختر المزاد وأدخل رابط البث والعنوان ثم اضغط إرسال.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchAuctionIds();
              fetchBroadcasts();
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border transition",
              "bg-white/70 text-gray-700 border-gray-200 hover:bg-white",
              "dark:bg-gray-900/40 dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/5"
            )}
            title="تحديث البيانات"
          >
            <RefreshCw
              className={cn("w-4 h-4", (loadingAuctions || loadingBroadcasts) && "animate-spin")}
            />
            تحديث
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Title */}
          <div className="col-span-1">
            <label className={cn("block text-sm mb-2", "text-gray-700 dark:text-gray-300")}>
              العنوان <span className="text-red-500">*</span>
            </label>
            <input
              dir="auto"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: بث مزاد — تويوتا كامري 2021"
              className={inputClass}
            />
          </div>

          {/* Auction */}
          <div className="col-span-1">
            <label className={cn("block text-sm mb-2", "text-gray-700 dark:text-gray-300")}>
              المزاد <span className="text-red-500">*</span>
            </label>
            <select
              value={auctionId}
              onChange={(e) => setAuctionId(e.target.value ? Number(e.target.value) : "")}
              className={selectClass}
              disabled={loadingAuctions}
            >
              <option value="">
                {loadingAuctions ? "جاري التحميل..." : "اختر المزاد الذي لا يحتوي على بث"}
              </option>
              {auctionOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  #{a.id} — {friendlyCar(a.car)}
                </option>
              ))}
            </select>

            <p className={cn("text-xs mt-2", mutedText)}>
              يظهر هنا فقط المزادات التي لا يوجد لها بث نشط/مسجل.
            </p>
          </div>

          {/* Stream URL */}
          <div className="col-span-1">
            <label className={cn("block text-sm mb-2", "text-gray-700 dark:text-gray-300")}>
              رابط البث (YouTube/RTMP) <span className="text-red-500">*</span>
            </label>
            <input
              dir="ltr"
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=XXXX أو rtmp://..."
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div className="col-span-1">
            <label className={cn("block text-sm mb-2", "text-gray-700 dark:text-gray-300")}>
              الوصف
            </label>
            <input
              dir="auto"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للبث"
              className={inputClass}
            />
          </div>

          <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-3 mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={resetForm}
              className={cn(
                "rounded-xl border",
                "bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-200",
                "dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-white/10"
              )}
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
      <div className={cardClass}>
        <div className={headerClass}>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-xl">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={cn("text-lg font-semibold", headingText)}>قائمة البثوث</h3>
              <p className={cn("text-sm", mutedText)}>عرض جميع البثوث المسجلة في النظام</p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchBroadcasts}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border transition",
              "bg-white/70 text-gray-700 border-gray-200 hover:bg-white",
              "dark:bg-gray-900/40 dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/5"
            )}
            title="تحديث القائمة"
          >
            <RefreshCw className={cn("w-4 h-4", loadingBroadcasts && "animate-spin")} />
            تحديث
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-white/5">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  العنوان
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  المزاد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  الوصف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  رابط البث
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
              {loadingBroadcasts ? (
                <tr>
                  <td colSpan={7} className={cn("px-6 py-10 text-center", mutedText)}>
                    جارٍ التحميل...
                  </td>
                </tr>
              ) : broadcasts.length > 0 ? (
                broadcasts.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-100/60 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {b.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {b.title || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {b.auction?.id ? `#${b.auction.id} — ${friendlyCar(b.auction.car)}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {b.description || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {b.stream_url ? (
                        <a
                          href={b.stream_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-700 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-cyan-300"
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
                        <span className="inline-flex items-center gap-2 text-rose-600 dark:text-red-400">
                          <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-red-400 animate-pulse"></span>
                          مباشر
                        </span>
                      ) : (
                        <span className={mutedText}>غير مباشر</span>
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
                  <td colSpan={7} className={cn("px-6 py-10 text-center", mutedText)}>
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
