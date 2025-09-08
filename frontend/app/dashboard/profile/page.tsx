"use client";

import { BackToDashboard } from "@/components/dashboard/BackToDashboard";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { UserRole } from "@/types/types";
import { Textarea } from "@/components/ui/textarea";

interface UserProfile {
    id: number;
    first_name: string;
    last_name: string;
    name?: string;
    email: string;
    phone: string;
    role: string;
    city?: string;
    address?: string;
    company_name?: string;
    trade_license?: string;
    description?: string;
    created_at: string;
    updated_at: string;
    email_verified_at: string | null;
    is_active?: boolean;
    kyc_status?: string;
    // Notification settings
    notification_email?: boolean;
    notification_sms?: boolean;
    two_factor_auth?: boolean;
}

interface ProfileFormData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    city: string;
    address: string;
    company_name: string;
    trade_license: string;
    description: string;
    // For security tab
    currentPassword: string;
    password: string;
    confirmPassword: string;
    // For notification tab
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
        city: "",
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
    const [tabStatus, setTabStatus] = useState({
        personal: { status: "", message: "" },
        security: { status: "", message: "" },
        notifications: { status: "", message: "" },
    });

    const { user, isLoggedIn } = useAuth();
    const router = useRouter();

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
                    console.log(profileData);
                    setProfile(profileData);

                    // Initialize form data with profile data
                    setFormData({
                        first_name: profileData.first_name || "",
                        last_name: profileData.last_name || "",
                        email: profileData.email || "",
                        phone: profileData.phone || "",
                        city: profileData.city || "",
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
                city: formData.city,
            };

            // Add dealer-specific data if user is a dealer
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

                // Update profile data
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

        // Validate passwords
        if (
            formData.password &&
            formData.password !== formData.confirmPassword
        ) {
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

        // Validate current password exists if changing password
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
            // Only send password update if actually changing password
            if (formData.password && formData.currentPassword) {
                const securityData = {
                    current_password: formData.currentPassword,
                    password: formData.password,
                    password_confirmation: formData.confirmPassword,
                    two_factor_auth: formData.twoFactorAuth,
                };

                // Using the appropriate endpoint for password update
                const response = await api.put(
                    "/api/user/password",
                    securityData
                );

                if (response.data && response.data.success) {
                    setTabStatus({
                        ...tabStatus,
                        security: {
                            status: "success",
                            message: "تم تحديث إعدادات الأمان بنجاح",
                        },
                    });
                    toast.success("تم تحديث إعدادات الأمان بنجاح");

                    // Clear password fields
                    setFormData({
                        ...formData,
                        currentPassword: "",
                        password: "",
                        confirmPassword: "",
                    });
                } else {
                    throw new Error(
                        response.data?.message ||
                            "حدث خطأ أثناء تحديث إعدادات الأمان"
                    );
                }
            } else if (profile?.two_factor_auth !== formData.twoFactorAuth) {
                // Only update 2FA setting
                const twoFAResponse = await api.put(
                    "/api/user/security-settings",
                    {
                        two_factor_auth: formData.twoFactorAuth,
                    }
                );

                if (twoFAResponse.data && twoFAResponse.data.success) {
                    setTabStatus({
                        ...tabStatus,
                        security: {
                            status: "success",
                            message: "تم تحديث إعدادات المصادقة الثنائية بنجاح",
                        },
                    });
                    toast.success("تم تحديث إعدادات المصادقة الثنائية بنجاح");

                    // Update profile
                    setProfile({
                        ...profile!,
                        two_factor_auth: formData.twoFactorAuth,
                    });
                }
            } else {
                // No changes were made
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
                    message:
                        error.response?.data?.message ||
                        "حدث خطأ أثناء تحديث إعدادات الأمان",
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

            // Using the appropriate endpoint for notification settings
            const response = await api.put(
                "/api/user/notification-settings",
                notificationData
            );

            if (response.data && response.data.success) {
                setTabStatus({
                    ...tabStatus,
                    notifications: {
                        status: "success",
                        message: "تم تحديث إعدادات الإشعارات بنجاح",
                    },
                });
                toast.success("تم تحديث إعدادات الإشعارات بنجاح");

                // Update profile
                setProfile({
                    ...profile!,
                    notification_email: formData.notifyEmail,
                    notification_sms: formData.notifySMS,
                });
            } else {
                throw new Error(
                    response.data?.message ||
                        "حدث خطأ أثناء تحديث إعدادات الإشعارات"
                );
            }
        } catch (error: any) {
            console.error("Error updating notification settings:", error);
            setTabStatus({
                ...tabStatus,
                notifications: {
                    status: "error",
                    message:
                        error.response?.data?.message ||
                        "حدث خطأ أثناء تحديث إعدادات الإشعارات",
                },
            });
            toast.error("حدث خطأ أثناء تحديث إعدادات الإشعارات");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main
            className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen"
            dir="rtl"
        >
            {/* زر العودة للوحة التحكم */}
            <BackToDashboard />

            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
                الملف الشخصي
            </h1>

            {isLoading ? (
                <div className="flex items-center justify-center p-10">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="mr-2 text-gray-600">
                        جاري تحميل بيانات الملف الشخصي...
                    </span>
                </div>
            ) : !profile ? (
                <div className="text-center py-10 text-gray-500">
                    <AlertCircle className="h-10 w-10 mx-auto mb-2 text-red-500" />
                    <p>لم يتم العثور على بيانات الملف الشخصي</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                    >
                        إعادة تحميل الصفحة
                    </button>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto">
                    {/* بطاقة معلومات العضوية */}
                    <div className="mb-8 bg-white p-6 rounded-lg shadow-md border">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                    <User size={36} />
                                </div>
                                {/* Disable avatar upload for now */}
                                {/* <button className="absolute -bottom-1 -left-1 bg-gray-100 rounded-full p-1 shadow-sm hover:bg-gray-200 border">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </button> */}
                            </div>

                            <div className="flex-grow text-center sm:text-right">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {profile.first_name} {profile.last_name}
                                </h2>
                                <p className="text-gray-500 mb-2">
                                    {profile.email}
                                </p>

                                <div className="flex flex-wrap justify-center sm:justify-start gap-3 mb-2">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
                                        <span>
                                            {profile.role === UserRole.DEALER
                                                ? "تاجر"
                                                : profile.role === UserRole.ADMIN
                                                ? "مدير"
                                                : "مستخدم"}
                                        </span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                                        <span>
                                            الحالة:{" "}
                                            {profile.is_active
                                                ? "مفعل ✅"
                                                : "غير مفعل ❌"}
                                        </span>
                                    </span>
                                </div>

                                <p className="text-gray-500 text-sm">
                                    تاريخ الانضمام:{" "}
                                    {formatDate(profile.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* تبويبات الإعدادات */}
                    <Tabs
                        defaultValue="personal"
                        className="bg-white rounded-lg shadow border"
                        value={activeTab}
                        onValueChange={setActiveTab}
                    >
                        <TabsList className="w-full p-0 bg-gray-50 rounded-t-lg border-b">
                            <TabsTrigger
                                value="personal"
                                className="flex-1 py-3 rounded-none rounded-tl-lg data-[state=active]:bg-white"
                            >
                                <User className="w-4 h-4 ml-1.5" />
                                المعلومات الشخصية
                            </TabsTrigger>
                            <TabsTrigger
                                value="security"
                                className="flex-1 py-3 rounded-none data-[state=active]:bg-white"
                            >
                                <Shield className="w-4 h-4 ml-1.5" />
                                الأمان
                            </TabsTrigger>
                            <TabsTrigger
                                value="notifications"
                                className="flex-1 py-3 rounded-none rounded-tr-lg data-[state=active]:bg-white"
                            >
                                <Bell className="w-4 h-4 ml-1.5" />
                                الإشعارات
                            </TabsTrigger>
                        </TabsList>

                        {/* معلومات شخصية */}
                        <TabsContent value="personal" className="p-6 space-y-6">
                            {tabStatus.personal.status && (
                                <div
                                    className={`p-4 rounded-md mb-4 ${
                                        tabStatus.personal.status === "success"
                                            ? "bg-green-50 border border-green-200 text-green-700"
                                            : "bg-red-50 border border-red-200 text-red-700"
                                    }`}
                                >
                                    <div className="flex items-center">
                                        {tabStatus.personal.status ===
                                        "success" ? (
                                            <CheckCircle className="h-5 w-5 mr-2" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 mr-2" />
                                        )}
                                        <p>{tabStatus.personal.message}</p>
                                    </div>
                                </div>
                            )}

                            <form
                                onSubmit={handlePersonalInfoSubmit}
                                className="space-y-5"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <Label
                                            htmlFor="first_name"
                                            className="mb-1.5"
                                        >
                                            الاسم الأول
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="first_name"
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={handleInputChange}
                                                className="pr-9"
                                                required
                                            />
                                            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        </div>
                                    </div>

                                    <div>
                                        <Label
                                            htmlFor="last_name"
                                            className="mb-1.5"
                                        >
                                            الاسم الأخير
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="last_name"
                                                name="last_name"
                                                value={formData.last_name}
                                                onChange={handleInputChange}
                                                className="pr-9"
                                                required
                                            />
                                            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        </div>
                                    </div>

                                    <div>
                                        <Label
                                            htmlFor="email"
                                            className="mb-1.5"
                                        >
                                            البريد الإلكتروني
                                        </Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            disabled={true}
                                            className="bg-gray-50"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            لا يمكن تغيير البريد الإلكتروني
                                        </p>
                                    </div>

                                    <div>
                                        <Label
                                            htmlFor="phone"
                                            className="mb-1.5"
                                        >
                                            رقم الهاتف
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="pr-9"
                                                required
                                            />
                                            <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        </div>
                                    </div>

                                    <div>
                                        <Label
                                            htmlFor="city"
                                            className="mb-1.5"
                                        >
                                            المدينة
                                        </Label>
                                        <Input
                                            id="city"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div>
                                        <Label
                                            htmlFor="address"
                                            className="mb-1.5"
                                        >
                                            العنوان
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="address"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                className="pr-9"
                                            />
                                            <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Dealer-specific fields */}
                                {profile.role === UserRole.DEALER && (
                                    <div className="mt-6 space-y-5 border-t pt-5">
                                        <h3 className="text-lg font-semibold text-gray-700">
                                            معلومات التاجر
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <Label
                                                    htmlFor="company_name"
                                                    className="mb-1.5"
                                                >
                                                    اسم الشركة
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="company_name"
                                                        name="company_name"
                                                        value={
                                                            formData.company_name
                                                        }
                                                        onChange={
                                                            handleInputChange
                                                        }
                                                        className="pr-9"
                                                    />
                                                    <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                </div>
                                            </div>

                                            <div>
                                                <Label
                                                    htmlFor="trade_license"
                                                    className="mb-1.5"
                                                >
                                                    رقم السجل التجاري
                                                </Label>
                                                <Input
                                                    id="trade_license"
                                                    name="trade_license"
                                                    value={
                                                        formData.trade_license
                                                    }
                                                    onChange={handleInputChange}
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <Label
                                                    htmlFor="description"
                                                    className="mb-1.5"
                                                >
                                                    وصف الشركة
                                                </Label>
                                                <Textarea
                                                    id="description"
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleInputChange}
                                                    rows={4}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end pt-4">
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className={
                                            submitting
                                                ? "opacity-70 cursor-not-allowed"
                                                : ""
                                        }
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                جاري الحفظ...
                                            </>
                                        ) : (
                                            "حفظ التعديلات"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>

                        {/* إعدادات الأمان */}
                        <TabsContent value="security" className="p-6 space-y-6">
                            {tabStatus.security.status && (
                                <div
                                    className={`p-4 rounded-md mb-4 ${
                                        tabStatus.security.status === "success"
                                            ? "bg-green-50 border border-green-200 text-green-700"
                                            : tabStatus.security.status ===
                                              "info"
                                            ? "bg-blue-50 border border-blue-200 text-blue-700"
                                            : "bg-red-50 border border-red-200 text-red-700"
                                    }`}
                                >
                                    <div className="flex items-center">
                                        {tabStatus.security.status ===
                                        "success" ? (
                                            <CheckCircle className="h-5 w-5 mr-2" />
                                        ) : tabStatus.security.status ===
                                          "info" ? (
                                            <Shield className="h-5 w-5 mr-2" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 mr-2" />
                                        )}
                                        <p>{tabStatus.security.message}</p>
                                    </div>
                                </div>
                            )}

                            <form
                                onSubmit={handleSecuritySubmit}
                                className="space-y-5"
                            >
                                <div>
                                    <Label
                                        htmlFor="currentPassword"
                                        className="mb-1.5"
                                    >
                                        كلمة المرور الحالية
                                    </Label>
                                    <Input
                                        id="currentPassword"
                                        name="currentPassword"
                                        type="password"
                                        value={formData.currentPassword}
                                        onChange={handleInputChange}
                                        placeholder="أدخل كلمة المرور الحالية"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <Label
                                            htmlFor="password"
                                            className="mb-1.5"
                                        >
                                            كلمة المرور الجديدة
                                        </Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="أدخل كلمة المرور الجديدة"
                                        />
                                    </div>

                                    <div>
                                        <Label
                                            htmlFor="confirmPassword"
                                            className="mb-1.5"
                                        >
                                            تأكيد كلمة المرور
                                        </Label>
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            placeholder="أعد إدخال كلمة المرور الجديدة"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-start space-x-2 space-x-reverse">
                                    <Checkbox
                                        id="twoFactorAuth"
                                        checked={formData.twoFactorAuth}
                                        onCheckedChange={(checked) =>
                                            handleCheckboxChange(
                                                "twoFactorAuth",
                                                checked === true
                                            )
                                        }
                                        className="mt-1 mr-1"
                                    />
                                    <div>
                                        <Label
                                            htmlFor="twoFactorAuth"
                                            className="text-base font-medium"
                                        >
                                            المصادقة الثنائية
                                        </Label>
                                        <p className="text-sm text-gray-500">
                                            تأمين حسابك بشكل أفضل باستخدام رمز
                                            إضافي عند تسجيل الدخول
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className={
                                            submitting
                                                ? "opacity-70 cursor-not-allowed"
                                                : ""
                                        }
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                جاري الحفظ...
                                            </>
                                        ) : (
                                            "تحديث إعدادات الأمان"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>

                        {/* إعدادات الإشعارات */}
                        <TabsContent
                            value="notifications"
                            className="p-6 space-y-6"
                        >
                            {tabStatus.notifications.status && (
                                <div
                                    className={`p-4 rounded-md mb-4 ${
                                        tabStatus.notifications.status ===
                                        "success"
                                            ? "bg-green-50 border border-green-200 text-green-700"
                                            : "bg-red-50 border border-red-200 text-red-700"
                                    }`}
                                >
                                    <div className="flex items-center">
                                        {tabStatus.notifications.status ===
                                        "success" ? (
                                            <CheckCircle className="h-5 w-5 mr-2" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 mr-2" />
                                        )}
                                        <p>{tabStatus.notifications.message}</p>
                                    </div>
                                </div>
                            )}

                            <form
                                onSubmit={handleNotificationsSubmit}
                                className="space-y-5"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-2 space-x-reverse">
                                        <Checkbox
                                            id="notifyEmail"
                                            checked={formData.notifyEmail}
                                            onCheckedChange={(checked) =>
                                                handleCheckboxChange(
                                                    "notifyEmail",
                                                    checked === true
                                                )
                                            }
                                            className="mt-1 mr-1"
                                        />
                                        <div>
                                            <Label
                                                htmlFor="notifyEmail"
                                                className="text-base font-medium"
                                            >
                                                إشعارات البريد الإلكتروني
                                            </Label>
                                            <p className="text-sm text-gray-500">
                                                استلام إشعارات عبر البريد
                                                الإلكتروني عند حدوث نشاط في
                                                حسابك
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-2 space-x-reverse">
                                        <Checkbox
                                            id="notifySMS"
                                            checked={formData.notifySMS}
                                            onCheckedChange={(checked) =>
                                                handleCheckboxChange(
                                                    "notifySMS",
                                                    checked === true
                                                )
                                            }
                                            className="mt-1 mr-1"
                                        />
                                        <div>
                                            <Label
                                                htmlFor="notifySMS"
                                                className="text-base font-medium"
                                            >
                                                إشعارات الرسائل النصية
                                            </Label>
                                            <p className="text-sm text-gray-500">
                                                استلام إشعارات عبر الرسائل
                                                النصية عند حدوث نشاط في حسابك
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className={
                                            submitting
                                                ? "opacity-70 cursor-not-allowed"
                                                : ""
                                        }
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                جاري الحفظ...
                                            </>
                                        ) : (
                                            "حفظ تفضيلات الإشعارات"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </main>
    );
}
