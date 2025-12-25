"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "../../../../../components/exhibitor/Header";
import { Sidebar } from "../../../../../components/exhibitor/sidebar";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  ArrowRight,
  Save,
  Calendar,
  Volume2,
  Zap,
  Clock,
  FileText,
  Settings,
  RefreshCw,
  Info,
} from "lucide-react";

/* ================= Helpers ================= */

/** يحوّل قيمة من الباك إند (مثال: "2025-02-20 18:30:00" أو ISO) لصيغة مناسبة للـ input datetime-local */
function toInputDateTime(value?: string | null): string {
  if (!value) return "";
  const v = String(value).trim();

  // لو ISO أو فيه "T" بالفعل
  if (v.includes("T")) {
    // نعيد أول 16 حرف: YYYY-MM-DDTHH:mm
    return v.slice(0, 16);
  }

  // لو بصيغة "YYYY-MM-DD HH:mm:ss"
  if (v.includes(" ")) {
    const [d, t] = v.split(" ");
    const hhmm = (t || "").slice(0, 5); // HH:mm
    return `${d}T${hhmm}`;
  }

  // محاولة أخيرة: Date parsing
  const d = new Date(v);
  if (!isNaN(d.getTime())) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  return "";
}

/** يحوّل قيمة datetime-local إلى صيغة مناسبة للحفظ في الباك إند */
function normalizeDateTime(value: string): string {
  if (!value) return "";
  // input مثال: 2025-02-20T18:30
  if (value.includes("T")) {
    const [date, time] = value.split("T");
    const t = time.length === 5 ? `${time}:00` : time; // أضف ثواني لو ناقصة
    return `${date} ${t}`;
  }
  return value;
}

/* =============== Types =============== */
type SessionStatus = "scheduled" | "active" | "completed" | "cancelled";
type SessionType = "live" | "instant" | "silent";

interface SessionForm {
  name: string;
  session_date: string; // بصيغة datetime-local في الواجهة
  status: SessionStatus;
  type: SessionType;
  description?: string;
}

