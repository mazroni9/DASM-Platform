"use client";

import { useEffect, useMemo, useRef, useState, ChangeEvent, FormEvent } from "react";
import {
  Car as CarIcon,
  Search,
  Filter,
  CheckSquare,
  MoreVertical,
  Eye,
  Play,
  Archive,
  RotateCcw,
  ChevronDown,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import Modal from "@/components/Modal";
import Pagination from "@/components/OldPagination";
import { MoveToLiveDialog } from "@/components/admin/MoveToLiveDialog";
import { PriceWithIcon } from "@/components/ui/priceWithIcon";
import { cn } from "@/lib/utils";

/**
 * ✅ توافق كامل مع الـ Backend الحالي:
 * - GET   /api/admin/cars?page=1&status=&search=&dealer_id=
 *   يرجع: { status: "success", data: Car[], pagination: {...} }
 * - GET   /api/admin/cars/{id}
 * - PUT   /api/admin/cars/{id}/status   body: { status: available|in_auction|sold }
 * - PUT   /api/admin/cars/{id}/review-status body: { review_status, review_reason? }
 */

type AuctionRow = {
  id: number | string;
  status?: string;
  minimum_bid?: number | string | null;
  maximum_bid?: number | string | null;
};

interface CarData {
  id: number;
  dealer_id?: number | null;
  make: string;
  model: string;
  year: number;
  vin?: string;
  condition?: string | null;
  transmission?: string | null;
  market_category?: string | null;
  odometer?: number | null;
  evaluation_price?: number | string | null;
  plate?: string | null;
  auction_status: string; // pending|available|in_auction|sold ... (backend default pending)
  province?: string | null;
  city?: string | null;

  // قد تكون مخفية في Model لكن الـ Admin Resource غالبًا بيظهرها
  min_price?: number | string | null;
  max_price?: number | string | null;

  // ملفات وصور
  images?: string[] | null;
  registration_card_image?: string | null;

  // AI Review
  review_status?: string | null; // pending|approved|rejected...
  review_score?: number | string | null;
  review_reason?: string | null;
  reviewed_at?: string | null;

  dealer?: {
    user: {
      first_name: string;
      last_name: string;
    };
  };
  user?: {
    first_name: string;
    last_name: string;
  };

  created_at: string;

  auctions?: AuctionRow[];
}

interface FilterOptions {
  status: string; // backend filter
  category: string; // client filter
  condition: string; // client filter
  transmission: string; // client filter
  dealer_id: string; // backend filter
}

interface EnumOption {
  value: string;
  label: string;
}

interface EnumOptionsResponse {
  categories?: EnumOption[];
  market_categories?: EnumOption[];
  conditions?: EnumOption[];
  transmissions?: EnumOption[];
}

interface CarFormData {
  price: string;
  id: string | number; // auction id
}

const pageSize = 10;

const toNum = (v: any) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
};

/** ===== Status helpers ===== */

const CAR_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "كل الحالات" },
  { value: "pending", label: "قيد المراجعة" },
  { value: "available", label: "متاح" },
  { value: "in_auction", label: "في المزاد" },
  { value: "sold", label: "تم البيع" },
];

const getCarStatusText = (s: string) => {
  switch (s) {
    case "pending":
      return "قيد المراجعة";
    case "available":
      return "متاح";
    case "in_auction":
      return "في المزاد";
    case "sold":
      return "تم البيع";
    case "cancelled":
    case "canceled":
      return "ملغي";
    default:
      return s || "—";
  }
};

const getCarStatusBadge = (s: string) => {
  switch (s) {
    case "available":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-300";
    case "in_auction":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-300";
    case "sold":
      return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-300";
    case "pending":
      return "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300";
    case "cancelled":
    case "canceled":
      return "bg-gray-500/10 text-gray-700 border-gray-500/20 dark:text-gray-300";
    default:
      return "bg-gray-500/10 text-gray-700 border-gray-500/20 dark:text-gray-300";
  }
};

const REVIEW_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "pending", label: "قيد المراجعة" },
  { value: "approved", label: "مقبول" },
  { value: "rejected", label: "مرفوض" },
];

const getReviewText = (s?: string | null) => {
  switch ((s || "").toLowerCase()) {
    case "approved":
      return "مقبول";
    case "rejected":
      return "مرفوض";
    case "pending":
    case "":
      return "قيد المراجعة";
    default:
      return s || "قيد المراجعة";
  }
};

