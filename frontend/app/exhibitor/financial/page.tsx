"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "../../../components/exhibitor/Header";
import { Sidebar } from "../../../components/exhibitor/sidebar";
import { FiMenu } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  ReceiptText,
  Search,
  Filter,
  RefreshCw,
  Download,
  Copy,
  Link as LinkIcon,
} from "lucide-react";

/* =========================
   Types (UI)
========================= */
type RawTxType = string;

interface Tx {
  id: number;
  wallet_id: number;
  type: RawTxType; // 'credit' | 'debit' | 'deposit' | 'withdraw' | 'auction' | 'adjustment' | ...
  amount: number; // قد تكون SAR أو هللة حسب النظام
  related_auction?: number | null;
  description?: string | null;
  created_at: string; // ISO
}

type Paginator<T> = {
  data: T[];
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
};

interface WalletResp {
  success?: boolean;
  data?: {
    balance: number; // قد تكون هللة
    balance_sar?: number; // وجودها غالباً يعني أن balance بالهللة
    currency: string; // "SAR"
  };
}

/* =========================
   Backend helpers (robust)
========================= */
type Wrapped<T> = { success: boolean; data: T; message?: string };

function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pick(obj: any, keys: string[], fallback: any = undefined) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return fallback;
}

function unwrap<T = any>(resp: any): T {
  // supports: {success:true,data:...} OR direct payload
  if (resp && typeof resp === "object" && "success" in resp && "data" in resp) {
    return (resp as Wrapped<T>).data;
  }
  return resp as T;
}

function normalizeTx(raw: any): Tx {
  return {
    id: safeNum(pick(raw, ["id"]), 0),
    wallet_id: safeNum(pick(raw, ["wallet_id", "walletId"]), 0),
    type: String(pick(raw, ["type"], "")),
    amount: safeNum(pick(raw, ["amount", "amount_sar", "amountSar"]), 0),
    related_auction: (() => {
      const v = pick(raw, ["related_auction", "relatedAuction", "auction_id", "auctionId"], null);
      return v == null ? null : safeNum(v, 0);
    })(),
    description: pick(raw, ["description", "desc"], null),
    created_at: String(pick(raw, ["created_at", "createdAt", "date"], new Date().toISOString())),
  };
}

/**
 * يدعم أشكال متعددة:
 * 1) Wrapped: {success:true,data:[...]} أو {success:true,data:{data:[],current_page...}}
 * 2) Direct paginator: {data:[],current_page,...}
 * 3) Laravel resources: {data:[], meta:{...}, links:{...}}
 * 4) Array: [...]
 */
function extractTxPaginator(resp: any): Paginator<Tx> {
  const payload = unwrap<any>(resp);

  // Direct array
  if (Array.isArray(payload)) {
    const arr = payload.map(normalizeTx);
    return {
      data: arr,
      current_page: 1,
      per_page: arr.length || 15,
      last_page: 1,
      total: arr.length,
    };
  }

  // Wrapped may have: payload = { data: [...], current_page... } OR resources
  // Direct paginator shape
  if (payload && Array.isArray(payload.data) && typeof payload.current_page === "number") {
    return {
      data: payload.data.map(normalizeTx),
      current_page: safeNum(payload.current_page, 1),
      per_page: safeNum(payload.per_page, payload.data.length || 15),
      last_page: safeNum(payload.last_page, 1),
      total: safeNum(payload.total, payload.data.length || 0),
    };
  }

  // Laravel resources style
  if (payload && Array.isArray(payload.data) && payload.meta) {
    return {
      data: payload.data.map(normalizeTx),
      current_page: safeNum(payload.meta.current_page, 1),
      per_page: safeNum(payload.meta.per_page, payload.data.length || 15),
      last_page: safeNum(payload.meta.last_page, 1),
      total: safeNum(payload.meta.total, payload.data.length || 0),
    };
  }

  // Some backends: payload itself is wrapped inside another "data"
  // e.g. { data: { data: [...], current_page: ... } }
  if (payload && payload.data && Array.isArray(payload.data.data)) {
    const inner = payload.data;
    return {
      data: inner.data.map(normalizeTx),
      current_page: safeNum(inner.current_page, 1),
      per_page: safeNum(inner.per_page, inner.data.length || 15),
      last_page: safeNum(inner.last_page, 1),
      total: safeNum(inner.total, inner.data.length || 0),
    };
  }

  // Fallback object
  const arr = Array.isArray(payload?.data) ? payload.data : [];
  return {
    data: arr.map(normalizeTx),
    current_page: safeNum(payload?.current_page, 1),
    per_page: safeNum(payload?.per_page, arr.length || 15),
    last_page: safeNum(payload?.last_page, 1),
    total: safeNum(payload?.total, arr.length || 0),
  };
}

