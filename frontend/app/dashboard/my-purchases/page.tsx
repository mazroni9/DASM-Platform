"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import LoadingLink from "@/components/LoadingLink";
import {
  ShoppingBag,
  CreditCard,
  Truck,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  Calendar,
  DollarSign,
  Package,
  Clock,
  Eye,
  Sparkles,
  Loader2,
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { Pagination } from "react-laravel-paginex";

type Settlement = {
  auction_id: number;
  seller_id: number;
  buyer_id: number;
  car_id: number;
  buyer_net_amount: number | string | null;
  status: string;

  car?: any;
  auction?: any;
  buyer?: any;
  seller?: any;
};

const getStatusConfig = (status: string) => {
  const statusMap: Record<
    string,
    {
      text: string;
      color: string;
      bg: string;
      border: string;
      icon: React.ElementType;
    }
  > = {
    pending: {
      text: "بانتظار الدفع",
      color: "text-amber-400",
      bg: "bg-amber-500/20",
      border: "border-amber-500/30",
      icon: CreditCard,
    },
    confirmed: {
      text: "تم التأكيد",
      color: "text-emerald-400",
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/30",
      icon: CheckCircle,
    },

    // احتياط لو أضفت حالات لاحقاً
    paid_pending_delivery: {
      text: "تم الدفع - بانتظار التسليم",
      color: "text-blue-400",
      bg: "bg-blue-500/20",
      border: "border-blue-500/30",
      icon: ShoppingBag,
    },
    shipped: {
      text: "جاري الشحن",
      color: "text-cyan-400",
      bg: "bg-cyan-500/20",
      border: "border-cyan-500/30",
      icon: Truck,
    },
    delivered_pending_confirmation: {
      text: "تم التسليم - بانتظار التأكيد",
      color: "text-purple-400",
      bg: "bg-purple-500/20",
      border: "border-purple-500/30",
      icon: Truck,
    },
    completed: {
      text: "مكتملة",
      color: "text-emerald-400",
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/30",
      icon: CheckCircle,
    },
    disputed: {
      text: "نزاع مفتوح",
      color: "text-rose-400",
      bg: "bg-rose-500/20",
      border: "border-rose-500/30",
      icon: AlertCircle,
    },
  };

  return (
    statusMap[status] || {
      text: status || "غير معروف",
      color: "text-gray-400",
      bg: "bg-gray-500/20",
      border: "border-gray-500/30",
      icon: Clock,
    }
  );
};

function safeUserName(u: any) {
  if (!u) return "غير معروف";
  const full = `${u.first_name || ""} ${u.last_name || ""}`.trim();
  return full || u.name || u.email || "غير معروف";
}

function normalizeImages(images: any): string[] {
  if (!images) return [];
  if (Array.isArray(images)) {
    // array of strings OR array of objects
    if (images.length && typeof images[0] === "string") return images;
    if (images.length && typeof images[0] === "object") {
      return images
        .map((x: any) => x?.url || x?.path || x?.image || x?.src)
        .filter(Boolean);
    }
    return [];
  }

  if (typeof images === "string") {
    // maybe JSON string
    try {
      const parsed = JSON.parse(images);
      return normalizeImages(parsed);
    } catch {
      // maybe single URL
      if (images.startsWith("http") || images.startsWith("/")) return [images];
      return [];
    }
  }

  return [];
}

export default function MyPurchasesPage() {
  const { isLoggedIn, user } = useAuth();
  const router = useLoadingRouter();

  const [purchases, setPurchases] = useState<Settlement[]>([]);
  const [paginationData, setPaginationData] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const paginationOptions = {
    containerClass: "pagination-container",
    prevButtonClass: "prev-button-class",
    nextButtonText: "التالي",
    prevButtonText: "السابق",
  };

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/dashboard/my-purchases");
    }
  }, [isLoggedIn, router]);

  const fetchPurchases = async (pageNum = 1) => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await api.get(`/api/settlements?page=${pageNum}`);

      if (response.data?.status === "success") {
        const paginated = response.data.data; // Laravel paginator
        const rows: Settlement[] = Array.isArray(paginated?.data)
          ? paginated.data
          : [];

        setPaginationData(paginated);

        // ✅ صفحة "مشترياتي" = أنا buyer فقط
        const myId = user?.id;
        const onlyMyPurchases = myId
          ? rows.filter((s) => s.buyer_id === myId)
          : rows;

        setPurchases(onlyMyPurchases);
      } else {
        setError("Failed to fetch purchases.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching purchases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const getCategories = () => {
    const cats = purchases
      .map((p) => p?.car?.market_category || "سيارات")
      .filter(Boolean);
    return [...new Set(cats)];
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const make = (purchase.car?.make || "").toString();
      const model = (purchase.car?.model || "").toString();
      const itemName = `${make} ${model}`.trim() || `سيارة #${purchase.car_id}`;

      const category = (purchase.car?.market_category || "سيارات").toString();

      const matchesSearch =
        itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (purchase.status || "").toLowerCase() === statusFilter;

      const matchesCategory =
        categoryFilter === "all" || category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [purchases, searchTerm, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const totalAmount = purchases.reduce((sum, p) => {
      const v = Number(p.buyer_net_amount ?? 0);
      return sum + (Number.isFinite(v) ? v : 0);
    }, 0);

    const completedCount = purchases.filter((p) =>
      ["confirmed", "completed"].includes((p.status || "").toLowerCase()),
    ).length;

    const pendingCount = purchases.filter(
      (p) => (p.status || "").toLowerCase() === "pending",
    ).length;

    return {
      total: purchases.length,
      completed: completedCount,
      pending: pendingCount,
      totalAmount,
    };
  }, [purchases]);

  const getDealDateText = (purchase: Settlement) => {
    const endTime = purchase.auction?.end_time;
    const createdAt = purchase.auction?.created_at;

    const raw = endTime || createdAt || null;
    if (!raw) return "غير متاح";

    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "غير متاح";

    return d.toLocaleDateString("ar-SA");
  };

  const handleOpenDispute = (_auctionId: number) => {
    router.push("/support");
  };

  const changePage = (p: any) => {
    fetchPurchases(p.page);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-foreground/70">جاري تحميل مشترياتك...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card backdrop-blur-2xl border border-border rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary text-primary-foreground rounded-xl">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  مشترياتي <span className="text-primary">({stats.total})</span>
                </h1>
                <p className="text-foreground/70 text-sm mt-1">
                  إدارة وتتبع جميع مشترياتك من المزادات
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-background/40 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-blue-500/20 rounded">
                    <Package className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-xs text-foreground/70">المجموع</span>
                </div>
                <p className="text-lg font-bold text-foreground mt-1">
                  {stats.total}
                </p>
              </div>

              <div className="bg-background/40 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-emerald-500/20 rounded">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-xs text-foreground/70">
                    مكتملة/مؤكدة
                  </span>
                </div>
                <p className="text-lg font-bold text-emerald-400 mt-1">
                  {stats.completed}
                </p>
              </div>

              <div className="bg-background/40 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-amber-500/20 rounded">
                    <Clock className="w-3 h-3 text-amber-400" />
                  </div>
                  <span className="text-xs text-foreground/70">
                    بانتظار الدفع
                  </span>
                </div>
                <p className="text-lg font-bold text-amber-400 mt-1">
                  {stats.pending}
                </p>
              </div>

              <div className="bg-background/40 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-cyan-500/20 rounded">
                    <DollarSign className="w-3 h-3 text-cyan-400" />
                  </div>
                  <span className="text-xs text-foreground/70">
                    إجمالي المشتريات
                  </span>
                </div>
                <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400 mt-1">
                  {Number(stats.totalAmount || 0).toLocaleString("ar-SA")} ريال
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <LoadingLink
              href="/auctions"
              className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl border border-primary/30 hover:scale-105 transition-all duration-300 group"
            >
              <Sparkles className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="font-medium">استكشاف المزادات</span>
            </LoadingLink>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/70" />
              <input
                type="text"
                placeholder="ابحث في المشتريات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background/50 border border-border rounded-xl pl-4 pr-10 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500/50 transition-colors"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">بانتظار الدفع</option>
              <option value="confirmed">تم التأكيد</option>
              {/* احتياطي للمستقبل */}
              <option value="completed">مكتملة</option>
            </select>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-green-500/50 transition-colors"
            >
              <option value="all">جميع الفئات</option>
              {getCategories().map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <Filter className="w-4 h-4" />
            <span>
              عرض {filteredPurchases.length} من {purchases.length} عملية شراء
            </span>
          </div>
        </div>
      </motion.div>

      {/* Purchases List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {filteredPurchases.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-card/30 rounded-2xl border border-border max-w-md mx-auto">
              <ShoppingBag className="w-16 h-16 text-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground/70 mb-2">
                {searchTerm ||
                statusFilter !== "all" ||
                categoryFilter !== "all"
                  ? "لا توجد نتائج"
                  : "لا توجد مشتريات"}
              </h3>
              <p className="text-foreground/50 text-sm mb-4">
                {searchTerm ||
                statusFilter !== "all" ||
                categoryFilter !== "all"
                  ? "لم نتمكن من العثور على مشتريات تطابق معايير البحث"
                  : "لم تقم بشراء أي عناصر من المزادات بعد"}
              </p>

              {searchTerm ||
              statusFilter !== "all" ||
              categoryFilter !== "all" ? (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setCategoryFilter("all");
                  }}
                  className="px-4 py-2 bg-primary/20 text-primary rounded-lg border border-primary/30 hover:bg-primary/30 transition-colors"
                >
                  إعادة تعيين الفلتر
                </button>
              ) : (
                <LoadingLink
                  href="/auctions"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:scale-105 transition-all duration-300"
                >
                  <Sparkles className="w-4 h-4" />
                  استكشاف المزادات المتاحة
                </LoadingLink>
              )}
            </div>
          </div>
        ) : (
          filteredPurchases.map((purchase, index) => {
            const statusConfig = getStatusConfig(purchase.status);
            const StatusIcon = statusConfig.icon;

            const make = purchase.car?.make || "";
            const model = purchase.car?.model || "";
            const category = purchase.car?.market_category || "سيارات";

            const images = normalizeImages(purchase.car?.images);
            const cover =
              images?.[0] ||
              "https://cdn.pixabay.com/photo/2012/05/29/00/43/car-49278_1280.jpg";

            const price = Number(purchase.buyer_net_amount ?? 0);
            const priceText = Number.isFinite(price)
              ? `${price.toLocaleString("ar-SA")} ريال`
              : `${purchase.buyer_net_amount ?? 0} ريال`;

            const sellerName = safeUserName(purchase.seller);

            const carId = purchase.car?.id ?? purchase.car_id;

            return (
              <motion.div
                key={purchase.auction_id ?? `${purchase.car_id}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6 hover:border-border/70 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 lg:w-32 lg:h-32 bg-background rounded-xl overflow-hidden">
                      <img
                        src={cover}
                        alt={`${make} ${model}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            "https://cdn.pixabay.com/photo/2012/05/29/00/43/car-49278_1280.jpg";
                        }}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-foreground/80 transition-colors mb-2">
                          {make} {model || `#${purchase.car_id}`}
                        </h3>

                        <div className="flex flex-wrap gap-3 text-sm text-foreground/70 mb-3">
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            <span>{category}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              تاريخ الصفقة: {getDealDateText(purchase)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>رقم المزاد #{purchase.auction_id}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-foreground/70">
                          <span>البائع:</span>
                          <span className="text-blue-300">{sellerName}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-start lg:items-end gap-2">
                        <div className="text-2xl font-bold text-secondary">
                          {priceText}
                        </div>

                        <div
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm",
                            statusConfig.bg,
                            statusConfig.border,
                            statusConfig.color,
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.text}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                      {purchase.status === "pending" && (
                        <LoadingLink
                          href={`/auctions/purchase-confirmation/${purchase.auction_id}`}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg border border-emerald-700 hover:bg-emerald-700 transition-all duration-300 group/pay"
                        >
                          <CreditCard className="w-4 h-4 transition-transform group-hover/pay:scale-110" />
                          <span className="font-medium">إتمام الدفع</span>
                        </LoadingLink>
                      )}

                      <LoadingLink
                        href={`/carDetails/${carId}`}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-card text-foreground rounded-lg border border-border hover:bg-muted transition-all duration-300 group/view"
                      >
                        <Eye className="w-4 h-4 transition-transform group-hover/view:scale-110" />
                        <span className="font-medium">عرض تفاصيل السيارة</span>
                      </LoadingLink>

                      {purchase.status !== "confirmed" && (
                        <button
                          onClick={() => handleOpenDispute(purchase.auction_id)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg border border-red-700 hover:bg-red-700 transition-all duration-300 group/dispute"
                        >
                          <AlertCircle className="w-4 h-4 transition-transform group-hover/dispute:scale-110" />
                          <span className="font-medium">فتح نزاع</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Pagination */}
      {paginationData && paginationData?.last_page > 1 && (
        <div className="flex justify-center pt-2">
          <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-4">
            <Pagination
              data={paginationData}
              options={paginationOptions}
              changePage={changePage}
            />
          </div>
        </div>
      )}
    </div>
  );
}

