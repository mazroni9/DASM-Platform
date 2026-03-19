"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import LoadingLink from "@/components/LoadingLink";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { Pagination } from "react-laravel-paginex";
import {
  Package,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  Loader2,
  AlertCircle,
  User,
} from "lucide-react";

type Settlement = {
  id?: number;
  auction_id: number;
  car_id: number;
  final_price?: number;
  vehicle_price_total?: number;
  car_price?: number;
  buyer_net_amount?: number;
  status: string;
  car?: { make?: string; model?: string; market_category?: string; images?: unknown };
  buyer?: { first_name?: string; last_name?: string };
};

const getStatusConfig = (status: string) => {
  const m: Record<string, { text: string; color: string; bg: string; border: string; icon: typeof Clock }> = {
    pending: { text: "بانتظار الدفع", color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30", icon: Clock },
    confirmed: { text: "تم التأكيد", color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30", icon: CheckCircle },
    completed: { text: "مكتملة", color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30", icon: CheckCircle },
  };
  return m[status?.toLowerCase()] ?? { text: status || "—", color: "text-gray-400", bg: "bg-gray-500/20", border: "border-gray-500/30", icon: Package };
};

function safeUserName(u: { first_name?: string; last_name?: string } | undefined): string {
  if (!u) return "غير معروف";
  const t = `${u.first_name || ""} ${u.last_name || ""}`.trim();
  return t || "غير معروف";
}

function getFirstImage(images: unknown): string {
  if (!images) return "/placeholder-car.png";
  if (Array.isArray(images) && images.length) return String(images[0]);
  if (typeof images === "string") {
    try {
      const p = JSON.parse(images);
      return Array.isArray(p) && p[0] ? String(p[0]) : "/placeholder-car.png";
    } catch {
      return images.startsWith("http") || images.startsWith("/") ? images : "/placeholder-car.png";
    }
  }
  return "/placeholder-car.png";
}

export default function MySalesPage() {
  const { isLoggedIn } = useAuth();
  const router = useLoadingRouter();
  const [sales, setSales] = useState<Settlement[]>([]);
  const [paginationData, setPaginationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = useCallback(
    async (page = 1) => {
      if (!isLoggedIn) return;
      setError(null);
      setLoading(true);
      try {
        const res = await api.get(`/api/settlements?seller=me&page=${page}&per_page=15`);
        if (res.data?.status === "success") {
          const p = res.data.data;
          const rows = Array.isArray(p?.data) ? p.data : [];
          setPaginationData(p);
          setSales(rows);
        } else {
          setError("فشل تحميل المبيعات");
        }
      } catch {
        setError("حدث خطأ أثناء تحميل المبيعات");
        setSales([]);
      } finally {
        setLoading(false);
      }
    },
    [isLoggedIn]
  );

  useEffect(() => {
    if (!isLoggedIn) router.push("/auth/login?returnUrl=/dashboard/my-sales");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (isLoggedIn) fetchSales(1);
  }, [isLoggedIn, fetchSales]);

  const stats = useMemo(() => {
    const price = (s: Settlement) => Number(s.vehicle_price_total ?? s.final_price ?? s.car_price ?? 0);
    const totalRevenue = sales.reduce((sum, s) => sum + price(s), 0);
    const netRevenue = sales.reduce((sum, s) => sum + Number(s.buyer_net_amount ?? 0), 0);
    return {
      total: sales.length,
      completed: sales.filter((s) => ["completed", "confirmed"].includes((s.status || "").toLowerCase())).length,
      pending: sales.filter((s) => (s.status || "").toLowerCase() === "pending").length,
      netRevenue,
      totalRevenue,
    };
  }, [sales]);

  const changePage = (p: { page: number }) => fetchSales(p.page);

  if (loading && sales.length === 0) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
        <p className="text-foreground/70">جاري تحميل مبيعاتك...</p>
      </div>
    );
  }

  if (error && sales.length === 0) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive font-medium mb-4">{error}</p>
        <button onClick={() => fetchSales(1)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card backdrop-blur-2xl border border-border rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              مبيعاتي <span className="text-primary">({stats.total})</span>
            </h1>
            <p className="text-foreground/70 text-sm mt-1">إدارة وتتبع مبيعاتك في المزادات</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="bg-background/40 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <Package className="w-3 h-3 text-blue-400" />
                  <span className="text-xs text-foreground/70">المجموع</span>
                </div>
                <p className="text-lg font-bold text-foreground mt-1">{stats.total}</p>
              </div>
              <div className="bg-background/40 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-foreground/70">مكتملة</span>
                </div>
                <p className="text-lg font-bold text-emerald-400 mt-1">{stats.completed}</p>
              </div>
              <div className="bg-background/40 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span className="text-xs text-foreground/70">بانتظار الدفع</span>
                </div>
                <p className="text-lg font-bold text-amber-400 mt-1">{stats.pending}</p>
              </div>
              <div className="bg-background/40 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs text-foreground/70">صافي الإيرادات</span>
                </div>
                <p className="text-lg font-bold text-cyan-600 mt-1">
                  {stats.netRevenue.toLocaleString("ar-SA")} ريال
                </p>
              </div>
            </div>
          </div>
          <LoadingLink href="/dashboard/mycars" className="flex items-center gap-2 px-4 py-3 bg-secondary text-white rounded-xl">
            <Package className="w-4 h-4" />
            سياراتي
          </LoadingLink>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
        {sales.length === 0 ? (
          <div className="text-center py-16 p-6 bg-card/30 rounded-2xl border border-border max-w-md mx-auto">
            <TrendingUp className="w-16 h-16 text-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground/70 mb-2">لا توجد مبيعات</h3>
            <p className="text-foreground/50 text-sm mb-4">لم تقم ببيع أي عناصر في المزادات بعد</p>
            <LoadingLink href="/dashboard/mycars" className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg">
              <Package className="w-4 h-4" />
              سياراتي
            </LoadingLink>
          </div>
        ) : (
          <>
            {sales.map((sale, idx) => {
              const sc = getStatusConfig(sale.status);
              const Icon = sc.icon;
              const price = Number(sale.vehicle_price_total ?? sale.final_price ?? sale.car_price ?? 0);
              const itemName = `${sale.car?.make || ""} ${sale.car?.model || ""}`.trim() || `سيارة #${sale.car_id}`;
              const imgUrl = getFirstImage(sale.car?.images);

              return (
                <motion.div
                  key={sale.auction_id ?? idx}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-card border border-border rounded-xl p-6 hover:border-border/80 transition"
                >
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-shrink-0 w-20 h-20 lg:w-24 lg:h-24 bg-background rounded-lg overflow-hidden">
                      <img
                        src={imgUrl}
                        alt={itemName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder-car.png";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-foreground mb-1">{itemName}</h3>
                      <div className="flex items-center gap-2 text-sm text-foreground/70 mb-2">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          المشتري: {safeUserName(sale.buyer)}
                        </span>
                      </div>
                      <span className={cn("inline-flex items-center gap-2 px-2 py-1 rounded text-xs border", sc.bg, sc.border, sc.color)}>
                        <Icon className="w-3 h-3" />
                        {sc.text}
                      </span>
                    </div>
                    <div className="text-left lg:text-right">
                      <div className="text-xl font-bold text-secondary">{price.toLocaleString("ar-SA")} ريال</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {paginationData && paginationData.last_page > 1 && (
              <div className="mt-6">
                <Pagination
                  changePage={changePage}
                  data={paginationData}
                  nextButtonText="التالي"
                  prevButtonText="السابق"
                />
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
