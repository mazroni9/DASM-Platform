'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiUserPlus, FiHome, FiPhone } from 'react-icons/fi';


// ✅ إزالة fallback إلى localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// 🔹 تعريف نوع البيانات اللي نتلقاها من الخادم
interface RegisterResponse {
  exhibitor?: {
    id: number;
    name: string;
    email: string;
    showroom_name: string;
    phone: string;
    [key: string]: any; // دعم أي خصائص إضافية
  };
  message?: string;
}

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showroomName, setShowroomName] = useState('');
  const [showroomAddress, setShowroomAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useLoadingRouter();
  
  const searchParams = useSearchParams();
  
  // اقرأ الرابط الذي يجب العودة إليه بعد التسجيل
  const redirect = searchParams.get('redirect') || '/exhibitor';

  // ⚠️ تحقق من أن API_URL معرّف
  useEffect(() => {
    if (!API_URL) {
      setError('خطأ: لم يتم تهيئة عنوان الخادم. تواصل مع الدعم.');
      return;
    }
  }, []);

  // تحقق من تسجيل الدخول تلقائيًا عند التحميل
  useEffect(() => {
    if (!API_URL) return;

    const checkAuth = async () => {
      try {
        await fetch(`${API_URL}/sanctum/csrf-cookie`, {
          method: 'GET',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'include',
        });

        const hasSession = document.cookie.includes('laravel_session');
        if (hasSession) {
          router.push(redirect);
        }
      } catch (err) {
        console.log('لا يوجد اتصال بالخادم أو خطأ في الشبكة');
      }
    };

    checkAuth();
  }, [router, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!API_URL) {
      setError('عنوان الخادم غير متوفر. يرجى المحاولة لاحقًا.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('كلمة المرور غير متطابقة');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // أولًا: جلب CSRF Cookie
      const csrfRes = await fetch(`${API_URL}/sanctum/csrf-cookie`, {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });

      if (!csrfRes.ok) {
        throw new Error('فشل في جلب CSRF token. تحقق من عنوان API أو CORS.');
      }

      // ثانيًا: إرسال طلب التسجيل
      const res = await fetch(`${API_URL}/api/exhibitor/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: passwordConfirm,
          showroom_name: showroomName,
          showroom_address: showroomAddress,
          phone,
        }),
      });

      let data: RegisterResponse = {};
      try {
        data = await res.json();
      } catch (err) {
        console.error('فشل في تحليل استجابة JSON من الخادم');
        throw new Error('استجابة غير صالحة من الخادم');
      }

      if (res.ok && data.exhibitor) {
        localStorage.setItem('exhibitor', JSON.stringify(data.exhibitor));
        document.cookie = "exhibitor_logged_in=true; path=/; max-age=86400; SameSite=Lax";
        router.push(redirect);
      } else {
        setError(data.message || 'حدث خطأ أثناء إنشاء الحساب');
      }
    } catch (err: any) {
      console.error('❌ خطأ في الاتصال:', err.message);
      if (err.message.includes('Failed to fetch')) {
        setError('فشل الاتصال بالخادم. تحقق من الإنترنت أو عنوان الخادم.');
      } else {
        setError(err.message || 'حدث خطأ غير متوقع');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-800 to-fuchsia-900 relative overflow-hidden">
      {/* خلفية زخرفية متحركة */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.08 }}
        className="absolute inset-0 pointer-events-none select-none z-0"
      >
        <svg width="100%" height="100%">
          <defs>
            <radialGradient id="grad1" cx="40%" cy="40%" r="80%" fx="30%" fy="30%">
              <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="grad2" cx="70%" cy="70%" r="70%" fx="80%" fy="80%">
              <stop offset="0%" stopColor="#e0aaff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="40%" cy="35%" r="420" fill="url(#grad1)" />
          <circle cx="80%" cy="85%" r="320" fill="url(#grad2)" />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 80, damping: 12 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 w-full max-w-md relative z-10 border border-indigo-200"
        style={{
          boxShadow: '0 8px 32px 0 rgba(80,37,186,0.18), 0 1.5px 0 0 #a5b4fc inset',
        }}
      >
        <div className="flex flex-col items-center mb-6 gap-2">
          <motion.div
            initial={{ rotate: -12, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="bg-gradient-to-tr from-indigo-600 to-fuchsia-400 rounded-full p-2 shadow-md"
          >
            <FiUserPlus size={30} className="text-white drop-shadow" />
          </motion.div>
          <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight text-center drop-shadow-sm">
            إنشاء حساب معرض سيارات
          </h2>
          <p className="text-gray-500 mt-1 text-center text-sm font-medium">
            سجل بياناتك وبيانات المعرض للانضمام للمنصة
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* الاسم */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-gray-700 mb-1 font-semibold">
                اسمك الكامل
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-10 py-2 border-none rounded-xl shadow-inner bg-indigo-50/50 focus:ring-2 focus:ring-indigo-300 focus:bg-white placeholder:font-light text-indigo-800 text-sm transition"
                  placeholder="اسمك الكامل"
                  style={{ boxShadow: '0 1px 6px 0 #e0e7ff' }}
                />
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
              </div>
            </div>
            {/* اسم المعرض */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-gray-700 mb-1 font-semibold">
                اسم المعرض
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={showroomName}
                  onChange={(e) => setShowroomName(e.target.value)}
                  required
                  className="w-full px-10 py-2 border-none rounded-xl shadow-inner bg-indigo-50/50 focus:ring-2 focus:ring-indigo-300 focus:bg-white placeholder:font-light text-indigo-800 text-sm transition"
                  placeholder="اسم المعرض"
                  style={{ boxShadow: '0 1px 6px 0 #e0e7ff' }}
                />
                <FiHome className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
              </div>
            </div>
            {/* عنوان المعرض */}
            <div className="col-span-2">
              <label className="block text-gray-700 mb-1 font-semibold">
                عنوان المعرض
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={showroomAddress}
                  onChange={(e) => setShowroomAddress(e.target.value)}
                  required
                  className="w-full px-10 py-2 border-none rounded-xl shadow-inner bg-indigo-50/50 focus:ring-2 focus:ring-indigo-300 focus:bg-white placeholder:font-light text-indigo-800 text-sm transition"
                  placeholder="المدينة، الحي، الشارع"
                  style={{ boxShadow: '0 1px 6px 0 #e0e7ff' }}
                />
                <FiHome className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
              </div>
            </div>
            {/* الجوال */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-gray-700 mb-1 font-semibold">
                رقم الجوال
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-10 py-2 border-none rounded-xl shadow-inner bg-indigo-50/50 focus:ring-2 focus:ring-indigo-300 focus:bg-white placeholder:font-light text-indigo-800 text-sm transition"
                  placeholder="05xxxxxxxx"
                  style={{ boxShadow: '0 1px 6px 0 #e0e7ff' }}
                />
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
              </div>
            </div>
            {/* البريد */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-gray-700 mb-1 font-semibold">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="w-full px-10 py-2 border-none rounded-xl shadow-inner bg-indigo-50/50 focus:ring-2 focus:ring-indigo-300 focus:bg-white placeholder:font-light text-indigo-800 text-sm transition"
                  placeholder="example@email.com"
                  style={{ boxShadow: '0 1px 6px 0 #e0e7ff' }}
                />
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
              </div>
            </div>
            {/* كلمة المرور */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-gray-700 mb-1 font-semibold">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  dir="ltr"
                  className="w-full px-10 py-2 border-none rounded-xl shadow-inner bg-indigo-50/50 focus:ring-2 focus:ring-indigo-300 focus:bg-white placeholder:font-light text-indigo-800 text-sm transition"
                  placeholder="********"
                  style={{ boxShadow: '0 1px 6px 0 #e0e7ff' }}
                />
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
              </div>
            </div>
            {/* تأكيد كلمة المرور */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-gray-700 mb-1 font-semibold">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  minLength={6}
                  dir="ltr"
                  className="w-full px-10 py-2 border-none rounded-xl shadow-inner bg-indigo-50/50 focus:ring-2 focus:ring-indigo-300 focus:bg-white placeholder:font-light text-indigo-800 text-sm transition"
                  placeholder="********"
                  style={{ boxShadow: '0 1px 6px 0 #e0e7ff' }}
                />
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
              </div>
            </div>
          </div>
          {/* الخطأ وزر التسجيل */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.33 }}
          >
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 rounded-xl p-2 text-xs font-semibold text-center mb-1 shadow">
                {error}
              </div>
            )}
            <motion.button
              whileHover={{
                scale: 1.025,
                background: 'linear-gradient(90deg, #6366f1 0%, #c084fc 100%)',
              }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className={`w-full py-2 bg-gradient-to-r from-indigo-600 to-fuchsia-500 text-white rounded-xl font-extrabold text-base shadow-lg transition focus:ring-4 focus:ring-fuchsia-300 hover:from-indigo-700 hover:to-fuchsia-600 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
            </motion.button>
          </motion.div>
        </form>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between items-center text-sm"
        >
          <a
            href="/exhibitor/login"
            className="text-indigo-600 font-semibold hover:underline hover:text-indigo-800 transition"
          >
            لديك حساب بالفعل؟ تسجيل الدخول
          </a>
        </motion.div>
        {/* زخرفة أسفل الفورم */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 0.25, scale: 1 }}
          transition={{ delay: 0.45 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-5 bg-gradient-to-r from-fuchsia-200 via-indigo-200 to-indigo-100 blur-2xl rounded-b-3xl pointer-events-none"
        />
      </motion.div>
    </div>
  );
}