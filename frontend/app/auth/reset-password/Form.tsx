// app/auth/reset-password/Form.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import LoadingLink from "@/components/LoadingLink";
import axios from "axios";

interface ResetPasswordResponse {
  status: string;
  message: string;
}

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "كلمة المرور يجب أن تكون على الأقل 8 أحرف" }),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "كلمات المرور غير متطابقة",
    path: ["password_confirmation"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
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
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setError("رابط إعادة تعيين كلمة المرور غير صالح");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post<ResetPasswordResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reset-password`,
        {
          token,
          password: data.password,
          password_confirmation: data.password_confirmation,
        }
      );

      if (response.data.status === "success") {
        setSuccess(response.data.message);
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } else {
        setError(response.data.message || "فشل في إعادة تعيين كلمة المرور");
      }
    } catch (error: any) {
      setError(
        error.response?.data?.message || "حدث خطأ أثناء إعادة تعيين كلمة المرور"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <Alert
          variant="destructive"
          className="bg-red-900/30 border-red-800 text-red-200"
        >
          <AlertCircle className="h-4 w-4 text-red-300" />
          <AlertDescription>
            رابط إعادة تعيين كلمة المرور غير صالح
          </AlertDescription>
        </Alert>
        <div>
          <LoadingLink
            href="/auth/forgot-password"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            طلب رابط جديد
          </LoadingLink>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full">
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
          <Label htmlFor="password" className="text-gray-200 font-medium">
            كلمة المرور الجديدة
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-500" />
            </div>
            <Input
              id="password"
              type="password"
              dir="ltr"
              {...register("password")}
              disabled={isLoading}
              className="pl-3 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
          {errors.password && (
            <p className="text-sm text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="password_confirmation"
            className="text-gray-200 font-medium"
          >
            تأكيد كلمة المرور
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-500" />
            </div>
            <Input
              id="password_confirmation"
              type="password"
              dir="ltr"
              {...register("password_confirmation")}
              disabled={isLoading}
              className="pl-3 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
          {errors.password_confirmation && (
            <p className="text-sm text-red-400">
              {errors.password_confirmation.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 transition-all duration-200 active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <span className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
              جاري إعادة تعيين كلمة المرور...
            </span>
          ) : (
            "إعادة تعيين كلمة المرور"
          )}
        </Button>

        <div className="text-center text-sm text-gray-400">
          <LoadingLink
            href="/auth/login"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            العودة إلى تسجيل الدخول
          </LoadingLink>
        </div>
      </div>
    </form>
  );
}
