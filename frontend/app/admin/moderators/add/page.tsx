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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/moderators"
                        className="text-blue-600 hover:text-blue-800"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">
                        إضافة مشرف جديد
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <Shield className="w-8 h-8 text-orange-500" />
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg shadow border p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First Name */}
                        <div>
                            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                                الاسم الأول *
                            </label>
                            <Input
                                id="first_name"
                                name="first_name"
                                type="text"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                className={`w-full ${errors.first_name ? 'border-red-500' : ''}`}
                                placeholder="أدخل الاسم الأول"
                                disabled={loading}
                            />
                            {errors.first_name && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.first_name[0]}
                                </p>
                            )}
                        </div>

                        {/* Last Name */}
                        <div>
                            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                                الاسم الأخير *
                            </label>
                            <Input
                                id="last_name"
                                name="last_name"
                                type="text"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                className={`w-full ${errors.last_name ? 'border-red-500' : ''}`}
                                placeholder="أدخل الاسم الأخير"
                                disabled={loading}
                            />
                            {errors.last_name && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.last_name[0]}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                البريد الإلكتروني *
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={`w-full ${errors.email ? 'border-red-500' : ''}`}
                                placeholder="أدخل البريد الإلكتروني"
                                disabled={loading}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.email[0]}
                                </p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                رقم الهاتف *
                            </label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className={`w-full ${errors.phone ? 'border-red-500' : ''}`}
                                placeholder="أدخل رقم الهاتف"
                                disabled={loading}
                            />
                            {errors.phone && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.phone[0]}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                كلمة المرور *
                            </label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`w-full pl-10 ${errors.password ? 'border-red-500' : ''}`}
                                    placeholder="أدخل كلمة المرور"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.password[0]}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                يجب أن تكون كلمة المرور 8 أحرف على الأقل
                            </p>
                        </div>

                        {/* Password Confirmation */}
                        <div>
                            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                                تأكيد كلمة المرور *
                            </label>
                            <div className="relative">
                                <Input
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type={showPasswordConfirmation ? "text" : "password"}
                                    value={formData.password_confirmation}
                                    onChange={handleInputChange}
                                    className={`w-full pl-10 ${errors.password_confirmation ? 'border-red-500' : ''}`}
                                    placeholder="أعد إدخال كلمة المرور"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPasswordConfirmation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password_confirmation && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.password_confirmation[0]}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-4 space-x-reverse pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            <X className="w-4 h-4 ml-2" />
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 ml-2" />
                            )}
                            حفظ المشرف
                        </Button>
                    </div>
                </form>
            </div>

            {/* Help Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                    <Shield className="w-5 h-5 text-blue-400 mt-0.5 ml-2" />
                    <div>
                        <h3 className="text-sm font-medium text-blue-800">
                            معلومات هامة حول المشرفين
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc list-inside space-y-1">
                                <li>سيكون للمشرف صلاحيات إدارة المزادات والإشراف عليها</li>
                                <li>سيتم تفعيل الحساب تلقائياً وتأكيد البريد الإلكتروني</li>
                                <li>يمكن تعديل بيانات المشرف لاحقاً من قائمة المشرفين</li>
                                <li>تأكد من صحة البيانات قبل الحفظ</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
