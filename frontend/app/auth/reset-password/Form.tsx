'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSearchParams } from 'next/navigation';
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import LoadingLink from "@/components/LoadingLink";
import axios from 'axios';

interface ResetPasswordResponse {
  status: string;
  message: string;
}

const resetPasswordSchema = z.object({
  password: z.string().min(8, { message: 'كلمة المرور يجب أن تكون على الأقل 8 أحرف' }),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'كلمات المرور غير متطابقة',
  path: ['password_confirmation'],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
  const router = useLoadingRouter();
  
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setError('رابط إعادة تعيين كلمة المرور غير صالح');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post<ResetPasswordResponse>(`${process.env.NEXT_PUBLIC_API_URL}/api/reset-password`, {
        token,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });

      if (response.data.status === 'success') {
        setSuccess(response.data.message);
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setError(response.data.message || 'فشل في إعادة تعيين كلمة المرور');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>رابط إعادة تعيين كلمة المرور غير صالح</AlertDescription>
        </Alert>
        <div className="mt-4">
          <LoadingLink href="/auth/forgot-password" className="text-primary hover:underline">
            طلب رابط جديد
          </LoadingLink>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-2">
          <Label htmlFor="password">كلمة المرور الجديدة</Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password_confirmation">تأكيد كلمة المرور</Label>
          <Input
            id="password_confirmation"
            type="password"
            {...register('password_confirmation')}
            disabled={isLoading}
          />
          {errors.password_confirmation && (
            <p className="text-sm text-red-500">{errors.password_confirmation.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'جاري إعادة تعيين كلمة المرور...' : 'إعادة تعيين كلمة المرور'}
        </Button>

        <div className="text-center text-sm">
          <LoadingLink href="/auth/login" className="text-primary hover:underline">
            العودة إلى تسجيل الدخول
          </LoadingLink>
        </div>
      </div>
    </form>
  );
} 