"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    
    // حالة النموذج
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'auctioneer' | 'control' | 'admin'>('auctioneer');
    const [showPassword, setShowPassword] = useState(false);
    
    // حالة إرسال النموذج
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // التعامل مع تسجيل الدخول
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // إعادة تعيين الخطأ
        setError(null);
        
        // التحقق من البيانات
        if (!email || !password) {
            setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }
        
        // تعيين حالة الإرسال
        setIsSubmitting(true);
        
        try {
            // في البيئة الحقيقية سنرسل طلب إلى الخادم
            // هنا نستخدم محاكاة بسيطة للتأكد من صحة الأكواد
            
            // محاكاة تأخير الشبكة
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // محاكاة استجابة الخادم
            // في الإنتاج، سنستخدم طلب fetch أو axios
            const mockResponse = {
                success: email.includes('@dasm') && password.length >= 6,
                token: 'mock-auth-token-12345',
                user: {
                    id: 1,
                    name: 'محمد أحمد',
                    email,
                    role
                }
            };
            
            if (mockResponse.success) {
                // حفظ بيانات المصادقة في التخزين المحلي
                localStorage.setItem('auth_token', mockResponse.token);
                localStorage.setItem('user', JSON.stringify(mockResponse.user));
                
                // التوجيه إلى الصفحة المناسبة حسب الدور
                if (role === 'auctioneer') {
                    router.push('/dashboard/auctioneer');
                } else if (role === 'control') {
                    router.push('/dashboard/control');
                } else {
                    router.push('/dashboard/admin');
                }
            } else {
                setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
            }
        } catch (err) {
            console.error('خطأ في تسجيل الدخول:', err);
            setError('حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">تسجيل الدخول</h2>
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
                    
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                    placeholder="example@dasm-platform.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                كلمة المرور
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 px-3 py-1.5 text-gray-500"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                الدور
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value as any)}
                                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                            >
                                <option value="auctioneer">محرّج (منادي)</option>
                                <option value="control">فريق الكنترول</option>
                                <option value="admin">مدير النظام</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                <Link href="/auth/forgot-password" className="font-medium text-teal-600 hover:text-teal-500">
                                    نسيت كلمة المرور؟
                                </Link>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
                                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                            >
                                <LogIn className="h-4 w-4 ml-2" />
                                {isSubmitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
