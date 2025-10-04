"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Save,
    X,
    Loader2,
    Shield,
    Eye,
    EyeOff,
    AlertTriangle,
    User,
    Mail,
    Phone,
    Key,
    CheckCircle,
    Clock,
    Settings,
    RefreshCw
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

interface ModeratorData {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    is_active: boolean;
    created_at: string;
    email_verified_at: string | null;
}

export default function EditModeratorPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const [moderator, setModerator] = useState<ModeratorData | null>(null);
    const [formData, setFormData] = useState<FormData>({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        fetchModeratorDetails();
    }, []);

    const fetchModeratorDetails = async () => {
        try {
            const response = await api.get(`/api/admin/moderators/${params.id}`);

            if (response.data && response.data.status === "success") {
                const moderatorData = response.data.data;
                setModerator(moderatorData);
                setFormData({
                    first_name: moderatorData.first_name,
                    last_name: moderatorData.last_name,
                    email: moderatorData.email,
                    phone: moderatorData.phone,
                    password: "",
                    password_confirmation: "",
                });
            }
        } catch (error: any) {
            console.error("Error fetching moderator details:", error);
            const errorMessage = error.response?.data?.message || "فشل في تحميل بيانات المشرف";
            toast.error(errorMessage);
            router.push("/admin/moderators");
        } finally {
            setInitialLoading(false);
        }
    };

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
        
        // Password is optional for editing, but if provided, must be validated
        if (formData.password) {
            if (formData.password.length < 8) {
                newErrors.password = ["كلمة المرور يجب أن تكون 8 أحرف على الأقل"];
            }
            
            if (formData.password !== formData.password_confirmation) {
                newErrors.password_confirmation = ["كلمة المرور وتأكيدها غير متطابقين"];
            }
        } else if (formData.password_confirmation) {
            newErrors.password = ["يرجى إدخال كلمة المرور"];
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
            // Prepare data for submission (exclude empty password)
            const submitData: any = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
            };

            // Only include password if provided
            if (formData.password) {
                submitData.password = formData.password;
                submitData.password_confirmation = formData.password_confirmation;
            }

            const response = await api.put(`/api/admin/moderators/${params.id}`, submitData);

            if (response.data && response.data.status === "success") {
                toast.success(response.data.message);
                router.push("/admin/moderators");
            }
        } catch (error: any) {
            console.error("Error updating moderator:", error);
            
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                toast.error("يرجى تصحيح الأخطاء في النموذج");
            } else {
                const errorMessage = error.response?.data?.message || "حدث خطأ أثناء تحديث بيانات المشرف";
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (moderator && (
            formData.first_name !== moderator.first_name ||
            formData.last_name !== moderator.last_name ||
            formData.email !== moderator.email ||
            formData.phone !== moderator.phone ||
            formData.password
        )) {
            if (confirm("هل أنت متأكد من إلغاء العملية؟ ستفقد جميع التغييرات غير المحفوظة.")) {
                router.push("/admin/moderators");
            }
        } else {
            router.push("/admin/moderators");
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "غير متوفر";
        const date = new Date(dateString);
        return date.toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
        });
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">جاري تحميل بيانات المشرف...</p>
                </div>
            </div>
        );
    }

    if (!moderator) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex flex-col items-center justify-center p-6">
                <AlertTriangle className="w-20 h-20 text-amber-500 mb-6" />
                <h1 className="text-2xl font-bold text-white mb-4 text-center">
                    لم يتم العثور على المشرف
                </h1>
                <p className="text-gray-400 mb-8 text-center">
                    المشرف المطلوب غير موجود أو تم حذفه
                </p>
                <Link
                    href="/admin/moderators"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center"
                >
                    <ArrowLeft className="w-5 h-5 ml-2" />
                    العودة إلى قائمة المشرفين
                </Link>
            </div>
        );
    }

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
                        تعديل بيانات المشرف
                    </h1>
                    <p className="text-gray-400 mt-2">
                        تحديث معلومات المشرف وإعدادات الحساب
                    </p>
                </div>

                <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
                    <Button
                        onClick={fetchModeratorDetails}
                        variant="outline"
                        className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300"
                    >
                        <RefreshCw className="w-4 h-4 ml-2" />
                        تحديث البيانات
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2">
                    {/* Moderator Info Card */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6 mb-6">
                        <div className="flex items-center space-x-4 space-x-reverse mb-6">
                            <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-3 rounded-xl">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {moderator.first_name} {moderator.last_name}
                                </h2>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                        <Shield className="w-3 h-3 ml-1" />
                                        مشرف
                                    </span>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                                        moderator.is_active 
                                            ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                                    }`}>
                                        {moderator.is_active ? (
                                            <>
                                                <CheckCircle className="w-3 h-3 ml-1" />
                                                نشط
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="w-3 h-3 ml-1" />
                                                غير نشط
                                            </>
                                        )}
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                        <User className="w-3 h-3 ml-1" />
                                        ID: {moderator.id}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-700/30 p-3 rounded-lg">
                                <div className="text-gray-400">تاريخ الإنشاء</div>
                                <div className="text-white">{formatDate(moderator.created_at)}</div>
                            </div>
                            <div className="bg-gray-700/30 p-3 rounded-lg">
                                <div className="text-gray-400">حالة البريد الإلكتروني</div>
                                <div className={`flex items-center ${moderator.email_verified_at ? 'text-green-400' : 'text-red-400'}`}>
                                    {moderator.email_verified_at ? (
                                        <>
                                            <CheckCircle className="w-3 h-3 ml-1" />
                                            مؤكد
                                        </>
                                    ) : (
                                        <>
                                            <Clock className="w-3 h-3 ml-1" />
                                            غير مؤكد
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white flex items-center">
                                <Settings className="w-5 h-5 ml-2 text-cyan-400" />
                                تعديل المعلومات الأساسية
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
                                    تغيير كلمة المرور (اختياري)
                                </h3>
                                
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-amber-400 flex items-center">
                                        <AlertTriangle className="w-4 h-4 ml-2" />
                                        اترك هذه الحقول فارغة إذا كنت لا تريد تغيير كلمة المرور
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Password */}
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-3">
                                            كلمة المرور الجديدة
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
                                                placeholder="أدخل كلمة المرور الجديدة"
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
                                        {formData.password && (
                                            <p className="mt-2 text-xs text-gray-400">
                                                يجب أن تكون كلمة المرور 8 أحرف على الأقل
                                            </p>
                                        )}
                                    </div>

                                    {/* Password Confirmation */}
                                    <div>
                                        <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-300 mb-3">
                                            تأكيد كلمة المرور الجديدة
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
                                                placeholder="أعد إدخال كلمة المرور الجديدة"
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
                                    تحديث البيانات
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">إجراءات سريعة</h3>
                        
                        <div className="space-y-3">
                            <Button 
                                variant="outline" 
                                className="w-full justify-start bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
                            >
                                <Mail className="w-4 h-4 ml-2" />
                                إرسال بريد إلكتروني
                            </Button>
                            
                            <Button 
                                variant="outline" 
                                className="w-full justify-start bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
                            >
                                <Shield className="w-4 h-4 ml-2" />
                                إدارة الصلاحيات
                            </Button>
                            
                            <Button 
                                variant="outline" 
                                className="w-full justify-start bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
                            >
                                <User className="w-4 h-4 ml-2" />
                                عرض النشاط
                            </Button>
                        </div>
                    </div>

                    {/* Form Tips */}
                    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20 shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-cyan-400 mb-4">نصائح مهمة</h3>
                        
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start space-x-2 space-x-reverse">
                                <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                <span className="text-cyan-300">الحقول المميزة بـ * إلزامية</span>
                            </div>
                            <div className="flex items-start space-x-2 space-x-reverse">
                                <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                <span className="text-cyan-300">كلمة المرور اختيارية للتعديل</span>
                            </div>
                            <div className="flex items-start space-x-2 space-x-reverse">
                                <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                <span className="text-cyan-300">سيتم إشعار المشرف بالتغييرات</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}