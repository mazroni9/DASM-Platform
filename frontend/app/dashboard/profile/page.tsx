"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Phone,
  MapPin,
  Shield,
  Bell,
  Loader2,
  CheckCircle,
  AlertCircle,
  Building,
  Mail,
  Calendar,
  Key,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  BadgeCheck,
  Star,
  Clock,
  Map,
} from "lucide-react";
import LoadingLink from "@/components/LoadingLink";
import { UserRole } from "@/types/types";

interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  name?: string;
  email: string;
  phone: string;
  type: string;
  area_id?: string | number | null;
  address?: string;
  // dealer fields removed - dealers table dropped
  created_at: string;
  updated_at: string;
  email_verified_at: string | null;
  is_active?: boolean;
  kyc_status?: string;
  notification_email?: boolean;
  notification_sms?: boolean;
  two_factor_auth?: boolean;
}

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  area_id: string; // always string in UI
  address: string;
  // dealer fields removed - dealers table dropped
  currentPassword: string;
  password: string;
  confirmPassword: string;
  notifyEmail: boolean;
  notifySMS: boolean;
  twoFactorAuth: boolean;
}

type TabId = "personal" | "security" | "notifications";

const isSuccessResponse = (res: any) =>
  res?.data?.status === "success" || res?.data?.success === true;

const getDataPayload = (res: any) => res?.data?.data ?? res?.data;

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "غير متوفر";
  try {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(dateString);
  }
};

const TABS: Array<{
  id: TabId;
  label: string;
  icon: typeof User;
  active: { bg: string; border: string; text: string; icon: string };
}> = [
  {
    id: "personal",
    label: "المعلومات الشخصية",
    icon: User,
    active: {
      bg: "bg-blue-500/20",
      border: "border-blue-500/30",
      text: "text-blue-300",
      icon: "text-blue-400",
    },
  },
  {
    id: "security",
    label: "الأمان",
    icon: Shield,
    active: {
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/30",
      text: "text-emerald-300",
      icon: "text-emerald-400",
    },
  },
  {
    id: "notifications",
    label: "الإشعارات",
    icon: Bell,
    active: {
      bg: "bg-amber-500/20",
      border: "border-amber-500/30",
      text: "text-amber-300",
      icon: "text-amber-400",
    },
  },
];

const getRoleConfig = (role: string) => {
  const roleMap: Record<
    string,
    { name: string; color: string; bg: string; border: string }
  > = {
    [UserRole.DEALER]: {
      name: "تاجر",
      color: "text-purple-400",
      bg: "bg-purple-500/20",
      border: "border-purple-500/30",
    },
    [UserRole.ADMIN]: {
      name: "مدير",
      color: "text-red-400",
      bg: "bg-red-500/20",
      border: "border-red-500/30",
    },
    [UserRole.USER]: {
      name: "مستخدم",
      color: "text-blue-400",
      bg: "bg-blue-500/20",
      border: "border-blue-500/30",
    },
  };

  return (
    roleMap[role] || {
      name: role,
      color: "text-gray-400",
      bg: "bg-gray-500/20",
      border: "border-gray-500/30",
    }
  );
};

