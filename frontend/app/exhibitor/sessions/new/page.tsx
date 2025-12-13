"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../../../components/exhibitor/Header";
import { Sidebar } from "../../../../components/exhibitor/sidebar";
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
  Sparkles,
  FileText,
  Settings,
  Info,
} from "lucide-react";

/** تحويل قيمة datetime-local إلى صيغة مناسبة للباك إند */
function normalizeDateTime(value: string): string {
  if (!value) return "";
  // أمثلة الإدخال: 2025-01-15T18:30 أو 2025-01-15T18:30:45
  if (value.includes("T")) {
    const [date, time] = value.split("T");
    // لو مفيش ثواني ضيف :00
    const t = time.length === 5 ? `${time}:00` : time;
    return `${date} ${t}`;
  }
  return value;
}

type SessionStatus = "scheduled" | "active" | "completed" | "cancelled";
type SessionType = "live" | "instant" | "silent";

export default function ExhibitorNewSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<{
    name: string;
    session_date: string;
    status: SessionStatus;
    type: SessionType;
    description: string;
  }>({
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
        description: "مزاد مباشر مع مزايدين متواجدين",
        icon: Volume2,
        color: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20",
        activeBorder: "border-emerald-600",
        activeBg: "bg-emerald-600/10",
      },
      {
        value: "instant" as SessionType,
        label: "فوري",
        description: "مزاد فوري بفترات زمنية قصيرة",
        icon: Zap,
        color: "bg-amber-600/10 text-amber-600 border-amber-600/20",
        activeBorder: "border-amber-600",
        activeBg: "bg-amber-600/10",
      },
      {
        value: "silent" as SessionType,
        label: "صامت",
        description: "مزاد صامت بمزايدات مغلقة",
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

  const onChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.name.trim() || !formData.session_date) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        session_date: normalizeDateTime(formData.session_date),
      };

      const res = await api.post("/api/exhibitor/sessions", payload);

      if (res?.data?.success || res?.status === 201 || res?.status === 200) {
        toast.success(res?.data?.message || "تم إنشاء الجلسة بنجاح");
        router.push("/exhibitor/sessions");
      } else {
        toast.error(res?.data?.message || "تعذر إنشاء الجلسة");
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
        toast.error(e?.response?.data?.message || "فشل إنشاء الجلسة");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {/* رأس الصفحة */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 flex-1">
              <Link
                href="/exhibitor/sessions"
                className="rounded-xl p-3 bg-secondary border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground transition"
                aria-label="رجوع لقائمة الجلسات"
              >
                <ArrowRight className="w-5 h-5" />
              </Link>

              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
                  إنشاء جلسة مزاد جديدة
                </h1>
                <p className="text-muted-foreground mt-1 truncate">
                  أضف جلسة جديدة لإدارة مزادات سيارتك
                </p>
              </div>

              <div className="ms-auto rounded-xl p-3 bg-primary/10 border border-primary/20">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* البطاقة الرئيسية */}
            <section className="rounded-2xl overflow-hidden border border-border bg-card shadow-xl">
              {/* عنوان النموذج */}
              <div className="border-b border-border p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl p-2 bg-primary/10">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">تفاصيل الجلسة</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      املأ المعلومات الأساسية للجلسة
                    </p>
                  </div>
                </div>
              </div>

              {/* النموذج */}
              <form onSubmit={submit} className="p-6 space-y-8">
                {/* الاسم */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    اسم الجلسة <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      autoFocus
                      value={formData.name}
                      onChange={onChange}
                      className={`w-full bg-background border rounded-xl py-4 pe-4 ps-12 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                        errors.name
                          ? "border-destructive focus:ring-destructive"
                          : "border-border"
                      }`}
                      placeholder="مثال: جلسة مزاد سيارات المعرض - فبراير"
                      required
                    />
                    {/* أيقونة على يمين الحقل في RTL */}
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

                {/* التاريخ */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    تاريخ ووقت الجلسة{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      name="session_date"
                      value={formData.session_date}
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

                {/* نوع الجلسة */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium">
                    نوع الجلسة <span className="text-destructive">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sessionTypes.map((t) => {
                      const Icon = t.icon;
                      const active = formData.type === t.value;
                      return (
                        <button
                          type="button"
                          key={t.value}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, type: t.value }))
                          }
                          className={`text-start rounded-xl border-2 p-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                            active
                              ? `${t.activeBorder} ${t.activeBg}`
                              : "border-border bg-card hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-lg p-2 ${t.color
                                .replace("text-", "bg-")
                                .replace("/10", "/20")
                                .split(" ")
                                .filter((c) => c.startsWith("bg-"))
                                .join(" ")} text-white`}
                            >
                              <Icon className={`w-5 h-5`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate text-foreground">
                                {t.label}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {t.description}
                              </div>
                            </div>
                            {active && (
                              <span
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
                </div>

                {/* الحالة + الوصف */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      حالة الجلسة <span className="text-destructive">*</span>
                    </label>
                    <select
                      name="status"
                      value={formData.status}
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
                      value={formData.description}
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

                {/* الأزرار */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6 border-t border-border">
                  <Link
                    href="/exhibitor/sessions"
                    className="px-6 py-3 rounded-xl bg-secondary border border-border text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition text-center"
                  >
                    إلغاء
                  </Link>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
                        جاري الإنشاء...
                      </span>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        إنشاء الجلسة
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* نصائح */}
            <section className="mt-6 rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">نصائح</h3>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground list-disc pr-5">
                <li>اختر نوع الجلسة المناسب لطبيعة المزادات.</li>
                <li>تأكد من صحة التاريخ والوقت قبل الحفظ.</li>
                <li>يمكنك تعديل الجلسة لاحقًا بسهولة.</li>
                <li>أضف سياراتك إلى الجلسة من صفحة المزادات.</li>
              </ul>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
