"use client";

import { useEffect, useState } from "react";
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
    Map
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
    role: string;
    area_id?: string;
    address?: string;
    company_name?: string;
    trade_license?: string;
    description?: string;
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
    area_id: string;
    address: string;
    company_name: string;
    trade_license: string;
    description: string;
    currentPassword: string;
    password: string;
    confirmPassword: string;
    notifyEmail: boolean;
    notifySMS: boolean;
    twoFactorAuth: boolean;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [formData, setFormData] = useState<ProfileFormData>({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        area_id: "",
        address: "",
        company_name: "",
        trade_license: "",
        description: "",
        currentPassword: "",
        password: "",
        confirmPassword: "",
        notifyEmail: true,
        notifySMS: false,
        twoFactorAuth: false,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("personal");
    const [showPassword, setShowPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [tabStatus, setTabStatus] = useState({
        personal: { status: "", message: "" },
        security: { status: "", message: "" },
        notifications: { status: "", message: "" },
    });

    const { user, isLoggedIn } = useAuth();
    const router = useLoadingRouter();

    // Verify user is authenticated
    useEffect(() => {
        if (!isLoggedIn) {
            router.push("/auth/login?returnUrl=/dashboard/profile");
        }
    }, [isLoggedIn, router]);

    // Fetch user profile data
    useEffect(() => {
        async function fetchProfile() {
            if (!isLoggedIn) return;

            setIsLoading(true);
            try {
                const response = await api.get("/api/user/profile");
                if (response.data && (response.data.data || response.data)) {
                    const profileData = response.data.data || response.data;
                    setProfile(profileData);

                    setFormData({
                        first_name: profileData.first_name || "",
                        last_name: profileData.last_name || "",
                        email: profileData.email || "",
                        phone: profileData.phone || "",
                        area_id: profileData.area_id || "",
                        address: profileData.address || "",
                        company_name: profileData.company_name || "",
                        trade_license: profileData.trade_license || "",
                        description: profileData.description || "",
                        currentPassword: "",
                        password: "",
                        confirmPassword: "",
                        notifyEmail: profileData.notification_email !== false,
                        notifySMS: profileData.notification_sms || false,
                        twoFactorAuth: profileData.two_factor_auth || false,
                    });
                }
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
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckboxChange = (name: string, checked: boolean) => {
        setFormData({ ...formData, [name]: checked });
    };

    // Format date to readable format
    const formatDate = (dateString: string | undefined | null) => {
        if (!dateString) return "غير متوفر";

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("ar-SA", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch (error) {
            return dateString;
        }
    };

    // Handle personal info update
    const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setTabStatus({
            ...tabStatus,
            personal: { status: "", message: "" },
        });

        try {
            const personalData = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
                address: formData.address,
                area_id: formData.area_id,
            };

            if (profile?.role === UserRole.DEALER) {
                Object.assign(personalData, {
                    company_name: formData.company_name,
                    trade_license: formData.trade_license,
                    description: formData.description,
                });
            }

            const response = await api.put("/api/user/profile", personalData);

            if (response.data && response.data.success) {
                setTabStatus({
                    ...tabStatus,
                    personal: {
                        status: "success",
                        message: "تم تحديث المعلومات الشخصية بنجاح",
                    },
                });
                toast.success("تم تحديث المعلومات الشخصية بنجاح");

                if (response.data.data) {
                    setProfile({
                        ...profile!,
                        ...response.data.data,
                    });
                }
            } else {
                throw new Error(
                    response.data?.message || "حدث خطأ أثناء تحديث المعلومات"
                );
            }
        } catch (error: any) {
            console.error("Error updating profile:", error);
            setTabStatus({
                ...tabStatus,
                personal: {
                    status: "error",
                    message:
                        error.response?.data?.message ||
                        "حدث خطأ أثناء تحديث المعلومات الشخصية",
                },
            });
            toast.error("حدث خطأ أثناء تحديث المعلومات الشخصية");
        } finally {
            setSubmitting(false);
        }
    };

    // Handle security update
    const handleSecuritySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setTabStatus({
            ...tabStatus,
            security: { status: "", message: "" },
        });

        if (formData.password && formData.password !== formData.confirmPassword) {
            setTabStatus({
                ...tabStatus,
                security: {
                    status: "error",
                    message: "كلمات المرور غير متطابقة",
                },
            });
            setSubmitting(false);
            return;
        }

        if (formData.password && !formData.currentPassword) {
            setTabStatus({
                ...tabStatus,
                security: {
                    status: "error",
                    message: "يرجى إدخال كلمة المرور الحالية",
                },
            });
            setSubmitting(false);
            return;
        }

        try {
            if (formData.password && formData.currentPassword) {
                const securityData = {
                    current_password: formData.currentPassword,
                    password: formData.password,
                    password_confirmation: formData.confirmPassword,
                    two_factor_auth: formData.twoFactorAuth,
                };

                const response = await api.put("/api/user/password", securityData);

                if (response.data && response.data.success) {
                    setTabStatus({
                        ...tabStatus,
                        security: {
                            status: "success",
                            message: "تم تحديث إعدادات الأمان بنجاح",
                        },
                    });
                    toast.success("تم تحديث إعدادات الأمان بنجاح");

                    setFormData({
                        ...formData,
                        currentPassword: "",
                        password: "",
                        confirmPassword: "",
                    });
                } else {
                    throw new Error(
                        response.data?.message || "حدث خطأ أثناء تحديث إعدادات الأمان"
                    );
                }
            } else if (profile?.two_factor_auth !== formData.twoFactorAuth) {
                const twoFAResponse = await api.put("/api/user/security-settings", {
                    two_factor_auth: formData.twoFactorAuth,
                });

                if (twoFAResponse.data && twoFAResponse.data.success) {
                    setTabStatus({
                        ...tabStatus,
                        security: {
                            status: "success",
                            message: "تم تحديث إعدادات المصادقة الثنائية بنجاح",
                        },
                    });
                    toast.success("تم تحديث إعدادات المصادقة الثنائية بنجاح");

                    setProfile({
                        ...profile!,
                        two_factor_auth: formData.twoFactorAuth,
                    });
                }
            } else {
                setTabStatus({
                    ...tabStatus,
                    security: {
                        status: "info",
                        message: "لم يتم إجراء أي تغييرات",
                    },
                });
            }
        } catch (error: any) {
            console.error("Error updating security settings:", error);
            setTabStatus({
                ...tabStatus,
                security: {
                    status: "error",
                    message: error.response?.data?.message || "حدث خطأ أثناء تحديث إعدادات الأمان",
                },
            });
            toast.error("حدث خطأ أثناء تحديث إعدادات الأمان");
        } finally {
            setSubmitting(false);
        }
    };

    // Handle notifications update
    const handleNotificationsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setTabStatus({
            ...tabStatus,
            notifications: { status: "", message: "" },
        });

        try {
            const notificationData = {
                notification_email: formData.notifyEmail,
                notification_sms: formData.notifySMS,
            };

            const response = await api.put("/api/user/notification-settings", notificationData);

            if (response.data && response.data.success) {
                setTabStatus({
                    ...tabStatus,
                    notifications: {
                        status: "success",
                        message: "تم تحديث إعدادات الإشعارات بنجاح",
                    },
                });
                toast.success("تم تحديث إعدادات الإشعارات بنجاح");

                setProfile({
                    ...profile!,
                    notification_email: formData.notifyEmail,
                    notification_sms: formData.notifySMS,
                });
            } else {
                throw new Error(
                    response.data?.message || "حدث خطأ أثناء تحديث إعدادات الإشعارات"
                );
            }
        } catch (error: any) {
            console.error("Error updating notification settings:", error);
            setTabStatus({
                ...tabStatus,
                notifications: {
                    status: "error",
                    message: error.response?.data?.message || "حدث خطأ أثناء تحديث إعدادات الإشعارات",
                },
            });
            toast.error("حدث خطأ أثناء تحديث إعدادات الإشعارات");
        } finally {
            setSubmitting(false);
        }
    };

    const getRoleConfig = (role: string) => {
        const roleMap = {
            [UserRole.DEALER]: { 
                name: "تاجر", 
                color: "text-purple-400",
                bg: "bg-purple-500/20",
                border: "border-purple-500/30"
            },
            [UserRole.ADMIN]: { 
                name: "مدير", 
                color: "text-red-400",
                bg: "bg-red-500/20", 
                border: "border-red-500/30"
            },
            [UserRole.USER]: { 
                name: "مستخدم", 
                color: "text-blue-400",
                bg: "bg-blue-500/20",
                border: "border-blue-500/30"
            }
        };
        
        return roleMap[role] || { 
            name: role, 
            color: "text-gray-400",
            bg: "bg-gray-500/20",
            border: "border-gray-500/30"
        };
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <Loader2 className="absolute inset-0 w-full h-full animate-spin text-purple-500" />
                        <div className="absolute inset-0 w-full h-full rounded-full border-4 border-transparent border-t-purple-500 animate-spin opacity-60"></div>
                    </div>
                    <p className="text-lg text-gray-400 font-medium">جاري تحميل بيانات الملف الشخصي...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="p-6 bg-gray-800/30 rounded-2xl border border-gray-700/50 max-w-md">
                        <AlertCircle className="w-16 h-16 text-rose-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-4">لم يتم العثور على بيانات الملف الشخصي</h2>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white hover:scale-105 transition-all duration-300"
                        >
                            إعادة تحميل الصفحة
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const roleConfig = getRoleConfig(profile.role);

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 shadow-2xl"
            >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    الملف الشخصي
                                </h1>
                                <p className="text-gray-400 text-sm mt-1">إدارة معلومات حسابك وإعداداته</p>
                            </div>
                        </div>

                        {/* User Info Card */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30 backdrop-blur-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                        <User className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">
                                            {profile.first_name} {profile.last_name}
                                        </h3>
                                        <p className="text-gray-300 text-sm">{profile.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <BadgeCheck className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm text-gray-300">الحالة</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm",
                                        roleConfig.bg,
                                        roleConfig.border,
                                        roleConfig.color
                                    )}>
                                        {roleConfig.name}
                                    </div>
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm",
                                        profile.is_active 
                                            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                                            : "bg-rose-500/20 border-rose-500/30 text-rose-400"
                                    )}>
                                        {profile.is_active ? "مفعل ✅" : "غير مفعل ❌"}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-xl p-4 border border-amber-500/30 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-amber-400" />
                                    <span className="text-sm text-gray-300">تاريخ الانضمام</span>
                                </div>
                                <p className="text-amber-300 font-medium">{formatDate(profile.created_at)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <LoadingLink
                            href="/dashboard"
                            className="flex items-center gap-2 px-4 py-3 bg-gray-500/20 text-gray-300 rounded-xl border border-gray-500/30 hover:bg-gray-500/30 hover:scale-105 transition-all duration-300"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="font-medium">العودة للرئيسية</span>
                        </LoadingLink>
                    </div>
                </div>
            </motion.div>

            {/* Tabs Section */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Tabs Navigation */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="xl:col-span-1"
                >
                    <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            الإعدادات
                        </h2>
                        
                        <div className="space-y-3">
                            {[
                                { id: "personal", label: "المعلومات الشخصية", icon: User, color: "blue" },
                                { id: "security", label: "الأمان", icon: Shield, color: "emerald" },
                                { id: "notifications", label: "الإشعارات", icon: Bell, color: "amber" }
                            ].map((tab) => {
                                const TabIcon = tab.icon;
                                const isActive = activeTab === tab.id;
                                
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "w-full p-4 rounded-xl border transition-all duration-300 text-right flex items-center gap-3 group",
                                            isActive 
                                                ? `bg-${tab.color}-500/20 border-${tab.color}-500/30 text-${tab.color}-300 shadow-lg` 
                                                : "bg-gray-800/30 border-gray-700/30 text-gray-400 hover:bg-gray-700/30 hover:border-gray-600/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-lg transition-transform duration-300 group-hover:scale-110",
                                            isActive 
                                                ? `bg-${tab.color}-500/20` 
                                                : "bg-gray-700/30"
                                        )}>
                                            <TabIcon className={cn(
                                                "w-5 h-5",
                                                isActive ? `text-${tab.color}-400` : "text-gray-400"
                                            )} />
                                        </div>
                                        <div className="flex-1 text-right">
                                            <div className="font-bold text-lg">{tab.label}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Account Status */}
                        <div className="mt-6 space-y-3">
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-blue-400 text-sm">
                                    <Star className="w-4 h-4" />
                                    <span className="font-medium">حالة الحساب</span>
                                </div>
                                <p className="text-blue-300 text-xs mt-1">
                                    {profile.email_verified_at ? "البريد الإلكتروني موثق" : "يرجى توثيق البريد الإلكتروني"}
                                </p>
                            </div>
                            
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-medium">آخر تحديث</span>
                                </div>
                                <p className="text-emerald-300 text-xs mt-1">
                                    {formatDate(profile.updated_at)}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Tab Content */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="xl:col-span-3"
                >
                    <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
                        {/* Personal Information Tab */}
                        {activeTab === "personal" && (
                            <div className="space-y-6">
                                {tabStatus.personal.status && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={cn(
                                            "p-4 rounded-xl border backdrop-blur-sm flex items-center gap-3",
                                            tabStatus.personal.status === "success"
                                                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                                                : "bg-rose-500/20 border-rose-500/30 text-rose-300"
                                        )}
                                    >
                                        {tabStatus.personal.status === "success" ? (
                                            <CheckCircle className="w-5 h-5" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5" />
                                        )}
                                        <p>{tabStatus.personal.message}</p>
                                    </motion.div>
                                )}

                                <motion.form
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onSubmit={handlePersonalInfoSubmit}
                                    className="space-y-6"
                                >
                                    <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                        <User className="w-5 h-5 text-blue-400" />
                                        المعلومات الأساسية
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm text-gray-300 mb-2 block">الاسم الأول</label>
                                            <div className="relative">
                                                <input
                                                    name="first_name"
                                                    value={formData.first_name}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg pl-10 pr-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors"
                                                    required
                                                />
                                                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm text-gray-300 mb-2 block">الاسم الأخير</label>
                                            <div className="relative">
                                                <input
                                                    name="last_name"
                                                    value={formData.last_name}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg pl-10 pr-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors"
                                                    required
                                                />
                                                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm text-gray-300 mb-2 block">البريد الإلكتروني</label>
                                            <div className="relative">
                                                <input
                                                    name="email"
                                                    type="email"
                                                    value={formData.email}
                                                    disabled
                                                    className="w-full bg-gray-800/30 border border-gray-700/50 rounded-lg pl-10 pr-3 py-3 text-gray-400 cursor-not-allowed"
                                                />
                                                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">لا يمكن تغيير البريد الإلكتروني</p>
                                        </div>

                                        <div>
                                            <label className="text-sm text-gray-300 mb-2 block">رقم الهاتف</label>
                                            <div className="relative">
                                                <input
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg pl-10 pr-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors"
                                                    required
                                                />
                                                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>

                                       
                                        {/* المنطقة */}
                                        <div className="space-y-2">
                                        <Label htmlFor="area_id" className="text-gray-200 font-medium">
                                            المنطقة
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                            <Map className="h-5 w-5 text-gray-500" />
                                            </div>
                                            <Select
                                            onValueChange={(value) => {
                                                setFormData({ ...formData, area_id:value });
                                            }}
                                            
                                            value={formData.area_id}
                                            >
                                            <SelectTrigger
                                                id="area_id"
                                                className="pl-3 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-10"
                                            >
                                                <SelectValue placeholder="اختر المنطقة" />
                                            </SelectTrigger>
                                            <SelectContent
                                                className="[&_*]:!bg-gray-800 [&_*]:!text-white border-gray-700 z-50"
                                                dir="rtl"
                                                align="end"
                                            >
                                                <SelectItem value="1">منطقة الرياض</SelectItem>
                                                <SelectItem value="2">منطقة مكة المكرمة</SelectItem>
                                                <SelectItem value="3">المنطقة الشرقية</SelectItem>
                                                <SelectItem value="4">منطقة تبوك</SelectItem>
                                                <SelectItem value="5">منطقة المدينة المنورة</SelectItem>
                                                <SelectItem value="6">منطقة الحدود الشمالية</SelectItem>
                                                <SelectItem value="7">منطقة القصيم</SelectItem>
                                                <SelectItem value="8">منطقة المجمعة</SelectItem>
                                                <SelectItem value="9">منطقة حائل</SelectItem>
                                                <SelectItem value="10">منطقة عسير</SelectItem>
                                            </SelectContent>
                                            </Select>
                                        </div>
                                        </div>

                                        <div>
                                            <label className="text-sm text-gray-300 mb-2 block">العنوان</label>
                                            <div className="relative">
                                                <input
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg pl-10 pr-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors"
                                                />
                                                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dealer-specific fields */}
                                    {profile.role === UserRole.DEALER && (
                                        <div className="mt-8 pt-6 border-t border-gray-700/50">
                                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                <Building className="w-5 h-5 text-purple-400" />
                                                معلومات التاجر
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-sm text-gray-300 mb-2 block">اسم الشركة</label>
                                                    <div className="relative">
                                                        <input
                                                            name="company_name"
                                                            value={formData.company_name}
                                                            onChange={handleInputChange}
                                                            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg pl-10 pr-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 transition-colors"
                                                        />
                                                        <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-sm text-gray-300 mb-2 block">رقم السجل التجاري</label>
                                                    <input
                                                        name="trade_license"
                                                        value={formData.trade_license}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 transition-colors"
                                                    />
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="text-sm text-gray-300 mb-2 block">وصف الشركة</label>
                                                    <textarea
                                                        name="description"
                                                        value={formData.description}
                                                        onChange={handleInputChange}
                                                        rows={4}
                                                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className={cn(
                                                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300",
                                                submitting
                                                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                                    : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white hover:scale-105"
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

                        {/* Security Tab */}
                        {activeTab === "security" && (
                            <div className="space-y-6">
                                {tabStatus.security.status && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={cn(
                                            "p-4 rounded-xl border backdrop-blur-sm flex items-center gap-3",
                                            tabStatus.security.status === "success"
                                                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                                                : tabStatus.security.status === "info"
                                                ? "bg-blue-500/20 border-blue-500/30 text-blue-300"
                                                : "bg-rose-500/20 border-rose-500/30 text-rose-300"
                                        )}
                                    >
                                        {tabStatus.security.status === "success" ? (
                                            <CheckCircle className="w-5 h-5" />
                                        ) : tabStatus.security.status === "info" ? (
                                            <Shield className="w-5 h-5" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5" />
                                        )}
                                        <p>{tabStatus.security.message}</p>
                                    </motion.div>
                                )}

                                <motion.form
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onSubmit={handleSecuritySubmit}
                                    className="space-y-6"
                                >
                                    <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-emerald-400" />
                                        إعدادات الأمان
                                    </h2>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm text-gray-300 mb-2 block">كلمة المرور الحالية</label>
                                            <div className="relative">
                                                <input
                                                    name="currentPassword"
                                                    type={showCurrentPassword ? "text" : "password"}
                                                    value={formData.currentPassword}
                                                    onChange={handleInputChange}
                                                    placeholder="أدخل كلمة المرور الحالية"
                                                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg pl-10 pr-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 transition-colors"
                                                />
                                                <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                                >
                                                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-gray-300 mb-2 block">كلمة المرور الجديدة</label>
                                                <div className="relative">
                                                    <input
                                                        name="password"
                                                        type={showPassword ? "text" : "password"}
                                                        value={formData.password}
                                                        onChange={handleInputChange}
                                                        placeholder="أدخل كلمة المرور الجديدة"
                                                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg pl-10 pr-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 transition-colors"
                                                    />
                                                    <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm text-gray-300 mb-2 block">تأكيد كلمة المرور</label>
                                                <div className="relative">
                                                    <input
                                                        name="confirmPassword"
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        value={formData.confirmPassword}
                                                        onChange={handleInputChange}
                                                        placeholder="أعد إدخال كلمة المرور الجديدة"
                                                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg pl-10 pr-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 transition-colors"
                                                    />
                                                    <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                                    >
                                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
                                            <input
                                                type="checkbox"
                                                id="twoFactorAuth"
                                                checked={formData.twoFactorAuth}
                                                onChange={(e) => handleCheckboxChange("twoFactorAuth", e.target.checked)}
                                                className="mt-1"
                                            />
                                            <div>
                                                <label htmlFor="twoFactorAuth" className="text-base font-medium text-white">
                                                    المصادقة الثنائية
                                                </label>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    تأمين حسابك بشكل أفضل باستخدام رمز إضافي عند تسجيل الدخول
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className={cn(
                                                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300",
                                                submitting
                                                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                                    : "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white hover:scale-105"
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

                        {/* Notifications Tab */}
                        {activeTab === "notifications" && (
                            <div className="space-y-6">
                                {tabStatus.notifications.status && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={cn(
                                            "p-4 rounded-xl border backdrop-blur-sm flex items-center gap-3",
                                            tabStatus.notifications.status === "success"
                                                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                                                : "bg-rose-500/20 border-rose-500/30 text-rose-300"
                                        )}
                                    >
                                        {tabStatus.notifications.status === "success" ? (
                                            <CheckCircle className="w-5 h-5" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5" />
                                        )}
                                        <p>{tabStatus.notifications.message}</p>
                                    </motion.div>
                                )}

                                <motion.form
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onSubmit={handleNotificationsSubmit}
                                    className="space-y-6"
                                >
                                    <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                        <Bell className="w-5 h-5 text-amber-400" />
                                        إعدادات الإشعارات
                                    </h2>

                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
                                            <input
                                                type="checkbox"
                                                id="notifyEmail"
                                                checked={formData.notifyEmail}
                                                onChange={(e) => handleCheckboxChange("notifyEmail", e.target.checked)}
                                                className="mt-1"
                                            />
                                            <div>
                                                <label htmlFor="notifyEmail" className="text-base font-medium text-white">
                                                    إشعارات البريد الإلكتروني
                                                </label>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    استلام إشعارات عبر البريد الإلكتروني عند حدوث نشاط في حسابك
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
                                            <input
                                                type="checkbox"
                                                id="notifySMS"
                                                checked={formData.notifySMS}
                                                onChange={(e) => handleCheckboxChange("notifySMS", e.target.checked)}
                                                className="mt-1"
                                            />
                                            <div>
                                                <label htmlFor="notifySMS" className="text-base font-medium text-white">
                                                    إشعارات الرسائل النصية
                                                </label>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    استلام إشعارات عبر الرسائل النصية عند حدوث نشاط في حسابك
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className={cn(
                                                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300",
                                                submitting
                                                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                                    : "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white hover:scale-105"
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