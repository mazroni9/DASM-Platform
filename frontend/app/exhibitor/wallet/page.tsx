"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "../../../components/exhibitor/Header";
import { Sidebar } from "../../../components/exhibitor/sidebar";
import { FiMenu } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  ArrowDownRight,
  ArrowUpRight,
  Link as LinkIcon,
  Loader2,
  Search,
  Wallet2,
} from "lucide-react";

type TxType = "deposit" | "withdraw" | "auction" | "adjustment" | string;

interface WalletResp {
  success: boolean;
  data: {
    balance: number; // غالبًا بالهللات (cents)
    balance_sar?: number; // لو موجود => balance/100
    currency: string; // "SAR"
  };
}

interface Transaction {
  id: number;
  wallet_id?: number;
  type?: TxType;
  amount: number; // غالبًا بالهللات (cents) زي الرصيد
  related_auction?: number | null; // قد تكون موجودة أو لا حسب جدولك
  related_auction_id?: number | null; // احتياط
  description?: string | null;
  created_at: string;
}

interface LaravelPaginator<T> {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
}

type WalletTxResp = {
  success: boolean;
  data: LaravelPaginator<Transaction>;
};

export default function ExhibitorWalletPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // بيانات المحفظة
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0); // SAR للعرض
  const [currency, setCurrency] = useState<string>("SAR");
  const [amountsAreCents, setAmountsAreCents] = useState<boolean>(true); // لو الباك بيرجع balance_sar يبقى المبالغ بالهللات

  // المعاملات (Server pagination)
  const [txLoading, setTxLoading] = useState(true);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txLastPage, setTxLastPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TxType>("all");

  // مودالات الإيداع/السحب
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const [depositAmount, setDepositAmount] = useState<string>("");
  const [depositSubmitting, setDepositSubmitting] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawNote, setWithdrawNote] = useState<string>("");
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  // ✅ التأكد أننا على الكلاينت (لتفادي مشاكل الهيدرات)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ إغلاق الدروار بزر ESC على الجوال
  useEffect(() => {
    if (!isSidebarOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSidebarOpen]);

  const toSar = (amount: number) => (amountsAreCents ? amount / 100 : amount);

  // فورمات عملة
  const fmt = (n: number) => new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(n);

  // جلب رصيد المحفظة
  const fetchWallet = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<WalletResp>("/api/exhibitor/wallet");

      if (data?.success && data?.data) {
        const hasSar = data.data.balance_sar != null;
        setAmountsAreCents(hasSar); // لو balance_sar موجود => الباك بيخزن هللات

        const bSar = Number(hasSar ? data.data.balance_sar : data.data.balance) || 0;
        setBalance(bSar);
        setCurrency(data.data.currency || "SAR");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("تعذر تحميل رصيد المحفظة");
    } finally {
      setLoading(false);
    }
  };

  // جلب المعاملات (Laravel paginator)
  const fetchTransactions = async (page = txPage) => {
    try {
      setTxLoading(true);

      // ✅ الراوت الصحيح: /wallet/transactions (مع دعم page افتراضيًا)
      const { data } = await api.get<WalletTxResp>("/api/exhibitor/wallet/transactions", {
        params: { page },
      });

      const paginator = data?.data;
      if (data?.success && paginator && Array.isArray(paginator.data)) {
        setTxs(paginator.data);
        setTxPage(paginator.current_page || page);
        setTxLastPage(paginator.last_page || 1);
        setTxTotal(paginator.total || 0);
      } else {
        setTxs([]);
        setTxLastPage(1);
        setTxTotal(0);
      }
    } catch (err: any) {
      console.error(err);

      // fallback لو السيرفر لسه بيستخدم typo endpoint (مع إن عندك دعم legacy)
      try {
        const { data } = await api.get<WalletTxResp>("/api/exhibitor/wallet/transcations", {
          params: { page },
        });

        const paginator = data?.data;
        if (data?.success && paginator && Array.isArray(paginator.data)) {
          setTxs(paginator.data);
          setTxPage(paginator.current_page || page);
          setTxLastPage(paginator.last_page || 1);
          setTxTotal(paginator.total || 0);
        } else {
          setTxs([]);
          setTxLastPage(1);
          setTxTotal(0);
        }
      } catch (e2: any) {
        console.error(e2);
        toast.error(e2?.response?.data?.message || "تعذر تحميل سجل المعاملات");
      }
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    if (!isClient) return;
    fetchWallet();
    fetchTransactions(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    fetchTransactions(txPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txPage]);

  const normalizeType = (t: Transaction): TxType => {
    const raw = String(t.type ?? "").toLowerCase();
    const amt = Number(t.amount ?? 0);

    if (raw.includes("deposit") || raw.includes("credit")) return "deposit";
    if (raw.includes("withdraw") || raw.includes("debit") || raw.includes("payout")) return "withdraw";
    if (raw.includes("auction") || raw.includes("bid")) return "auction";
    if (raw.includes("adjust")) return "adjustment";

    // fallback by sign if you ever store negatives
    if (amt < 0) return "withdraw";
    if (amt > 0) return "deposit";

    return (t.type ?? "unknown") as TxType;
  };

  // فلترة + بحث (داخل الصفحة الحالية من السيرفر)
  const filteredTxs = useMemo(() => {
    let list = [...txs];

    if (typeFilter !== "all") {
      list = list.filter((t) => normalizeType(t).toLowerCase() === String(typeFilter).toLowerCase());
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter((t) => {
        const related = (t.related_auction ?? t.related_auction_id) as any;
        return (
          String(t.id).includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          (related ? String(related).includes(q) : false) ||
          normalizeType(t).toLowerCase().includes(q)
        );
      });
    }

    // الأحدث أولاً (احتياط)
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return list;
  }, [txs, typeFilter, searchTerm]);

  useEffect(() => {
    // عند تغيير الفلتر/البحث: ارجع لأول صفحة (سيرفر)
    setTxPage(1);
  }, [typeFilter, searchTerm]);

  // شارة النوع
  const txTypeBadge = (tx: Transaction) => {
    const type = normalizeType(tx);
    const base = "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border";

    switch (String(type).toLowerCase()) {
      case "deposit":
        return (
          <span className={`${base} border-emerald-500/30 text-emerald-300 bg-emerald-500/10`}>
            <ArrowDownRight className="w-3 h-3" />
            إيداع
          </span>
        );
      case "withdraw":
        return (
          <span className={`${base} border-rose-500/30 text-rose-300 bg-rose-500/10`}>
            <ArrowUpRight className="w-3 h-3" />
            سحب
          </span>
        );
      case "auction":
        return (
          <span className={`${base} border-violet-500/30 text-violet-300 bg-violet-500/10`}>
            مزاد
          </span>
        );
      case "adjustment":
        return (
          <span className={`${base} border-slate-500/30 text-slate-300 bg-slate-500/10`}>
            تعديل
          </span>
        );
      default:
        return (
          <span className={`${base} border-slate-500/30 text-slate-300 bg-slate-500/10`}>
            {type || "غير معروف"}
          </span>
        );
    }
  };

  // إيداع (Backend expects: amount_sar, return_url)
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(depositAmount);

    if (!amountNum || amountNum < 10) {
      toast.error("أدخل مبلغ إيداع صحيح (10 على الأقل)");
      return;
    }

    setDepositSubmitting(true);
    try {
      const payload = {
        amount_sar: amountNum,
        return_url: typeof window !== "undefined" ? window.location.href : undefined,
      };

      const { data } = await api.post("/api/exhibitor/wallet/deposit/initiate", payload);

      const url =
        data?.data?.redirect_url ||
        (data as any)?.redirect_url ||
        (data as any)?.payment_url ||
        data?.data?.payment_url;

      if (url && typeof window !== "undefined") {
        toast.success("جاري تحويلك لبوابة الدفع");
        window.open(url, "_blank");
      } else {
        toast.success("تم إنشاء عملية الإيداع. راجع تفاصيل الدفع.");
      }

      setShowDeposit(false);
      setDepositAmount("");

      // المعاملات/الرصيد قد لا يتغيران فورًا إلا بعد webhook
      await fetchTransactions(1);
      await fetchWallet();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "تعذر بدء عملية الإيداع");
    } finally {
      setDepositSubmitting(false);
    }
  };

  // سحب (Backend expects: amount_sar, method?, details? (array))
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);

    if (!amountNum || amountNum < 10) {
      toast.error("أدخل مبلغ سحب صحيح (10 على الأقل)");
      return;
    }

    if (amountNum > balance) {
      toast.error("المبلغ المطلوب أكبر من الرصيد المتاح");
      return;
    }

    setWithdrawSubmitting(true);
    try {
      const payload: Record<string, any> = {
        amount_sar: amountNum,
        method: "bank_transfer",
      };

      if (withdrawNote.trim()) {
        payload.details = { note: withdrawNote.trim() }; // ✅ details لازم تكون array/object
      }

      const { data } = await api.post("/api/exhibitor/wallet/withdraw", payload);

      if (data?.success) {
        toast.success("تم إرسال طلب السحب بنجاح");
      } else {
        toast("تم إرسال الطلب، بانتظار المعالجة", { icon: "ℹ️" });
      }

      setShowWithdraw(false);
      setWithdrawAmount("");
      setWithdrawNote("");

      await fetchTransactions(1);
      await fetchWallet();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "تعذر إرسال طلب السحب");
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  // ⏳ Skeleton أثناء تهيئة الكلاينت
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

  return (
    <div dir="rtl" className="flex min-h-screen bg-background relative overflow-x-hidden text-foreground">
      {/* الشريط الجانبي (ديسكتوب) */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* الشريط الجانبي (جوال - Drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 md:hidden flex"
            aria-modal="true"
            role="dialog"
          >
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="إغلاق القائمة الجانبية"
            />
            <motion.div className="relative w-72 ml-auto h-full">
              <Sidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex flex-col w-0 relative z-10">
        <Header />

        <main className="p-4 md:p-6 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {/* عنوان الصفحة */}
            <div className="mb-4 md:mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                <Wallet2 className="w-5 h-5 text-primary" />
                محفظة المعرض
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                راجع رصيدك، المعاملات، وعمليات السحب والإيداع من مكان واحد.
              </p>
            </div>

            {/* بطاقات الرصيد والإجراءات */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* الرصيد */}
              <div className="col-span-1 rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">الرصيد المتاح</span>
                  <span className="text-muted-foreground text-xs">{currency}</span>
                </div>
                <div className="mt-2 mb-1">
                  {loading ? (
                    <div className="h-8 w-40 bg-muted animate-pulse rounded-md" />
                  ) : (
                    <div className="text-3xl font-extrabold text-primary">
                      {fmt(balance)}{" "}
                      <span className="text-sm text-muted-foreground">{currency}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">آخر تحديث عند فتح الصفحة</p>
              </div>

              {/* إيداع */}
              <div className="col-span-1 rounded-2xl border border-border bg-card p-5">
                <h3 className="font-bold text-foreground mb-3">إضافة رصيد</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeposit(true)}
                    className="flex-1 py-2.5 rounded-lg font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-sm transition-all"
                  >
                    إيداع عبر البوابة
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  يتم تحويلك لبوابة الدفع. بعد الإتمام سيُضاف الرصيد تلقائيًا.
                </p>
              </div>

              {/* سحب */}
              <div className="col-span-1 rounded-2xl border border-border bg-card p-5">
                <h3 className="font-bold text-foreground mb-3">طلب سحب</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowWithdraw(true)}
                    className="flex-1 py-2.5 rounded-lg font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-sm transition-all"
                  >
                    إنشاء طلب سحب
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  تتم مراجعة طلبات السحب يدويًا وتحويلها خلال الوقت المحدد.
                </p>
              </div>
            </div>

            {/* أدوات البحث والفلترة */}
            <div className="rounded-2xl border border-border bg-card p-4 md:p-5 mb-4">
              <div className="flex flex-col md:flex-row gap-3 md:items-center">
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
                <div className="flex gap-2">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="px-3 py-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="all">كل الأنواع</option>
                    <option value="deposit">إيداع</option>
                    <option value="withdraw">سحب</option>
                    <option value="auction">مزاد</option>
                    <option value="adjustment">تعديل</option>
                  </select>
                </div>
              </div>

              {/* ملاحظة صغيرة عشان تكون صريح: البحث داخل صفحة السيرفر الحالية */}
              <div className="mt-2 text-[11px] text-muted-foreground">
                * البحث/الفلترة يتم داخل الصفحة الحالية من السجل.
              </div>
            </div>

            {/* جدول المعاملات */}
            <div className="rounded-2xl border border-border bg-card p-0 overflow-hidden">
              <div className="w-full max-w-full overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-right w-[72px]">#</th>
                      <th className="px-4 py-3 text-right w-[110px]">النوع</th>
                      <th className="px-4 py-3 text-right w-[150px]">المبلغ</th>
                      <th className="px-4 py-3 text-right w-[140px]">المزاد المرتبط</th>
                      <th className="px-4 py-3 text-right">الوصف</th>
                      <th className="px-4 py-3 text-right w-[190px]">التاريخ</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {txLoading ? (
                      [...Array(6)].map((_, i) => (
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
                            <div className="h-4 w-48 bg-muted rounded" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-4 w-28 bg-muted rounded" />
                          </td>
                        </tr>
                      ))
                    ) : filteredTxs.length ? (
                      filteredTxs.map((t) => {
                        const type = normalizeType(t);
                        const related = t.related_auction ?? t.related_auction_id ?? null;

                        const rawAmount = Number(t.amount ?? 0);
                        const amountSar = toSar(rawAmount);
                        const isWithdraw =
                          String(type).toLowerCase() === "withdraw" || amountSar < 0;

                        return (
                          <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                              {t.id}
                            </td>
                            <td className="px-4 py-3">{txTypeBadge(t)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`font-bold ${isWithdraw ? "text-rose-500" : "text-emerald-500"}`}
                              >
                                {fmt(Math.abs(amountSar))}{" "}
                                <span className="text-xs text-muted-foreground">
                                  {currency}
                                </span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                              {related ? (
                                <span className="inline-flex items-center gap-1 text-primary">
                                  <LinkIcon className="w-3 h-3" />#{related}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {t.description ? (
                                <span className="block truncate max-w-[520px]">
                                  {t.description}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
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

              {/* ترقيم الصفحات (سيرفر) */}
              {!txLoading && txLastPage > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-border">
                  <button
                    onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                    disabled={txPage === 1}
                    className={`px-3 py-2 rounded-lg text-sm border ${
                      txPage === 1
                        ? "border-border text-muted-foreground cursor-not-allowed"
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    السابق
                  </button>

                  <div className="text-muted-foreground text-sm">
                    صفحة <span className="text-foreground">{txPage}</span> من{" "}
                    <span className="text-foreground">{txLastPage}</span>{" "}
                    <span className="text-muted-foreground">— إجمالي: </span>
                    <span className="text-foreground">{txTotal}</span>
                  </div>

                  <button
                    onClick={() => setTxPage((p) => Math.min(txLastPage, p + 1))}
                    disabled={txPage === txLastPage}
                    className={`px-3 py-2 rounded-lg text-sm border ${
                      txPage === txLastPage
                        ? "border-border text-muted-foreground cursor-not-allowed"
                        : "border-border text-foreground hover:bg-muted"
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

      {/* زر فتح القائمة (جوال) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-xl z-50 hover:bg-primary/90 transition-all duration-200 flex items-center justify-center"
        aria-label="فتح القائمة الجانبية"
        title="القائمة"
      >
        <FiMenu size={22} />
      </button>

      {/* مودال الإيداع */}
      <AnimatePresence>
        {showDeposit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => !depositSubmitting && setShowDeposit(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-5"
            >
              <h3 className="text-lg font-bold text-foreground mb-4">إضافة رصيد</h3>

              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    المبلغ (بالريال)
                  </label>
                  <input
                    inputMode="numeric"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="مثال: 250"
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={depositSubmitting}
                    onClick={() => setShowDeposit(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    disabled={depositSubmitting || !depositAmount}
                    className="flex-1 px-4 py-2.5 rounded-lg text-primary-foreground font-semibold bg-primary hover:bg-primary/90 shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {depositSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    بدء الإيداع
                  </button>
                </div>
              </form>

              <p className="text-[11px] text-muted-foreground mt-3">
                سيتم فتح بوابة الدفع في نافذة جديدة. بعد اكتمال العملية ستظهر في سجل المعاملات (بعد تأكيد الدفع).
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مودال السحب */}
      <AnimatePresence>
        {showWithdraw && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => !withdrawSubmitting && setShowWithdraw(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-5"
            >
              <h3 className="text-lg font-bold text-foreground mb-4">طلب سحب</h3>

              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    المبلغ (بالريال)
                  </label>
                  <input
                    inputMode="numeric"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder={`حتى ${fmt(balance)} ${currency}`}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    ملاحظة (اختياري)
                  </label>
                  <textarea
                    value={withdrawNote}
                    onChange={(e) => setWithdrawNote(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="مثال: تحويل لحسابي البنكي"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={withdrawSubmitting}
                    onClick={() => setShowWithdraw(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    disabled={withdrawSubmitting || !withdrawAmount}
                    className="flex-1 px-4 py-2.5 rounded-lg text-primary-foreground font-semibold bg-primary hover:bg-primary/90 shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {withdrawSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    إرسال الطلب
                  </button>
                </div>
              </form>

              <p className="text-[11px] text-muted-foreground mt-3">
                ملاحظة: طلب السحب يتم إنشاؤه كـ Pending ويتم خصم الرصيد فعليًا بعد موافقة الإدارة (حسب منطق الباك إند الحالي).
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
