"use client";

import { useState, useEffect } from "react";
import {
    Settings,
    Globe,
    Bell,
    Shield,
    DollarSign,
    SaudiRiyal,
    Database,
    Save,
    AlertTriangle,
    CheckCircle,
    Loader2,
    Cpu,
    Mail,
    MessageSquare,
    Zap,
    Server,
    Eye,
    EyeOff,
    CreditCard,
    Car,
    TrafficCone,
    Calendar
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";

interface SystemSettings {
    siteName: string;
    siteUrl: string;
    adminEmail: string;
    supportEmail: string;
    platformFee: number;
    tamFee: number;
    trafficManagementFee: number;
    CarEntryFees: number;
    auctionDuration: number;
    emailNotifications: boolean;
    smsNotifications: boolean;
    maintenanceMode: boolean;
    autoApproveAuctions: boolean;
    maxBidAmount: number;
    minBidIncrement: number;
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SystemSettings>({
        siteName: "منصة أسواق المزادات الرقمية السعودية",
        siteUrl: "https://mazbrothers.com",
        adminEmail: "admin@mazbrothers.com",
        supportEmail: "support@mazbrothers.com",
        platformFee: 0,
        tamFee: 0,
        CarEntryFees: 0,
        trafficManagementFee: 0,
        auctionDuration: 24,
        emailNotifications: true,
        smsNotifications: false,
        maintenanceMode: false,
        autoApproveAuctions: false,
        maxBidAmount: 1000000,
        minBidIncrement: 100,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        if (!settingsLoaded) {
            fetchSettings();
        }
    }, [settingsLoaded]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/admin/settings");
            if (response.data && response.data.status === "success") {
                setSettings(response.data.data);
            }
            setSettingsLoaded(true);
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("تم تحميل الإعدادات الافتراضية");
            setSettingsLoaded(true);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            const response = await api.put("/api/admin/settings", settings);
            if (response.data && response.data.status === "success") {
                toast.success(response.data.message || "تم حفظ الإعدادات بنجاح");
            } else {
                toast.error(response.data.message || "فشل حفظ الإعدادات");
            }
        } catch (error: any) {
            console.error("Error saving settings:", error);
            const errorMessage =
                error.response?.data?.message || "حدث خطأ أثناء حفظ الإعدادات";
            toast.error(errorMessage);
            if (error.response?.data?.errors) {
                Object.values(error.response.data.errors).forEach((err: any) => {
                    toast.error(err[0]);
                });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (key: keyof SystemSettings, value: any) => {
        setSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const tabs = [
        { id: "general", name: "عام", icon: Settings, color: "blue" },
        { id: "notifications", name: "الإشعارات", icon: Bell, color: "purple" },
        { id: "security", name: "الأمان", icon: Shield, color: "green" },
        { id: "financial", name: "المالية", icon: SaudiRiyal, color: "amber" },
        { id: "system", name: "النظام", icon: Database, color: "red" },
    ];

    const getColorClass = (color: string) => {
        const colors = {
            blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
            green: "bg-green-500/10 text-green-400 border-green-500/20",
            amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            red: "bg-red-500/10 text-red-400 border-red-500/20"
        };
        return colors[color as keyof typeof colors] || colors.blue;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-300 text-lg">جاري تحميل الإعدادات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            إعدادات النظام
                        </h1>
                        <p className="text-gray-400">
                            إدارة إعدادات المنصة والتكوينات المختلفة
                        </p>
                    </div>
                    <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        {saving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {tabs.map((tab) => {
                        const IconComponent = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    activeTab === tab.id
                                        ? `${getColorClass(tab.color)} border`
                                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                                }`}
                            >
                                <IconComponent className="w-4 h-4" />
                                {tab.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Settings Content */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl">
                {/* General Settings */}
                {activeTab === "general" && (
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <Globe className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">
                                    الإعدادات العامة
                                </h3>
                                <p className="text-gray-400">
                                    إعدادات الموقع والمعلومات الأساسية
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        اسم الموقع
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.siteName}
                                        onChange={(e) =>
                                            handleInputChange("siteName", e.target.value)
                                        }
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        placeholder="أدخل اسم الموقع"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        بريد المدير الإلكتروني
                                    </label>
                                    <input
                                        type="email"
                                        value={settings.adminEmail}
                                        onChange={(e) =>
                                            handleInputChange("adminEmail", e.target.value)
                                        }
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        placeholder="admin@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        رابط الموقع
                                    </label>
                                    <input
                                        type="url"
                                        value={settings.siteUrl}
                                        onChange={(e) =>
                                            handleInputChange("siteUrl", e.target.value)
                                        }
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        placeholder="https://example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        بريد الدعم الفني
                                    </label>
                                    <input
                                        type="email"
                                        value={settings.supportEmail}
                                        onChange={(e) =>
                                            handleInputChange("supportEmail", e.target.value)
                                        }
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        placeholder="support@example.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notifications Settings */}
                {activeTab === "notifications" && (
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-purple-500/10 rounded-xl">
                                <Bell className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">
                                    إعدادات الإشعارات
                                </h3>
                                <p className="text-gray-400">
                                    إدارة تفضيلات الإشعارات والتنبيهات
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-6 bg-gray-700/30 rounded-2xl border border-gray-600 hover:border-purple-500/30 transition-all duration-200">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 rounded-xl">
                                        <Mail className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">
                                            إشعارات البريد الإلكتروني
                                        </h4>
                                        <p className="text-sm text-gray-400">
                                            إرسال إشعارات عبر البريد الإلكتروني للمستخدمين
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.emailNotifications}
                                        onChange={(e) =>
                                            handleInputChange("emailNotifications", e.target.checked)
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-12 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-gray-700/30 rounded-2xl border border-gray-600 hover:border-purple-500/30 transition-all duration-200">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-500/10 rounded-xl">
                                        <MessageSquare className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">
                                            إشعارات الرسائل النصية
                                        </h4>
                                        <p className="text-sm text-gray-400">
                                            إرسال إشعارات عبر الرسائل النصية للمستخدمين
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.smsNotifications}
                                        onChange={(e) =>
                                            handleInputChange("smsNotifications", e.target.checked)
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-12 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Security Settings */}
                {activeTab === "security" && (
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-green-500/10 rounded-xl">
                                <Shield className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">
                                    إعدادات الأمان
                                </h3>
                                <p className="text-gray-400">
                                    إعدادات الأمان والتحكم في الوصول
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-6 bg-gray-700/30 rounded-2xl border border-gray-600 hover:border-green-500/30 transition-all duration-200">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 rounded-xl">
                                        <Zap className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">
                                            الموافقة التلقائية على المزادات
                                        </h4>
                                        <p className="text-sm text-gray-400">
                                            السماح بالموافقة التلقائية على المزادات الجديدة
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.autoApproveAuctions}
                                        onChange={(e) =>
                                            handleInputChange("autoApproveAuctions", e.target.checked)
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-12 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        الحد الأقصى لمبلغ المزايدة (ريال)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.maxBidAmount}
                                        onChange={(e) =>
                                            handleInputChange("maxBidAmount", parseInt(e.target.value))
                                        }
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        الحد الأدنى لزيادة المزايدة (ريال)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.minBidIncrement}
                                        onChange={(e) =>
                                            handleInputChange("minBidIncrement", parseInt(e.target.value))
                                        }
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Financial Settings */}
                {activeTab === "financial" && (
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-amber-500/10 rounded-xl">
                                <CreditCard className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">
                                    الإعدادات المالية
                                </h3>
                                <p className="text-gray-400">
                                    إدارة الرسوم والتكاليف المالية
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                    <Car className="w-4 h-4" />
                                    رسوم تام
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={settings.tamFee}
                                    onChange={(e) =>
                                        handleInputChange("tamFee", parseFloat(e.target.value))
                                    }
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                                />
                                <p className="text-xs text-gray-400 mt-2">
                                    رسوم تام من كل عملية بيع
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                    <TrafficCone className="w-4 h-4" />
                                    رسوم إدارة المرور
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={settings.trafficManagementFee}
                                    onChange={(e) =>
                                        handleInputChange("trafficManagementFee", parseFloat(e.target.value))
                                    }
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                                />
                                <p className="text-xs text-gray-400 mt-2">
                                    رسوم إدارة المرور من كل عملية بيع
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                    <Car className="w-4 h-4" />
                                    رسوم إدخال السيارة للمزاد
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={settings.CarEntryFees}
                                    onChange={(e) =>
                                        handleInputChange("CarEntryFees", parseFloat(e.target.value))
                                    }
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                                />
                                <p className="text-xs text-gray-400 mt-2">
                                    رسوم إدخال السيارة للمزاد يدفعها البائع
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* System Settings */}
                {activeTab === "system" && (
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-red-500/10 rounded-xl">
                                <Server className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">
                                    إعدادات النظام
                                </h3>
                                <p className="text-gray-400">
                                    إعدادات النظام والصيانة
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-500/10 rounded-xl">
                                        <AlertTriangle className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">
                                            وضع الصيانة
                                        </h4>
                                        <p className="text-sm text-gray-400">
                                            تفعيل وضع الصيانة لمنع الوصول للموقع مؤقتاً
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.maintenanceMode}
                                        onChange={(e) =>
                                            handleInputChange("maintenanceMode", e.target.checked)
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-12 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        مدة المزاد الافتراضية (ساعة)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.auctionDuration}
                                        onChange={(e) =>
                                            handleInputChange("auctionDuration", parseInt(e.target.value))
                                        }
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                                    />
                                    <p className="text-xs text-gray-400 mt-2">
                                        المدة الافتراضية للمزادات بالساعات
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}