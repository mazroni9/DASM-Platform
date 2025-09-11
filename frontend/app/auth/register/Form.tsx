"use client";

import { useState } from "react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";
import {
    AlertCircle,
    User,
    Mail,
    Phone,
    Lock,
    Building,
    FileText,
    ClipboardList,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import Link from "next/link";
import { UserRole } from "@/types/types";

interface RegisterResponse {
    status: string;
    message: string;
}

const registerSchema = z
    .object({
        first_name: z
            .string()
            .min(2, { message: "الاسم الأول يجب أن يكون على الأقل حرفين" })
            .max(50, { message: "الاسم الأول يجب ألا يتجاوز 50 حرفًا" })
            .refine((value) => /^[\u0600-\u06FFa-zA-Z\s]+$/.test(value), {
                message: "الاسم الأول يجب أن يحتوي على أحرف فقط",
            }),
        last_name: z
            .string()
            .min(2, { message: "الاسم الأخير يجب أن يكون على الأقل حرفين" })
            .max(50, { message: "الاسم الأخير يجب ألا يتجاوز 50 حرفًا" })
            .refine((value) => /^[\u0600-\u06FFa-zA-Z\s]+$/.test(value), {
                message: "الاسم الأخير يجب أن يحتوي على أحرف فقط",
            }),
        email: z
            .string()
            .email({ message: "يرجى إدخال بريد إلكتروني صالح" })
            .refine((value) => value.includes("@") && value.includes("."), {
                message: "يرجى إدخال بريد إلكتروني صالح مع وجود @ ونقطة",
            }),
        phone: z
            .string()
            .min(10, {
                message: "يرجى إدخال رقم هاتف صالح (10 أرقام على الأقل)",
            })
            .max(15, { message: "رقم الهاتف لا يجب أن يتجاوز 15 رقم" })
            .refine((value) => /^[0-9+\s]+$/.test(value), {
                message: "رقم الهاتف يجب أن يحتوي على أرقام فقط",
            }),
        password: z
            .string()
            .min(8, { message: "كلمة المرور يجب أن تكون على الأقل 8 أحرف" })
            .max(72, { message: "كلمة المرور يجب ألا تتجاوز 72 حرفًا" })
            .refine((value) => /[A-Z]/.test(value), {
                message: "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل",
            })
            .refine((value) => /[0-9]/.test(value), {
                message: "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل",
            })
            .refine((value) => /[^A-Za-z0-9]/.test(value), {
                message: "كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل",
            }),
        password_confirmation: z.string(),
        account_type: z.enum(["user", "dealer", "venue_owner", "investor"]),
        company_name: z.string().optional(),
        commercial_registry: z.string().optional(),
        vat_number: z.string().optional(),
    })
    .refine(
        (data) => {
            if (data.account_type === "dealer" || data.account_type === "venue_owner" || data.account_type === "investor") {
                return !!data.company_name && data.company_name.length >= 3;
            }
            return true;
        },
        {
            message: "اسم الشركة/المعرض مطلوب ويجب أن يكون 3 أحرف على الأقل",
            path: ["company_name"],
        }
    )
    .refine(
        (data) => {
            if (data.account_type === "dealer" || data.account_type === "venue_owner" || data.account_type === "investor") {
                return (
                    !!data.commercial_registry &&
                    data.commercial_registry.length >= 5
                );
            }
            return true;
        },
        {
            message: "رقم السجل التجاري مطلوب ويجب أن يكون 5 أحرف على الأقل",
            path: ["commercial_registry"],
        }
    )
    .refine((data) => data.password === data.password_confirmation, {
        message: "كلمات المرور غير متطابقة",
        path: ["password_confirmation"],
    });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
    const router = useLoadingRouter();
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [accountType, setAccountType] = useState<"user" | "dealer" | "venue_owner" | "investor">("user");

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            account_type: "user",
        },
    });

    const onSubmit = async (data: RegisterFormValues) => {
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await axios.post<RegisterResponse>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/register`,
                data
            );

            // Check if the response indicates success
            if (response.data.status === "success") {
                setSuccess(
                    "تم التسجيل بنجاح، جاري التحويل إلى صفحة التحقق من البريد الإلكتروني"
                );

                // Redirect after a short delay
                setTimeout(() => {
                    router.push("/verify-email");
                }, 1500);
            } else {
                // Handle unexpected response format
                setError(response.data.message || "حدث خطأ أثناء التسجيل");
            }
        } catch (error: any) {
            // Log detailed error in development only
            if (process.env.NODE_ENV !== "production") {
                console.error("Registration error details:", error);
            }

            let errorMessage = "حدث خطأ أثناء التسجيل، يرجى المحاولة مرة أخرى";

            if (error.response?.data) {
                const errorData = error.response.data;

                // Check if this is a successful registration despite the error response
                if (
                    errorData.status === "success" ||
                    (errorData.message && errorData.message.includes("بنجاح"))
                ) {
                    setSuccess(
                        "تم التسجيل بنجاح، جاري التحويل إلى صفحة التحقق من البريد الإلكتروني"
                    );
                    setTimeout(() => {
                        router.push("/verify-email");
                    }, 1500);
                    return;
                }

                // Handle validation errors with specific field messages
                if (error.response?.status === 422 && errorData.errors) {
                    const errors = errorData.errors;

                    // Priority order for displaying errors
                    const errorPriority = [
                        "email",
                        "phone",
                        "first_name",
                        "last_name",
                        "password",
                        "company_name",
                        "commercial_registry",
                    ];

                    for (const field of errorPriority) {
                        if (errors[field] && errors[field].length > 0) {
                            errorMessage = errors[field][0]; // Get the first error for this field
                            break;
                        }
                    }

                    // If no priority field has errors, use the first available error
                    if (
                        errorMessage ===
                        "حدث خطأ أثناء التسجيل، يرجى المحاولة مرة أخرى"
                    ) {
                        const firstField = Object.keys(errors)[0];
                        if (firstField && errors[firstField].length > 0) {
                            errorMessage = errors[firstField][0];
                        }
                    }
                }
                // Handle direct message errors
                else if (errorData.message) {
                    errorMessage = errorData.message;
                }
                // Handle first_error field if available
                else if (errorData.first_error) {
                    errorMessage = errorData.first_error;
                }
                // Handle legacy error format
                else if (errorData.error) {
                    errorMessage = errorData.error;
                }

                // Network-related error handling
                if (error.response?.status === 500) {
                    errorMessage =
                        "خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقًا.";
                } else if (error.response?.status === 429) {
                    errorMessage =
                        "تم تجاوز حد المحاولات. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.";
                }
            } else if (error.request) {
                // Network error - no response received
                errorMessage =
                    "لا يمكن الوصول إلى الخادم. يرجى التحقق من اتصالك بالإنترنت.";
            } else if (error.code === "ECONNABORTED") {
                // Request timeout
                errorMessage = "انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.";
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6">
                {error && (
                    <Alert
                        variant="destructive"
                        className="bg-red-50 text-red-700 border border-red-200"
                    >
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="bg-green-50 text-green-700 border border-green-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-2">
                    <Label
                        htmlFor="first_name"
                        className="text-gray-700 font-medium"
                    >
                        الاسم الأول
                    </Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                            id="first_name"
                            className="pr-10 pl-3 py-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            {...register("first_name")}
                            disabled={isLoading}
                        />
                    </div>
                    {errors.first_name && (
                        <p className="text-sm text-red-500">
                            {errors.first_name.message}
                        </p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label
                        htmlFor="last_name"
                        className="text-gray-700 font-medium"
                    >
                        الاسم الأخير
                    </Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                            id="last_name"
                            className="pr-10 pl-3 py-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            {...register("last_name")}
                            disabled={isLoading}
                        />
                    </div>
                    {errors.last_name && (
                        <p className="text-sm text-red-500">
                            {errors.last_name.message}
                        </p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label
                        htmlFor="email"
                        className="text-gray-700 font-medium"
                    >
                        البريد الإلكتروني
                    </Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                            id="email"
                            type="email"
                            className="pr-10 pl-3 py-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            {...register("email")}
                            disabled={isLoading}
                            dir="ltr"
                        />
                    </div>
                    {errors.email && (
                        <p className="text-sm text-red-500">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label
                        htmlFor="phone"
                        className="text-gray-700 font-medium"
                    >
                        رقم الهاتف
                    </Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                            id="phone"
                            type="tel"
                            className="pr-10 pl-3 py-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            {...register("phone")}
                            disabled={isLoading}
                            dir="ltr"
                        />
                    </div>
                    {errors.phone && (
                        <p className="text-sm text-red-500">
                            {errors.phone.message}
                        </p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label
                        htmlFor="password"
                        className="text-gray-700 font-medium"
                    >
                        كلمة المرور
                    </Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                            id="password"
                            type="password"
                            className="pr-10 pl-3 py-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            {...register("password")}
                            disabled={isLoading}
                            dir="ltr"
                        />
                    </div>
                    {errors.password && (
                        <p className="text-sm text-red-500">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label
                        htmlFor="password_confirmation"
                        className="text-gray-700 font-medium"
                    >
                        تأكيد كلمة المرور
                    </Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                            id="password_confirmation"
                            type="password"
                            className="pr-10 pl-3 py-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            {...register("password_confirmation")}
                            disabled={isLoading}
                            dir="ltr"
                        />
                    </div>
                    {errors.password_confirmation && (
                        <p className="text-sm text-red-500">
                            {errors.password_confirmation.message}
                        </p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label
                        htmlFor="account_type"
                        className="text-gray-700 font-medium"
                    >
                        نوع الحساب
                    </Label>
                    <Select
                        onValueChange={(value: "user" | "dealer" | "venue_owner" | "investor") => {
                            setAccountType(value);
                            setValue("account_type", value);
                        }}
                        defaultValue="user"
                    >
                        <SelectTrigger className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
                            <SelectValue placeholder="اختر نوع الحساب" />
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-white">
                            <SelectItem value="user">مستخدم</SelectItem>
                            <SelectItem value="dealer">تاجر</SelectItem>
                            <SelectItem value="venue_owner">مالك المعرض</SelectItem>
                            <SelectItem value="investor">مستثمر</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {accountType === "dealer" && (
                    <>
                        <div className="grid gap-2">
                            <Label
                                htmlFor="company_name"
                                className="text-gray-700 font-medium"
                            >
                                اسم الشركة
                            </Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <Building className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    id="company_name"
                                    className="pr-10 pl-3 py-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    {...register("company_name")}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.company_name && (
                                <p className="text-sm text-red-500">
                                    {errors.company_name.message}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label
                                htmlFor="commercial_registry"
                                className="text-gray-700 font-medium"
                            >
                                السجل التجاري
                            </Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <ClipboardList className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    id="commercial_registry"
                                    className="pr-10 pl-3 py-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    {...register("commercial_registry")}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.commercial_registry && (
                                <p className="text-sm text-red-500">
                                    {errors.commercial_registry.message}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label
                                htmlFor="vat_number"
                                className="text-gray-700 font-medium"
                            >
                                رقم ضريبة القيمة المضافة (اختياري)
                            </Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    id="vat_number"
                                    className="pr-10 pl-3 py-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    {...register("vat_number")}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.vat_number && (
                                <p className="text-sm text-red-500">
                                    {errors.vat_number.message}
                                </p>
                            )}
                        </div>
                    </>
                )}

                {accountType === "venue_owner" && (
                    <>
                        <div className="grid gap-2">
                            <Label
                                htmlFor="company_name"
                                className="text-gray-700 font-medium"
                            >
                                اسم المعرض
                            </Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <Building className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    id="company_name"
                                    className="pr-10 pl-3 py-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    {...register("company_name")}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.company_name && (
                                <p className="text-sm text-red-500">
                                    {errors.company_name.message}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label
                                htmlFor="commercial_registry"
                                className="text-gray-700 font-medium"
                            >
                                السجل التجاري
                            </Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <ClipboardList className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    id="commercial_registry"
                                    className="pr-10 pl-3 py-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    {...register("commercial_registry")}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.commercial_registry && (
                                <p className="text-sm text-red-500">
                                    {errors.commercial_registry.message}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label
                                htmlFor="vat_number"
                                className="text-gray-700 font-medium"
                            >
                                رقم ضريبة القيمة المضافة (اختياري)
                            </Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    id="vat_number"
                                    className="pr-10 pl-3 py-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    {...register("vat_number")}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.vat_number && (
                                <p className="text-sm text-red-500">
                                    {errors.vat_number.message}
                                </p>
                            )}
                        </div>
                    </>
                )}

                {accountType === "investor" && (
                    <>
                        <div className="grid gap-2">
                            <Label
                                htmlFor="company_name"
                                className="text-gray-700 font-medium"
                            >
                                اسم الشركة الاستثمارية
                            </Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <Building className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    id="company_name"
                                    className="pr-10 pl-3 py-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    {...register("company_name")}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.company_name && (
                                <p className="text-sm text-red-500">
                                    {errors.company_name.message}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label
                                htmlFor="commercial_registry"
                                className="text-gray-700 font-medium"
                            >
                                السجل التجاري
                            </Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <ClipboardList className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    id="commercial_registry"
                                    className="pr-10 pl-3 py-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    {...register("commercial_registry")}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.commercial_registry && (
                                <p className="text-sm text-red-500">
                                    {errors.commercial_registry.message}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label
                                htmlFor="vat_number"
                                className="text-gray-700 font-medium"
                            >
                                رقم ضريبة القيمة المضافة (اختياري)
                            </Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    id="vat_number"
                                    className="pr-10 pl-3 py-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    {...register("vat_number")}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.vat_number && (
                                <p className="text-sm text-red-500">
                                    {errors.vat_number.message}
                                </p>
                            )}
                        </div>
                    </>
                )}

                <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin ml-2"></div>
                            جاري التسجيل...
                        </div>
                    ) : (
                        "إنشاء حساب"
                    )}
                </Button>
            </div>
        </form>
    );
}
