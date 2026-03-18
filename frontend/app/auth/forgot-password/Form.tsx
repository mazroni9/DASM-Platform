// app/auth/forgot-password/Form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';
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
              {...register('email')}
              disabled={isLoading}
              className="pl-3 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-400">{errors.email.message}</p>
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
              جاري الإرسال...
            </span>
          ) : (
            "إرسال رابط إعادة تعيين كلمة المرور"
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