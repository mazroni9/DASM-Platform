// app/auth/login/Form.tsx
"use client";

import { useState } from "react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingLink from "@/components/LoadingLink";
import { useAuthStore } from "@/store/authStore";

const loginSchema = z.object({
  email: z.string().email({ message: "يرجى إدخال بريد إلكتروني صالح" }),
  password: z
    .string()
    .min(8, { message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useLoadingRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingApproval, setPendingApproval] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      remember: false,
    },
  });

  const emailValue = watch("email");

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError("");
    setSuccess("");
    setPendingApproval(false);

    try {
      const result = await login(data.email, data.password);

      if (result.success) {
        setSuccess("تم تسجيل الدخول بنجاح");
        router.push("/dashboard");
      } else {
        if (result.needsVerification) {
          setSuccess("يرجى إدخال رمز التحقق المرسل إلى بريدك الإلكتروني");
          setShowVerification(true);
        } else if (result.pendingApproval) {
          setPendingApproval(true);
          setError(result.error || "حسابك في انتظار موافقة المسؤول");
        } else {
          setError(
            result.error ||
              "فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك."
          );
        }
      }
    } catch (error: any) {
      setError(error.message || "حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await useAuthStore
        .getState()
        .verifyCode(emailValue, verificationCode);

      if (result.success) {
        setSuccess("تم التحقق بنجاح وتسجيل الدخول");
        router.push("/dashboard");
      } else {
        setError(result.error || "فشل التحقق من الكود");
      }
    } catch (error: any) {
      setError(error.message || "حدث خطأ أثناء التحقق من الكود");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  if (showVerification) {
    return (
      <form onSubmit={handleVerifyCode} className="space-y-5 w-full">
        <div className="space-y-4">
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-900/30 border-red-800 text-red-200"
            >
              <AlertCircle className="h-4 w-4 text-red-300" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-emerald-900/30 border-emerald-800 text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="verificationCode" className="text-gray-200 font-medium">
              رمز التحقق
            </Label>
            <Input
              id="verificationCode"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              disabled={isLoading}
              dir="ltr"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 transition-all duration-200"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
                جاري التحقق...
              </span>
            ) : (
              "تحقق من الرمز"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowVerification(false)}
            disabled={isLoading}
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            العودة للخلف
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full">
      <div className="space-y-4">
        {error && !pendingApproval && (
          <Alert
            variant="destructive"
            className="bg-red-900/30 border-red-800 text-red-200"
          >
            <AlertCircle className="h-4 w-4 text-red-300" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {pendingApproval && (
          <Alert className="bg-amber-900/30 border-amber-800 text-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            <AlertDescription>
              {error}
              <div className="mt-2 text-sm">
                <p>يمكنك التواصل مع الدعم الفني للاستفسار عن حالة حسابك.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-emerald-900/30 border-emerald-800 text-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-200 font-medium">
            البريد الإلكتروني
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-500" />
            </div>
            <Input
              id="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              disabled={isLoading}
              {...register("email")}
              className="pl-3 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-gray-200 font-medium">
              كلمة المرور
            </Label>
            <LoadingLink
              href="/auth/forgot-password"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              نسيت كلمة المرور؟
            </LoadingLink>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-500" />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              dir="ltr"
              autoComplete="current-password"
              disabled={isLoading}
              {...register("password")}
              className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 left-3 flex items-center text-gray-500 hover:text-blue-400"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-reverse space-x-2 rtl:space-x-reverse">
          <input
            type="checkbox"
            id="remember"
            {...register("remember")}
            className="h-4 w-4 text-blue-500 border-gray-600 rounded focus:ring-blue-500 bg-gray-800"
          />
          <Label htmlFor="remember" className="text-sm text-gray-300 font-normal">
            تذكرني
          </Label>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 transition-all duration-200 active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <span className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
              جاري تسجيل الدخول...
            </span>
          ) : (
            "تسجيل الدخول"
          )}
        </Button>
      </div>

      <div className="text-center text-sm text-gray-400">
        ليس لديك حساب؟{" "}
        <LoadingLink
          href="/auth/register"
          className="text-blue-400 hover:text-blue-300 font-medium"
        >
          إنشاء حساب جديد
        </LoadingLink>
      </div>
    </form>
  );
}