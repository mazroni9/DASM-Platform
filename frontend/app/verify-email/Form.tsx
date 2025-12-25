"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import axios from "axios";

interface VerifyEmailResponse {
    status: string;
    message: string;
}

const verifyEmailSchema = z.object({
    email: z.string().email({ message: "يرجى إدخال بريد إلكتروني صالح" }),
});

type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

export default function VerifyEmailForm() {
    const router = useLoadingRouter();
    
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<VerifyEmailFormValues>({
        resolver: zodResolver(verifyEmailSchema),
    });

    useEffect(() => {
        if (token) {
            verifyEmail(token);
        }
    }, [token]);

    const verifyEmail = async (verificationToken: string) => {
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await axios.post<VerifyEmailResponse>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/verify-email`,
                {
                    token: verificationToken,
                }
            );

            if (response.data.status === "success") {
                setSuccess(response.data.message);
                setTimeout(() => {
                    router.push("/auth/login");
                }, 3000);
            } else {
                setError(
                    response.data.message ||
                        "فشل في التحقق من البريد الإلكتروني"
                );
            }
        } catch (error: any) {
            setError(
                error.response?.data?.message ||
                    "حدث خطأ أثناء التحقق من البريد الإلكتروني"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: VerifyEmailFormValues) => {
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await axios.post<VerifyEmailResponse>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/resend-verification`,
                {
                    email: data.email,
                }
            );

            if (response.data.status === "success") {
                setSuccess(response.data.message);
            } else {
                setError(response.data.message || "فشل في إرسال بريد التحقق");
            }
        } catch (error: any) {
            setError(
                error.response?.data?.message ||
                    "حدث خطأ أثناء إرسال بريد التحقق"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

                {!token && (
                    <>
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
                                    dir="ltr"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-sm text-red-500">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin ml-2"></div>
                                    جاري الإرسال...
                                </div>
                            ) : (
                                "إعادة إرسال بريد التحقق"
                            )}
                        </Button>
                    </>
                )}

                {token && isLoading && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-sm text-gray-600">
                            جاري التحقق من البريد الإلكتروني...
                        </p>
                    </div>
                )}
            </div>
        </form>
    );
}
