// app/auth/login/Form.tsx
"use client";

import { useState, useEffect, useRef } from "react";
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
  ArrowLeft,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingLink from "@/components/LoadingLink";
import { useAuthStore } from "@/store/authStore";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getErrorMessage } from "@/utils/errorUtils";
const loginSchema = z.object({
  email: z.string().email({ message: "يرجى إدخال بريد إلكتروني صالح" }),
  password: z
    .string()
    .min(8, { message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const REDIRECT_FALLBACK_DELAY_MS = 3000;

function isValidReturnUrl(url: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  return url.startsWith("/") && !url.startsWith("//") && !url.includes(":");
}

export default function LoginForm() {
  const router = useLoadingRouter();
  const pathname = usePathname();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [intendedDestination, setIntendedDestination] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingApproval, setPendingApproval] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!success || !intendedDestination || showVerification || pendingApproval) return;

    fallbackTimerRef.current = setTimeout(() => {
      if (pathname === "/auth/login") {
        setShowFallback(true);
      }
      fallbackTimerRef.current = null;
    }, REDIRECT_FALLBACK_DELAY_MS);

    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [success, intendedDestination, showVerification, pendingApproval, pathname]);
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
    setIntendedDestination(null);
    setShowFallback(false);
    setPendingApproval(false);

    try {
      const result = await login(data.email, data.password);

      if (result.success) {
        setSuccess("تم تسجيل الدخول بنجاح");
        const returnUrl = searchParams.get("returnUrl");
        const destination = isValidReturnUrl(returnUrl)
          ? returnUrl
          : (result.redirectTo || "/dashboard");
        setIntendedDestination(destination);
        router.push(destination);
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
      setError(getErrorMessage(error, "حدث خطأ أثناء تسجيل الدخول"));
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
      setError(getErrorMessage(error, "حدث خطأ أثناء التحقق من الكود"));
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  if (showVerification) {
    router.push("/verify-email");
    // return (
    //   <form onSubmit={handleVerifyCode} className="space-y-5 w-full">
    //     <div className="space-y-4">
    //       {error && (
    //         <Alert variant="destructive">
    //           <AlertCircle className="h-4 w-4" />
    //           <AlertDescription>{error}</AlertDescription>
    //         </Alert>
    //       )}

    //       {success && (
    //         <Alert variant="success">
    //           <CheckCircle2 className="h-4 w-4" />
    //           <AlertDescription>{success}</AlertDescription>
    //         </Alert>
    //       )}

    //       <div className="space-y-2">
    //         <Label htmlFor="verificationCode" className="text-foreground font-medium">
    //           رمز التحقق
    //         </Label>
    //         <Input
    //           id="verificationCode"
    //           type="text"
    //           value={verificationCode}
    //           onChange={(e) => setVerificationCode(e.target.value)}
    //           disabled={isLoading}
    //           dir="ltr"
    //         />
    //       </div>

    //       <Button
    //         type="submit"
    //         disabled={isLoading}
    //         className="w-full py-2.5"
    //       >
    //         {isLoading ? (
    //           <span className="flex items-center justify-center">
    //             <span className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
    //             جاري التحقق...
    //           </span>
    //         ) : (
    //           "تحقق من الرمز"
    //         )}
    //       </Button>

    //       <Button
    //         type="button"
    //         variant="outline"
    //         onClick={() => setShowVerification(false)}
    //         disabled={isLoading}
    //         className="w-full"
    //       >
    //         العودة للخلف
    //       </Button>
    //     </div>
    //   </form>
    // );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full">
      <div className="space-y-4">
        {error && !pendingApproval && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {pendingApproval && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <div className="mt-2 text-sm">
                <p>يمكنك التواصل مع الدعم الفني للاستفسار عن حالة حسابك.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              {success}
              {showFallback && intendedDestination && (
                <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                  <p className="text-sm text-foreground/80">
                    إذا لم يتم نقلك تلقائيًا، يمكنك المتابعة من هنا
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      router.replace(intendedDestination);
                      setShowFallback(false);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 ml-1" />
                    الانتقال إلى صفحتي
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground font-medium">
            البريد الإلكتروني
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-foreground/50" />
            </div>
            <Input
              id="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              disabled={isLoading}
              {...register("email")}
              className="pl-3 pr-10"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-foreground font-medium">
              كلمة المرور
            </Label>
            <LoadingLink
              href="/auth/forgot-password"
              className="text-sm text-primary hover:text-primary/80"
            >
              نسيت كلمة المرور؟
            </LoadingLink>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-foreground/50" />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              dir="ltr"
              autoComplete="current-password"
              disabled={isLoading}
              {...register("password")}
              className="pl-10 pr-10"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 left-3 flex items-center text-foreground/50 hover:text-primary"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
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
            className="h-4 w-4 text-primary border-border rounded focus:ring-primary bg-card"
          />
          <Label
            htmlFor="remember"
            className="text-sm text-foreground font-normal"
          >
            تذكرني
          </Label>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 active:scale-[0.98]"
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
      <div className="text-center text-sm text-foreground">
        ليس لديك حساب؟
        <LoadingLink
          href="/auth/register"
          className="text-primary hover:text-primary/80 font-medium mr-1"
        >
          إنشاء حساب جديد
        </LoadingLink>
      </div>
    </form>
  );
}