/* =============== Page =============== */
export default function ExhibitorEditSessionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<SessionForm>({
    name: "",
    session_date: "",
    status: "scheduled",
    type: "live",
    description: "",
  });

  const sessionTypes = useMemo(
    () => [
      {
        value: "live" as SessionType,
        label: "مباشر",
        icon: Volume2,
        color: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20",
        activeBorder: "border-emerald-600",
        activeBg: "bg-emerald-600/10",
      },
      {
        value: "instant" as SessionType,
        label: "فوري",
        icon: Zap,
        color: "bg-amber-600/10 text-amber-600 border-amber-600/20",
        activeBorder: "border-amber-600",
        activeBg: "bg-amber-600/10",
      },
      {
        value: "silent" as SessionType,
        label: "صامت",
        icon: Clock,
        color: "bg-blue-600/10 text-blue-600 border-blue-600/20",
        activeBorder: "border-blue-600",
        activeBg: "bg-blue-600/10",
      },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { value: "scheduled" as SessionStatus, label: "مجدولة" },
      { value: "active" as SessionStatus, label: "نشطة" },
      { value: "completed" as SessionStatus, label: "مكتملة" },
      { value: "cancelled" as SessionStatus, label: "ملغاة" },
    ],
    []
  );

  const fetchSession = async () => {
    try {
      setLoading(true);
      setErrors({});
      const res = await api.get(`/api/exhibitor/sessions/${id}`);
      const row = res?.data?.data ?? res?.data;

      setForm({
        name: row?.name ?? "",
        session_date: toInputDateTime(row?.session_date),
        status: (row?.status as SessionStatus) ?? "scheduled",
        type: (row?.type as SessionType) ?? "live",
        description: row?.description ?? "",
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل في جلب بيانات الجلسة");
      router.push("/exhibitor/sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    // تحقق بسيط
    if (!form.name.trim() || !form.session_date) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const payload = {
        ...form,
        session_date: normalizeDateTime(form.session_date),
      };

      const res = await api.put(`/api/exhibitor/sessions/${id}`, payload);
      if (res?.status === 200) {
        toast.success(res?.data?.message || "تم حفظ التعديلات");
        router.push("/exhibitor/sessions");
      } else {
        toast.error(res?.data?.message || "تعذّر حفظ التعديلات");
      }
    } catch (e: any) {
      if (e.response?.data?.errors) {
        const bag: Record<string, string> = {};
        Object.entries(e.response.data.errors).forEach(
          ([k, v]: [string, any]) => {
            bag[k] = Array.isArray(v) ? String(v[0]) : String(v);
            toast.error(bag[k]);
          }
        );
        setErrors(bag);
      } else {
        toast.error(e?.response?.data?.message || "فشل حفظ التعديلات");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Link
              href="/exhibitor/sessions"
              className="bg-secondary border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 p-3 rounded-xl"
              aria-label="رجوع لقائمة الجلسات"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>

            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
                تعديل الجلسة
              </h1>
              <p className="text-muted-foreground mt-1 truncate">
                حدّث تفاصيل الجلسة الخاصة بك
              </p>
            </div>

            <button
              onClick={fetchSession}
              disabled={loading}
              className="ms-auto bg-secondary border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 px-4 py-2 rounded-xl flex items-center disabled:opacity-50"
              title="تحديث البيانات"
            >
              <RefreshCw
                className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`}
              />
              تحديث
            </button>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
              {/* Card Header */}
              <div className="border-b border-border p-6 bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="bg-secondary p-2 rounded-xl">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      تفاصيل الجلسة
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      قم بتعديل البيانات ثم احفظ
                    </p>
                  </div>
                </div>
              </div>

              {/* Loader */}
              {loading ? (
                <div className="p-10 flex items-center justify-center">
                  <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                </div>
              ) : (
                <form onSubmit={save} className="p-6 space-y-8">
                  {/* name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      اسم الجلسة <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={onChange}
                        className={`w-full bg-background border rounded-xl py-4 pe-4 ps-12 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                          errors.name
                            ? "border-destructive focus:ring-destructive"
                            : "border-border"
                        }`}
                        required
                      />
                      {/* أيقونة على يمين الحقل (RTL) */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Settings className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                    {errors.name && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <Info className="w-4 h-4" /> {errors.name}
                      </p>
                    )}
                  </div>

                  {/* date */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      تاريخ ووقت الجلسة{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        name="session_date"
                        value={form.session_date}
                        onChange={onChange}
                        className={`w-full bg-background border rounded-xl py-4 pe-4 ps-12 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                          errors.session_date
                            ? "border-destructive focus:ring-destructive"
                            : "border-border"
                        }`}
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                    {errors.session_date && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <Info className="w-4 h-4" /> {errors.session_date}
                      </p>
                    )}
                  </div>

                  {/* type */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium">
                      نوع الجلسة <span className="text-destructive">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {sessionTypes.map((t) => {
                        const Icon = t.icon;
                        const active = form.type === t.value;
                        return (
                          <button
                            type="button"
                            key={t.value}
                            onClick={() =>
                              setForm((prev) => ({ ...prev, type: t.value }))
                            }
                            className={`text-start rounded-xl border-2 p-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                              active
                                ? `${t.activeBorder} ${t.activeBg}`
                                : "border-border bg-card hover:bg-muted"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`
                                flex items-center justify-center p-2 rounded-lg 
                                ${t.color
                                  .replace("text-", "bg-")
                                  .replace("/10", "/20")
                                  .split(" ")
                                  .filter((c) => c.startsWith("bg-"))
                                  .join(" ")} 
                                text-white
                              `}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate text-foreground">
                                  {t.label}
                                </div>
                              </div>
                              {active && (
                                <div
                                  className={`w-3 h-3 rounded-full ${t.activeBorder.replace(
                                    "border-",
                                    "bg-"
                                  )}`}
                                />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {errors.type && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <Info className="w-4 h-4" /> {errors.type}
                      </p>
                    )}
                  </div>

                  {/* status + description */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        حالة الجلسة <span className="text-destructive">*</span>
                      </label>
                      <select
                        name="status"
                        value={form.status}
                        onChange={onChange}
                        className={`w-full bg-background border rounded-xl py-4 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                          errors.status
                            ? "border-destructive focus:ring-destructive"
                            : "border-border"
                        }`}
                        required
                      >
                        {statusOptions.map((s) => (
                          <option
                            key={s.value}
                            value={s.value}
                            className="bg-background text-foreground"
                          >
                            {s.label}
                          </option>
                        ))}
                      </select>
                      {errors.status && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <Info className="w-4 h-4" /> {errors.status}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        وصف الجلسة (اختياري)
                      </label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={onChange}
                        rows={3}
                        className={`w-full bg-background border rounded-xl py-4 px-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
                          errors.description
                            ? "border-destructive focus:ring-destructive"
                            : "border-border"
                        }`}
                        placeholder="اكتب وصفًا مختصرًا للجلسة..."
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <Info className="w-4 h-4" /> {errors.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* actions */}
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6 border-t border-border">
                    <Link
                      href="/exhibitor/sessions"
                      className="px-6 py-3 bg-secondary border border-border text-muted-foreground hover:bg-secondary/80 hover:text-foreground rounded-xl transition-all text-center"
                    >
                      إلغاء
                    </Link>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
                          جاري الحفظ...
                        </span>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          حفظ التعديلات
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
