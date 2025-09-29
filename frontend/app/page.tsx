// =============================================================
// 🏗️ الصفحة الرئيسية – DASM-e | Digital Auctions Specialists Markets
// ✨ تصميم احترافي عالمي – متوافق مع-navbar الجديد + تسلسل كتابة مضبوط
// =============================================================

"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";
import Footer from "@/components/shared/Footer";
import AuctionDropdown from "@/components/shared/AuctionDropdown";
import MarketTypeNav from "@/components/shared/MarketTypeNav";

// ========== typing effect للعنوان الرئيسي (مرة واحدة) ==========
const TypingMainTitle = ({
  text,
  speed = 60,
  onDone,
}: {
  text: string;
  speed?: number;
  onDone: () => void;
}) => {
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (charIndex < text.length) {
      const id = setTimeout(() => setCharIndex((i) => i + 1), speed);
      return () => clearTimeout(id);
    } else {
      // انتهى العنوان
      onDone?.();
    }
  }, [charIndex, text, speed, onDone]);

  const displayed = text.slice(0, charIndex);

  return (
    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400 bg-clip-text text-transparent leading-tight">
      {displayed}
      {charIndex < text.length ? (
        <span className="inline-block w-[2px] h-[0.9em] align-[-0.12em] ml-1 animate-pulse bg-cyan-300" />
      ) : null}
    </h1>
  );
};

// ========== typing & deleting loop للجمل الدوّارة (تبدأ بعد انتهاء العنوان) ==========
const RotatingSentences = ({
  start,
  sentences = [
    "اخترنا لك نخبة من الأسواق الرقمية التي تلبي احتياجاتك.",
    "نمنحك فرصًا لا تجدها في مكان آخر.",
    "كل ما تبحث عنه من أصول ومنتجات مستعملة ومجددة.",
  ],
}: {
  start: boolean;
  sentences?: string[];
}) => {
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // إعادة الضبط عند بدء التشغيل بعد العنوان
  useEffect(() => {
    if (!start) return;
    setSentenceIndex(0);
    setCharIndex(0);
    setIsDeleting(false);
  }, [start]);

  useEffect(() => {
    if (!start) return;

    const current = sentences[sentenceIndex];
    const typingSpeed = 50;
    const deletingSpeed = 40;
    const pauseAtEnd = 1400;

    let delay = isDeleting ? deletingSpeed : typingSpeed;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < current.length) {
          setCharIndex((i) => i + 1);
        } else {
          // توقف بسيط ثم ابدأ الحذف
          setTimeout(() => setIsDeleting(true), pauseAtEnd);
        }
      } else {
        if (charIndex > 0) {
          setCharIndex((i) => i - 1);
        } else {
          setIsDeleting(false);
          setSentenceIndex((i) => (i + 1) % sentences.length);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [start, charIndex, isDeleting, sentenceIndex, sentences]);

  if (!start) return null;

  const current = sentences[sentenceIndex];
  const text = current.slice(0, charIndex);

  return (
    <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto mt-6 leading-relaxed">
      {text}
      {!isDeleting && charIndex === current.length ? (
        <span className="inline-block w-[2px] h-[0.9em] align-[-0.12em] ml-1 animate-pulse bg-cyan-300" />
      ) : null}
    </p>
  );
};

// ========== العد التنازلي (تصميم فاخر) ==========
const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-16 h-16 md:w-20 md:h-20">
      <motion.div
        key={value}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg"
      >
        <span className="text-slate-900 text-2xl md:text-3xl font-bold">{value}</span>
      </motion.div>
    </div>
    <span className="mt-2 text-xs md:text-sm text-slate-400 font-medium">{label}</span>
  </div>
);

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ أيام: number; ساعات: number; دقائق: number; ثواني: number } | null>(null);

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return null;
      return {
        أيام: Math.floor(diff / (1000 * 60 * 60 * 24)),
        ساعات: Math.floor((diff / (1000 * 60 * 60)) % 24),
        دقائق: Math.floor((diff / 1000 / 60) % 60),
        ثواني: Math.floor((diff / 1000) % 60),
      };
    };

    setTimeLeft(calculate());
    const id = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!timeLeft) return <div className="text-amber-400 font-bold">الانطلاقة قريبة!</div>;

  return (
    <div className="flex items-center gap-4 md:gap-6">
      <CountdownUnit value={timeLeft.أيام} label="أيام" />
      <span className="text-slate-500">:</span>
      <CountdownUnit value={timeLeft.ساعات} label="ساعات" />
      <span className="text-slate-500">:</span>
      <CountdownUnit value={timeLeft.دقائق} label="دقائق" />
      <span className="text-slate-500">:</span>
      <CountdownUnit value={timeLeft.ثواني} label="ثواني" />
    </div>
  );
};

