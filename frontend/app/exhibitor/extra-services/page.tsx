"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "../../../components/exhibitor/Header";
import { Sidebar } from "../../../components/exhibitor/sidebar";
import { FiMenu } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  Sparkles,
  Shield,
  Car,
  Battery,
  SprayCan,
  Info,
  RefreshCw,
  CheckCircle2,
  Search,
  X,
} from "lucide-react";

/* =========================
   Types (UI)
========================= */
type Status = "pending" | "approved" | "rejected" | "completed" | string;

interface ExtraService {
  id: number;
  name: string;
  description?: string | null;
  details?: string | null;
  icon?: string | null; // shield | spray | battery | third | car | ...
  base_price?: number | null;
  currency?: string | null;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ExtraServiceRequest {
  id: number;
  extra_service_id: number;
  status: Status;
  notes?: string | null;
  price?: number | null;
  currency?: string | null;
  created_at: string;
  extra_service?: ExtraService;
}

type Paginator<T> = {
  data: T[];
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
};

// Backend may return one of these:
// 1) Wrapped: { success: true, data: ... }
// 2) Direct paginator: { data: [...], current_page, ... }
// 3) Laravel API Resources style: { data: [...], meta: {...}, links: {...} }
// 4) Array: [...]
type Wrapped<T> = { success: boolean; data: T; message?: string };

/* =========================
   Helpers
========================= */
function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pick<T = any>(obj: any, keys: string[], fallback: any = undefined): T {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return fallback;
}

function unwrap<T = any>(resp: any): T {
  return resp && resp.success !== undefined ? (resp as Wrapped<T>).data : resp;
}

const fmtMoney = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("ar-SA");
  } catch {
    return iso;
  }
};

const pickIcon = (key?: string | null) => {
  const k = (key || "").toLowerCase();
  const base = "w-6 h-6";
  if (k.includes("shield") || k.includes("insurance") || k === "full")
    return <Shield className={`${base} text-primary`} />;
  if (k.includes("spray") || k.includes("paint"))
    return <SprayCan className={`${base} text-primary`} />;
  if (k.includes("battery"))
    return <Battery className={`${base} text-amber-500`} />;
  if (k.includes("third") || k.includes("car"))
    return <Car className={`${base} text-rose-500`} />;
  return <Sparkles className={`${base} text-muted-foreground`} />;
};

function normalizeService(raw: any): ExtraService {
  return {
    id: safeNum(pick(raw, ["id"]), 0),
    name: String(pick(raw, ["name", "title"], "")),
    description: pick(raw, ["description"], null),
    details: pick(raw, ["details", "long_description"], null),
    icon: pick(raw, ["icon", "icon_key"], null),
    base_price: (() => {
      const v = pick(raw, ["base_price", "basePrice", "price"], null);
      return v == null ? null : safeNum(v, 0);
    })(),
    currency: (() => {
      const c = pick(raw, ["currency"], null);
      return c == null ? null : String(c).toUpperCase();
    })(),
    is_active: Boolean(pick(raw, ["is_active", "isActive", "active"], false)),
    createdAt: pick(raw, ["createdAt", "created_at"], undefined),
    updatedAt: pick(raw, ["updatedAt", "updated_at"], undefined),
  };
}

function normalizeRequest(raw: any): ExtraServiceRequest {
  const svcRaw =
    pick(raw, ["extra_service", "extraService", "service"], undefined) ?? undefined;

  return {
    id: safeNum(pick(raw, ["id"]), 0),
    extra_service_id: safeNum(pick(raw, ["extra_service_id", "extraServiceId", "service_id"]), 0),
    status: String(pick(raw, ["status"], "pending")),
    notes: pick(raw, ["notes", "note"], null),
    price: (() => {
      const v = pick(raw, ["price", "amount"], null);
      return v == null ? null : safeNum(v, 0);
    })(),
    currency: (() => {
      const c = pick(raw, ["currency"], null);
      return c == null ? null : String(c).toUpperCase();
    })(),
    created_at: String(pick(raw, ["created_at", "createdAt", "date"], new Date().toISOString())),
    extra_service: svcRaw ? normalizeService(svcRaw) : undefined,
  };
}

