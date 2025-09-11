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
import LoadingLink from "@/components/LoadingLink";
import axios from 'axios';

interface ForgotPasswordResponse {
  status: string;
  message: string;
}

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'يرجى إدخال بريد إلكتروني صالح' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post<ForgotPasswordResponse>(`${process.env.NEXT_PUBLIC_API_URL}/api/forgot-password`, {
        email: data.email,
      });

      if (response.data.status === 'success') {
        setSuccess(response.data.message);
      } else {
        setError(response.data.message || 'فشل في إرسال رابط إعادة تعيين كلمة المرور');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء إرسال رابط إعادة تعيين كلمة المرور');
    } finally {
      setIsLoading(false);
    }
  };

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
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'جاري الإرسال...' : 'إرسال رابط إعادة تعيين كلمة المرور'}
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