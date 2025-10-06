"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Save,
    X,
    Loader2,
    Shield,
    Eye,
    EyeOff,
    User,
    Mail,
    Phone,
    Key,
    AlertTriangle,
    CheckCircle,
    Settings,
    UserPlus,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import Link from "next/link";

interface FormData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
}

interface FormErrors {
    first_name?: string[];
    last_name?: string[];
    email?: string[];
    phone?: string[];
    password?: string[];
    password_confirmation?: string[];
}

export default function AddModeratorPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear errors for this field when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        
        if (!formData.first_name.trim()) {
            newErrors.first_name = ["الاسم الأول مطلوب"];
        }
        
        if (!formData.last_name.trim()) {
            newErrors.last_name = ["الاسم الأخير مطلوب"];
        }
        
        if (!formData.email.trim()) {
            newErrors.email = ["البريد الإلكتروني مطلوب"];
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = ["يرجى إدخال بريد إلكتروني صالح"];
        }
        
        if (!formData.phone.trim()) {
            newErrors.phone = ["رقم الهاتف مطلوب"];
        }
        
        if (!formData.password) {
            newErrors.password = ["كلمة المرور مطلوبة"];
        } else if (formData.password.length < 8) {
            newErrors.password = ["كلمة المرور يجب أن تكون 8 أحرف على الأقل"];
        }
        
        if (!formData.password_confirmation) {
            newErrors.password_confirmation = ["تأكيد كلمة المرور مطلوب"];
        } else if (formData.password !== formData.password_confirmation) {
            newErrors.password_confirmation = ["كلمة المرور وتأكيدها غير متطابقين"];
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error("يرجى تصحيح الأخطاء في النموذج");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post("/api/admin/moderators", formData);

            if (response.data && response.data.status === "success") {
                toast.success(response.data.message);
                router.push("/admin/moderators");
            }
        } catch (error: any) {
            console.error("Error creating moderator:", error);
            
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                toast.error("يرجى تصحيح الأخطاء في النموذج");
            } else {
                const errorMessage = error.response?.data?.message || "حدث خطأ أثناء إنشاء المشرف";
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (Object.values(formData).some(value => value.trim() !== "")) {
            if (confirm("هل أنت متأكد من إلغاء العملية؟ ستفقد جميع البيانات المدخلة.")) {
                router.push("/admin/moderators");
            }
        } else {
            router.push("/admin/moderators");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 md:p-6">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
                <div>
                    <Link
                        href="/admin/moderators"
                        className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors duration-300 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5 ml-2" />
                        العودة إلى قائمة المشرفين
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        إضافة مشرف جديد
                    </h1>
                    <p className="text-gray-400 mt-2">
                        إنشاء حساب مشرف جديد مع الصلاحيات المناسبة
                    </p>
                </div>

                <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-3 rounded-xl">
                        <UserPlus className="w-6 h-6 text-white" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2">
                    {/* Welcome Card */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6 mb-6">
                        <div className="flex items-center space-x-4 space-x-reverse">
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-3 rounded-xl">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">مرحباً بك في إضافة مشرف جديد</h2>
                                <p className="text-gray-400 mt-1">
                                    املأ النموذج أدناه لإنشاء حساب مشرف جديد في النظام
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Add Form */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white flex items-center">
                                <Settings className="w-5 h-5 ml-2 text-cyan-400" />
                                المعلومات الأساسية للمشرف
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Personal Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* First Name */}
                                <div>
                                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-300 mb-3">
                                        الاسم الأول *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            id="first_name"
                                            name="first_name"
                                            type="text"
                                            value={formData.first_name}
                                            onChange={handleInputChange}
                                            className={`w-full bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 pl-10 ${
                                                errors.first_name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-cyan-500'
                                            }`}
                                            placeholder="أدخل الاسم الأول"
                                            disabled={loading}
                                        />
                                    </div>
                                    {errors.first_name && (
                                        <p className="mt-2 text-sm text-red-400 flex items-center">
                                            <AlertTriangle className="w-3 h-3 ml-1" />
                                            {errors.first_name[0]}
                                        </p>
                                    )}
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-300 mb-3">
                                        الاسم الأخير *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            id="last_name"
                                            name="last_name"
                                            type="text"
                                            value={formData.last_name}
                                            onChange={handleInputChange}
                                            className={`w-full bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 pl-10 ${
                                                errors.last_name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-cyan-500'
                                            }`}
                                            placeholder="أدخل الاسم الأخير"
                                            disabled={loading}
                                        />
                                    </div>
                                    {errors.last_name && (
                                        <p className="mt-2 text-sm text-red-400 flex items-center">
                                            <AlertTriangle className="w-3 h-3 ml-1" />
                                            {errors.last_name[0]}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-3">
                                        البريد الإلكتروني *
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className={`w-full bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 pl-10 ${
                                                errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-cyan-500'
                                            }`}
                                            placeholder="أدخل البريد الإلكتروني"
                                            disabled={loading}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-2 text-sm text-red-400 flex items-center">
                                            <AlertTriangle className="w-3 h-3 ml-1" />
                                            {errors.email[0]}
                                        </p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-3">
                                        رقم الهاتف *
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className={`w-full bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 pl-10 ${
                                                errors.phone ? 'border-red-500 focus:ring-red-500' : 'focus:ring-cyan-500'
                                            }`}
                                            placeholder="أدخل رقم الهاتف"
                                            disabled={loading}
                                        />
                                    </div>
                                    {errors.phone && (
                                        <p className="mt-2 text-sm text-red-400 flex items-center">
                                            <AlertTriangle className="w-3 h-3 ml-1" />
                                            {errors.phone[0]}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Password Section */}
                            <div className="border-t border-gray-700/50 pt-6">
                                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                                    <Key className="w-5 h-5 ml-2 text-amber-400" />
                                    إعدادات الأمان
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Password */}
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-3">
                                            كلمة المرور *
                                        </label>
                                        <div className="relative">
                                            <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className={`w-full bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 pl-10 ${
                                                    errors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-cyan-500'
                                                }`}
                                                placeholder="أدخل كلمة المرور"
                                                disabled={loading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="mt-2 text-sm text-red-400 flex items-center">
                                                <AlertTriangle className="w-3 h-3 ml-1" />
                                                {errors.password[0]}
                                            </p>
                                        )}
                                        <p className="mt-2 text-xs text-gray-400">
                                            يجب أن تكون كلمة المرور 8 أحرف على الأقل
                                        </p>
                                    </div>

                                    {/* Password Confirmation */}
                                    <div>
                                        <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-300 mb-3">
                                            تأكيد كلمة المرور *
                                        </label>
                                        <div className="relative">
                                            <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                id="password_confirmation"
                                                name="password_confirmation"
                                                type={showPasswordConfirmation ? "text" : "password"}
                                                value={formData.password_confirmation}
                                                onChange={handleInputChange}
                                                className={`w-full bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 pl-10 ${
                                                    errors.password_confirmation ? 'border-red-500 focus:ring-red-500' : 'focus:ring-cyan-500'
                                                }`}
                                                placeholder="أعد إدخال كلمة المرور"
                                                disabled={loading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                            >
                                                {showPasswordConfirmation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errors.password_confirmation && (
                                            <p className="mt-2 text-sm text-red-400 flex items-center">
                                                <AlertTriangle className="w-3 h-3 ml-1" />
                                                {errors.password_confirmation[0]}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end space-x-4 space-x-reverse pt-6 border-t border-gray-700/50">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={loading}
                                    className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
                                >
                                    <X className="w-4 h-4 ml-2" />
                                    إلغاء
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-300"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 ml-2" />
                                    )}
                                    إنشاء المشرف
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Tips */}
                    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20 shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-cyan-400 mb-4">نصائح سريعة</h3>
                        
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start space-x-2 space-x-reverse">
                                <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                <span className="text-cyan-300">جميع الحقول المميزة بـ * إلزامية</span>
                            </div>
                            <div className="flex items-start space-x-2 space-x-reverse">
                                <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                <span className="text-cyan-300">استخدم بريد إلكتروني فعال</span>
                            </div>
                            <div className="flex items-start space-x-2 space-x-reverse">
                                <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                <span className="text-cyan-300">كلمة مرور قوية تحمي الحساب</span>
                            </div>
                            <div className="flex items-start space-x-2 space-x-reverse">
                                <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                <span className="text-cyan-300">تأكد من صحة جميع البيانات</span>
                            </div>
                        </div>
                    </div>

                    {/* Moderator Permissions */}
                    <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-2xl border border-orange-500/20 shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-orange-400 mb-4 flex items-center">
                            <Shield className="w-5 h-5 ml-2" />
                            صلاحيات المشرف
                        </h3>
                        
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center space-x-2 space-x-reverse text-orange-300">
                                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                <span>إدارة المزادات والمشاركين</span>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse text-orange-300">
                                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                <span>التحقق من المستخدمين والتجار</span>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse text-orange-300">
                                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                <span>مراقبة النشاطات والمخالفات</span>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse text-orange-300">
                                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                <span>إعداد التقارير والإحصائيات</span>
                            </div>
                        </div>
                    </div>

                    {/* Next Steps */}
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20 shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-green-400 mb-4">بعد الإنشاء</h3>
                        
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start space-x-2 space-x-reverse">
                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-green-300">سيتم تفعيل الحساب تلقائياً</span>
                            </div>
                            <div className="flex items-start space-x-2 space-x-reverse">
                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-green-300">إشعار المشرف ببيانات الدخول</span>
                            </div>
                            <div className="flex items-start space-x-2 space-x-reverse">
                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-green-300">إمكانية تعديل البيانات لاحقاً</span>
                            </div>
                            <div className="flex items-start space-x-2 space-x-reverse">
                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-green-300">إدارة الصلاحيات من لوحة التحكم</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Indicator */}
            <div className="mt-8 bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between text-sm">
                    <div className="text-cyan-400 font-semibold">جاري إنشاء المشرف الجديد</div>
                    <div className="text-gray-400">الخطوة 1 من 1</div>
                </div>
                <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full w-full"></div>
                </div>
            </div>
        </div>
    );
}