/** استخراج paginator لطلبات الخدمات */
function extractReqPaginator(resp: any): Paginator<ExtraServiceRequest> {
  const payload = unwrap<any>(resp);

  // Direct paginator
  if (payload && Array.isArray(payload.data) && typeof payload.current_page === "number") {
    return {
      data: payload.data.map(normalizeRequest),
      current_page: safeNum(payload.current_page, 1),
      per_page: safeNum(payload.per_page, payload.data.length || 10),
      last_page: safeNum(payload.last_page, 1),
      total: safeNum(payload.total, payload.data.length || 0),
    };
  }

  // Laravel resources style { data: [...], meta: {...} }
  if (payload && Array.isArray(payload.data) && payload.meta) {
    return {
      data: payload.data.map(normalizeRequest),
      current_page: safeNum(payload.meta.current_page, 1),
      per_page: safeNum(payload.meta.per_page, payload.data.length || 10),
      last_page: safeNum(payload.meta.last_page, 1),
      total: safeNum(payload.meta.total, payload.data.length || 0),
    };
  }

  // If payload is an array
  if (Array.isArray(payload)) {
    const arr = payload.map(normalizeRequest);
    return {
      data: arr,
      current_page: 1,
      per_page: arr.length || 10,
      last_page: 1,
      total: arr.length,
    };
  }

  // Fallback object
  const arr = Array.isArray(payload?.data) ? payload.data : [];
  return {
    data: arr.map(normalizeRequest),
    current_page: safeNum(payload?.current_page, 1),
    per_page: safeNum(payload?.per_page, arr.length || 10),
    last_page: safeNum(payload?.last_page, 1),
    total: safeNum(payload?.total, arr.length || 0),
  };
}

/** استخراج قائمة الخدمات (قد تكون array / paginator / resources / wrapped) */
function extractServicesList(resp: any): ExtraService[] {
  const payload = unwrap<any>(resp);

  // resources style or paginator
  if (payload && Array.isArray(payload.data)) {
    return payload.data.map(normalizeService);
  }

  // direct array
  if (Array.isArray(payload)) {
    return payload.map(normalizeService);
  }

  // object fallback
  const arr = Array.isArray(payload?.data) ? payload.data : [];
  return arr.map(normalizeService);
}

