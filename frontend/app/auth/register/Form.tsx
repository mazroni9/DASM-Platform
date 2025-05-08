"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

interface RegisterResponse {
    status: string;
    message: string;
}

const registerSchema = z
    .object({
        first_name: z
            .string()
            .min(2, { message: "الاسم الأول يجب أن يكون على الأقل حرفين" }),
        last_name: z
            .string()
            .min(2, { message: "الاسم الأخير يجب أن يكون على الأقل حرفين" }),
        email: z.string().email({ message: "يرجى إدخال بريد إلكتروني صالح" }),
        phone: z.string().min(10, { message: "يرجى إدخال رقم هاتف صالح" }),
        password: z
            .string()
            .min(8, { message: "كلمة المرور يجب أن تكون على الأقل 8 أحرف" }),
        password_confirmation: z.string(),
        account_type: z.enum(["user", "dealer"]),
        company_name: z.string().optional(),
        commercial_registry: z.string().optional(),
        description: z.string().optional(),
    })
    .refine(
        (data) => {
            if (data.account_type === "dealer") {
                return !!data.company_name && !!data.commercial_registry;
            }
            return true;
        },
        {
            message: "يرجى إدخال معلومات الشركة",
            path: ["company_name"],
        }
    )
    .refine((data) => data.password === data.password_confirmation, {
        message: "كلمات المرور غير متطابقة",
        path: ["password_confirmation"],
    });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [accountType, setAccountType] = useState<"user" | "dealer">("user");

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

            // Check if the response contains a message that indicates success
            // This handles cases where the API returns status "error" but with a success message
            if (
                response.data.status === "success" ||
                (response.data.message &&
                    response.data.message.toLowerCase().includes("success"))
            ) {
                // Show success message
                setSuccess(
                    "تم التسجيل بنجاح، جاري التحويل إلى صفحة التحقق من البريد الإلكتروني"
                );

                // Redirect after a short delay
                setTimeout(() => {
                    router.push("/verify-email");
                }, 1500);
            } else {
                setError(response.data.message || "حدث خطأ أثناء التسجيل");
            }
        } catch (error: any) {
            // Check if the error response contains a success message
            if (
                error.response?.data?.message &&
                error.response.data.message.toLowerCase().includes("success")
            ) {
                setSuccess(
                    "تم التسجيل بنجاح، جاري التحويل إلى صفحة التحقق من البريد الإلكتروني"
                );

                setTimeout(() => {
                    router.push("/verify-email");
                }, 1500);
            } else {
                setError(
                    error.response?.data?.message || "حدث خطأ أثناء التسجيل"
                );
            }
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
                    <Alert
                        variant="success"
                        className="bg-green-50 text-green-700 border border-green-200"
                    >
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
                        onValueChange={(value: "user" | "dealer") => {
                            setAccountType(value);
                            setValue("account_type", value);
                        }}
                        defaultValue="user"
                    >
                        <SelectTrigger className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
                            <SelectValue placeholder="اختر نوع الحساب" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="user">مستخدم</SelectItem>
                            <SelectItem value="dealer">تاجر</SelectItem>
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
                                htmlFor="description"
                                className="text-gray-700 font-medium"
                            >
                                وصف الشركة
                            </Label>
                            <div className="relative">
                                <div className="absolute top-2 right-0 flex items-start pr-3 pointer-events-none">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                </div>
                                <Textarea
                                    id="description"
                                    className="pr-10 pl-3 py-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
                                    {...register("description")}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.description && (
                                <p className="text-sm text-red-500">
                                    {errors.description.message}
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
