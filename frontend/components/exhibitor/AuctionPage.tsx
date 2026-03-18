"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiFilter,
  FiPlus,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiClock,
  FiUser,
  FiRefreshCw,
} from "react-icons/fi";
import { FaGavel, FaCar } from "react-icons/fa";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

/** ========= API setup (fixed abort handling) ========= **/
const IS_PROD = process.env.NODE_ENV === "production";
const RAW_ROOT = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");

const getSameOrigin = () =>
  typeof window !== "undefined" ? window.location.origin : "";

function resolveApiRoot() {
  if (RAW_ROOT) return { root: RAW_ROOT, source: "env" as const };
  if (!IS_PROD) return { root: getSameOrigin(), source: "dev-fallback" as const };
  throw new Error(
    [
      "Production misconfigured: NEXT_PUBLIC_API_URL is missing.",
      "Set it to your Laravel host ROOT (WITHOUT /api).",
      "Example: https://example.onrender.com OR https://domain.com/public",
    ].join(" ")
  );
}

const { root: API_ROOT, source: API_SOURCE } = resolveApiRoot();
const API_BASE = `${API_ROOT}/api`;
const TOKEN_KEY = "token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  return raw.replace(/^"(.+)"$/, "$1");
}

function authHeaders() {
  const token = getToken();
  const h: Record<string, string> = { Accept: "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

class ApiError extends Error {
  status?: number;
  url?: string;
  body?: string;
  constructor(message: string, opts?: { status?: number; url?: string; body?: string }) {
    super(message);
    this.name = "ApiError";
    this.status = opts?.status;
    this.url = opts?.url;
    this.body = opts?.body;
  }
}

const buildApiUrl = (path: string) => {
  const clean = path.replace(/^\//, "");
  return `${API_BASE}/${clean}`;
};

function isAbortError(err: any) {
  return (
    err?.name === "AbortError" ||
    err instanceof DOMException ||
    (typeof err?.message === "string" &&
      err.message.toLowerCase().includes("aborted"))
  );
}

async function apiFetchRaw(path: string, init?: RequestInit) {
  const url = buildApiUrl(path);

  let res: Response;
  try {
    res = await fetch(url, {
      cache: "no-store",
      ...init,
      headers: {
        ...authHeaders(),
        ...(init?.headers || {}),
      },
    });
  } catch (err: any) {
    // ✅ مهم: لو abort، ما نغلفش الخطأ، نخليه يطلع زي ما هو عشان نستثنيه فوق
    if (isAbortError(err)) throw err;

    const hint =
      API_SOURCE === "dev-fallback"
        ? "تستخدم نفس الدومين محليًا (dev-fallback)."
        : "تحقق من NEXT_PUBLIC_API_URL أو CORS على Laravel.";
    throw new ApiError(`تعذر الاتصال بالخادم: ${url}\n${hint}\n${err?.message || err}`, {
      url,
    });
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");

    if (res.status === 401) {
      throw new ApiError("غير مصرح: يرجى تسجيل الدخول مرة أخرى (401).", {
        status: 401,
        url,
        body,
      });
    }

    if (res.status === 404) {
      const isNext404 = /The page could not be found/i.test(body);
      const advice = isNext404
        ? `الطلب وصل إلى Next.js بدل Laravel.
- يجب ضبط NEXT_PUBLIC_API_URL ليشير إلى جذر Laravel (بدون /api).
- لاحظ أن الكود يضيف /api تلقائيًا.`
        : "تحقق من مسار Laravel (route) أو البارامترات.";
      throw new ApiError(`تعذر جلب البيانات (404) من: ${url}\n${advice}\n${body}`, {
        status: 404,
        url,
        body,
      });
    }

    throw new ApiError(`فشل الطلب (${res.status}) من: ${url}\n${body}`, {
      status: res.status,
      url,
      body,
    });
  }

  return res;
}

async function apiJson<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetchRaw(path, init);
  const text = await res.text().catch(() => "");
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    const snippet = text.slice(0, 250);
    throw new ApiError(`الرد ليس JSON من: ${res.url}\n${snippet}`, {
      status: res.status,
      url: res.url,
      body: text,
    });
  }
}

async function postWithFallback<T = any>(paths: string[], payload: any): Promise<T> {
  let lastErr: any = null;
  for (const p of paths) {
    try {
      return await apiJson<T>(p, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e: any) {
      // ✅ لو abort، سيبه يطلع
      if (isAbortError(e)) throw e;
      lastErr = e;
      if (e?.status === 404) continue;
      throw e;
    }
  }
  throw lastErr || new Error("تعذر إنشاء المزاد: لا يوجد مسار صالح.");
}

/** ========= Helpers ========= **/
const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop";

const toNumberSafe = (v: any) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).replace(/\s/g, "").replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

function resolveMediaUrl(src: string) {
  const s = (src || "").trim();
  if (!s) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return `${API_ROOT}${s}`;
  return `${API_ROOT}/${s}`;
}

function arStatusLabel(s: string) {
  switch (s) {
    case "live":
      return "جاري";
    case "scheduled":
      return "قادم";
    case "ended":
      return "منتهي";
    case "canceled":
    case "cancelled":
      return "ملغي";
    case "failed":
      return "فاشل";
    case "completed":
      return "مكتمل";
    case "active":
      return "جاري";
    default:
      return s;
  }
}

function statusChipColor(s: string) {
  return s === "live" || s === "active"
    ? "bg-emerald-600 text-white"
    : s === "scheduled"
    ? "bg-amber-500 text-white"
    : s === "ended" || s === "completed"
    ? "bg-destructive text-destructive-foreground"
    : "bg-muted text-muted-foreground";
}

/** ========= Types ========= **/
type AuctionStatusApi =
  | "scheduled"
  | "live"
  | "ended"
  | "canceled"
  | "cancelled"
  | "failed"
  | "completed"
  | "active";

interface CarApi {
  id: number;
  make: string;
  model: string;
  year: number;
  images?: string[] | null;
  evaluation_price?: string | number | null;
  min_price?: string | number | null;
  max_price?: string | number | null;
  user_id?: number | null;
  owner_id?: number | null;
}

interface BidApi {
  id: number;
  bid_amount: string | number;
  created_at: string;
  user_id: number;
}

interface AuctionApi {
  id: number;
  car_id: number;
  car?: CarApi | null;
  starting_bid: string | number;
  current_bid: string | number;
  min_price?: string | number | null;
  max_price?: string | number | null;
  start_time: string;
  end_time: string;
  extended_until?: string | null;
  status: AuctionStatusApi | string;
  bids?: BidApi[];
  broadcasts?: any[];
}

interface Paged<T> {
  current_page: number;
  data: T[];
  per_page: number;
  total: number;
  last_page: number;
}

interface UiAuction {
  id: number;
  carLabel: string;
  image: string;
  startPrice: number;
  currentBid: number;
  endTimeIso: string;
  statusApi: AuctionStatusApi | string;
  statusAr: string;
  bidsCount: number;
  watchers: number;
  owner?: string;
}

interface AuctionSession {
  id: number;
  name: string;
  session_date: string;
  status: "scheduled" | "active" | "completed" | "cancelled" | "canceled";
  type: "live" | "instant" | "silent";
  auctions_count?: number;
  created_at?: string;
  updated_at?: string;
}

/** ========= Response pickers ========= **/
function isPaginator(obj: any): obj is Paged<any> {
  return (
    !!obj &&
    typeof obj === "object" &&
    typeof obj.current_page === "number" &&
    Array.isArray(obj.data) &&
    typeof obj.per_page === "number" &&
    typeof obj.total === "number" &&
    typeof obj.last_page === "number"
  );
}

function pickPaged<T = any>(js: any): Paged<T> | null {
  if (isPaginator(js)) return js as Paged<T>;
  if (isPaginator(js?.data)) return js.data as Paged<T>;
  if (isPaginator(js?.data?.data)) return js.data.data as Paged<T>;
  if (isPaginator(js?.result)) return js.result as Paged<T>;
  return null;
}

function pickArray<T = any>(js: any): T[] | null {
  if (Array.isArray(js)) return js;
  if (Array.isArray(js?.data)) return js.data;
  if (Array.isArray(js?.data?.data)) return js.data.data;
  if (Array.isArray(js?.data?.sessions)) return js.data.sessions;
  if (Array.isArray(js?.sessions)) return js.sessions;
  return null;
}

function pickCarArray(js: any): CarApi[] | null {
  const pg = pickPaged<CarApi>(js);
  if (pg) return pg.data;
  const arr =
    (Array.isArray(js?.cars) && js.cars) ||
    (Array.isArray(js?.data?.cars) && js.data.cars) ||
    pickArray<CarApi>(js);
  return Array.isArray(arr) ? arr : null;
}

function pickMyId(js: any): number | null {
  const id =
    js?.data?.id ??
    js?.id ??
    js?.user?.id ??
    js?.data?.user?.id ??
    js?.data?.data?.id ??
    null;
  if (typeof id === "number") return id;
  if (typeof id === "string" && /^\d+$/.test(id)) return Number(id);
  return null;
}

/** ========= Countdown ========= **/
function Countdown({ endIso }: { endIso: string }) {
  const [t, setT] = useState("");

  useEffect(() => {
    const update = () => {
      const end = new Date(endIso).getTime();
      if (!Number.isFinite(end)) {
        setT("—");
        return;
      }
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setT("انتهى");
        return;
      }
      const h = Math.floor(diff / 1000 / 60 / 60);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setT(`${h}س ${m}د ${s}ث`);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endIso]);

  return <span className="font-mono text-xs md:text-sm">{t}</span>;
}

/** ========= Fetch helpers ========= **/
async function readMyUserId(): Promise<number | null> {
  const candidates = ["me", "auth/me", "user", "profile"];
  for (const c of candidates) {
    try {
      const js: any = await apiJson(c);
      const id = pickMyId(js);
      if (id != null) return id;
    } catch {
      /* ignore */
    }
  }
  return null;
}

async function fetchMyCarsOnly(): Promise<CarApi[]> {
  const myId = await readMyUserId().catch(() => null);

  const paths: string[] = [];
  if (myId != null) {
    paths.push(`cars?user_id=${myId}&sort_by=created_at&sort_dir=desc`);
    paths.push(`cars?owner_id=${myId}&sort_by=created_at&sort_dir=desc`);
  }
  paths.push("my-cars?sort_by=created_at&sort_dir=desc");
  paths.push("cars?mine=1&sort_by=created_at&sort_dir=desc");
  paths.push("cars?user_id=me&sort_by=created_at&sort_dir=desc");
  paths.push("cars?sort_by=created_at&sort_dir=desc");

  for (const p of paths) {
    try {
      const js: any = await apiJson(p);
      const arr = pickCarArray(js);
      if (arr && arr.length) {
        if (myId != null) {
          return arr.filter(
            (c) =>
              (c.user_id != null && c.user_id === myId) ||
              (c.owner_id != null && c.owner_id === myId) ||
              (c.user_id == null && c.owner_id == null)
          );
        }
        return arr;
      }
    } catch {
      /* try next */
    }
  }
  return [];
}

async function fetchPublicSessions(): Promise<AuctionSession[]> {
  const candidates = [
    "sessions/active-scheduled?with_counts=1",
    "sessions/active-scheduled",
    "sessions?status=active,scheduled",
  ];
  for (const p of candidates) {
    try {
      const js: any = await apiJson(p);
      const arr = pickArray<AuctionSession>(js);
      if (arr) return arr;
    } catch {
      /* try next */
    }
  }
  return [];
}

function sessionLabel(s: AuctionSession) {
  const dateTxt = s.session_date
    ? ` — ${format(new Date(s.session_date), "dd MMMM yyyy", { locale: ar })}`
    : "";
  return `${s.name}${dateTxt}`;
}

/** ========= Modal: Start Live Auction ========= **/
function StartLiveModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (created: UiAuction) => void;
}) {
  const [cars, setCars] = useState<CarApi[]>([]);
  const [loadingCars, setLoadingCars] = useState(false);

  const [sessions, setSessions] = useState<AuctionSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [form, setForm] = useState({
    car_id: "",
    car_price: "",
    starting_bid: "",
    min_price: "",
    max_price: "",
    session_id: "",
  });

  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const firstInputRef = useRef<HTMLSelectElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    setErrors({});
    setSessionsError(null);
    setForm({
      car_id: "",
      car_price: "",
      starting_bid: "",
      min_price: "",
      max_price: "",
      session_id: "",
    });

    const t = setTimeout(() => firstInputRef.current?.focus(), 100);

    const run = async () => {
      try {
        const token = getToken();
        if (!token) throw new Error("غير مصرح: لا يوجد توكن. سجّل الدخول أولاً.");

        setLoadingCars(true);
        setLoadingSessions(true);

        const [mine, sess] = await Promise.all([fetchMyCarsOnly(), fetchPublicSessions()]);

        setCars(Array.isArray(mine) ? mine : []);
        setSessions(Array.isArray(sess) ? sess : []);

        if (!mine || mine.length === 0) {
          setErrors((prev) => ({ ...prev, carsEmpty: "لا توجد سيارات مرتبطة بحسابك." }));
        }
        if (!sess || sess.length === 0) {
          setSessionsError("لا توجد جلسات متاحة (active / scheduled).");
        }
      } catch (e: any) {
        setCars([]);
        setSessions([]);
        setSessionsError(e?.message || "تعذر جلب الجلسات.");
        setErrors((prev) => ({ ...prev, global: e?.message || "حدث خطأ غير متوقع" }));
      } finally {
        setLoadingCars(false);
        setLoadingSessions(false);
      }
    };

    run();
    return () => clearTimeout(t);
  }, [open]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.car_id) e.car_id = "السيارة مطلوبة";
    if (!form.session_id) e.session_id = "الجلسة مطلوبة";
    if (!form.starting_bid || Number(form.starting_bid) < 1000) e.starting_bid = "سعر البدء غير صحيح";
    if (!form.min_price || !form.max_price) e.minmax = "أدخل حد أدنى وأقصى موصى به";
    if (form.min_price && form.max_price && Number(form.min_price) > Number(form.max_price))
      e.minmax = "الحد الأدنى يجب أن يكون ≤ الحد الأعلى";
    return e;
  };

  const closeOnBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  const onSelectCar = (val: string) => {
    const idNum = Number(val);
    const selected = cars.find((c) => c.id === idNum);

    const evalPrice = selected?.evaluation_price != null ? String(toNumberSafe(selected.evaluation_price)) : "";
    const minP = selected?.min_price != null ? String(toNumberSafe(selected.min_price)) : "";
    const maxP = selected?.max_price != null ? String(toNumberSafe(selected.max_price)) : "";

    setForm((f) => ({
      ...f,
      car_id: val,
      car_price: evalPrice,
      min_price: minP || f.min_price,
      max_price: maxP || f.max_price,
    }));
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    try {
      const token = getToken();
      if (!token) throw new Error("غير مصرح: لا يوجد توكن. سجّل الدخول أولاً.");

      const payload = {
        car_id: Number(form.car_id),
        starting_bid: Number(form.starting_bid),
        min_price: Number(form.min_price),
        max_price: Number(form.max_price),
        session_id: Number(form.session_id),
      };

      const js: any = await postWithFallback(
        ["auction", "auctions", "auction/create", "auctions/create"],
        payload
      );

      const a: AuctionApi = js?.data?.auction || js?.data || js?.auction || js || ({} as any);

      const car = a?.car || cars.find((c) => c.id === a.car_id) || null;
      const carLabel = car ? `${car.make} ${car.model} ${car.year}` : `#${a.car_id}`;

      const imageRaw = car?.images?.[0] || "";
      const image = imageRaw ? resolveMediaUrl(imageRaw) : PLACEHOLDER_IMG;

      const endIso =
        a?.extended_until && a.extended_until !== "null" ? a.extended_until : a?.end_time;

      const ui: UiAuction = {
        id: a.id,
        carLabel,
        image,
        startPrice: toNumberSafe(a.starting_bid),
        currentBid: toNumberSafe(a.current_bid),
        endTimeIso: endIso || new Date().toISOString(),
        statusApi: (a.status as any) || "scheduled",
        statusAr: arStatusLabel(String(a.status || "")),
        bidsCount: Array.isArray(a.bids) ? a.bids.length : 0,
        watchers: Array.isArray(a.broadcasts) ? a.broadcasts.length : 0,
      };

      onCreated(ui);
      onClose();
    } catch (err: any) {
      // ✅ لو abort حصل لأي سبب، تجاهله
      if (isAbortError(err)) return;
      setErrors({ global: err?.message || "حدث خطأ غير متوقع" });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={backdropRef}
          onMouseDown={closeOnBackdrop}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="bg-background text-foreground w-full max-w-xl rounded-2xl shadow-2xl p-5 md:p-6 relative border border-border"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
              aria-label="إغلاق"
            >
              <FiX size={20} />
            </button>

            <h2 className="text-xl md:text-2xl font-bold mb-4 text-center">
              بدء حراج مباشر الآن
            </h2>

            {errors.global && (
              <div className="mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm whitespace-pre-wrap">
                {errors.global}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block mb-1 text-muted-foreground text-sm">السيارة</label>
                <select
                  ref={firstInputRef}
                  className={`w-full px-3 py-2.5 rounded-lg outline-none bg-background text-foreground border focus:border-primary focus:ring-4 focus:ring-primary/20 ${
                    errors.car_id ? "border-destructive" : "border-border"
                  }`}
                  value={form.car_id}
                  onChange={(e) => onSelectCar(e.target.value)}
                >
                  <option value="">
                    {loadingCars
                      ? "...جاري تحميل سياراتك"
                      : cars.length
                      ? "اختر سيارة من سيارات حسابك"
                      : "لا توجد سيارات مرتبطة بحسابك"}
                  </option>
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>{`${c.make} ${c.model} ${c.year}`}</option>
                  ))}
                </select>
                {errors.car_id && <div className="text-destructive text-xs mt-1">{errors.car_id}</div>}
                {errors.carsEmpty && !loadingCars && (
                  <div className="text-muted-foreground text-xs mt-1">{errors.carsEmpty}</div>
                )}
              </div>

              <div>
                <label className="block mb-1 text-muted-foreground text-sm">الجلسة</label>
                <select
                  className={`w-full px-3 py-2.5 rounded-lg outline-none bg-background text-foreground border focus:border-primary focus:ring-4 focus:ring-primary/20 ${
                    errors.session_id ? "border-destructive" : "border-border"
                  }`}
                  value={form.session_id}
                  onChange={(e) => setForm((f) => ({ ...f, session_id: e.target.value }))}
                >
                  <option value="">
                    {loadingSessions
                      ? "...جاري تحميل الجلسات"
                      : sessions.length
                      ? `اختر جلسة (${sessions.length})`
                      : sessionsError
                      ? "تعذر جلب الجلسات"
                      : "لا توجد جلسات"}
                  </option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {sessionLabel(s)}
                    </option>
                  ))}
                </select>
                {sessionsError && !loadingSessions && (
                  <div className="text-destructive text-xs mt-1">{sessionsError}</div>
                )}
                {errors.session_id && (
                  <div className="text-destructive text-xs mt-1">{errors.session_id}</div>
                )}
              </div>

              <div>
                <label className="block mb-1 text-muted-foreground text-sm">سعر السيارة (تقييم)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 rounded-lg outline-none bg-muted/50 text-foreground border border-border"
                  value={form.car_price}
                  readOnly
                  placeholder="يُملأ تلقائيًا من تقييم السيارة"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-muted-foreground text-sm">سعر البدء (ر.س)</label>
                  <input
                    type="number"
                    className={`w-full px-3 py-2.5 rounded-lg outline-none bg-background text-foreground border focus:border-primary focus:ring-4 focus:ring-primary/20 ${
                      errors.starting_bid ? "border-destructive" : "border-border"
                    }`}
                    value={form.starting_bid}
                    onChange={(e) => setForm((f) => ({ ...f, starting_bid: e.target.value }))}
                    min={1000}
                  />
                  {errors.starting_bid && (
                    <div className="text-destructive text-xs mt-1">{errors.starting_bid}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-muted-foreground text-sm">حد أدنى موصى به</label>
                  <input
                    type="number"
                    className={`w-full px-3 py-2.5 rounded-lg outline-none bg-background text-foreground border focus:border-primary focus:ring-4 focus:ring-primary/20 ${
                      errors.minmax ? "border-destructive" : "border-border"
                    }`}
                    value={form.min_price}
                    onChange={(e) => setForm((f) => ({ ...f, min_price: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-muted-foreground text-sm">حد أقصى موصى به</label>
                  <input
                    type="number"
                    className={`w-full px-3 py-2.5 rounded-lg outline-none bg-background text-foreground border focus:border-primary focus:ring-4 focus:ring-primary/20 ${
                      errors.minmax ? "border-destructive" : "border-border"
                    }`}
                    value={form.max_price}
                    onChange={(e) => setForm((f) => ({ ...f, max_price: e.target.value }))}
                  />
                </div>
              </div>

              {errors.minmax && <div className="text-destructive text-xs mt-1">{errors.minmax}</div>}

              <button
                type="submit"
                className="w-full py-2.5 mt-1 rounded-lg font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors text-base"
              >
                بدء الحراج الآن
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** ========= Main Page ========= **/
export default function DealerAuctionsPage() {
  const [list, setList] = useState<UiAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [bgLoading, setBgLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "live" | "scheduled" | "ended">("");
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inflightRef = useRef<AbortController | null>(null);

  const fetchAuctions = async (opts?: { page?: number; status?: string; silent?: boolean }) => {
    const p = opts?.page ?? page;
    const s = opts?.status ?? statusFilter;
    const silent = opts?.silent ?? false;

    if (!silent) setLoading(true);
    else setBgLoading(true);

    setError(null);

    try {
      const token = getToken();
      if (!token) throw new Error("غير مصرح: لا يوجد توكن. سجّل الدخول أولاً.");

      // abort previous request
      if (inflightRef.current) inflightRef.current.abort();
      const ac = new AbortController();
      inflightRef.current = ac;

      const qs = new URLSearchParams();
      qs.set("sort_by", "created_at");
      qs.set("sort_dir", "desc");
      qs.set("per_page", String(perPage));
      if (s) qs.set("status", String(s));
      qs.set("page", String(p));

      const candidates = [
        `my-auctions?${qs.toString()}`,
        `auctions/mine?${qs.toString()}`,
        `dealer/auctions?${qs.toString()}`,
      ];

      let js: any = null;
      let lastErr: any = null;

      for (const path of candidates) {
        try {
          js = await apiJson(path, { signal: ac.signal });
          break;
        } catch (e: any) {
          // ✅ ignore abort here too
          if (isAbortError(e)) throw e;
          lastErr = e;
          if (e?.status === 404) continue;
          throw e;
        }
      }
      if (!js) throw lastErr || new Error("تعذر جلب المزادات.");

      const pg = pickPaged<AuctionApi>(js);
      if (!pg) throw new Error("شكل استجابة المزادات غير متوقع (Paginator غير موجود).");

      const rows = Array.isArray(pg.data) ? pg.data : [];
      const transformed: UiAuction[] = rows.map((a) => {
        const car = a.car || null;
        const carLabel = car ? `${car.make} ${car.model} ${car.year}` : `#${a.car_id}`;

        const imageRaw = car?.images?.[0] || "";
        const image = imageRaw ? resolveMediaUrl(imageRaw) : PLACEHOLDER_IMG;

        const endIso =
          a.extended_until && a.extended_until !== "null" ? a.extended_until : a.end_time;

        return {
          id: a.id,
          carLabel,
          image,
          startPrice: toNumberSafe(a.starting_bid),
          currentBid: toNumberSafe(a.current_bid),
          endTimeIso: endIso || new Date().toISOString(),
          statusApi: (a.status as any) || "scheduled",
          statusAr: arStatusLabel(String(a.status || "")),
          bidsCount: Array.isArray(a.bids) ? a.bids.length : 0,
          watchers: Array.isArray(a.broadcasts) ? a.broadcasts.length : 0,
        };
      });

      setList(transformed);
      setPage(pg.current_page || 1);
      setPerPage(pg.per_page || perPage);
      setTotal(pg.total || 0);
      setLastPage(pg.last_page || 1);
    } catch (e: any) {
      // ✅ أهم سطر: لو AbortError لا تعرض أي رسالة
      if (isAbortError(e)) return;

      setError(e?.message || "حدث خطأ");
      setList([]);
    } finally {
      if (!silent) setLoading(false);
      else setBgLoading(false);
      inflightRef.current = null;
    }
  };

  useEffect(() => {
    fetchAuctions({ page: 1, silent: false });
    return () => {
      if (inflightRef.current) inflightRef.current.abort();
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAuctions({ page, status: statusFilter, silent: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  const hasLive = useMemo(
    () => list.some((a) => a.statusApi === "live" || a.statusApi === "active"),
    [list]
  );

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (!hasLive) return;

    pollRef.current = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      fetchAuctions({ page, status: statusFilter, silent: true });
    }, 5000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLive, page, statusFilter]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (a) => a.carLabel.toLowerCase().includes(q) || a.statusAr.includes(searchTerm)
    );
  }, [list, searchTerm]);

  const liveCount = filtered.filter((a) => a.statusApi === "live" || a.statusApi === "active").length;
  const endedCount = filtered.filter((a) => a.statusApi === "ended" || a.statusApi === "completed").length;

  const onCreated = (created: UiAuction) => {
    setList((prev) => [created, ...prev]);
    setPage(1);
  };

  const imgOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
  };

  const pageWindow = (current: number, last: number, span = 2) => {
    const from = Math.max(1, current - span);
    const to = Math.min(last, current + span);
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-background text-foreground py-6 md:py-8 px-4 sm:px-6 lg:px-8"
    >
      <StartLiveModal open={showModal} onClose={() => setShowModal(false)} onCreated={onCreated} />

      <div className="max-w-7xl mx-auto">
        {/* العنوان */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="text-2xl md:text-3xl font-extrabold mb-1.5 flex items-center gap-2"
            >
              <FaGavel className="text-secondary-foreground" />
              حراج المعرض
            </motion.h1>
            <p className="text-muted-foreground text-sm md:text-base">
              إدارة مزاداتك الحيّة والفورية من مكان واحد.
            </p>
          </div>

          <div className="flex gap-2 md:gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center px-4 md:px-5 py-2.5 rounded-xl bg-background border border-border text-foreground hover:bg-muted transition-colors text-sm md:text-base"
              onClick={() => fetchAuctions({ page, status: statusFilter, silent: false })}
              aria-label="تحديث"
              title="تحديث"
            >
              <FiRefreshCw className={`ml-2 ${bgLoading ? "animate-spin" : ""}`} />
              {bgLoading ? "جارٍ التحديث..." : "تحديث"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center px-5 md:px-6 py-2.5 rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 shadow-lg text-sm md:text-base"
              onClick={() => setShowModal(true)}
              aria-label="بدء حراج مباشر"
            >
              <FiPlus className="ml-2" />
              <span>بدء حراج مباشر</span>
            </motion.button>
          </div>
        </div>

        {/* شريط البحث والفلاتر */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-5 md:mb-6">
          <motion.div className="relative flex-grow" whileHover={{ scale: 1.01 }}>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <FiSearch className="text-muted-foreground" />
            </div>
            <input
              type="text"
              aria-label="بحث"
              placeholder="ابحث باسم السيارة..."
              className="w-full pr-10 pl-3 md:pl-4 py-2.5 rounded-lg outline-none bg-background text-foreground placeholder-muted-foreground border border-border focus:border-primary focus:ring-4 focus:ring-primary/20 text-sm md:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center px-5 py-2.5 rounded-lg bg-background border border-border text-foreground hover:bg-muted transition-colors text-sm md:text-base"
          >
            <FiFilter className="ml-2" />
            <span>الفلاتر</span>
          </motion.button>
        </div>

        {/* لوحة الفلاتر */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-card text-foreground p-4 md:p-5 rounded-xl shadow-xl border border-border mb-5 md:mb-6 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground mb-1.5 text-sm">حالة المزاد</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as any);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2.5 rounded-lg outline-none bg-background text-foreground border border-border focus:border-primary focus:ring-4 focus:ring-primary/20 text-sm"
                  >
                    <option value="">الكل</option>
                    <option value="live">جاري</option>
                    <option value="scheduled">قادم</option>
                    <option value="ended">منتهي</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 md:mt-5 flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowFilters(false);
                    setPage(1);
                  }}
                  className="px-5 py-2 rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 text-sm"
                >
                  تطبيق
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* إحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-5 md:mb-6">
          <StatCard title="إجمالي (الصفحة الحالية)" value={filtered.length} accent="indigo" />
          <StatCard title="جارية" value={liveCount} accent="emerald" />
          <StatCard title="منتهية" value={endedCount} accent="rose" />
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg whitespace-pre-wrap text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl shadow-xl p-8 animate-pulse h-60" />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-border rounded-xl shadow-xl p-10 md:p-12 text-center"
          >
            <div className="text-muted-foreground mb-3">
              <FaGavel size={40} className="mx-auto" />
            </div>
            <h3 className="text-lg md:text-xl font-medium text-foreground mb-1.5">لا توجد مزادات</h3>
            <p className="text-muted-foreground text-sm md:text-base mb-5">أضف مزادًا جديدًا أو غيّر الفلاتر.</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setStatusFilter("");
                setSearchTerm("");
                setPage(1);
                fetchAuctions({ page: 1, status: "", silent: false });
              }}
              className="px-5 py-2.5 rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 text-sm md:text-base"
            >
              عرض الكل
            </motion.button>
          </motion.div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filtered.map((auction, idx) => (
                <motion.div
                  key={auction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`relative group rounded-2xl overflow-hidden shadow-2xl border ${
                    auction.statusApi === "ended" || auction.statusApi === "completed"
                      ? "border-destructive/40"
                      : auction.statusApi === "live" || auction.statusApi === "active"
                      ? "border-emerald-500/40"
                      : "border-amber-500/40"
                  } bg-card`}
                >
                  <div className="relative h-44 md:h-48 w-full overflow-hidden">
                    <img
                      src={auction.image}
                      alt={auction.carLabel}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      onError={imgOnError}
                      loading="lazy"
                    />
                    <span
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] md:text-xs font-semibold shadow ${statusChipColor(
                        String(auction.statusApi)
                      )}`}
                    >
                      {auction.statusAr}
                    </span>
                  </div>

                  <div className="p-5 md:p-6">
                    <div className="flex items-center gap-2 mb-1.5">
                      <FaCar className="text-primary shrink-0" />
                      <span className="text-base md:text-lg font-bold text-foreground truncate">
                        {auction.carLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <FiUser className="shrink-0" />
                      <span className="text-xs md:text-sm">معرضك</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-2 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FiClock className="text-primary" />
                        {auction.statusApi === "live" || auction.statusApi === "active" ? (
                          <Countdown endIso={auction.endTimeIso} />
                        ) : (
                          <span className="font-mono text-xs md:text-sm">
                            {auction.statusApi === "scheduled" ? "قريبًا" : "انتهى"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <FaGavel className="text-amber-500" />
                        <span className="font-mono text-xs md:text-sm">
                          {auction.bidsCount} مزايدة
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <FiEye className="text-sky-500" />
                        <span className="font-mono text-xs md:text-sm">
                          {auction.watchers} متابع
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-2">
                      <div>
                        <span className="text-[11px] md:text-xs text-muted-foreground">سعر البدء</span>
                        <div className="font-semibold md:font-bold text-primary text-sm md:text-base">
                          {auction.startPrice.toLocaleString()} ر.س
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] md:text-xs text-muted-foreground">أعلى مزايدة</span>
                        <div className="font-semibold md:font-bold text-emerald-500 text-sm md:text-base">
                          {auction.currentBid.toLocaleString()} ر.س
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {lastPage > 1 && (
              <div className="mt-7 md:mt-8 flex justify-between items-center">
                <div className="text-xs md:text-sm text-muted-foreground">
                  صفحة <span className="font-medium text-foreground">{page}</span> من{" "}
                  <span className="font-medium text-foreground">{lastPage}</span> — إجمالي{" "}
                  <span className="font-medium text-foreground">{total}</span>
                </div>

                <nav className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-full border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="السابق"
                  >
                    <FiChevronLeft />
                  </button>

                  {pageWindow(page, lastPage, 2).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base ${
                        page === n
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {n}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                    disabled={page === lastPage}
                    className="p-2 rounded-full border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="التالي"
                  >
                    <FiChevronRight />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** ========= Small component ========= **/
function StatCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: number | string;
  accent: "indigo" | "emerald" | "rose";
}) {
  const ring =
    accent === "indigo"
      ? "from-primary/20 to-primary/10"
      : accent === "emerald"
      ? "from-emerald-500/20 to-emerald-500/10"
      : "from-destructive/20 to-destructive/10";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-4 md:p-5">
      <div
        className={`pointer-events-none absolute -top-10 -left-10 w-28 h-28 rounded-full bg-gradient-to-br opacity-50 ${ring}`}
      />
      <h3 className="text-muted-foreground text-xs md:text-sm mb-1.5">{title}</h3>
      <p className="text-2xl md:text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}