// helper: extract backend validation errors nicely
const extractErrorsMessage = (err: any) => {
  const data = err?.response?.data;
  const msg = data?.message;
  const errors = data?.errors;
  if (errors && typeof errors === "object") {
    const flat = Object.values(errors).flat().filter(Boolean).join("، ");
    return flat || msg || "بيانات غير صالحة";
  }
  return msg || "حدث خطأ غير متوقع";
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    area_id: "",
    address: "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
    notifyEmail: true,
    notifySMS: false,
    twoFactorAuth: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("personal");

  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [tabStatus, setTabStatus] = useState<
    Record<
      TabId,
      { status: "" | "success" | "error" | "info"; message: string }
    >
  >({
    personal: { status: "", message: "" },
    security: { status: "", message: "" },
    notifications: { status: "", message: "" },
  });

  const { isLoggedIn } = useAuth();
  const router = useLoadingRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/dashboard/profile");
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    async function fetchProfile() {
      if (!isLoggedIn) return;

      setIsLoading(true);
      try {
        const res = await api.get("/api/user/profile");
        const profileData = getDataPayload(res);

        if (!profileData) throw new Error("Profile payload missing");

        setProfile(profileData);

        setFormData((prev) => ({
          ...prev,
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
          area_id:
            profileData.area_id != null ? String(profileData.area_id) : "",
          address: profileData.address || "",
          currentPassword: "",
          password: "",
          confirmPassword: "",
          notifyEmail: profileData.notification_email !== false,
          notifySMS: Boolean(profileData.notification_sms),
          twoFactorAuth: Boolean(profileData.two_factor_auth),
        }));
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("حدث خطأ أثناء تحميل بيانات الملف الشخصي");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [isLoggedIn]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleCheckboxChange = (
    name: keyof ProfileFormData,
    checked: boolean
  ) => {
    setFormData((p) => ({ ...p, [name]: checked }));
  };

  const clearTabStatus = (tab: TabId) =>
    setTabStatus((p) => ({ ...p, [tab]: { status: "", message: "" } }));

  const setTabMessage = (
    tab: TabId,
    status: "success" | "error" | "info",
    message: string
  ) => setTabStatus((p) => ({ ...p, [tab]: { status, message } }));

  // ✅ FIX: لا ترسل area_id إذا كانت فارغة، ولو موجودة ارسلها رقم
  const handlePersonalInfoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSubmitting(true);
    clearTabStatus("personal");

    try {
      const payload: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        address: formData.address,
      };

      // IMPORTANT: UpdateUserProfileRequest: area_id => sometimes|exists
      // so we must NOT send it when empty, otherwise exists fails.
      const areaIdStr = (formData.area_id || "").trim();
      if (areaIdStr) {
        const areaIdNum = Number(areaIdStr);
        if (!Number.isFinite(areaIdNum)) {
          setTabMessage("personal", "error", "قيمة المنطقة غير صحيحة");
          setSubmitting(false);
          return;
        }
        payload.area_id = areaIdNum;
      }

      // dealer fields removed - dealers table dropped

      const res = await api.put("/api/user/profile", payload);

      if (isSuccessResponse(res)) {
        const updated = getDataPayload(res) || payload;

        setProfile((p) => (p ? { ...p, ...updated } : p));
        // sync form area_id too (in case backend changed it)
        if (updated?.area_id != null) {
          setFormData((p) => ({ ...p, area_id: String(updated.area_id) }));
        }

        setTabMessage(
          "personal",
          "success",
          "تم تحديث المعلومات الشخصية بنجاح"
        );
        toast.success("تم تحديث المعلومات الشخصية بنجاح");
      } else {
        throw new Error(res?.data?.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);

      const nice = extractErrorsMessage(error);
      setTabMessage("personal", "error", nice);
      toast.error(nice);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSecuritySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSubmitting(true);
    clearTabStatus("security");

    if (formData.password && formData.password !== formData.confirmPassword) {
      setTabMessage("security", "error", "كلمات المرور غير متطابقة");
      setSubmitting(false);
      return;
    }

    if (formData.password && !formData.currentPassword) {
      setTabMessage("security", "error", "يرجى إدخال كلمة المرور الحالية");
      setSubmitting(false);
      return;
    }

    try {
      if (formData.password && formData.currentPassword) {
        const payload = {
          current_password: formData.currentPassword,
          password: formData.password,
          password_confirmation: formData.confirmPassword,
          two_factor_auth: formData.twoFactorAuth,
        };

        const res = await api.put("/api/user/password", payload);

        if (isSuccessResponse(res)) {
          setTabMessage("security", "success", "تم تحديث إعدادات الأمان بنجاح");
          toast.success("تم تحديث إعدادات الأمان بنجاح");

          setFormData((p) => ({
            ...p,
            currentPassword: "",
            password: "",
            confirmPassword: "",
          }));

          setProfile((p) =>
            p ? { ...p, two_factor_auth: formData.twoFactorAuth } : p
          );
          return;
        }

        throw new Error(res?.data?.message || "Failed to update password");
      }

      if (profile.two_factor_auth !== formData.twoFactorAuth) {
        const res = await api.put("/api/user/security-settings", {
          two_factor_auth: formData.twoFactorAuth,
        });

        if (isSuccessResponse(res)) {
          setTabMessage(
            "security",
            "success",
            "تم تحديث إعدادات المصادقة الثنائية بنجاح"
          );
          toast.success("تم تحديث إعدادات المصادقة الثنائية بنجاح");

          setProfile((p) =>
            p ? { ...p, two_factor_auth: formData.twoFactorAuth } : p
          );
          return;
        }

        throw new Error(res?.data?.message || "Failed to update 2FA");
      }

      setTabMessage("security", "info", "لم يتم إجراء أي تغييرات");
    } catch (error: any) {
      console.error("Error updating security settings:", error);
      const nice = extractErrorsMessage(error);
      setTabMessage("security", "error", nice);
      toast.error(nice);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotificationsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSubmitting(true);
    clearTabStatus("notifications");

    try {
      const payload = {
        notification_email: formData.notifyEmail,
        notification_sms: formData.notifySMS,
      };

      const res = await api.put("/api/user/notification-settings", payload);

      if (isSuccessResponse(res)) {
        setTabMessage(
          "notifications",
          "success",
          "تم تحديث إعدادات الإشعارات بنجاح"
        );
        toast.success("تم تحديث إعدادات الإشعارات بنجاح");

        setProfile((p) =>
          p
            ? {
                ...p,
                notification_email: formData.notifyEmail,
                notification_sms: formData.notifySMS,
              }
            : p
        );
      } else {
        throw new Error(res?.data?.message || "Failed to update notifications");
      }
    } catch (error: any) {
      console.error("Error updating notification settings:", error);
      const nice = extractErrorsMessage(error);
      setTabMessage("notifications", "error", nice);
      toast.error(nice);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Loader2 className="absolute inset-0 w-full h-full animate-spin text-primary" />
            <div className="absolute inset-0 w-full h-full rounded-full border-4 border-transparent border-t-primary animate-spin opacity-60"></div>
          </div>
          <p className="text-lg text-foreground/70 font-medium">
            جاري تحميل بيانات الملف الشخصي...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <div className="p-6 bg-card/30 rounded-2xl border border-border max-w-md">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-4">
              لم يتم العثور على بيانات الملف الشخصي
            </h2>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary rounded-xl text-white hover:scale-105 transition-all duration-300"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      </div>
    );
  }

  const roleConfig = getRoleConfig(profile.type);

  return (
    <div className="space-y-6 overflow-x-hidden" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card backdrop-blur-2xl border border-border rounded-2xl p-4 sm:p-6 shadow-2xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary rounded-xl shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-foreground">
                  الملف الشخصي
                </h1>
                <p className="text-foreground/70 text-sm mt-1">
                  إدارة معلومات حسابك وإعداداته
                </p>
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 backdrop-blur-sm min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center shrink-0">
                    <User className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground text-lg truncate">
                      {profile.first_name} {profile.last_name}
                    </h3>
                    <p className="text-foreground/80 text-sm truncate">
                      {profile.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 backdrop-blur-sm min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <BadgeCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-sm text-foreground/80">الحالة</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm",
                      roleConfig.bg,
                      roleConfig.border,
                      roleConfig.color
                    )}
                  >
                    {roleConfig.name}
                  </div>

                  <div
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm",
                      profile.is_active === false
                        ? "bg-rose-500/20 border-rose-500/30 text-rose-400"
                        : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                    )}
                  >
                    {profile.is_active === false ? "غير مفعل ❌" : "مفعل ✅"}
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 backdrop-blur-sm min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-sm text-foreground/80">
                    تاريخ الانضمام
                  </span>
                </div>
                <p className="text-amber-300 font-medium break-words">
                  {formatDate(profile.created_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <LoadingLink
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-card/50 text-foreground/80 rounded-xl border border-border hover:bg-border hover:scale-105 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">العودة للرئيسية</span>
            </LoadingLink>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Nav */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-1"
        >
          <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              الإعدادات
            </h2>

            <div className="space-y-3">
              {TABS.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full p-4 rounded-xl border transition-all duration-300 text-right flex items-center gap-3 group min-w-0",
                      isActive
                        ? cn(
                            tab.active.bg,
                            tab.active.border,
                            tab.active.text,
                            "shadow-lg"
                          )
                        : "bg-border/30 border-border text-foreground/70 hover:bg-border/70 hover:border-border"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg transition-transform duration-300 group-hover:scale-110 shrink-0",
                        isActive ? tab.active.bg : "bg-border/30"
                      )}
                    >
                      <TabIcon
                        className={cn(
                          "w-5 h-5",
                          isActive ? tab.active.icon : "text-foreground/70"
                        )}
                      />
                    </div>

                    <div className="flex-1 text-right min-w-0">
                      <div className="font-bold text-base sm:text-lg truncate">
                        {tab.label}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Status cards */}
            <div className="mt-6 space-y-3">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-400 text-sm">
                  <Star className="w-4 h-4 shrink-0" />
                  <span className="font-medium">حالة الحساب</span>
                </div>
                <p className="text-blue-300 text-xs mt-1 break-words">
                  {profile.email_verified_at
                    ? "البريد الإلكتروني موثق"
                    : "يرجى توثيق البريد الإلكتروني"}
                </p>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span className="font-medium">آخر تحديث</span>
                </div>
                <p className="text-emerald-300 text-xs mt-1 break-words">
                  {formatDate(profile.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-3 min-w-0"
        >
          <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-4 sm:p-6 min-w-0 overflow-hidden">
            {/* PERSONAL */}
            {activeTab === "personal" && (
              <div className="space-y-6">
                {tabStatus.personal.status && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "p-4 rounded-xl border backdrop-blur-sm flex items-start gap-3 min-w-0",
                      tabStatus.personal.status === "success"
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                        : "bg-rose-500/20 border-rose-500/30 text-rose-300"
                    )}
                  >
                    {tabStatus.personal.status === "success" ? (
                      <CheckCircle className="w-5 h-5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 shrink-0" />
                    )}
                    <p className="break-words min-w-0">
                      {tabStatus.personal.message}
                    </p>
                  </motion.div>
                )}

                <motion.form
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handlePersonalInfoSubmit}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-400" />
                    المعلومات الأساسية
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* first_name */}
                    <div className="min-w-0">
                      <label className="text-sm text-foreground/80 mb-2 block">
                        الاسم الأول
                      </label>
                      <div className="relative">
                        <input
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          className="w-full bg-background/50 border border-border rounded-lg pr-10 pl-3 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                          required
                        />
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/70" />
                      </div>
                    </div>

                    {/* last_name */}
                    <div className="min-w-0">
                      <label className="text-sm text-foreground/80 mb-2 block">
                        الاسم الأخير
                      </label>
                      <div className="relative">
                        <input
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          className="w-full bg-background/50 border border-border rounded-lg pr-10 pl-3 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                          required
                        />
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/70" />
                      </div>
                    </div>

                    {/* email */}
                    <div className="min-w-0">
                      <label className="text-sm text-foreground/80 mb-2 block">
                        البريد الإلكتروني
                      </label>
                      <div className="relative">
                        <input
                          name="email"
                          type="email"
                          value={formData.email}
                          disabled
                          className="w-full bg-background/30 border border-border rounded-lg pr-10 pl-3 py-3 text-foreground/70 cursor-not-allowed truncate"
                        />
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                      </div>
                      <p className="text-xs text-foreground/50 mt-1">
                        لا يمكن تغيير البريد الإلكتروني
                      </p>
                    </div>

                    {/* phone */}
                    <div className="min-w-0">
                      <label className="text-sm text-foreground/80 mb-2 block">
                        رقم الهاتف
                      </label>
                      <div className="relative">
                        <input
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full bg-background/50 border border-border rounded-lg pr-10 pl-3 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                          required
                        />
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/70" />
                      </div>
                    </div>

                    {/* area */}
                    <div className="space-y-2 min-w-0">
                      <Label
                        htmlFor="area_id"
                        className="text-foreground/80 font-medium"
                      >
                        المنطقة
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <Map className="h-5 w-5 text-foreground/50" />
                        </div>

                        <Select
                          onValueChange={(value) =>
                            setFormData((p) => ({ ...p, area_id: value }))
                          }
                          // ✅ better: give undefined when empty so placeholder shows
                          value={formData.area_id || undefined}
                        >
                          <SelectTrigger
                            id="area_id"
                            className="w-full pr-10 pl-3 bg-background border-border text-foreground placeholder-foreground/50 h-12"
                          >
                            <SelectValue placeholder="اختر المنطقة" />
                          </SelectTrigger>
                          <SelectContent
                            className="bg-card text-foreground border-border z-50"
                            dir="rtl"
                            align="end"
                          >
                            {/* NOTE: لازم IDs هنا تطابق جدول areas فعلاً */}
                            <SelectItem value="1">منطقة الرياض</SelectItem>
                            <SelectItem value="2">منطقة مكة المكرمة</SelectItem>
                            <SelectItem value="3">المنطقة الشرقية</SelectItem>
                            <SelectItem value="4">منطقة تبوك</SelectItem>
                            <SelectItem value="5">
                              منطقة المدينة المنورة
                            </SelectItem>
                            <SelectItem value="6">
                              منطقة الحدود الشمالية
                            </SelectItem>
                            <SelectItem value="7">منطقة القصيم</SelectItem>
                            <SelectItem value="8">منطقة المجمعة</SelectItem>
                            <SelectItem value="9">منطقة حائل</SelectItem>
                            <SelectItem value="10">منطقة عسير</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* address */}
                    <div className="min-w-0">
                      <label className="text-sm text-foreground/80 mb-2 block">
                        العنوان
                      </label>
                      <div className="relative">
                        <input
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full bg-background/50 border border-border rounded-lg pr-10 pl-3 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                        />
                        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/70" />
                      </div>
                    </div>
                  </div>

                  {/* Dealer fields removed - dealers table dropped */}

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={cn(
                        "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 w-full sm:w-auto",
                        submitting
                          ? "bg-border text-foreground/70 cursor-not-allowed"
                          : "bg-primary text-white hover:bg-primary/90 hover:scale-[1.02]"
                      )}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        "حفظ التعديلات"
                      )}
                    </button>
                  </div>
                </motion.form>
              </div>
            )}

            {/* SECURITY */}
            {activeTab === "security" && (
              <div className="space-y-6">
                {tabStatus.security.status && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "p-4 rounded-xl border backdrop-blur-sm flex items-start gap-3 min-w-0",
                      tabStatus.security.status === "success"
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                        : tabStatus.security.status === "info"
                        ? "bg-blue-500/20 border-blue-500/30 text-blue-300"
                        : "bg-rose-500/20 border-rose-500/30 text-rose-300"
                    )}
                  >
                    {tabStatus.security.status === "success" ? (
                      <CheckCircle className="w-5 h-5 shrink-0" />
                    ) : tabStatus.security.status === "info" ? (
                      <Shield className="w-5 h-5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 shrink-0" />
                    )}
                    <p className="break-words min-w-0">
                      {tabStatus.security.message}
                    </p>
                  </motion.div>
                )}

                <motion.form
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleSecuritySubmit}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    إعدادات الأمان
                  </h2>

                  <div className="space-y-4">
                    <div className="min-w-0">
                      <label className="text-sm text-foreground/80 mb-2 block">
                        كلمة المرور الحالية
                      </label>
                      <div className="relative">
                        <input
                          name="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          placeholder="أدخل كلمة المرور الحالية"
                          className="w-full bg-background/50 border border-border rounded-lg pr-10 pl-10 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                        <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/70" />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword((v) => !v)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/70 hover:text-foreground"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="min-w-0">
                        <label className="text-sm text-foreground/80 mb-2 block">
                          كلمة المرور الجديدة
                        </label>
                        <div className="relative">
                          <input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="أدخل كلمة المرور الجديدة"
                            className="w-full bg-background/50 border border-border rounded-lg pr-10 pl-10 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:border-emerald-500/50 transition-colors"
                          />
                          <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/70" />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/70 hover:text-foreground"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <label className="text-sm text-foreground/80 mb-2 block">
                          تأكيد كلمة المرور
                        </label>
                        <div className="relative">
                          <input
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="أعد إدخال كلمة المرور الجديدة"
                            className="w-full bg-background/50 border border-border rounded-lg pr-10 pl-10 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:border-emerald-500/50 transition-colors"
                          />
                          <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/70" />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/70 hover:text-foreground"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-background/30 rounded-xl border border-border min-w-0">
                      <input
                        type="checkbox"
                        id="twoFactorAuth"
                        checked={formData.twoFactorAuth}
                        onChange={(e) =>
                          handleCheckboxChange(
                            "twoFactorAuth",
                            e.target.checked
                          )
                        }
                        className="mt-1 shrink-0"
                      />
                      <div className="min-w-0">
                        <label
                          htmlFor="twoFactorAuth"
                          className="text-base font-medium text-foreground"
                        >
                          المصادقة الثنائية
                        </label>
                        <p className="text-sm text-foreground/70 mt-1 break-words">
                          تأمين حسابك بشكل أفضل باستخدام رمز إضافي عند تسجيل
                          الدخول
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={cn(
                        "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 w-full sm:w-auto",
                        submitting
                          ? "bg-border text-foreground/70 cursor-not-allowed"
                          : "bg-secondary text-white hover:bg-secondary/90 hover:scale-[1.02]"
                      )}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        "تحديث إعدادات الأمان"
                      )}
                    </button>
                  </div>
                </motion.form>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                {tabStatus.notifications.status && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "p-4 rounded-xl border backdrop-blur-sm flex items-start gap-3 min-w-0",
                      tabStatus.notifications.status === "success"
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                        : "bg-rose-500/20 border-rose-500/30 text-rose-300"
                    )}
                  >
                    {tabStatus.notifications.status === "success" ? (
                      <CheckCircle className="w-5 h-5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 shrink-0" />
                    )}
                    <p className="break-words min-w-0">
                      {tabStatus.notifications.message}
                    </p>
                  </motion.div>
                )}

                <motion.form
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleNotificationsSubmit}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-400" />
                    إعدادات الإشعارات
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-background/30 rounded-xl border border-border min-w-0">
                      <input
                        type="checkbox"
                        id="notifyEmail"
                        checked={formData.notifyEmail}
                        onChange={(e) =>
                          handleCheckboxChange("notifyEmail", e.target.checked)
                        }
                        className="mt-1 shrink-0"
                      />
                      <div className="min-w-0">
                        <label
                          htmlFor="notifyEmail"
                          className="text-base font-medium text-foreground"
                        >
                          إشعارات البريد الإلكتروني
                        </label>
                        <p className="text-sm text-foreground/70 mt-1 break-words">
                          استلام إشعارات عبر البريد الإلكتروني عند حدوث نشاط في
                          حسابك
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-background/30 rounded-xl border border-border min-w-0">
                      <input
                        type="checkbox"
                        id="notifySMS"
                        checked={formData.notifySMS}
                        onChange={(e) =>
                          handleCheckboxChange("notifySMS", e.target.checked)
                        }
                        className="mt-1 shrink-0"
                      />
                      <div className="min-w-0">
                        <label
                          htmlFor="notifySMS"
                          className="text-base font-medium text-foreground"
                        >
                          إشعارات الرسائل النصية
                        </label>
                        <p className="text-sm text-foreground/70 mt-1 break-words">
                          استلام إشعارات عبر الرسائل النصية عند حدوث نشاط في
                          حسابك
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={cn(
                        "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 w-full sm:w-auto",
                        submitting
                          ? "bg-border text-foreground/70 cursor-not-allowed"
                          : "bg-secondary text-white hover:bg-secondary/90 hover:scale-[1.02]"
                      )}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        "حفظ تفضيلات الإشعارات"
                      )}
                    </button>
                  </div>
                </motion.form>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
