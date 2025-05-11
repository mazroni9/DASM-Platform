"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

export function LoginForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [showVerification, setShowVerification] = useState(false);

    // Get login and verifyCode functions from the auth store
    const { login, verifyCode } = useAuthStore();

    // Check if user is already logged in
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            router.push("/dashboard");
        }
    }, [router]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        if (!email || !password) {
            toast.error("يرجى إدخال البريد الإلكتروني وكلمة المرور");
            setIsLoading(false);
            return;
        }

        try {
            const result = await login(email, password);

            if (result.success) {
                toast.success("تم تسجيل الدخول بنجاح");
                // Redirect based on user role
                const user = useAuthStore.getState().user;
                if (user?.role === "admin") {
                    router.push("/admin/dashboard");
                } else if (user?.role === "dealer") {
                    router.push("/dealer/dashboard");
                } else {
                    router.push("/dashboard");
                }
            } else {
                if (result.needsVerification) {
                    toast.success(
                        "يرجى إدخال رمز التحقق المرسل إلى بريدك الإلكتروني"
                    );
                    setShowVerification(true);
                } else {
                    toast.error(result.error || "حدث خطأ أثناء تسجيل الدخول");
                }
            }
        } catch (error) {
            console.error("خطأ في تسجيل الدخول:", error);
            toast.error("حدث خطأ أثناء تسجيل الدخول");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleVerifyCode(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await verifyCode(email, verificationCode);

            if (result.success) {
                toast.success("تم التحقق بنجاح وتسجيل الدخول");
                if (result.redirectTo) {
                    router.push(result.redirectTo);
                } else {
                    router.push("/dashboard");
                }
            } else {
                toast.error(result.error || "فشل التحقق من الكود");
            }
        } catch (error) {
            console.error("خطأ في التحقق من الكود:", error);
            toast.error("حدث خطأ أثناء التحقق من الكود");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="grid gap-6">
            {!showVerification ? (
                <form onSubmit={onSubmit}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">البريد الإلكتروني</Label>
                            <Input
                                id="email"
                                placeholder="name@example.com"
                                type="email"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                disabled={isLoading}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">كلمة المرور</Label>
                            <Input
                                id="password"
                                placeholder="********"
                                type="password"
                                autoCapitalize="none"
                                autoComplete="current-password"
                                disabled={isLoading}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <Button disabled={isLoading}>
                            {isLoading && (
                                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            تسجيل الدخول
                        </Button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleVerifyCode}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="verificationCode">رمز التحقق</Label>
                            <Input
                                id="verificationCode"
                                placeholder="أدخل الرمز المرسل"
                                type="text"
                                disabled={isLoading}
                                value={verificationCode}
                                onChange={(e) =>
                                    setVerificationCode(e.target.value)
                                }
                            />
                        </div>

                        <Button disabled={isLoading}>
                            {isLoading && (
                                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            تحقق
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowVerification(false)}
                            disabled={isLoading}
                        >
                            العودة
                        </Button>
                    </div>
                </form>
            )}

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        أو
                    </span>
                </div>
            </div>

            <div className="text-center">
                <Link
                    href="/auth/register"
                    className="text-sm text-blue-600 hover:underline"
                >
                    ليس لديك حساب؟ سجل الآن
                </Link>
            </div>
        </div>
    );
}
