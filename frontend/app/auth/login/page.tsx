"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn, AlertCircle, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
    const router = useRouter();
    const { login, verifyCode } = useAuthStore();

    // Form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<string>("");
    const [showPassword, setShowPassword] = useState(false);

    // Form submission states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Verification states
    const [showVerification, setShowVerification] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");

    // Check if user is already logged in
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            router.push("/dashboard");
        }
    }, [router]);

    // Handle login
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset states
        setError(null);
        setSuccess(null);

        // Validate form
        if (!email || !password) {
            setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
            return;
        }

        // Set submitting state
        setIsSubmitting(true);

        try {
            // Attempt login using our Zustand auth store
            const result = await login(email, password);

            if (result.success) {
                setSuccess("تم تسجيل الدخول بنجاح");

                // Get user data from the store
                const user = useAuthStore.getState().user;

                // Redirect based on user role
                if (user?.role === "admin") {
                    router.push("/admin/dashboard");
                } else if (user?.role === "dealer") {
                    router.push("/dealer/dashboard");
                } else if (user?.role === "auctioneer") {
                    router.push("/dashboard/auctioneer");
                } else if (user?.role === "control") {
                    router.push("/dashboard/control");
                } else {
                    router.push("/dashboard");
                }
            } else {
                if (result.needsVerification) {
                    setSuccess(
                        "يرجى إدخال رمز التحقق المرسل إلى بريدك الإلكتروني"
                    );
                    setShowVerification(true);
                } else {
                    setError(
                        result.error ||
                            "البريد الإلكتروني أو كلمة المرور غير صحيحة"
                    );
                }
            }
        } catch (err: any) {
            console.error("خطأ في تسجيل الدخول:", err);
            setError(
                err.message ||
                    "حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle verification code submission
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset states
        setError(null);
        setSuccess(null);

        // Validate form
        if (!verificationCode) {
            setError("يرجى إدخال رمز التحقق");
            return;
        }

        // Set submitting state
        setIsSubmitting(true);

        try {
            // Attempt verification using our Zustand auth store
            const result = await verifyCode(email, verificationCode);

            if (result.success) {
                setSuccess("تم التحقق بنجاح وتسجيل الدخول");

                // Redirect to the appropriate page
                if (result.redirectTo) {
                    router.push(result.redirectTo);
                } else {
                    router.push("/dashboard");
                }
            } else {
                setError(result.error || "رمز التحقق غير صحيح");
            }
        } catch (err: any) {
            console.error("خطأ في التحقق من الرمز:", err);
            setError(
                err.message ||
                    "حدث خطأ أثناء التحقق من الرمز، يرجى المحاولة مرة أخرى"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        تسجيل الدخول
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        واجهة خاصة بالمحرّجين وفريق الكنترول
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-800 flex items-start">
                            <AlertCircle className="h-5 w-5 mt-0.5 ml-2 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 rounded bg-green-50 border border-green-200 text-green-800 flex items-start">
                            <CheckCircle className="h-5 w-5 mt-0.5 ml-2 flex-shrink-0" />
                            <span>{success}</span>
                        </div>
                    )}

                    {!showVerification ? (
                        <form className="space-y-6" onSubmit={handleLogin}>
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    البريد الإلكتروني
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                        placeholder="example@dasm-platform.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    كلمة المرور
                                </label>
                                <div className="mt-1 relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 px-3 py-1.5 text-gray-500"
                                        onClick={togglePasswordVisibility}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="text-sm">
                                    <Link
                                        href="/auth/forgot-password"
                                        className="font-medium text-teal-600 hover:text-teal-500"
                                    >
                                        نسيت كلمة المرور؟
                                    </Link>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
                                        isSubmitting
                                            ? "opacity-70 cursor-not-allowed"
                                            : ""
                                    }`}
                                >
                                    <LogIn className="h-4 w-4 ml-2" />
                                    {isSubmitting
                                        ? "جاري تسجيل الدخول..."
                                        : "تسجيل الدخول"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form className="space-y-6" onSubmit={handleVerifyCode}>
                            <div>
                                <label
                                    htmlFor="verificationCode"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    رمز التحقق
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="verificationCode"
                                        name="verificationCode"
                                        type="text"
                                        required
                                        value={verificationCode}
                                        onChange={(e) =>
                                            setVerificationCode(e.target.value)
                                        }
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                        placeholder="أدخل رمز التحقق"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
                                        isSubmitting
                                            ? "opacity-70 cursor-not-allowed"
                                            : ""
                                    }`}
                                >
                                    {isSubmitting
                                        ? "جاري التحقق..."
                                        : "تحقق من الرمز"}
                                </button>
                            </div>

                            <div>
                                <button
                                    type="button"
                                    onClick={() => setShowVerification(false)}
                                    className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                                >
                                    العودة للخلف
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