/* =========================
   Modal
========================= */
function ServiceModal({
  open,
  onClose,
  service,
  onRequest,
  requesting,
}: {
  open: boolean;
  onClose: () => void;
  service: ExtraService | null;
  onRequest: (notes: string) => void;
  requesting: boolean;
}) {
  const [notes, setNotes] = useState("");
  useEffect(() => {
    if (open) setNotes("");
  }, [open]);

  if (!open || !service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="relative w-full md:max-w-lg rounded-2xl border border-border bg-background p-4 md:p-5 mx-2 md:mx-0 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-3 left-3 text-muted-foreground hover:text-foreground"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3 pr-1">
          <div className="shrink-0">{pickIcon(service.icon)}</div>
          <div className="flex-1">
            <div className="text-foreground font-bold text-lg">{service.name}</div>
            {service.description && (
              <div className="text-muted-foreground text-sm mt-1">
                {service.description}
              </div>
            )}
          </div>
        </div>

        {service.details && (
          <div className="mt-3 text-muted-foreground/90 text-sm leading-6 whitespace-pre-wrap">
            {service.details}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-muted/50 p-3">
            <div className="text-muted-foreground text-xs">السعر الأساسي</div>
            <div className="text-foreground font-semibold mt-1">
              {fmtMoney(service.base_price)}{" "}
              <span className="text-muted-foreground text-xs">
                {service.currency || "SAR"}
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/50 p-3">
            <div className="text-muted-foreground text-xs">الحالة</div>
            <div
              className={`text-xs font-semibold mt-1 ${
                service.is_active ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {service.is_active ? "نشط" : "متوقف"}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs text-muted-foreground mb-1">
            ملاحظاتك (اختياري)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="أي تفاصيل أو تفضيلات خاصة بالتنفيذ…"
          />
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted"
          >
            إلغاء
          </button>
          <button
            onClick={() => onRequest(notes)}
            disabled={requesting || !service.is_active}
            className={`px-4 py-2.5 rounded-lg text-primary-foreground font-semibold shadow-lg inline-flex items-center gap-2
            ${
              service.is_active
                ? "bg-primary hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {requesting ? "جارٍ الإرسال..." : "طلب الخدمة"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* =========================
   Page
========================= */
export default function ExhibitorExtraServicesPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Services
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ExtraService[]>([]);
  const [q, setQ] = useState("");

  // Requests
  const [reqLoading, setReqLoading] = useState(true);
  const [reqPage, setReqPage] = useState(1);
  const [reqPaginator, setReqPaginator] = useState<Paginator<ExtraServiceRequest> | null>(null);
  const [requests, setRequests] = useState<ExtraServiceRequest[]>([]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [activeService, setActiveService] = useState<ExtraService | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => setIsClient(true), []);

  const serviceById = useMemo(() => {
    const m = new Map<number, ExtraService>();
    services.forEach((s) => m.set(s.id, s));
    return m;
  }, [services]);

  /* -------------------------
     Fetchers
  ------------------------- */
  const fetchServices = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { per_page: 12 };
      if (q.trim()) params.q = q.trim();

      const { data } = await api.get("/api/exhibitor/extra-services", { params });
      const list = extractServicesList(data);

      setServices(list);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "تعذّر تحميل الخدمات");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async (page = 1) => {
    setReqLoading(true);
    try {
      const { data } = await api.get("/api/exhibitor/extra-services/requests", {
        params: { page, per_page: 10 },
      });

      const p = extractReqPaginator(data);
      setReqPaginator(p);
      setRequests(p.data || []);
      setReqPage(p.current_page || page || 1);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "تعذّر تحميل طلباتك");
      setRequests([]);
      setReqPaginator(null);
      setReqPage(1);
    } finally {
      setReqLoading(false);
    }
  };

  useEffect(() => {
    if (!isClient) return;
    fetchServices();
    fetchRequests(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  /* -------------------------
     Actions
  ------------------------- */
  const openService = async (svc: ExtraService) => {
    try {
      const { data } = await api.get(`/api/exhibitor/extra-services/${svc.id}`);
      const payload = unwrap<any>(data);
      const s = payload ? normalizeService(payload) : svc;
      setActiveService(s);
      setModalOpen(true);
    } catch {
      setActiveService(svc);
      setModalOpen(true);
    }
  };

  const requestService = async (notes: string) => {
    if (!activeService) return;
    setRequesting(true);
    try {
      const { data } = await api.post("/api/exhibitor/extra-services/requests", {
        extra_service_id: activeService.id,
        notes: notes?.trim() ? notes.trim() : null,
      });

      if (data?.success === false) {
        toast.error(data?.message || "فشل إرسال الطلب");
        return;
      }

      toast.success("تم إرسال طلب الخدمة بنجاح");
      setModalOpen(false);
      setActiveService(null);
      await fetchRequests(reqPage);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "فشل إرسال الطلب");
    } finally {
      setRequesting(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchServices(), fetchRequests(reqPage)]);
    toast.success("تم التحديث");
  };

  const applySearch = async () => {
    await fetchServices();
  };

  /* -------------------------
     Derivations (client-side filter as safety net)
  ------------------------- */
  const filtered = useMemo(() => {
    if (!q.trim()) return services;
    const s = q.trim().toLowerCase();
    return services.filter((x) =>
      [x.name, x.description, x.details, x.icon].some((t) =>
        (t || "").toLowerCase().includes(s)
      )
    );
  }, [services, q]);

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
    <div
      dir="rtl"
      className="flex min-h-screen bg-background text-foreground relative overflow-x-hidden"
    >
      {/* زخارف */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl bg-violet-600/10" />
        <div className="absolute bottom-0 -right-24 w-72 h-72 rounded-full blur-3xl bg-fuchsia-500/10" />
      </div>

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
            <motion.div className="relative w-72 ml-auto h-full bg-slate-950 border-l border-slate-800 shadow-2xl">
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
                  <Sparkles className="w-5 h-5 text-primary" />
                  خدمات إضافية للمعرض
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  اطلب خدمات مساندة (تأمين، حماية طلاء، شحن بطارية، وغيرها) مباشرة عبر اللوحة.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={refreshAll}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-foreground hover:bg-muted"
                >
                  <RefreshCw className="w-4 h-4" />
                  تحديث
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="rounded-2xl border border-border bg-card p-4 md:p-5 mb-6">
              <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="ابحث بالاسم / الوصف / النوع..."
                    className="w-full pr-9 pl-3 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={applySearch}
                    className="px-3 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted inline-flex items-center gap-2"
                  >
                    <Info className="w-4 h-4" />
                    تطبيق البحث
                  </button>
                  <button
                    onClick={() => {
                      setQ("");
                      // بعد ما نمسح q، fetchServices هيجيب كل حاجة
                      // لكن عشان state لسه ما اتحدثتش، نناديه بعد setQ بميكرو-تيك
                      setTimeout(() => fetchServices(), 0);
                    }}
                    className="px-3 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted"
                  >
                    إعادة تعيين
                  </button>
                </div>
              </div>
            </div>

            {/* Content: Services + Requests */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Services list */}
              <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-4 md:p-5">
                <div className="text-muted-foreground text-sm font-semibold mb-3">
                  الخدمات المتاحة
                </div>

                {loading ? (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-32 rounded-xl border border-border bg-muted/50 animate-pulse"
                      />
                    ))}
                  </div>
                ) : filtered.length ? (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filtered.map((svc) => (
                      <button
                        key={svc.id}
                        onClick={() => openService(svc)}
                        className="group text-right rounded-xl border border-border bg-card hover:border-primary/50 transition-colors p-4 text-foreground"
                        title="عرض التفاصيل وطلب الخدمة"
                      >
                        <div className="flex items-start gap-3">
                          <div className="shrink-0">{pickIcon(svc.icon)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{svc.name}</div>
                            {svc.description ? (
                              <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                {svc.description}
                              </div>
                            ) : (
                              <div className="mt-1 text-sm text-muted-foreground/50">—</div>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            السعر الأساسي:{" "}
                            <span className="text-foreground font-bold">
                              {fmtMoney(svc.base_price)}{" "}
                              <span className="text-xs text-muted-foreground">
                                {svc.currency || "SAR"}
                              </span>
                            </span>
                          </div>
                          <div
                            className={`text-[11px] px-2 py-1 rounded-full border
                              ${
                                svc.is_active
                                  ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                                  : "border-rose-500/30 text-rose-500 bg-rose-500/10"
                              }`}
                          >
                            {svc.is_active ? "متاح" : "غير متاح"}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">لا توجد خدمات مطابقة</div>
                )}
              </div>

              {/* Requests list */}
              <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
                <div className="text-muted-foreground text-sm font-semibold mb-3">
                  طلباتي الأخيرة
                </div>

                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="w-full max-w-full overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted border-b border-border text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-right w-[80px]">#</th>
                          <th className="px-3 py-2 text-right">الخدمة</th>
                          <th className="px-3 py-2 text-right w-[140px]">الحالة</th>
                          <th className="px-3 py-2 text-right w-[140px]">السعر</th>
                          <th className="px-3 py-2 text-right w-[160px]">التاريخ</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-border">
                        {reqLoading ? (
                          Array.from({ length: 6 }).map((_, i) => (
                            <tr key={i} className="animate-pulse">
                              <td className="px-3 py-2">
                                <div className="h-4 w-10 bg-muted rounded" />
                              </td>
                              <td className="px-3 py-2">
                                <div className="h-4 w-48 bg-muted rounded" />
                              </td>
                              <td className="px-3 py-2">
                                <div className="h-5 w-20 bg-muted rounded-full" />
                              </td>
                              <td className="px-3 py-2">
                                <div className="h-4 w-20 bg-muted rounded" />
                              </td>
                              <td className="px-3 py-2">
                                <div className="h-4 w-32 bg-muted rounded" />
                              </td>
                            </tr>
                          ))
                        ) : requests.length ? (
                          requests.map((r) => {
                            const badge =
                              r.status === "pending"
                                ? "border-amber-500/30 text-amber-500 bg-amber-500/10"
                                : r.status === "approved"
                                ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                                : r.status === "completed"
                                ? "border-violet-500/30 text-violet-500 bg-violet-500/10"
                                : "border-rose-500/30 text-rose-500 bg-rose-500/10";

                            const svcName =
                              r.extra_service?.name ||
                              serviceById.get(r.extra_service_id)?.name ||
                              "—";

                            const cur =
                              r.currency ||
                              r.extra_service?.currency ||
                              serviceById.get(r.extra_service_id)?.currency ||
                              "SAR";

                            return (
                              <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                  {r.id}
                                </td>

                                <td className="px-3 py-2 text-muted-foreground">
                                  <span className="truncate block max-w-[220px]">{svcName}</span>
                                </td>

                                <td className="px-3 py-2">
                                  <span
                                    className={`text-[11px] px-2 py-1 rounded-full border ${badge} capitalize`}
                                  >
                                    {r.status}
                                  </span>
                                </td>

                                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                  {fmtMoney(r.price ?? null)}{" "}
                                  <span className="text-xs text-muted-foreground">{cur}</span>
                                </td>

                                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                  {fmtDate(r.created_at)}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td className="px-3 py-8 text-center text-muted-foreground" colSpan={5}>
                              لا توجد طلبات
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {!reqLoading && reqPaginator && reqPaginator.last_page > 1 && (
                    <div className="flex items-center justify-between p-3 border-t border-border text-sm text-muted-foreground">
                      <button
                        onClick={() => reqPage > 1 && fetchRequests(reqPage - 1)}
                        disabled={reqPage <= 1}
                        className={`px-3 py-2 rounded-lg border ${
                          reqPage <= 1
                            ? "border-border text-muted-foreground/50 cursor-not-allowed"
                            : "border-border hover:bg-muted text-foreground"
                        }`}
                      >
                        السابق
                      </button>

                      <div className="text-muted-foreground">
                        صفحة <span className="text-foreground">{reqPaginator.current_page}</span> من{" "}
                        <span className="text-foreground">{reqPaginator.last_page}</span>
                      </div>

                      <button
                        onClick={() =>
                          reqPage < (reqPaginator.last_page || 1) && fetchRequests(reqPage + 1)
                        }
                        disabled={reqPage >= (reqPaginator.last_page || 1)}
                        className={`px-3 py-2 rounded-lg border ${
                          reqPage >= (reqPaginator.last_page || 1)
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
            </div>
          </div>
        </main>
      </div>

      {/* FAB (Mobile) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-xl z-50 hover:bg-primary/90 transition-all duration-200 flex items-center justify-center"
        style={{
          boxShadow:
            "0 10px 15px -3px rgba(139, 92, 246, 0.35), 0 4px 6px -4px rgba(0, 0, 0, 0.35)",
        }}
        aria-label="فتح القائمة"
        title="القائمة"
      >
        <FiMenu size={22} />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <ServiceModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setActiveService(null);
            }}
            service={activeService}
            onRequest={requestService}
            requesting={requesting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
