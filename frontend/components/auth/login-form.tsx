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

    // Get login function from the auth store
    const { login } = useAuthStore();

    // Check if user is already logged in
    useEffect(() => {
        const token = localStorage.getItem("token");
        // Don't automatically redirect if token exists, let the role-based redirection handle it
        if (token) {
            const authState = useAuthStore.getState();
            // Only redirect if not already logged in (to avoid overriding role-based redirects)
            if (!authState.isLoggedIn) {
                authState.initializeFromStorage().then((success) => {
                    if (success) {
                        const user = authState.user;
                        console.log("User role from storage:", user?.role);
                        if (user?.role === "admin") {
                            router.push("/admin");
                        } else if (user?.role === "dealer") {
                            router.push("/dealer/dashboard");
                        } else if (user?.role === "moderator") {
                            router.push("/moderator");
                        } else {
                            router.push("/dashboard");
                        }
                    }
                });
            }
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
            console.log(result);
            if (result.success) {
                toast.success("تم تسجيل الدخول بنجاح");
                // Get the user role and redirect accordingly
                router.push(result.redirectTo);
            } else {
                if (result.needsVerification) {
                    toast.error(
                        "يرجى التحقق من بريدك الإلكتروني أولاً لتفعيل حسابك"
                    );
                    // Redirect to verification page where user can resend verification email
                    router.push("/verify-email");
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

    return (
        <div className="grid gap-6">
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
