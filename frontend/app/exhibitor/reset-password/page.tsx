'use client'

import { useState } from 'react'
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { motion } from 'framer-motion'
import { FiMail, FiRefreshCw } from 'react-icons/fi'

export default function Page() {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useLoadingRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    try {
      const res = await fetch('https://your-laravel-api.com/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (res.ok && data.status === 'success') {
        setSuccess(true)
      } else {
        setError(data.message || 'تعذر إرسال رابط إعادة تعيين كلمة المرور')
      }
    } catch {
      setError('حدث خطأ أثناء الاتصال بالخادم')
    }
    setLoading(false)
  }

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
          boxShadow: '0 8px 32px 0 rgba(80,37,186,0.18), 0 1.5px 0 0 #a5b4fc inset'
        }}
      >
        <div className="flex flex-col items-center mb-6 gap-2">
          <motion.div
            initial={{ rotate: -12, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="bg-gradient-to-tr from-indigo-600 to-fuchsia-400 rounded-full p-2 shadow-md"
          >
            <FiRefreshCw size={30} className="text-white drop-shadow" />
          </motion.div>
          <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight text-center drop-shadow-sm">
            إعادة تعيين كلمة المرور
          </h2>
          <p className="text-gray-500 mt-1 text-center text-sm font-medium">
            أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <label className="block text-gray-700 mb-1 font-semibold text-sm">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                dir="ltr"
                className="w-full px-10 py-2 border-none rounded-xl shadow-inner bg-indigo-50/50 focus:ring-2 focus:ring-indigo-300 focus:bg-white placeholder:font-light text-indigo-800 text-sm transition"
                placeholder="example@email.com"
                style={{ boxShadow: '0 1px 6px 0 #e0e7ff' }}
              />
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
            </div>
          </motion.div>
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 rounded-xl p-2 text-xs font-semibold text-center mb-1 shadow">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-300 text-green-700 rounded-xl p-2 text-xs font-semibold text-center mb-1 shadow">
              تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.
            </div>
          )}
          <motion.button
            whileHover={{
              scale: 1.025,
              background:
                'linear-gradient(90deg, #6366f1 0%, #c084fc 100%)'
            }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className={`w-full py-2 bg-gradient-to-r from-indigo-600 to-fuchsia-500 text-white rounded-xl font-extrabold text-base shadow-lg transition focus:ring-4 focus:ring-fuchsia-300 hover:from-indigo-700 hover:to-fuchsia-600 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
          </motion.button>
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
            العودة لتسجيل الدخول
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
  )
}