// ========== الفيديو (بدون autoplay – تجربة مستخدم أفضل) ==========
const VideoSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl bg-slate-900 aspect-video">
      {!isPlaying ? (
        <button
          onClick={() => setIsPlaying(true)}
          className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900/90 to-slate-800/80 hover:from-slate-800/90 hover:to-slate-700/80 transition-all duration-300 group"
          aria-label="تشغيل فيديو مقدمة المنصة"
        >
          <img
            src="https://img.youtube.com/vi/ZSxZeM9Mcwk/maxresdefault.jpg"
            alt="مقدمة منصة DASM-e"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/800x450/1e293b/64748b?text=Video+Thumbnail";
            }}
          />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white ml-1" viewBox="0 0 24 24">
                <path fill="currentColor" d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="mt-4 text-slate-200 font-medium">شاهد مقدمة المنصة</span>
          </div>
        </button>
      ) : (
        <iframe
          src="https://www.youtube.com/embed/ZSxZeM9Mcwk?autoplay=1&mute=0"
          title="DASM Platform Introduction"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
        />
      )}
    </div>
  );
};

// ========== الصفحة الرئيسية ==========
export default function Page() {
  const targetDate = "July 1, 2025 01:00:00";
  const [titleDone, setTitleDone] = useState(false);

  return (
    <>
      {/* Hero Section – فاخر وغامر */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, #25B4D8 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        ></div>

        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* العنوان يُكتب أولًا */}
            <TypingMainTitle
              text="Digital Auctions Specialists Markets"
              speed={60}
              onDone={() => setTitleDone(true)}
            />

            {/* الجمل الدوارة — تظهر بعد انتهاء العنوان، وأعلى النص العربي الثابت */}
            <RotatingSentences start={titleDone} />

            {/* النص العربي الثابت */}
            <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto mt-6 leading-relaxed">
              منصة وطنية رقمية شاملة تُعيد تعريف تجربة المزادات عبر تقنيات ذكية، شفافية مطلقة، ووصول عالمي.
            </p>
          </motion.div>

          {/* العد التنازلي – مركز فخم */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 flex justify-center"
          >
            <div className="bg-slate-800 px-6 py-4 rounded-2xl border border-slate-700 shadow-xl">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-400" />
                <span className="text-slate-300 font-medium">الانطلاقة في:</span>
              </div>
              <div className="mt-3">
                <CountdownTimer targetDate={targetDate} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* أنواع الأسواق — ✅ تم إصلاح الخلفية هنا */}
      <section className="py-12 bg-slate-900 border-y border-slate-800/40">
        <div className="container mx-auto px-4">
          <MarketTypeNav />
        </div>
      </section>

      {/* قسم الفيديو – تجربة غامرة */}
      <section className="py-20 bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-cyan-400 mb-4"
            >
              القناة الرسمية لـ DASM-e
            </motion.h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              حيث يلتقي البزنس الجاد مع الابتكار الرقمي — تجارب حقيقية من قلب السوق.
            </p>
          </div>
          <VideoSection />
          <p className="text-slate-400 text-center mt-10 max-w-3xl mx-auto text-lg leading-relaxed">
            تابعنا لتفهم الفارق، وتحجز مكانك في مستقبل التجارة التفاعلية.
          </p>
        </div>
      </section>

      {/* CTA – تحويل فعّال */}
      <section className="py-24 bg-slate-900">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center">
            <div className="inline-block px-6 py-2 bg-slate-800 border border-slate-700 rounded-full mb-10">
              <h3 className="text-2xl font-bold text-cyan-400">ابدأ رحلتك اليوم</h3>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="w-full max-w-xs">
                <AuctionDropdown />
              </div>
              <motion.a
                href="/add/Car"
                whileHover={{ scale: 1.03, boxShadow: "0 10px 30px -10px rgba(37, 180, 216, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg overflow-hidden w-full md:w-auto flex items-center justify-center"
              >
                <span className="relative z-10">أدخل بيانات سيارتك</span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
