"use client";

import { useState } from "react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { motion } from "framer-motion";
import { FiMail, FiRefreshCw } from "react-icons/fi";

export default function Page() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useLoadingRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch(
        "https://your-laravel-api.com/api/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setSuccess(true);
      } else {
        setError(data.message || "تعذر إرسال رابط إعادة تعيين كلمة المرور");
      }
    } catch {
      setError("حدث خطأ أثناء الاتصال بالخادم");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 80, damping: 12 }}
        className="bg-card w-full max-w-md relative z-10 border border-border rounded-xl shadow-sm p-6 sm:p-8"
      >
        <div className="flex flex-col items-center mb-6 gap-3">
          <motion.div
            initial={{ rotate: -12, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="bg-primary rounded-full p-3 shadow-md"
          >
            <FiRefreshCw size={24} className="text-primary-foreground" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight text-center">
            إعادة تعيين كلمة المرور
          </h2>
          <p className="text-muted-foreground mt-1 text-center text-sm font-medium">
            أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <label className="block text-foreground mb-1.5 font-semibold text-sm">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                dir="ltr"
                className="w-full px-10 py-2.5 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground transition-shadow outline-none"
                placeholder="example@email.com"
              />
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base" />
            </div>
          </motion.div>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-xs font-semibold text-center shadow-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-primary/10 border border-primary/20 text-primary rounded-lg p-3 text-xs font-semibold text-center shadow-sm">
              تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow transition hover:bg-primary/90 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
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
            className="text-primary font-semibold hover:underline hover:text-primary/80 transition"
          >
            العودة لتسجيل الدخول
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
