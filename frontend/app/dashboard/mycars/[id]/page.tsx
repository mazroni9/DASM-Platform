"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useSearchParams } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Edit,
  ArrowRight,
  Car,
  Calendar,
  Gauge,
  Settings,
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import LoadingLink from "@/components/LoadingLink";
import { Car as CarType } from "@/types/types";
import VehicleForm from "@/components/shared/VehicleForm";

type ActiveAuction = {
  id: number;
  car_id: number;
  status: string; // scheduled | active | live | ...
  control_room_approved?: boolean;
  approved_for_live?: boolean;
  current_price?: number;
  current_bid?: number;
  start_time?: string;
  end_time?: string;
};

type CarShowResponse = {
  status: "success" | "error";
  data?: {
    car: CarType;
    active_auction: ActiveAuction | null;
    car_extra_attributes?: Record<string, string>;
  };
  message?: string;
};

export default function CarDetailsPage() {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [car, setCar] = useState<CarType | null>(null);
  const [activeAuction, setActiveAuction] = useState<ActiveAuction | null>(
    null,
  );

  const { isLoggedIn } = useAuth();
  const router = useLoadingRouter();
  const searchParams = useSearchParams();

  const params = useParams();
  const carId = (params?.id as string) || "";

  useEffect(() => {
    if (searchParams.get("edit") === "1") {
      setEditing(true);
    }
  }, [searchParams]);

  // ✅ اشتقاق حالة المزاد بشكل موحّد (الأولوية لـ active_auction.status لو موجود)
  const auctionStatus = useMemo(() => {
    const s = (activeAuction?.status ?? (car as any)?.auction_status ?? "")
      .toString()
      .toLowerCase();
    // تطبيع بسيط
    if (s === "live") return "active";
    return s || "unknown";
  }, [activeAuction, car]);

  const isLockedForEdit = useMemo(() => {
    // ممنوع التعديل إذا المزاد نشط/لايف
    if (["active", "live"].includes(auctionStatus)) return true;

    // ممنوع التعديل إذا مجدول وتمت الموافقة عليه
    if (auctionStatus === "scheduled" && activeAuction?.control_room_approved) {
      return true;
    }

    return false;
  }, [auctionStatus, activeAuction]);

  const getAuctionStatusConfig = (status: string) => {
    const statusMap: Record<string, any> = {
      pending: {
        text: "في انتظار المراجعة",
        color: "text-amber-400",
        bg: "bg-amber-500/20",
        border: "border-amber-500/30",
        icon: Clock,
      },
      scheduled: {
        text: "مجدولة",
        color: "text-blue-400",
        bg: "bg-blue-500/20",
        border: "border-blue-500/30",
        icon: Clock,
      },
      active: {
        text: "في المزاد",
        color: "text-purple-400",
        bg: "bg-purple-500/20",
        border: "border-purple-500/30",
        icon: Gauge,
      },
      available: {
        text: "متوفر للمزاد",
        color: "text-blue-400",
        bg: "bg-blue-500/20",
        border: "border-blue-500/30",
        icon: DollarSign,
      },
      sold: {
        text: "مباع",
        color: "text-gray-400",
        bg: "bg-gray-500/20",
        border: "border-gray-500/30",
        icon: CheckCircle,
      },
      withdrawn: {
        text: "مسحوبة",
        color: "text-gray-400",
        bg: "bg-gray-500/20",
        border: "border-gray-500/30",
        icon: AlertCircle,
      },
      archived: {
        text: "مؤرشفة",
        color: "text-gray-400",
        bg: "bg-gray-500/20",
        border: "border-gray-500/30",
        icon: FileText,
      },
      unknown: {
        text: "غير معروف",
        color: "text-gray-400",
        bg: "bg-gray-500/20",
        border: "border-gray-500/30",
        icon: FileText,
      },
    };

    return statusMap[status] || statusMap.unknown;
  };

  // Verify user is authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/dashboard/mycars");
    }
  }, [isLoggedIn, router]);

  // Fetch car details (✅ مربوط على شكل show() في الباك)
  useEffect(() => {
    async function fetchCarDetails() {
      if (!isLoggedIn || !carId) return;

      try {
        const response = await api.get<CarShowResponse>(`/api/cars/${carId}`);

        if (response.data.status === "success" && response.data.data?.car) {
          setCar(response.data.data.car);
          setActiveAuction(response.data.data.active_auction ?? null);
        } else {
          toast.error("السيارة غير موجودة أو ليس لديك صلاحية لعرضها");
          router.push("/dashboard/mycars");
        }
      } catch (error: any) {
        console.error("Error fetching car details:", error);

        if (error?.response?.status === 401) {
          router.push("/auth/login?returnUrl=/dashboard/mycars");
          return;
        }

        if (error?.response?.status === 404) {
          toast.error("السيارة غير موجودة");
          router.push("/dashboard/mycars");
        } else {
          toast.error("حدث خطأ أثناء تحميل بيانات السيارة");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCarDetails();
  }, [isLoggedIn, carId, router]);

  // ✅ اعتماد غرفة التحكم: بدل car.auctions?.[0] نستخدم activeAuction
  const controlRoomApproved = Boolean(activeAuction?.control_room_approved);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Loader2 className="absolute inset-0 w-full h-full animate-spin text-purple-500" />
            <div className="absolute inset-0 w-full h-full rounded-full border-4 border-transparent border-t-purple-500 animate-spin opacity-60"></div>
          </div>
          <p className="text-lg text-gray-400 font-medium">
            جاري تحميل بيانات السيارة...
          </p>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="p-6 bg-gray-800/30 rounded-2xl border border-gray-700/50 max-w-md">
            <AlertCircle className="w-16 h-16 text-rose-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              السيارة غير موجودة
            </h2>
            <LoadingLink
              href="/dashboard/mycars"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white hover:scale-105 transition-all duration-300"
            >
              العودة إلى قائمة السيارات
              <ArrowRight className="w-4 h-4" />
            </LoadingLink>
          </div>
        </div>
      </div>
    );
  }

  // --- Edit Mode Render ---
  if (editing) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 pb-20">
        <div className="max-w-6xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">
            تعديل بيانات السيارة
          </h1>
          <button
            onClick={() => setEditing(false)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-all border border-border"
          >
            <ArrowRight className="w-4 h-4 text-primary" />
            <span className="font-medium">إلغاء وعودة</span>
          </button>
        </div>

        <VehicleForm
          mode="edit"
          initialData={{
            ...car,
            auctions: activeAuction ? [activeAuction] : [],
          }}
          onSuccess={(updatedCar) => {
            if (updatedCar) setCar(updatedCar);
            setEditing(false);
          }}
        />
      </div>
    );
  }

  // --- View Mode Render ---
  const statusConfig = getAuctionStatusConfig(auctionStatus);
  const StatusIcon = statusConfig.icon;
  const canEdit = !isLockedForEdit;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card backdrop-blur-2xl border border-border rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary text-primary-foreground rounded-xl">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {car.make} {car.model} - {car.year}
                </h1>
                <p className="text-foreground/70 text-sm mt-1">
                  تفاصيل السيارة المعروضة
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm",
                  statusConfig.bg,
                  statusConfig.border,
                  statusConfig.color,
                )}
              >
                <StatusIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{statusConfig.text}</span>
              </div>

              {controlRoomApproved && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30 backdrop-blur-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">معتمدة للمزاد</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {canEdit && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-3 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 hover:bg-amber-500/30 hover:scale-105 transition-all duration-300"
              >
                <Edit className="w-4 h-4" />
                <span className="font-medium">تعديل البيانات</span>
              </button>
            )}

            <LoadingLink
              href="/dashboard/mycars"
              className="flex items-center gap-2 px-4 py-3 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/30 hover:bg-blue-500/30 hover:scale-105 transition-all duration-300"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="font-medium">العودة للقائمة</span>
            </LoadingLink>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        {/* Car Images Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            معرض الصور
          </h2>

          <div className="space-y-4">
            {Array.isArray((car as any).images) &&
            (car as any).images.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {(car as any).images.map((image: string, index: number) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`${car.make} ${car.model} - صورة ${index + 1}`}
                      className="w-full h-64 object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "https://cdn.pixabay.com/photo/2012/05/29/00/43/car-49278_1280.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
                      <span className="text-white text-sm">
                        صورة {index + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="w-16 h-16 text-foreground/50 mx-auto mb-4" />
                <p className="text-foreground/70">لا توجد صور متاحة للسيارة</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Car Details Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Basic Information */}
          <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              المعلومات الأساسية
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-foreground/70 mb-2 block">
                  الماركة
                </label>
                <p className="text-foreground font-medium">{car.make}</p>
              </div>

              <div>
                <label className="text-sm text-foreground/70 mb-2 block">
                  الموديل
                </label>
                <p className="text-foreground font-medium">{car.model}</p>
              </div>

              <div>
                <label className="text-sm text-foreground/70 mb-2 block">
                  سنة الصنع
                </label>
                <p className="text-foreground font-medium">{car.year}</p>
              </div>

              <div>
                <label className="text-sm text-foreground/70 mb-2 block">
                  اللون
                </label>
                <p className="text-foreground font-medium">
                  {(car as any).color || "غير محدد"}
                </p>
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              المواصفات الفنية
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-foreground/70 mb-2 block">
                  العداد (كم)
                </label>
                <p className="text-foreground font-medium">
                  {(car as any).odometer?.toLocaleString?.("ar-EG") ??
                    (car as any).odometer}
                </p>
              </div>

              <div>
                <label className="text-sm text-foreground/70 mb-2 block">
                  المحرك
                </label>
                <p className="text-foreground font-medium">
                  {(car as any).engine || "غير محدد"}
                </p>
              </div>

              <div>
                <label className="text-sm text-foreground/70 mb-2 block">
                  ناقل الحركة
                </label>
                <p className="text-foreground font-medium">
                  {(car as any).transmission === "automatic"
                    ? "أوتوماتيك"
                    : (car as any).transmission === "manual"
                      ? "يدوي"
                      : (car as any).transmission === "cvt"
                        ? "CVT"
                        : "غير محدد"}
                </p>
              </div>

              <div>
                <label className="text-sm text-foreground/70 mb-2 block">
                  الحالة
                </label>
                <p className="text-foreground font-medium">
                  {(car as any).condition === "excellent"
                    ? "ممتازة"
                    : (car as any).condition === "good"
                      ? "جيدة"
                      : (car as any).condition === "fair"
                        ? "متوسطة"
                        : (car as any).condition === "poor"
                          ? "ضعيفة"
                          : "غير محدد"}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-foreground/70 mb-2 block">
                  رقم الهيكل (VIN)
                </label>
                <p className="text-foreground font-medium">
                  {(car as any).vin}
                </p>
              </div>
            </div>
          </div>

          {/* Price & Description */}
          <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              السعر والوصف
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-foreground/70 mb-2 block">
                  سعر التقييم (ريال)
                </label>
                <p className="text-2xl font-bold text-secondary">
                  {(car as any).evaluation_price?.toLocaleString?.("ar-EG") ??
                    (car as any).evaluation_price}{" "}
                  ريال
                </p>
              </div>

              <div>
                <label className="text-sm text-foreground/70 mb-2 block">
                  الوصف
                </label>
                <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {(car as any).description || "لا يوجد وصف متاح"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Auction Settings Section - Visible always (read-only) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6 mt-6"
      >
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          إعدادات المزاد
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-foreground/70 mb-2 block">
              مدة المزاد
            </label>
            <p className="text-foreground font-medium">
              {(car as any).main_auction_duration
                ? `${(car as any).main_auction_duration} أيام`
                : "10 أيام"}
            </p>
          </div>

          <div>
            <label className="text-sm text-foreground/70 mb-2 block">
              وقت البدء
            </label>
            <p className="text-foreground font-medium">
              {activeAuction?.status === "scheduled" && activeAuction.start_time
                ? `مجدول: ${new Date(activeAuction.start_time).toLocaleDateString("ar-EG")}`
                : "يبدأ فور الموافقة"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Timestamps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6 mt-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-foreground/70">
            <Calendar className="w-4 h-4" />
            <span>
              <strong>تاريخ الإضافة:</strong>{" "}
              {car.created_at
                ? new Date((car as any).created_at).toLocaleDateString(
                    "ar-EG",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )
                : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-foreground/70">
            <Calendar className="w-4 h-4" />
            <span>
              <strong>آخر تحديث:</strong>{" "}
              {car.updated_at
                ? new Date((car as any).updated_at).toLocaleDateString(
                    "ar-EG",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )
                : "—"}
            </span>
          </div>
        </div>
      </motion.div>

      {!canEdit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/20 border border-amber-500/30 rounded-2xl p-4 backdrop-blur-sm mt-6"
        >
          <div className="flex items-center gap-2 text-amber-300">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">
              لا يمكن تعديل بيانات السيارة لأنها في حالة مزاد نشط أو مجدول
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
