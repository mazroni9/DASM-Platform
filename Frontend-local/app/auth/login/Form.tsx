'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email({ message: 'يرجى إدخال بريد إلكتروني صالح' }),
  password: z.string().min(8, { message: 'كلمة المرور يجب أن تكون على الأقل 8 أحرف' }),
  verificationCode: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isRegistered, setIsRegistered] = useState(true);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      verificationCode: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/login`, data);

      if (response.data.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        if (response.data.needsVerification) {
          setNeedsVerification(true);
          setMessage(response.data.message || '');
        }

        if (response.data.isRegistered === false) {
          setIsRegistered(false);
        }

        if (response.data.error) {
          setError(response.data.error);
        }
      }
    } catch (error: any) {
      if (error.response?.data?.needsVerification) {
        setNeedsVerification(true);
        setMessage(error.response?.data?.message || '');
      }
      if (error.response?.data?.isRegistered === false) {
        setIsRegistered(false);
      }
      setError(error.response?.data?.error || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const emailInput = (document.getElementById('email') as HTMLInputElement)?.value;
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/resend-verification`, { email: emailInput });

      if (response.data.success) {
        setMessage('تم إرسال رمز التحقق مرة أخرى');
      } else {
        setError(response.data.error || 'فشل في إرسال رمز التحقق');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'حدث خطأ أثناء إرسال رمز التحقق');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 rounded-xl border bg-white shadow-sm">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-1">مرحباً بعودتك</h1>
        <p className="text-sm text-muted-foreground">أدخل بريدك وكلمة المرور لتسجيل الدخول</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" placeholder="name@example.com" type="email" autoComplete="email" disabled={isLoading} {...register('email')} />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <Input id="password" placeholder="********" type="password" autoComplete="password" disabled={isLoading} {...register('password')} />
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        {needsVerification && (
          <div className="grid gap-2">
            <Label htmlFor="verificationCode">رمز التحقق</Label>
            <Input id="verificationCode" placeholder="123456" type="text" disabled={isLoading} {...register('verificationCode')} />
            <Button variant="link" size="sm" type="button" onClick={handleResendCode} disabled={isLoading}>
              إعادة إرسال الرمز
            </Button>
          </div>
        )}

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {message && <Alert><AlertDescription>{message}</AlertDescription></Alert>}

        <Button disabled={isLoading} type="submit" className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          تسجيل الدخول عبر البريد الإلكتروني
        </Button>
      </form>

      {!isRegistered && (
        <div className="text-center mt-4">
          <Link href="/auth/register" className="text-sm text-primary hover:underline">
            ليس لديك حساب؟ سجّل الآن
          </Link>
        </div>
      )}
    </div>
  );
}
