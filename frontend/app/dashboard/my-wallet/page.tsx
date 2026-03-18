"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { useAuth } from "@/hooks/useAuth";
import {
  Loader2,
  Plus,
  ArrowDownLeft,
  Wallet as WalletIcon,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Calendar,
  DollarSign,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";

type WalletBalance = {
  available: number;
  funded: number;
  total: number;
};

type ApiWalletTransaction = {
  id: number;
  wallet_id: number;
  amount: number | string;
  type: string;
  status: string;
  reference?: string | null;
  payment_method?: string | null;
  payment_gateway_invoice_id?: string | number | null;
  created_at: string;
  updated_at?: string;
};

type UiTransaction = {
  id: number;
  type: string;
  status: string;
  amount: number; // raw positive number
  signedAmount: number; // +/-
  reference?: string;
  payment_method?: string;
  invoice_id?: string;
  created_at: string;
  dateText: string;
  description: string;
  runningBalance?: number;
};

const positiveTypes = new Set(["deposit", "refund", "sale", "transfer_in"]);
const negativeTypes = new Set([
  "withdrawal",
  "purchase",
  "commission",
  "bid",
  "transfer_out",
]);

const safeNumber = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const getTransactionTypeArabic = (type: string) => {
  const map: Record<string, string> = {
    deposit: "إيداع",
    withdrawal: "سحب",
    purchase: "شراء",
    sale: "تحويل مبيعات",
    commission: "عمولة",
    refund: "استرداد",
    bid: "مزايدة",
    transfer_in: "تحويل وارد",
    transfer_out: "تحويل صادر",
  };
  return map[type] || type || "معاملة";
};

const getPaymentMethodArabic = (m?: string | null) => {
  const map: Record<string, string> = {
    credit_card: "بطاقة",
    bank_transfer: "تحويل بنكي",
    myfatoorah: "MyFatoorah",
    api: "API",
  };
  if (!m) return "";
  return map[m] || m;
};

const buildDescription = (t: ApiWalletTransaction) => {
  const typeAr = getTransactionTypeArabic(t.type);
  const pm = getPaymentMethodArabic(t.payment_method);
  const ref = t.reference ? ` • مرجع: ${t.reference}` : "";
  const invoice = t.payment_gateway_invoice_id
    ? ` • فاتورة: ${t.payment_gateway_invoice_id}`
    : "";
  const method = pm ? ` • طريقة: ${pm}` : "";
  return `${typeAr}${method}${ref}${invoice}`;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "غير معروف";
  return d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTransactionTypeConfig = (type: string) => {
  const typeMap: Record<
    string,
    { color: string; bg: string; border: string; icon: any }
  > = {
    deposit: {
      color: "text-emerald-400",
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/30",
      icon: Plus,
    },
    withdrawal: {
      color: "text-rose-400",
      bg: "bg-rose-500/20",
      border: "border-rose-500/30",
      icon: ArrowDownLeft,
    },
    purchase: {
      color: "text-blue-400",
      bg: "bg-blue-500/20",
      border: "border-blue-500/30",
      icon: CreditCard,
    },
    sale: {
      color: "text-amber-400",
      bg: "bg-amber-500/20",
      border: "border-amber-500/30",
      icon: TrendingUp,
    },
    commission: {
      color: "text-purple-400",
      bg: "bg-purple-500/20",
      border: "border-purple-500/30",
      icon: DollarSign,
    },
    refund: {
      color: "text-cyan-400",
      bg: "bg-cyan-500/20",
      border: "border-cyan-500/30",
      icon: ArrowUpRight,
    },
    bid: {
      color: "text-indigo-400",
      bg: "bg-indigo-500/20",
      border: "border-indigo-500/30",
      icon: WalletIcon,
    },
  };

  return (
    typeMap[type] || {
      color: "text-gray-400",
      bg: "bg-gray-500/20",
      border: "border-gray-500/30",
      icon: DollarSign,
    }
  );
};

const getStatusConfig = (status: string) => {
  const statusMap: Record<
    string,
    { color: string; bg: string; border: string; icon: any; text: string }
  > = {
    completed: {
      color: "text-emerald-400",
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/30",
      icon: CheckCircle,
      text: "مكتملة",
    },
    pending: {
      color: "text-amber-400",
      bg: "bg-amber-500/20",
      border: "border-amber-500/30",
      icon: Clock,
      text: "قيد المعالجة",
    },
    failed: {
      color: "text-rose-400",
      bg: "bg-rose-500/20",
      border: "border-rose-500/30",
      icon: XCircle,
      text: "فاشلة",
    },
  };

  return (
    statusMap[status] || {
      color: "text-gray-400",
      bg: "bg-gray-500/20",
      border: "border-gray-500/30",
      icon: Clock,
      text: status || "غير معروف",
    }
  );
};

export default function MyWalletPage() {
  const [transactions, setTransactions] = useState<UiTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [walletBalance, setWalletBalance] = useState<WalletBalance>({
    available: 0,
    funded: 0,
    total: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [pagination, setPagination] = useState<{
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  } | null>(null);

  const router = useLoadingRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/dashboard/my-wallet");
    }
  }, [isLoggedIn, router]);

  const getSignedAmount = (t: ApiWalletTransaction) => {
    const amount = safeNumber(t.amount);
    if (positiveTypes.has(t.type)) return +amount;
    if (negativeTypes.has(t.type)) return -amount;
    // default: اعرض حسب النوع لو معروف، وإلا اعتبره + (احتياط)
    return t.type === "withdrawal" ? -amount : +amount;
  };

  const fetchWalletData = async (page = 1) => {
    if (!isLoggedIn) return;

    setIsLoading(true);
    try {
      // 1) Wallet summary (creates wallet if missing)
      const walletRes = await api.get("/api/wallet");
      if (walletRes.data?.status === "success") {
        const w = walletRes.data.data;
        setWalletBalance({
          available: safeNumber(w.available_balance),
          funded: safeNumber(w.funded_balance),
          total: safeNumber(
            w.total_balance ??
              safeNumber(w.available_balance) + safeNumber(w.funded_balance),
          ),
        });
      }

      // 2) Transactions with server-side filters
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const txRes = await api.get(
        `/api/wallet/transactions?${params.toString()}`,
      );

      if (txRes.data?.status === "success") {
        const balance = txRes.data.balance;
        const totalNow = safeNumber(balance?.total_balance);

        setWalletBalance({
          available: safeNumber(balance?.available_balance),
          funded: safeNumber(balance?.funded_balance),
          total: totalNow,
        });

        const paginated = txRes.data.data; // Laravel paginator
        const rows: ApiWalletTransaction[] = Array.isArray(paginated?.data)
          ? paginated.data
          : [];

        setPagination({
          current_page: safeNumber(paginated?.current_page) || 1,
          last_page: safeNumber(paginated?.last_page) || 1,
          total: safeNumber(paginated?.total) || rows.length,
          per_page: safeNumber(paginated?.per_page) || 20,
        });

        // API أصلاً بيرتب desc، هنفترض كده. لو مش كده نرتبه:
        const sorted = [...rows].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        // running balance (من الحالي للأقدم)
        let running = totalNow;

        const mapped: UiTransaction[] = sorted.map((t, idx) => {
          const signed = getSignedAmount(t);
          const dateText = `${formatDate(t.created_at)} • ${formatTime(t.created_at)}`;
          const ui: UiTransaction = {
            id: t.id,
            type: t.type,
            status: t.status,
            amount: safeNumber(t.amount),
            signedAmount: signed,
            reference: t.reference ?? undefined,
            payment_method: t.payment_method ?? undefined,
            invoice_id: t.payment_gateway_invoice_id
              ? String(t.payment_gateway_invoice_id)
              : undefined,
            created_at: t.created_at,
            dateText,
            description: buildDescription(t),
            runningBalance: running,
          };

          // للمعاملة التالية (الأقدم): نرجع بالزمن (نلغي تأثير هذه المعاملة)
          // لو deposit (+) → الرصيد الأقدم = الحالي - deposit
          // لو withdrawal (-) → الرصيد الأقدم = الحالي - (-) = الحالي + amount
          running = running - signed;

          return ui;
        });

        setTransactions(mapped);
      } else {
        setTransactions([]);
        setPagination(null);
      }
    } catch (error: any) {
      console.error("Error fetching wallet data:", error);
      toast.error("حدث خطأ أثناء تحميل بيانات المحفظة");
      setTransactions([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  };

  // أول تحميل + عند تغيير الفلاتر نرجع لأول صفحة
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchWalletData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, typeFilter, statusFilter]);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;

    const q = searchTerm.toLowerCase();
    return transactions.filter((t) => {
      const typeAr = getTransactionTypeArabic(t.type).toLowerCase();
      const desc = (t.description || "").toLowerCase();
      const ref = (t.reference || "").toLowerCase();
      return typeAr.includes(q) || desc.includes(q) || ref.includes(q);
    });
  }, [transactions, searchTerm]);

  const handleDeposit = () =>
    router.replace("/dashboard/my-transfers?action=deposit");
  const handleWithdraw = () =>
    router.replace("/dashboard/my-transfers?action=withdraw");

  const transactionStats = useMemo(() => {
    const total = pagination?.total ?? transactions.length;
    const deposits = transactions.filter((t) => t.type === "deposit").length;
    const withdrawals = transactions.filter(
      (t) => t.type === "withdrawal",
    ).length;
    const totalAmount = transactions.reduce(
      (sum, t) => sum + Math.abs(t.signedAmount),
      0,
    );
    return { total, deposits, withdrawals, totalAmount };
  }, [transactions, pagination]);

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
                <WalletIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  محفظتي{" "}
                  <span className="text-primary">
                    ({walletBalance.total.toLocaleString("ar-SA")} ريال)
                  </span>
                </h1>
                <p className="text-foreground/70 text-sm mt-1">
                  إدارة رصيدك المالي ومعاملاتك
                </p>
              </div>
            </div>

            {/* Balance cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <WalletIcon className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground/80">
                    الرصيد الكلي
                  </span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {walletBalance.total.toLocaleString("ar-SA")} ريال
                </p>
              </div>

              <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-foreground/80">المتاح</span>
                </div>
                <p className="text-2xl font-bold text-emerald-300">
                  {walletBalance.available.toLocaleString("ar-SA")} ريال
                </p>
              </div>

              <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-foreground/80">المحجوز</span>
                </div>
                <p className="text-2xl font-bold text-blue-300">
                  {walletBalance.funded.toLocaleString("ar-SA")} ريال
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDeposit}
              className="flex items-center gap-2 px-4 py-3 bg-secondary text-white rounded-xl border border-secondary/30 hover:scale-105 transition-all duration-300 group"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="font-medium">إيداع</span>
            </button>
            <button
              onClick={handleWithdraw}
              className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl border border-red-400/30 hover:scale-105 transition-all duration-300 group"
            >
              <ArrowDownLeft className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="font-medium">سحب</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {transactionStats.total}
            </div>
            <div className="text-sm text-foreground/70">إجمالي المعاملات</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {transactionStats.deposits}
            </div>
            <div className="text-sm text-foreground/70">إيداعات (بالصفحة)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-rose-400">
              {transactionStats.withdrawals}
            </div>
            <div className="text-sm text-foreground/70">سحوبات (بالصفحة)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">
              {transactionStats.totalAmount.toLocaleString("ar-SA")}
            </div>
            <div className="text-sm text-foreground/70">
              إجمالي المبالغ (بالصفحة)
            </div>
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
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/70" />
              <input
                type="text"
                placeholder="ابحث في المعاملات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background/50 border border-border rounded-xl pl-4 pr-10 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500/50 transition-colors"
            >
              <option value="all">جميع الأنواع</option>
              <option value="deposit">إيداع</option>
              <option value="withdrawal">سحب</option>
              <option value="purchase">شراء</option>
              <option value="sale">مبيعات</option>
              <option value="commission">عمولة</option>
              <option value="refund">استرداد</option>
              <option value="bid">مزايدة</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-emerald-500/50 transition-colors"
            >
              <option value="all">جميع الحالات</option>
              <option value="completed">مكتملة</option>
              <option value="pending">قيد المعالجة</option>
              <option value="failed">فاشلة</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <Filter className="w-4 h-4" />
            <span>
              عرض {filteredTransactions.length} معاملة (من الصفحة الحالية)
            </span>
          </div>
        </div>
      </motion.div>

      {/* Transactions list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        {isLoading ? (
          <div className="text-center py-16">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <Loader2 className="absolute inset-0 w-full h-full animate-spin text-primary" />
              <div className="absolute inset-0 w-full h-full rounded-full border-4 border-transparent border-t-primary animate-spin opacity-60"></div>
            </div>
            <p className="text-lg text-foreground/70 font-medium">
              جاري تحميل بيانات المحفظة...
            </p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-card/30 rounded-2xl border border-border max-w-md mx-auto">
              <WalletIcon className="w-16 h-16 text-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground/70 mb-2">
                {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                  ? "لا توجد نتائج"
                  : "لا توجد معاملات"}
              </h3>
              <p className="text-foreground/50 text-sm mb-4">
                {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                  ? "لم نتمكن من العثور على معاملات تطابق معايير البحث"
                  : "لم تقم بأي معاملات في محفظتك حتى الآن"}
              </p>
              {searchTerm || typeFilter !== "all" || statusFilter !== "all" ? (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("all");
                    setStatusFilter("all");
                  }}
                  className="px-4 py-2 bg-primary/20 text-primary rounded-lg border border-primary/30 hover:bg-primary/30 transition-colors"
                >
                  إعادة تعيين الفلاتر
                </button>
              ) : (
                <button
                  onClick={handleDeposit}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:scale-105 transition-all duration-300"
                >
                  <Plus className="w-4 h-4" />
                  إيداع أول مبلغ
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredTransactions.map((t, index) => {
            const typeConfig = getTransactionTypeConfig(t.type);
            const TypeIcon = typeConfig.icon;

            const statusConfig = getStatusConfig(t.status || "completed");
            const StatusIcon = statusConfig.icon;

            const isPositive = t.signedAmount >= 0;

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6 hover:border-border/70 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={cn(
                        "p-3 rounded-xl border backdrop-blur-sm transition-transform duration-300 group-hover:scale-110",
                        typeConfig.bg,
                        typeConfig.border,
                      )}
                    >
                      <TypeIcon className={cn("w-5 h-5", typeConfig.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-foreground/80 transition-colors">
                          {getTransactionTypeArabic(t.type)}
                        </h3>

                        <div
                          className={cn(
                            "text-xl font-bold",
                            isPositive ? "text-emerald-400" : "text-rose-400",
                          )}
                        >
                          {isPositive ? "+" : "-"}
                          {Math.abs(t.signedAmount).toLocaleString(
                            "ar-SA",
                          )}{" "}
                          ريال
                        </div>
                      </div>

                      <p className="text-foreground/70 text-sm mb-3 leading-relaxed">
                        {t.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-foreground/50">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{t.dateText}</span>
                        </div>

                        {typeof t.runningBalance === "number" && (
                          <div className="flex items-center gap-1">
                            <WalletIcon className="w-3 h-3" />
                            <span>
                              الرصيد بعد العملية:{" "}
                              {t.runningBalance.toLocaleString("ar-SA")} ريال
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
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
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Pagination */}
      {!isLoading && pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-3 py-4">
          <button
            disabled={pagination.current_page <= 1}
            onClick={() => fetchWalletData(pagination.current_page - 1)}
            className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-border transition disabled:opacity-50"
          >
            السابق
          </button>

          <div className="text-sm text-foreground/70">
            صفحة {pagination.current_page} من {pagination.last_page}
          </div>

          <button
            disabled={pagination.current_page >= pagination.last_page}
            onClick={() => fetchWalletData(pagination.current_page + 1)}
            className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-border transition disabled:opacity-50"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}