const getReviewBadge = (s?: string | null) => {
  switch ((s || "").toLowerCase()) {
    case "approved":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-300";
    case "rejected":
      return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-300";
    case "pending":
    case "":
      return "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300";
    default:
      return "bg-gray-500/10 text-gray-700 border-gray-500/20 dark:text-gray-300";
  }
};

/** ===== Small UI ===== */

function CardStat({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-foreground/70 text-sm">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className="bg-primary/10 p-3 rounded-xl">{icon}</div>
      </div>
    </div>
  );
}

function useOutsideClose(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  return ref;
}

/** ===== Actions Menu (بدون MUI عشان شكل موحّد واحترافي) ===== */
function ActionsMenu({
  car,
  onAction,
  onOpenReview,
  onSetCarStatus,
}: {
  car: CarData;
  onAction: (action: string, carId?: number) => void;
  onOpenReview: (car: CarData) => void;
  onSetCarStatus: (carId: number, status: "available" | "in_auction" | "sold") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-foreground/70 hover:text-foreground hover:bg-border p-2 rounded-lg transition-all duration-200"
        aria-label="المزيد"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-2xl z-20 overflow-hidden">
          <div className="p-2 space-y-1">
            {/* تغيير حالة السيارة (متوافق مع PUT /cars/{id}/status) */}
            <div className="px-3 py-2 text-xs text-foreground/60">حالة السيارة</div>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSetCarStatus(car.id, "available");
              }}
              className="w-full text-right px-3 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition"
            >
              <CheckCircle size={16} />
              تحويل إلى: متاح
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSetCarStatus(car.id, "in_auction");
              }}
              className="w-full text-right px-3 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition"
            >
              <Play size={16} />
              تحويل إلى: في المزاد
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSetCarStatus(car.id, "sold");
              }}
              className="w-full text-right px-3 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition"
            >
              <CheckSquare size={16} />
              تحويل إلى: تم البيع
            </button>

            <div className="h-px bg-border my-2" />

            {/* AI Review */}
            <div className="px-3 py-2 text-xs text-foreground/60">مراجعة الذكاء الاصطناعي</div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenReview(car);
              }}
              className="w-full text-right px-3 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition"
            >
              <Sparkles size={16} />
              تعديل حالة المراجعة
            </button>

            <div className="h-px bg-border my-2" />

            {/* باقي الإجراءات الموجودة عندك */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAction("approve-auctions-with-price", car.id);
              }}
              className="w-full text-right px-3 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition"
            >
              <CheckSquare size={16} />
              الموافقة على المزاد مع سعر
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAction("reject-auctions", car.id);
              }}
              className="w-full text-right px-3 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition"
            >
              <X size={16} />
              رفض المزاد
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAction("move-to-live", car.id);
              }}
              className="w-full text-right px-3 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition"
            >
              <Play size={16} />
              نقل إلى الحراج المباشر
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAction("move-to-instant", car.id);
              }}
              className="w-full text-right px-3 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition"
            >
              <Clock size={16} />
              نقل للمزادات الفورية
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAction("move-to-late", car.id);
              }}
              className="w-full text-right px-3 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition"
            >
              <AlertTriangle size={16} />
              نقل للمزادات المتأخرة
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAction("move-to-active", car.id);
              }}
              className="w-full text-right px-3 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition"
            >
              <CheckCircle size={16} />
              نقل للمزادات النشطة
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAction("move-to-pending", car.id);
              }}
              className="w-full text-right px-3 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition"
            >
              <RotateCcw size={16} />
              نقل للمزادات المعلقة
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAction("archive", car.id);
              }}
              className="w-full text-right px-3 py-2 hover:bg-border rounded-lg flex items-center gap-2 text-rose-500 transition"
            >
              <Archive size={16} />
              أرشفة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCarsPage() {
  const router = useLoadingRouter();

  const [cars, setCars] = useState<CarData[]>([]);
  const [selectedCars, setSelectedCars] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [showMoveToLiveDialog, setShowMoveToLiveDialog] = useState(false);
  const [moveToLiveCarIds, setMoveToLiveCarIds] = useState<number[]>([]);

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [formData, setFormData] = useState<CarFormData>({ price: "", id: "" });

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [carsToApprove, setCarsToApprove] = useState<number[]>([]);
  const [openingPrice, setOpeningPrice] = useState("");

  const [filters, setFilters] = useState<FilterOptions>({
    status: "",
    category: "",
    condition: "",
    transmission: "",
    dealer_id: "",
  });

  const [enumOptions, setEnumOptions] = useState<EnumOptionsResponse>({});
  const [loading, setLoading] = useState(false);

  /** AI Review modal */
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewCar, setReviewCar] = useState<CarData | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>("pending");
  const [reviewReason, setReviewReason] = useState<string>("");

  const bulkRef = useOutsideClose(showBulkActions, () => setShowBulkActions(false));

  useEffect(() => {
    fetchEnumOptions();
  }, []);

  useEffect(() => {
    fetchCars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, filters.status, filters.dealer_id]);

  const fetchCars = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(currentPage));

      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (filters.status) params.set("status", filters.status);
      if (filters.dealer_id) params.set("dealer_id", filters.dealer_id);

      const res = await api.get(`/api/admin/cars?${params.toString()}`);

      if (res.data?.status === "success") {
        // ✅ backend: data = array مباشرة
        setCars(Array.isArray(res.data.data) ? res.data.data : []);
        setCurrentPage(res.data.pagination?.current_page ?? currentPage);
        setTotalCount(res.data.pagination?.total ?? 0);
      } else {
        setCars([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching cars:", error);
      toast.error("فشل في تحميل السيارات");
      setCars([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnumOptions = async () => {
    try {
      const res = await api.get("/api/cars/enum-options");
      if (res.data?.status === "success") {
        setEnumOptions(res.data.data || {});
      }
    } catch (error) {
      console.error("Error fetching enum options:", error);
    }
  };

  const handleSelectCar = (carId: number, checked: boolean) => {
    setSelectedCars((prev) => {
      const next = new Set(prev);
      if (checked) next.add(carId);
      else next.delete(carId);
      setSelectAll(next.size > 0 && next.size === cars.length);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedCars(new Set(cars.map((c) => c.id)));
    else setSelectedCars(new Set());
    setSelectAll(checked);
  };

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      if (filters.category && (car.market_category || "") !== filters.category) return false;
      if (filters.condition && (car.condition || "") !== filters.condition) return false;
      if (filters.transmission && (car.transmission || "") !== filters.transmission) return false;
      return true;
    });
  }, [cars, filters.category, filters.condition, filters.transmission]);

  const stats = useMemo(() => {
    // إحصائيات الصفحة الحالية (وتوتال من الباك)
    const page = cars;
    return {
      total: totalCount,
      pending: page.filter((c) => c.auction_status === "pending").length,
      available: page.filter((c) => c.auction_status === "available").length,
      inAuction: page.filter((c) => c.auction_status === "in_auction").length,
      sold: page.filter((c) => c.auction_status === "sold").length,
    };
  }, [cars, totalCount]);

  /** ===== Bulk & other existing actions (كما هي عندك) ===== */
  const handleBulkAction = async (action: string, carId?: number) => {
    const carIds = carId ? [carId] : Array.from(selectedCars);

    if (carIds.length === 0) {
      toast.error("يرجى اختيار سيارة واحدة على الأقل");
      return;
    }

    if (action === "approve-auctions-with-price") {
      setCarsToApprove(carIds);
      if (carId) {
        const car = cars.find((c) => c.id === carId);
        setOpeningPrice(car?.evaluation_price ? String(car.evaluation_price) : "");
      } else {
        setOpeningPrice("");
      }
      setShowApproveModal(true);
      return;
    }

    try {
      switch (action) {
        case "approve-auctions": {
          const approveStatus = await api.put("/api/admin/cars/bulk/approve-reject", {
            ids: carIds,
            action: true,
          });
          toast.success(approveStatus.data.message);
          break;
        }
        case "reject-auctions": {
          const rejectStatus = await api.put("/api/admin/cars/bulk/approve-reject", {
            ids: carIds,
            action: false,
          });
          toast.success(rejectStatus.data.message);
          break;
        }
        case "move-to-live":
          setMoveToLiveCarIds(carIds);
          setShowMoveToLiveDialog(true);
          return;

        case "move-to-active": {
          const r = await api.put("/api/admin/auctions/bulk/move-to-status", {
            ids: carIds,
            status: "active",
          });
          toast.success(r.data.message);
          break;
        }
        case "move-to-instant": {
          const r = await api.put("/api/admin/auctions/bulk/move-to-status", {
            ids: carIds,
            status: "instant",
          });
          toast.success(r.data.message);
          break;
        }
        case "move-to-late": {
          const r = await api.put("/api/admin/auctions/bulk/move-to-status", {
            ids: carIds,
            status: "late",
          });
          toast.success(r.data.message);
          break;
        }
        case "move-to-pending": {
          const r = await api.put("/api/admin/auctions/bulk/move-to-status", {
            ids: carIds,
            status: "pending",
          });
          toast.success(r.data.message);
          break;
        }
        case "archive":
          toast.success("سيتم إضافة هذه الوظيفة قريباً");
          break;
      }

      await fetchCars();
      setSelectedCars(new Set());
      setSelectAll(false);
      setShowBulkActions(false);
    } catch (error: any) {
      console.error("Error performing bulk action:", error);
      toast.error(error.response?.data?.message || "فشل في تنفيذ العملية");
    }
  };

  const handleApproveWithPrice = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const approveStatus = await api.put("/api/admin/cars/bulk/approve-reject", {
        ids: carsToApprove,
        action: true,
        price: openingPrice,
      });

      toast.success(approveStatus.data.message);
      setShowApproveModal(false);
      setOpeningPrice("");
      setCarsToApprove([]);
      await fetchCars();
      setSelectedCars(new Set());
      setSelectAll(false);
      setShowBulkActions(false);
    } catch (error: any) {
      console.error("Error performing bulk action:", error);
      toast.error(error.response?.data?.message || "فشل في تنفيذ العملية");
    }
  };

  /** ===== Car Status update (متوافق 100% مع backend) ===== */
  const updateCarStatus = async (
    carId: number,
    status: "available" | "in_auction" | "sold"
  ) => {
    try {
      await api.put(`/api/admin/cars/${carId}/status`, { status });
      toast.success("تم تحديث حالة السيارة بنجاح");
      await fetchCars();
    } catch (error: any) {
      console.error("updateCarStatus error:", error);
      toast.error(error.response?.data?.message || "فشل في تحديث حالة السيارة");
    }
  };

  /** ===== AI Review update (متوافق مع /review-status) ===== */
  const openReviewModal = (car: CarData) => {
    setReviewCar(car);
    setReviewStatus((car.review_status || "pending").toString());
    setReviewReason(car.review_reason || "");
    setShowReviewModal(true);
  };

  const submitReviewStatus = async (e: FormEvent) => {
    e.preventDefault();
    if (!reviewCar) return;

    try {
      await api.put(`/api/admin/cars/${reviewCar.id}/review-status`, {
        review_status: reviewStatus,
        review_reason: reviewReason?.trim() ? reviewReason.trim() : null,
      });
      toast.success("تم تحديث حالة المراجعة");
      setShowReviewModal(false);
      setReviewCar(null);
      setReviewReason("");
      await fetchCars();
    } catch (error: any) {
      console.error("submitReviewStatus error:", error);
      toast.error(error.response?.data?.message || "فشل في تحديث حالة المراجعة");
    }
  };

  /** ===== Price Modal (ظبطنا المسافات + بدون تعديل state بشكل مباشر) ===== */
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitOpenPrice = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("يجب تسجيل الدخول أولاً");

      const payload = { id: formData.id, price: formData.price };

      const res = await api.put(`/api/admin/auctions/${payload.id}/set-open-price`, payload);

      if (res.data?.status === "success") {
        toast.success("تم وضع السعر الافتراضي");
        setShowPriceModal(false);
        setFormData({ id: "", price: "" });
        await fetchCars();
      } else {
        toast.error("حصل خطأ ما");
      }
    } catch (error: any) {
      console.error("handleSubmitOpenPrice error:", error);
      toast.error(error?.message || "خطأ في حفظ البيانات");
    }
  };

  const getOwnerName = (car: CarData) => {
    if (car.dealer?.user) {
      return `${car.dealer.user.first_name} ${car.dealer.user.last_name} (معرض)`;
    }
    if (car.user) {
      return `${car.user.first_name} ${car.user.last_name}`;
    }
    return "غير محدد";
  };

  const getRowAuction = (car: CarData) => {
    const list = car.auctions || [];
    return (
      list.find((a) => (a.status || "").toLowerCase() === "active") ||
      list.find((a) => (a.status || "").toLowerCase() === "scheduled") ||
      list[0] ||
      null
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">إدارة السيارات</h1>
          <p className="text-foreground/70 mt-2">إدارة وتنظيم جميع السيارات في النظام</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCars}
            className="bg-card border border-border text-foreground/80 hover:bg-border hover:text-foreground transition-all duration-200 px-4 py-2 rounded-xl flex items-center"
          >
            <RefreshCw className={cn("w-4 h-4 ml-2", loading && "animate-spin")} />
            تحديث
          </button>
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
            <CarIcon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Stats (احترافية + واضحة أنها إجمالي من الباك) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <CardStat title="إجمالي السيارات" value={stats.total} icon={<CarIcon className="w-6 h-6 text-primary" />} />
        <CardStat title="قيد المراجعة (الصفحة)" value={stats.pending} icon={<Clock className="w-6 h-6 text-amber-400" />} />
        <CardStat title="متاح (الصفحة)" value={stats.available} icon={<CheckCircle className="w-6 h-6 text-emerald-400" />} />
        <CardStat title="في المزاد (الصفحة)" value={stats.inAuction} icon={<Play className="w-6 h-6 text-blue-400" />} />
        <CardStat title="تم البيع (الصفحة)" value={stats.sold} icon={<CheckSquare className="w-6 h-6 text-rose-400" />} />
      </div>

      {/* Main */}
      <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Search & Filters */}
        <div className="border-b border-border p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
              <div className="relative flex-grow">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 w-5 h-5" />
                <input
                  type="text"
                  placeholder="البحث بالماركة، الموديل، VIN أو اللوحة..."
                  value={searchTerm}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setSearchTerm(e.target.value);
                  }}
                  className="w-full bg-background/50 border border-border rounded-xl py-2 pr-10 pl-4 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <button
                onClick={() => setShowFilters((v) => !v)}
                className="bg-background border border-border text-foreground/80 hover:bg-border hover:text-foreground transition-all duration-200 px-4 py-2 rounded-xl flex items-center"
              >
                <Filter className="w-4 h-4 ml-2" />
                فلاتر
                <ChevronDown className={cn("w-4 h-4 mr-2 transition-transform", showFilters && "rotate-180")} />
              </button>
            </div>

            {selectedCars.size > 0 && (
              <div className="flex items-center gap-3" ref={bulkRef}>
                <span className="text-sm text-foreground/70">تم اختيار {selectedCars.size} سيارة</span>

                <div className="relative">
                  <button
                    onClick={() => setShowBulkActions((v) => !v)}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-all duration-200 flex items-center"
                  >
                    إجراءات جماعية
                    <ChevronDown className={cn("w-4 h-4 mr-2 transition-transform", showBulkActions && "rotate-180")} />
                  </button>

                  {showBulkActions && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-2xl z-10 overflow-hidden">
                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => handleBulkAction("approve-auctions")}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition"
                        >
                          <CheckSquare size={16} />
                          الموافقة على المزادات
                        </button>
                        <button
                          onClick={() => handleBulkAction("reject-auctions")}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition"
                        >
                          <X size={16} />
                          رفض المزادات
                        </button>
                        <button
                          onClick={() => handleBulkAction("move-to-live")}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition"
                        >
                          <Play size={16} />
                          نقل إلى الحراج المباشر
                        </button>
                        <button
                          onClick={() => handleBulkAction("move-to-instant")}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition"
                        >
                          <Clock size={16} />
                          نقل الى المزادات الفورية
                        </button>
                        <button
                          onClick={() => handleBulkAction("move-to-late")}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition"
                        >
                          <AlertTriangle size={16} />
                          نقل إلى المزادات المتأخرة
                        </button>
                        <button
                          onClick={() => handleBulkAction("move-to-active")}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition"
                        >
                          <CheckCircle size={16} />
                          نقل إلى المزادات النشطة
                        </button>
                        <button
                          onClick={() => handleBulkAction("move-to-pending")}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition"
                        >
                          <RotateCcw size={16} />
                          نقل إلى المزادات المعلقة
                        </button>
                        <button
                          onClick={() => handleBulkAction("archive")}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 text-rose-500 transition"
                        >
                          <Archive size={16} />
                          أرشفة
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-background/50 rounded-xl mt-4">
              {/* backend status filter */}
              <select
                value={filters.status}
                onChange={(e) => {
                  setCurrentPage(1);
                  setFilters((prev) => ({ ...prev, status: e.target.value }));
                }}
                className="bg-background border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {CAR_STATUS_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              {/* client category filter */}
              <select
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                className="bg-background border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">كل الفئات</option>
                {(enumOptions.market_categories || enumOptions.categories || []).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.condition}
                onChange={(e) => setFilters((prev) => ({ ...prev, condition: e.target.value }))}
                className="bg-background border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">كل الحالات</option>
                {(enumOptions.conditions || []).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.transmission}
                onChange={(e) => setFilters((prev) => ({ ...prev, transmission: e.target.value }))}
                className="bg-background border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">كل أنواع الناقل</option>
                {(enumOptions.transmissions || []).map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-border/50 border-b border-border">
                  <th className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                    />
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">السيارة</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">المالك</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">حالة السيارة</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">مراجعة AI</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">السعر التقييمي</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">أقل مرغوب</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">أعلى مرغوب</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">أقل مزايدة</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">أعلى مزايدة</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">تاريخ الإضافة</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">الإجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y border-border">
                {filteredCars.map((car) => {
                  const auc = getRowAuction(car);

                  return (
                    <tr key={car.id} className="hover:bg-border/50 transition-colors duration-200">
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCars.has(car.id)}
                          onChange={(e) => handleSelectCar(car.id, e.target.checked)}
                          className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="bg-primary p-2 rounded-xl">
                            <CarIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="mr-4">
                            <div
                              className="text-sm font-medium text-foreground cursor-pointer hover:text-primary"
                              onClick={() => router.push(`/admin/cars/${car.id}`)}
                            >
                              {car.make} {car.model}
                            </div>
                            <div className="text-xs text-foreground/60 mt-1">
                              {car.year} • {car.plate || "بدون لوحة"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-foreground/80">{getOwnerName(car)}</td>

                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                            getCarStatusBadge(car.auction_status)
                          )}
                        >
                          {getCarStatusText(car.auction_status)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                              getReviewBadge(car.review_status)
                            )}
                          >
                            <Sparkles className="w-3.5 h-3.5 ml-1" />
                            {getReviewText(car.review_status)}
                          </span>

                          {car.review_score !== null && car.review_score !== undefined && String(car.review_score).trim() !== "" && (
                            <span className="text-xs text-foreground/60 tabular-nums">
                              ({toNum(car.review_score)})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <PriceWithIcon iconSize={18} className="text-sm font-medium" price={toNum(car.evaluation_price)} />
                      </td>

                      <td className="px-6 py-4 text-sm text-foreground/80">
                        <PriceWithIcon iconSize={18} price={toNum(car.min_price)} />
                      </td>

                      <td className="px-6 py-4 text-sm text-foreground/80">
                        <PriceWithIcon iconSize={18} price={toNum(car.max_price)} />
                      </td>

                      <td className="px-6 py-4 text-sm text-foreground/80">
                        <PriceWithIcon iconSize={18} price={toNum(auc?.minimum_bid)} />
                      </td>

                      <td className="px-6 py-4 text-sm text-foreground/80">
                        <PriceWithIcon iconSize={18} price={toNum(auc?.maximum_bid)} />
                      </td>

                      <td className="px-6 py-4 text-sm text-foreground/80">
                        {new Date(car.created_at).toLocaleDateString("ar-SA")}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/cars/${car.id}`)}
                            className="text-primary hover:text-primary/80 hover:bg-primary/10 p-2 rounded-lg transition-all duration-200"
                            title="عرض التفاصيل"
                          >
                            <Eye size={16} />
                          </button>

                          {/* زر تحديد سعر البداية (لو عندك auction id) */}
                          {auc?.id && car.auction_status === "in_auction" && (
                            <button
                              onClick={() => {
                                setFormData({
                                  id: auc.id,
                                  price: car.evaluation_price ? String(car.evaluation_price) : "",
                                });
                                setShowPriceModal(true);
                              }}
                              className="bg-primary hover:bg-primary/90 text-white px-3 py-1 rounded-lg text-xs transition-all duration-200"
                              title="تحديد سعر بداية المزاد"
                            >
                              حدد السعر
                            </button>
                          )}

                          <ActionsMenu
                            car={car}
                            onAction={handleBulkAction}
                            onOpenReview={openReviewModal}
                            onSetCarStatus={updateCarStatus}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!loading && filteredCars.length === 0 && (
              <div className="text-center py-12">
                <CarIcon className="mx-auto h-12 w-12 text-foreground/40 mb-4" />
                <h3 className="text-lg font-medium text-foreground/70">لا توجد سيارات</h3>
                <p className="text-foreground/50 mt-1">لم يتم العثور على سيارات تطابق معايير البحث.</p>
              </div>
            )}

            {loading && (
              <div className="py-10 text-center text-foreground/60">جاري التحميل...</div>
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <Pagination
          className="pagination-bar"
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* ✅ Price Modal (مسافات مظبوطة + شكل احترافي) */}
      <Modal show={showPriceModal} onClose={() => setShowPriceModal(false)} title="تحديد سعر بداية المزاد">
        <form onSubmit={handleSubmitOpenPrice} className="space-y-5">
          <input type="text" id="id" name="id" value={formData.id} className="hidden" readOnly />

          <div className="space-y-2">
            <label htmlFor="price" className="block text-sm font-medium text-foreground">
              سعر بداية المزاد
            </label>
            <input
              type="text"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              placeholder="مثال: 50000"
              required
            />
            <p className="text-xs text-foreground/60">سيتم استخدام هذا السعر كبداية للمزاد.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-xl transition-all duration-200"
            >
              حفظ
            </button>
            <button
              type="button"
              onClick={() => setShowPriceModal(false)}
              className="flex-1 bg-border hover:bg-border/80 text-foreground py-3 px-4 rounded-xl transition-all duration-200"
            >
              إغلاق
            </button>
          </div>
        </form>
      </Modal>

      {/* ✅ Approve Modal (مسافات مظبوطة) */}
      <Modal show={showApproveModal} onClose={() => setShowApproveModal(false)} title="الموافقة وتحديد سعر البداية">
        <form onSubmit={handleApproveWithPrice} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="openingPrice" className="block text-sm font-medium text-foreground">
              سعر بداية المزاد
            </label>
            <input
              type="number"
              id="openingPrice"
              name="openingPrice"
              value={openingPrice}
              onChange={(e) => setOpeningPrice(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              placeholder="مثال: 50000"
              required
              min={0}
            />
            <p className="text-xs text-foreground/60">سيتم الموافقة وتعيين السعر كبداية.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-xl transition-all duration-200"
            >
              موافق
            </button>
            <button
              type="button"
              onClick={() => setShowApproveModal(false)}
              className="flex-1 bg-border hover:bg-border/80 text-foreground py-3 px-4 rounded-xl transition-all duration-200"
            >
              إغلاق
            </button>
          </div>
        </form>
      </Modal>

      {/* ✅ AI Review Modal (جديد + احترافي + مسافات مظبوطة) */}
      <Modal
        show={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setReviewCar(null);
        }}
        title="تعديل حالة مراجعة الذكاء الاصطناعي"
      >
        <form onSubmit={submitReviewStatus} className="space-y-5">
          <div className="rounded-xl border border-border bg-background/50 p-4">
            <div className="text-sm font-medium text-foreground">
              {reviewCar ? `${reviewCar.make} ${reviewCar.model} • ${reviewCar.year}` : "—"}
            </div>
            <div className="text-xs text-foreground/60 mt-1">
              الحالة الحالية: {reviewCar ? getReviewText(reviewCar.review_status) : "—"}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">حالة المراجعة</label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              >
                {REVIEW_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">سبب (اختياري)</label>
              <textarea
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none min-h-[110px] resize-none"
                placeholder="اكتب سبب الرفض/ملاحظات المراجعة إن وجدت..."
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-xl transition-all duration-200"
            >
              حفظ التغييرات
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReviewModal(false);
                setReviewCar(null);
              }}
              className="flex-1 bg-border hover:bg-border/80 text-foreground py-3 px-4 rounded-xl transition-all duration-200"
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      <MoveToLiveDialog
        open={showMoveToLiveDialog}
        onClose={() => setShowMoveToLiveDialog(false)}
        carIds={moveToLiveCarIds}
        onSuccess={() => {
          setSelectedCars(new Set());
          setSelectAll(false);
          fetchCars();
          setShowMoveToLiveDialog(false);
        }}
      />
    </div>
  );
}
