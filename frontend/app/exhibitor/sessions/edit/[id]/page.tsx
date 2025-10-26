"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "../../../../../components/exhibitor/Header";
import { Sidebar } from "../../../../../components/exhibitor/sidebar";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import LoadingLink from "@/components/LoadingLink";
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
      { value: "live" as SessionType, label: "مباشر", icon: Volume2, color: "from-green-500 to-emerald-600" },
      { value: "instant" as SessionType, label: "فوري", icon: Zap, color: "from-amber-500 to-orange-600" },
      { value: "silent" as SessionType, label: "صامت", icon: Clock, color: "from-blue-500 to-cyan-600" },
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
        Object.entries(e.response.data.errors).forEach(([k, v]: [string, any]) => {
          bag[k] = Array.isArray(v) ? String(v[0]) : String(v);
          toast.error(bag[k]);
        });
        setErrors(bag);
      } else {
        toast.error(e?.response?.data?.message || "فشل حفظ التعديلات");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white">
      <Header />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <LoadingLink
              href="/exhibitor/sessions"
              className="bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300 p-3 rounded-xl"
              aria-label="رجوع لقائمة الجلسات"
            >
              <ArrowRight className="w-5 h-5" />
            </LoadingLink>

            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold">تعديل الجلسة</h1>
              <p className="text-gray-400 mt-1 truncate">حدّث تفاصيل الجلسة الخاصة بك</p>
            </div>

            <button
              onClick={fetchSession}
              disabled={loading}
              className="ms-auto bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300 px-4 py-2 rounded-xl flex items-center disabled:opacity-50"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`} />
              تحديث
            </button>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
              {/* Card Header */}
              <div className="border-b border-gray-700/50 p-6 bg-gradient-to-r from-gray-800 to-gray-900">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-xl">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">تفاصيل الجلسة</h2>
                    <p className="text-gray-400 text-sm mt-1">قم بتعديل البيانات ثم احفظ</p>
                  </div>
                </div>
              </div>

              {/* Loader */}
              {loading ? (
                <div className="p-10 flex items-center justify-center">
                  <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
                </div>
              ) : (
                <form onSubmit={save} className="p-6 space-y-8">
                  {/* name */}
                  <div className="space-y-2">
                    <label className="block text-sm">
                      اسم الجلسة <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={onChange}
                        className={`w-full bg-gray-700/50 border rounded-xl py-4 pe-4 ps-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                          errors.name ? "border-red-500" : "border-gray-600"
                        }`}
                        required
                      />
                      {/* أيقونة على يمين الحقل (RTL) */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Settings className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    {errors.name && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" /> {errors.name}
                      </p>
                    )}
                  </div>

                  {/* date */}
                  <div className="space-y-2">
                    <label className="block text-sm">
                      تاريخ ووقت الجلسة <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        name="session_date"
                        value={form.session_date}
                        onChange={onChange}
                        className={`w-full bg-gray-700/50 border rounded-xl py-4 pe-4 ps-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                          errors.session_date ? "border-red-500" : "border-gray-600"
                        }`}
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Calendar className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    {errors.session_date && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" /> {errors.session_date}
                      </p>
                    )}
                  </div>

                  {/* type */}
                  <div className="space-y-3">
                    <label className="block text-sm">
                      نوع الجلسة <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {sessionTypes.map((t) => {
                        const Icon = t.icon;
                        const active = form.type === t.value;
                        return (
                          <button
                            type="button"
                            key={t.value}
                            onClick={() => setForm((prev) => ({ ...prev, type: t.value }))}
                            className={`text-start rounded-xl border-2 p-4 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                              active
                                ? "border-cyan-500 bg-cyan-500/10"
                                : "border-gray-600 bg-gray-700/30 hover:border-gray-500"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`bg-gradient-to-r ${t.color} p-2 rounded-lg`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{t.label}</div>
                              </div>
                              {active && <div className="w-3 h-3 bg-cyan-500 rounded-full" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {errors.type && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <Info className="w-4 h-4" /> {errors.type}
                      </p>
                    )}
                  </div>

                  {/* status + description */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm">
                        حالة الجلسة <span className="text-red-400">*</span>
                      </label>
                      <select
                        name="status"
                        value={form.status}
                        onChange={onChange}
                        className={`w-full bg-gray-700/50 border rounded-xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                          errors.status ? "border-red-500" : "border-gray-600"
                        }`}
                        required
                      >
                        {statusOptions.map((s) => (
                          <option key={s.value} value={s.value} className="bg-gray-800">
                            {s.label}
                          </option>
                        ))}
                      </select>
                      {errors.status && (
                        <p className="text-sm text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" /> {errors.status}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm">وصف الجلسة (اختياري)</label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={onChange}
                        rows={3}
                        className={`w-full bg-gray-700/50 border rounded-xl py-4 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none ${
                          errors.description ? "border-red-500" : "border-gray-600"
                        }`}
                        placeholder="اكتب وصفًا مختصرًا للجلسة..."
                      />
                      {errors.description && (
                        <p className="text-sm text-red-400 flex items-center gap-1">
                          <Info className="w-4 h-4" /> {errors.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* actions */}
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6 border-t border-gray-700/50">
                    <LoadingLink
                      href="/exhibitor/sessions"
                      className="px-6 py-3 bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white rounded-xl transition-all text-center"
                    >
                      إلغاء
                    </LoadingLink>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
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
