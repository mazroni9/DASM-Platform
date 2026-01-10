"use client";

import { useState, useMemo, useEffect } from "react";
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
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";

// Helper to get status text and color
const getStatusConfig = (status: string) => {
  const statusMap: {
    [key: string]: {
      text: string;
      color: string;
      bg: string;
      border: string;
      icon: React.ElementType;
    };
  } = {
    pending: {
      text: "بانتظار الدفع",
      color: "text-amber-400",
      bg: "bg-amber-500/20",
      border: "border-amber-500/30",
      icon: CreditCard,
    },
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
      text: status,
      color: "text-gray-400",
      bg: "bg-gray-500/20",
      border: "border-gray-500/30",
      icon: Clock,
    }
  );
};

export default function MyPurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const router = useLoadingRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/dashboard/my-purchases");
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    async function fetchPurchases() {
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get("/api/settlements");
        if (response.data.status === "success") {
          setPurchases(response.data.data.data);
        } else {
          setError("Failed to fetch purchases.");
        }
      } catch (err) {
        setError("An error occurred while fetching purchases.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPurchases();
  }, [isLoggedIn]);

  // Filter purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase: any) => {
      const itemName = `${purchase.car.make} ${purchase.car.model}`;
      const category = purchase.car.market_category || "سيارات";
      const matchesSearch =
        itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || purchase.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [purchases, searchTerm, statusFilter, categoryFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalAmount = purchases.reduce(
      (sum, purchase: any) => sum + (Number(purchase.buyer_net_amount) || 0),
      0
    );
    return {
      total: purchases.length,
      completed: purchases.filter((p: any) => p.status === "completed").length,
      pending: purchases.filter((p: any) => p.status === "pending").length,
      totalAmount: totalAmount,
    };
  }, [purchases]);

  const handlePayNow = (purchaseId: string) => {
    // Simulate payment process
    setPurchases(
      purchases.map((p: any) =>
        p.id === purchaseId ? { ...p, status: "paid_pending_delivery" } : p
      )
    );
  };

  const handleConfirmReceipt = (purchaseId: string) => {
    // Simulate receipt confirmation
    setPurchases(
      purchases.map((p: any) =>
        p.id === purchaseId ? { ...p, status: "completed" } : p
      )
    );
  };

  const handleOpenDispute = (purchaseId: string) => {
    // Simulate opening dispute
    alert("سيتم فتح صفحة النزاع (محاكاة).");
  };

  const getCategories = () => {
    return [
      ...new Set(purchases.map((p: any) => p.car.market_category || "سيارات")),
    ];
  };

  if (loading) {
    return <div className="text-center py-10">جاري تحميل مشترياتك...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card backdrop-blur-2xl border border-border rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary rounded-xl">
                <ShoppingBag className="w-6 h-6 text-white" />
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
                  <span className="text-xs text-foreground/70">مكتملة</span>
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
                  {(stats.totalAmount || 0).toLocaleString("ar-SA")} ريال
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <LoadingLink
              href="/auctions"
              className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl border border-primary/30 hover:scale-105 transition-all duration-300 group"
            >
              <Sparkles className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="font-medium">استكشاف المزادات</span>
            </LoadingLink>
          </div>
        </div>
      </motion.div>

      {/* Filters and Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/70" />
              <input
                type="text"
                placeholder="ابحث في المشتريات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background/50 border border-border rounded-xl pl-4 pr-10 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500/50 transition-colors"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">بانتظار الدفع</option>
              <option value="paid_pending_delivery">تم الدفع</option>
              <option value="shipped">جاري الشحن</option>
              <option value="delivered_pending_confirmation">
                بانتظار التأكيد
              </option>
              <option value="completed">مكتملة</option>
              <option value="disputed">نزاع</option>
            </select>

            {/* Category Filter */}
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:scale-105 transition-all duration-300"
                >
                  <Sparkles className="w-4 h-4" />
                  استكشاف المزادات المتاحة
                </LoadingLink>
              )}
            </div>
          </div>
        ) : (
          filteredPurchases.map((purchase: any, index) => {
            const statusConfig = getStatusConfig(purchase.status);
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={purchase.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6 hover:border-border/70 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 lg:w-32 lg:h-32 bg-background rounded-xl overflow-hidden">
                      <img
                        src={purchase.car.images?.[0] || "/placeholder-car.jpg"}
                        alt={`${purchase.car.make} ${purchase.car.model}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            "https://via.placeholder.com/200x200?text=No+Image";
                        }}
                      />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-foreground/80 transition-colors mb-2">
                          {purchase.car.make} {purchase.car.model}
                        </h3>

                        <div className="flex flex-wrap gap-3 text-sm text-foreground/70 mb-3">
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            <span>
                              {purchase.car.market_category || "سيارات"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              انتهى في{" "}
                              {new Date(purchase.created_at).toLocaleDateString(
                                "ar-SA"
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>
                              {purchase.auction?.bids_count || 0} مزايدة
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-foreground/70">
                          <span>البائع:</span>
                          <span className="text-blue-300">
                            {purchase.seller.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-start lg:items-end gap-2">
                        <div className="text-2xl font-bold text-secondary">
                          {purchase.buyer_net_amount} ريال
                        </div>

                        <div
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm",
                            statusConfig.bg,
                            statusConfig.border,
                            statusConfig.color
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.text}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
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

                      {purchase.status === "delivered_pending_confirmation" && (
                        <button
                          onClick={() => handleConfirmReceipt(purchase.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg border border-blue-700 hover:bg-blue-700 transition-all duration-300 group/confirm"
                        >
                          <CheckCircle className="w-4 h-4 transition-transform group-hover/confirm:scale-110" />
                          <span className="font-medium">تأكيد الاستلام</span>
                        </button>
                      )}

                      <LoadingLink
                        href={`/carDetails/${purchase.car.id}`}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-card text-foreground rounded-lg border border-border hover:bg-muted transition-all duration-300 group/view"
                      >
                        <Eye className="w-4 h-4 transition-transform group-hover/view:scale-110" />
                        <span className="font-medium">عرض تفاصيل العنصر</span>
                      </LoadingLink>

                      {purchase.status !== "completed" && (
                        <button
                          onClick={() => handleOpenDispute(purchase.id)}
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
    </div>
  );
}