/* =========================
   Page
========================= */
export default function FinancialPage() {
  const [isClient, setIsClient] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Server pagination (إن وجدت من الباك)
  const [serverPage, setServerPage] = useState(1);
  const [paginator, setPaginator] = useState<Paginator<Tx> | null>(null);

  // Data
  const [loading, setLoading] = useState(true);
  const [txs, setTxs] = useState<Tx[]>([]);

  // Units
  // true => backend amounts in halala => we divide by 100 for SAR
  const [amountsInHalala, setAmountsInHalala] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>("SAR");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "credit" | "debit" | "auction" | "adjustment"
  >("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Client-only
  useEffect(() => setIsClient(true), []);

  // Close drawer by ESC
  useEffect(() => {
    if (!isSidebarOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSidebarOpen]);

  // Detect currency + units from wallet endpoint (non-blocking)
  const detectUnits = async () => {
    try {
      const { data } = await api.get<WalletResp>("/api/exhibitor/wallet");
      const payload = unwrap<any>(data);
      // payload هنا ممكن يكون {balance,...} أو {data:{...}} حسب اللف
      const w = payload?.balance !== undefined ? payload : payload?.data;
      if (w) {
        setCurrency(String(w.currency || "SAR").toUpperCase());
        // وجود balance_sar غالباً يعني أن balance بالهللة (والـ balance_sar بالريال)
        setAmountsInHalala(typeof w.balance_sar === "number");
      }
    } catch {
      // تجاهل: الهدف فقط كشف الوحدة
    }
  };

  // Fetch transactions (prefers /transactions then fallback to /transcations)
  const fetchTx = async (page: number = 1) => {
    setLoading(true);
    try {
      const PER_PAGE = 15;

      const params: Record<string, any> = {
        page,
        per_page: PER_PAGE,
      };

      // لو الباك يدعم الفلترة، هنرسلها. لو لا، هيتجاهلها.
      if (searchTerm.trim()) params.q = searchTerm.trim();
      if (typeFilter !== "all") params.type = typeFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      let resp: any;
      try {
        resp = await api.get("/api/exhibitor/wallet/transactions", { params });
      } catch {
        resp = await api.get("/api/exhibitor/wallet/transcations", { params });
      }

      const json = resp?.data;

      // بعض الباكات ترجع success=false مع message
      if (json && typeof json === "object" && "success" in json && json.success === false) {
        throw new Error(json.message || "تعذر قراءة سجل المعاملات");
      }

      const p = extractTxPaginator(json);
      setPaginator(p);
      setTxs(p.data || []);
      setServerPage(p.current_page || page || 1);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "تعذر قراءة سجل المعاملات");
      setPaginator(null);
      setTxs([]);
      setServerPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isClient) return;
    detectUnits();
    fetchTx(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  /* -------------------------
     Helpers & Computations
  ------------------------- */
  const fmtNum = (n: number) =>
    new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(Math.round(n));

  const asSar = (raw: number) => (amountsInHalala ? raw / 100 : raw);

  const badge = (raw: RawTxType) => {
    const t = (raw || "").toLowerCase();
    const base = "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border";
    if (t === "credit" || t === "deposit")
      return (
        <span className={`${base} border-emerald-500/30 text-emerald-300 bg-emerald-500/10`}>
          إيداع
        </span>
      );
    if (t === "debit" || t === "withdraw")
      return (
        <span className={`${base} border-rose-500/30 text-rose-300 bg-rose-500/10`}>
          سحب
        </span>
      );
    if (t === "auction")
      return (
        <span className={`${base} border-violet-500/30 text-violet-300 bg-violet-500/10`}>
          مزاد
        </span>
      );
    if (t === "adjustment")
      return (
        <span className={`${base} border-amber-500/30 text-amber-300 bg-amber-500/10`}>
          تسوية
        </span>
      );
    return (
      <span className={`${base} border-slate-500/30 text-slate-300 bg-slate-500/10`}>
        {raw || "غير معروف"}
      </span>
    );
  };

  const withinDate = (d: string) => {
    const t = new Date(d).getTime();
    if (dateFrom) {
      const f = new Date(dateFrom + "T00:00:00").getTime();
      if (t < f) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59").getTime();
      if (t > to) return false;
    }
    return true;
  };

  // (فلترة على مستوى الصفحة الحالية) — لو الباك مش بيفلتر، ده هيشتغل
  const filtered = useMemo(() => {
    let list = [...txs];

    if (typeFilter !== "all") {
      const t = typeFilter.toLowerCase();
      list = list.filter(
        (x) =>
          (x.type || "").toLowerCase() === t ||
          (t === "credit" && (x.type || "").toLowerCase() === "deposit") ||
          (t === "debit" && (x.type || "").toLowerCase() === "withdraw")
      );
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        (x) =>
          String(x.id).includes(q) ||
          (x.description || "").toLowerCase().includes(q) ||
          (x.related_auction ? String(x.related_auction).includes(q) : false) ||
          (x.type || "").toLowerCase().includes(q)
      );
    }

    if (dateFrom || dateTo) {
      list = list.filter((x) => withinDate(x.created_at));
    }

    // الأحدث أولاً
    list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return list;
  }, [txs, typeFilter, searchTerm, dateFrom, dateTo]);

  const totals = useMemo(() => {
    let credits = 0;
    let debits = 0;
    for (const t of filtered) {
      const ty = (t.type || "").toLowerCase();
      if (ty === "credit" || ty === "deposit") credits += asSar(t.amount);
      else if (ty === "debit" || ty === "withdraw") debits += asSar(t.amount);
    }
    return {
      credits: Math.round(credits),
      debits: Math.round(debits),
      net: Math.round(credits - debits),
    };
  }, [filtered, amountsInHalala]);

  /* -------------------------
      Actions
  ------------------------- */
  const handleRefresh = async () => {
    await fetchTx(serverPage);
    toast.success("تم تحديث السجل");
  };

  const handlePrev = async () => {
    if (!paginator) return;
    if (paginator.current_page <= 1) return;
    await fetchTx(paginator.current_page - 1);
  };

  const handleNext = async () => {
    if (!paginator) return;
    if (paginator.current_page >= paginator.last_page) return;
    await fetchTx(paginator.current_page + 1);
  };

  const applyServerFilters = async () => {
    await fetchTx(1);
  };

  const resetFilters = async () => {
    setSearchTerm("");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    await fetchTx(1);
  };

  const exportCSV = () => {
    const rows = [
      ["#", "النوع", `المبلغ (${currency})`, "المزاد المرتبط", "الوصف", "التاريخ"],
      ...filtered.map((t) => [
        String(t.id),
        (t.type || "").toUpperCase(),
        String(asSar(t.amount)),
        t.related_auction ? `#${t.related_auction}` : "",
        (t.description || "").replace(/\n/g, " "),
        new Date(t.created_at).toLocaleString("ar-SA"),
      ]),
    ];
    const csv = rows
      .map((r) =>
        r
          .map((c) => {
            const v = String(c ?? "");
            return /[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تنزيل CSV");
  };

  const copyTable = async () => {
    try {
      const header = ["#", "النوع", `المبلغ (${currency})`, "المزاد", "الوصف", "التاريخ"];
      const body = filtered.map(
        (t) =>
          `${t.id}\t${(t.type || "").toUpperCase()}\t${asSar(t.amount)}\t${
            t.related_auction ?? ""
          }\t${t.description ?? ""}\t${new Date(t.created_at).toLocaleString("ar-SA")}`
      );
      await navigator.clipboard.writeText([header.join("\t"), ...body].join("\n"));
      toast.success("تم نسخ الجدول");
    } catch {
      toast.error("تعذر النسخ للحافظة");
    }
  };

  /* -------------------------
      Skeleton (client)
  ------------------------- */
  if (!isClient) {
    return (
      <div dir="rtl" className="flex min-h-screen bg-background overflow-x-hidden">
        <div className="hidden md:block w-72 bg-card border-l border-border animate-pulse" />
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-card border-b border-border animate-pulse" />
          <main className="p-6 flex-1 bg-background" />
        </div>
      </div>
    );
  }

  /* -------------------------
      UI
  ------------------------- */
  return (
    <div dir="rtl" className="flex min-h-screen bg-background text-foreground relative overflow-x-hidden">
      {/* Sidebar Desktop */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar Mobile Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 md:hidden flex"
            role="dialog"
            aria-modal="true"
          >
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="إغلاق القائمة"
            />
            <motion.div className="relative w-72 ml-auto h-full">
              <Sidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col w-0 relative z-10">
        <Header />

        <main className="p-4 md:p-6 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {/* Title + Actions */}
            <div className="mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                  <ReceiptText className="w-5 h-5 text-primary" />
                  سجل المعاملات المالية
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  جميع العمليات الخاصة بصاحب المعرض. لإدارة الرصيد استخدم صفحة{" "}
                  <Link
                    href="/exhibitor/wallet"
                    className="text-primary underline decoration-dotted underline-offset-4"
                  >
                    محفظة المعرض
                  </Link>
                  .
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/exhibitor/wallet"
                  className="px-3 py-2 rounded-lg text-primary-foreground font-semibold bg-primary hover:bg-primary/90 shadow-lg"
                  title="الذهاب لمحفظة المعرض"
                >
                  محفظة المعرض
                </Link>

                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-foreground hover:bg-muted"
                >
                  <RefreshCw className="w-4 h-4" />
                  تحديث
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="rounded-2xl border border-border bg-card p-4 md:p-5 mb-4">
              <div className="flex flex-col xl:flex-row gap-4 xl:items-end">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ابحث برقم العملية / وصف / نوع / رقم المزاد..."
                    className="w-full pr-9 pl-3 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Type Filter */}
                <div className="min-w-[180px]">
                  <label className="block text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> النوع
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="all">كل الأنواع</option>
                    <option value="credit">إيداع</option>
                    <option value="debit">سحب</option>
                    <option value="auction">مزاد</option>
                    <option value="adjustment">تسوية</option>
                  </select>
                </div>

                {/* Date range */}
                <div className="flex gap-2">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">من تاريخ</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="px-3 py-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">إلى تاريخ</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="px-3 py-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {/* Units toggle (override if detection wrong) */}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-background border border-border">
                  <span className="text-xs text-muted-foreground">
                    {amountsInHalala ? "البيانات بالهللة (÷100)" : "البيانات بالريال"}
                  </span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={amountsInHalala}
                      onChange={() => setAmountsInHalala((v) => !v)}
                    />
                    <div className="h-5 w-9 rounded-full bg-muted peer-checked:bg-primary transition-colors">
                      <div className="absolute top-1/2 -translate-y-1/2 left-1 peer-checked:left-5 h-3 w-3 rounded-full bg-background transition-all" />
                    </div>
                  </label>
                </div>

                {/* Server filter actions */}
                <div className="flex gap-2">
                  <button
                    onClick={applyServerFilters}
                    className="px-3 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted inline-flex items-center gap-2"
                    title="تطبيق الفلاتر (لو الباك يدعمها)"
                  >
                    <Filter className="w-4 h-4" />
                    تطبيق
                  </button>
                  <button
                    onClick={resetFilters}
                    className="px-3 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted"
                  >
                    تصفير
                  </button>
                </div>

                {/* Export */}
                <div className="flex gap-2">
                  <button
                    onClick={exportCSV}
                    className="px-3 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    onClick={copyTable}
                    className="px-3 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted inline-flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    نسخ
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="text-muted-foreground text-sm">إجمالي الإيداعات</div>
                <div className="mt-1 text-2xl font-extrabold text-emerald-500">
                  {fmtNum(totals.credits)}{" "}
                  <span className="text-sm text-emerald-500/80">{currency}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="text-muted-foreground text-sm">إجمالي السحوبات</div>
                <div className="mt-1 text-2xl font-extrabold text-rose-500">
                  {fmtNum(totals.debits)}{" "}
                  <span className="text-sm text-rose-500/80">{currency}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="text-muted-foreground text-sm">صافي الحركة (المعروض)</div>
                <div
                  className={`mt-1 text-2xl font-extrabold ${
                    totals.net >= 0 ? "text-primary" : "text-amber-500"
                  }`}
                >
                  {fmtNum(totals.net)}{" "}
                  <span className="text-sm text-muted-foreground/80">{currency}</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="w-full max-w-full overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead className="bg-muted border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-right w-[72px]">#</th>
                      <th className="px-4 py-3 text-right w-[110px]">النوع</th>
                      <th className="px-4 py-3 text-right w-[150px]">المبلغ</th>
                      <th className="px-4 py-3 text-right w-[140px]">المزاد المرتبط</th>
                      <th className="px-4 py-3 text-right">الوصف</th>
                      <th className="px-4 py-3 text-right w-[200px]">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      [...Array(8)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-4 py-3">
                            <div className="h-4 w-10 bg-muted rounded" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-6 w-16 bg-muted rounded-full" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-4 w-24 bg-muted rounded" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-4 w-14 bg-muted rounded" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-4 w-56 bg-muted rounded" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-4 w-32 bg-muted rounded" />
                          </td>
                        </tr>
                      ))
                    ) : filtered.length ? (
                      filtered.map((t) => {
                        const tType = (t.type || "").toLowerCase();
                        const isDebit = tType === "debit" || tType === "withdraw";
                        const amountSar = asSar(t.amount);
                        return (
                          <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                              {t.id}
                            </td>
                            <td className="px-4 py-3">{badge(t.type)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`font-bold ${isDebit ? "text-rose-500" : "text-emerald-500"}`}>
                                {fmtNum(amountSar)}{" "}
                                <span className="text-xs text-muted-foreground">{currency}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                              {t.related_auction ? (
                                <span className="inline-flex items-center gap-1 text-primary">
                                  <LinkIcon className="w-3 h-3" />#{t.related_auction}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/50">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {t.description ? (
                                <span className="block truncate max-w-[520px]">{t.description}</span>
                              ) : (
                                <span className="text-muted-foreground/50">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                              {new Date(t.created_at).toLocaleString("ar-SA")}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="px-4 py-10 text-center text-muted-foreground" colSpan={6}>
                          لا توجد معاملات مطابقة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Server Pagination */}
              {!loading && paginator && paginator.last_page > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-border text-sm text-muted-foreground">
                  <button
                    onClick={handlePrev}
                    disabled={paginator.current_page <= 1}
                    className={`px-3 py-2 rounded-lg border ${
                      paginator.current_page <= 1
                        ? "border-border text-muted-foreground/50 cursor-not-allowed"
                        : "border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    السابق
                  </button>
                  <div className="text-muted-foreground">
                    صفحة <span className="text-foreground">{paginator.current_page}</span> من{" "}
                    <span className="text-foreground">{paginator.last_page}</span>
                  </div>
                  <button
                    onClick={handleNext}
                    disabled={paginator.current_page >= paginator.last_page}
                    className={`px-3 py-2 rounded-lg border ${
                      paginator.current_page >= paginator.last_page
                        ? "border-border text-muted-foreground/50 cursor-not-allowed"
                        : "border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    التالي
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* FAB (Mobile) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-xl z-50 hover:bg-primary/90 transition-all duration-200 flex items-center justify-center"
        aria-label="فتح القائمة"
        title="القائمة"
      >
        <FiMenu size={22} />
      </button>
    </div>
  );
}
