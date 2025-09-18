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

  

    if (!moderator) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    لم يتم العثور على المشرف
                </h1>
                <p className="text-gray-600 mb-6">
                    المشرف المطلوب غير موجود أو تم حذفه
                </p>
                <Link
                    href="/admin/moderators"
                    className="text-blue-600 hover:underline"
                >
                    <ArrowLeft className="w-4 h-4 inline ml-1" />
                    العودة إلى قائمة المشرفين
                </Link>
            </div>
        );
    }

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
                        تعديل بيانات المشرف
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <Shield className="w-8 h-8 text-orange-500" />
                </div>
            </div>

            {/* Moderator Info Summary */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                    <Shield className="w-5 h-5 text-orange-500 ml-2" />
                    <div>
                        <h3 className="text-sm font-medium text-orange-800">
                            تعديل بيانات: {moderator.first_name} {moderator.last_name}
                        </h3>
                        <p className="text-sm text-orange-700">
                            تاريخ الإنشاء: {new Date(moderator.created_at).toLocaleDateString("ar-SA")}
                            {moderator.is_active ? " • نشط" : " • غير نشط"}
                        </p>
                    </div>
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

                    {/* Password Section */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            تغيير كلمة المرور (اختياري)
                        </h3>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-amber-700">
                                اترك هذه الحقول فارغة إذا كنت لا تريدين تغيير كلمة المرور
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    كلمة المرور الجديدة
                                </label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`w-full pl-10 ${errors.password ? 'border-red-500' : ''}`}
                                        placeholder="أدخل كلمة المرور الجديدة"
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
                                {formData.password && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        يجب أن تكون كلمة المرور 8 أحرف على الأقل
                                    </p>
                                )}
                            </div>

                            {/* Password Confirmation */}
                            <div>
                                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                                    تأكيد كلمة المرور الجديدة
                                </label>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type={showPasswordConfirmation ? "text" : "password"}
                                        value={formData.password_confirmation}
                                        onChange={handleInputChange}
                                        className={`w-full pl-10 ${errors.password_confirmation ? 'border-red-500' : ''}`}
                                        placeholder="أعد إدخال كلمة المرور الجديدة"
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
                            تحديث البيانات
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
