"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/app/contexts/AuthContext";
import {
    AlertCircle,
    CheckCircle2,
    Mail,
    Lock,
    Eye,
    EyeOff,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const loginSchema = z.object({
    email: z.string().email({ message: "يرجى إدخال بريد إلكتروني صالح" }),
    password: z
        .string()
        .min(8, { message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }),
    remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
    const router = useRouter();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            remember: false,
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await login(
                data.email,
                data.password,
                data.remember
            );

            if (response.success) {
                setSuccess("تم تسجيل الدخول بنجاح");
                router.push("/dashboard");
            } else {
                setError(
                    response.message ||
                        "فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك."
                );
            }
        } catch (error: any) {
            setError(error.message || "حدث خطأ أثناء تسجيل الدخول");
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4">
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
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

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
                            placeholder="example@example.com"
                            {...register("email")}
                            disabled={isLoading}
                            autoComplete="email"
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
                    <div className="flex items-center justify-between">
                        <Label
                            htmlFor="password"
                            className="text-gray-700 font-medium"
                        >
                            كلمة المرور
                        </Label>
                        <Link
                            href="/auth/forgot-password"
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                        >
                            نسيت كلمة المرور؟
                        </Link>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            className="pr-10 pl-10 py-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            {...register("password")}
                            disabled={isLoading}
                            autoComplete="current-password"
                            dir="ltr"
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 left-0 flex items-center px-3 cursor-pointer"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                                <Eye className="h-5 w-5 text-gray-400" />
                            )}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-sm text-red-500">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="remember"
                        {...register("remember")}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <Label
                        htmlFor="remember"
                        className="text-sm text-gray-600 font-normal"
                    >
                        تذكرني
                    </Label>
                </div>

                <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                            جاري تسجيل الدخول...
                        </div>
                    ) : (
                        "تسجيل الدخول"
                    )}
                </Button>
            </div>
        </form>
    );
}
