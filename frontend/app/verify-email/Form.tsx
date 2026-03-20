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

import api from "@/lib/axios";
import { isAxiosError } from "axios";

interface VerifyEmailResponse {
  status: string;
  message: string;
}

const verifyEmailSchema = z.object({
  email: z.string().email({ message: "يرجى إدخال بريد إلكتروني صالح" }),
});

type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

function friendlyErrorMessage(err: unknown, fallback: string): string {
  if (!isAxiosError(err)) return fallback;
  const status = err.response?.status;
  const data = err.response?.data as { message?: string } | undefined;
  if (typeof data?.message === "string" && data.message.trim() !== "") {
    const m = data.message;
    if (!/^Request failed with status code \d+/i.test(m)) return m;
  }
  if (status === 404) return "رابط التحقق غير صالح أو منتهٍ.";
  if (status === 422) return "البيانات المرسلة غير صالحة.";
  if (status && status >= 500) return "الخادم غير متاح مؤقتاً. حاول لاحقاً.";
  if (!err.response) return "تعذر الاتصال بالخادم. تحقق من الإنترنت.";
  if (err.code === "ECONNABORTED" || /timeout/i.test(err.message || "")) {
    return "انتهت مهلة الطلب. حاول مرة أخرى.";
  }
  return fallback;
}

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post<VerifyEmailResponse>("/api/verify-email", {
        token: verificationToken,
      });

      if (response.data.status === "success") {
        setSuccess(response.data.message);
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } else {
        setError(
          response.data.message || "فشل في التحقق من البريد الإلكتروني"
        );
      }
    } catch (err: unknown) {
      setError(
        friendlyErrorMessage(
          err,
          "حدث خطأ أثناء التحقق من البريد الإلكتروني"
        )
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
      const response = await api.post<VerifyEmailResponse>(
        "/api/resend-verification",
        {
          email: data.email,
        }
      );

      if (response.data.status === "success") {
        setSuccess(response.data.message);
      } else {
        setError(response.data.message || "فشل في إرسال بريد التحقق");
      }
    } catch (err: unknown) {
      setError(
        friendlyErrorMessage(err, "حدث خطأ أثناء إرسال بريد التحقق")
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
            className="bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-200 dark:border-red-900"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-200 dark:border-green-900">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {!token && (
          <>
            <div className="grid gap-2">
              <Label
                htmlFor="email"
                className="text-gray-700 dark:text-foreground/90 font-medium"
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
                  className="pr-10 pl-3 py-2 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-background dark:border-border"
                  placeholder="example@example.com"
                  {...register("email")}
                  disabled={isLoading}
                  dir="ltr"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
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
            <p className="mt-4 text-sm text-gray-600 dark:text-muted-foreground">
              جاري التحقق من البريد الإلكتروني...
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
