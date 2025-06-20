"use client";

import { useState, useEffect } from "react";
import {
    Settings,
    Globe,
    Bell,
    Shield,
    DollarSign,
    Mail,
    Database,
    Save,
    AlertTriangle,
    CheckCircle,
    Loader2,
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
        platformFee: 5.0,
        tamFee: 2.5,
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

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            // In a real implementation, you would fetch settings from the backend
            // For now, we'll use default values
            setLoading(false);
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("فشل في تحميل الإعدادات");
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            // Here you would send the settings to the backend
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
            toast.success("تم حفظ الإعدادات بنجاح");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("فشل في حفظ الإعدادات");
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
        { id: "general", name: "عام", icon: Settings },
        { id: "notifications", name: "الإشعارات", icon: Bell },
        { id: "security", name: "الأمان", icon: Shield },
        { id: "financial", name: "المالية", icon: DollarSign },
        { id: "system", name: "النظام", icon: Database },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="mr-2">جاري تحميل الإعدادات...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">
                    إعدادات النظام
                </h1>
                <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                </button>
            </div>

            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === tab.id
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-600 hover:text-gray-800"
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.name}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
                {activeTab === "general" && (
                    <div className="p-6 space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            الإعدادات العامة
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    اسم الموقع
                                </label>
                                <input
                                    type="text"
                                    value={settings.siteName}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "siteName",
                                            e.target.value
                                        )
                                    }
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    رابط الموقع
                                </label>
                                <input
                                    type="url"
                                    value={settings.siteUrl}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "siteUrl",
                                            e.target.value
                                        )
                                    }
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    بريد المدير الإلكتروني
                                </label>
                                <input
                                    type="email"
                                    value={settings.adminEmail}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "adminEmail",
                                            e.target.value
                                        )
                                    }
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    بريد الدعم الفني
                                </label>
                                <input
                                    type="email"
                                    value={settings.supportEmail}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "supportEmail",
                                            e.target.value
                                        )
                                    }
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "notifications" && (
                    <div className="p-6 space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            إعدادات الإشعارات
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div>
                                    <h4 className="font-medium text-gray-800">
                                        إشعارات البريد الإلكتروني
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        إرسال إشعارات عبر البريد الإلكتروني
                                        للمستخدمين
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.emailNotifications}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "emailNotifications",
                                                e.target.checked
                                            )
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div>
                                    <h4 className="font-medium text-gray-800">
                                        إشعارات الرسائل النصية
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        إرسال إشعارات عبر الرسائل النصية
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.smsNotifications}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "smsNotifications",
                                                e.target.checked
                                            )
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "security" && (
                    <div className="p-6 space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            إعدادات الأمان
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div>
                                    <h4 className="font-medium text-gray-800">
                                        الموافقة التلقائية على المزادات
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        السماح بالموافقة التلقائية على المزادات
                                        الجديدة
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.autoApproveAuctions}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "autoApproveAuctions",
                                                e.target.checked
                                            )
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        الحد الأقصى لمبلغ المزايدة (ريال)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.maxBidAmount}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "maxBidAmount",
                                                parseInt(e.target.value)
                                            )
                                        }
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        الحد الأدنى لزيادة المزايدة (ريال)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.minBidIncrement}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "minBidIncrement",
                                                parseInt(e.target.value)
                                            )
                                        }
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "financial" && (
                    <div className="p-6 space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            الإعدادات المالية
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    عمولة المنصة (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={settings.platformFee}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "platformFee",
                                            parseFloat(e.target.value)
                                        )
                                    }
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    عمولة المنصة من كل عملية بيع
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    رسوم تام (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={settings.tamFee}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "tamFee",
                                            parseFloat(e.target.value)
                                        )
                                    }
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    رسوم تام من كل عملية بيع
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "system" && (
                    <div className="p-6 space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            إعدادات النظام
                        </h3>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                                <div>
                                    <h4 className="font-medium text-red-800 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        وضع الصيانة
                                    </h4>
                                    <p className="text-sm text-red-600">
                                        تفعيل وضع الصيانة لمنع الوصول للموقع
                                        مؤقتاً
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.maintenanceMode}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "maintenanceMode",
                                                e.target.checked
                                            )
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    مدة المزاد الافتراضية (ساعة)
                                </label>
                                <input
                                    type="number"
                                    value={settings.auctionDuration}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "auctionDuration",
                                            parseInt(e.target.value)
                                        )
                                    }
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    المدة الافتراضية للمزادات بالساعات
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
