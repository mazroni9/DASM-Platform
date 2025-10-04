// =============================================================
// 🏗️ الصفحة الرئيسية – DASM-e | Digital Auctions Specialists Markets
// ✨ تصميم احترافي عالمي – متوافق مع-navbar الجديد + تسلسل كتابة مضبوط
// =============================================================

"use client";

import React, { useState, useEffect } from "react";
import { Clock, Car, Shield, TrendingUp, Users, Award, CheckCircle, ArrowRight } from "lucide-react";
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
    <div className="relative w-14 h-14 md:w-18 md:h-18 lg:w-20 lg:h-20">
      <motion.div
        key={value}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg"
      >
        <span className="text-slate-900 text-xl md:text-2xl lg:text-3xl font-bold">{value}</span>
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

  if (!timeLeft) return <div className="text-amber-400 font-bold text-sm md:text-base">الانطلاقة قريبة!</div>;

  return (
    <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
      <CountdownUnit value={timeLeft.أيام} label="أيام" />
      <span className="text-slate-500 text-sm md:text-base">:</span>
      <CountdownUnit value={timeLeft.ساعات} label="ساعات" />
      <span className="text-slate-500 text-sm md:text-base">:</span>
      <CountdownUnit value={timeLeft.دقائق} label="دقائق" />
      <span className="text-slate-500 text-sm md:text-base">:</span>
      <CountdownUnit value={timeLeft.ثواني} label="ثواني" />
    </div>
  );
};

// ========== قسم السيارات المميزة ==========
const FeaturedCars = () => {
  const cars = [
    {
      id: 1,
      name: "مرسيدس بنز الفئة S 2023",
      price: "350,000",
      image: "https://images.unsplash.com/photo-1617814076662-1c6c3ccde5b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      timeLeft: "2 يوم",
      bids: 24,
    },
    {
      id: 2,
      name: "بي إم دبليو X7 2022",
      price: "420,000",
      image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      timeLeft: "1 يوم",
      bids: 18,
    },
    {
      id: 3,
      name: "أودي Q8 2023",
      price: "380,000",
      image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      timeLeft: "3 أيام",
      bids: 32,
    },
    {
      id: 4,
      name: "تويوتا لاند كروزر 2023",
      price: "320,000",
      image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      timeLeft: "5 أيام",
      bids: 15,
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-cyan-400 mb-3 md:mb-4"
          >
            سيارات مميزة في المزاد
          </motion.h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg px-4">
            اكتشف مجموعة مختارة من أفضل السيارات المتاحة للمزاد الآن
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {cars.map((car, index) => (
            <motion.div
              key={car.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-slate-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="relative h-40 sm:h-48 overflow-hidden">
                <img
                  src={car.image}
                  alt={car.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
                <div className="absolute top-3 right-3 bg-amber-500 text-slate-900 px-2 py-1 rounded-full text-xs sm:text-sm font-bold">
                  {car.timeLeft}
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 line-clamp-2">{car.name}</h3>
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <span className="text-amber-400 font-bold text-base sm:text-lg">{car.price} ر.س</span>
                  <span className="text-slate-400 text-xs sm:text-sm">{car.bids} مزايدة</span>
                </div>
                <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 text-sm sm:text-base">
                  شارك في المزاد
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10 md:mt-12">
          <motion.a
            href="/auctions"
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 bg-slate-800 text-cyan-400 font-bold py-3 px-6 rounded-xl border border-slate-700 hover:bg-slate-700 transition-all duration-300 text-sm md:text-base"
          >
            عرض جميع المزادات
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </motion.a>
        </div>
      </div>
    </section>
  );
};

// ========== قسم خطوات المزاد (Timeline) ==========
const AuctionTimeline = () => {
  const steps = [
    {
      step: 1,
      title: "التسجيل في المنصة",
      description: "أنشئ حسابك في داسم بخطوات بسيطة وسريعة",
      icon: <Users className="w-5 h-5 md:w-6 md:h-6" />,
    },
    {
      step: 2,
      title: "اختر السيارة المناسبة",
      description: "تصفح آلاف السيارات واختر ما يناسب احتياجاتك",
      icon: <Car className="w-5 h-5 md:w-6 md:h-6" />,
    },
    {
      step: 3,
      title: "شارك في المزاد",
      description: "ضع مزايدتك وتابع المنافسة حتى نهاية المزاد",
      icon: <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />,
    },
    {
      step: 4,
      title: "احصل على سيارتك",
      description: "استلم سيارتك الجديدة بعد فوزك في المزاد",
      icon: <Award className="w-5 h-5 md:w-6 md:h-6" />,
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-cyan-400 mb-3 md:mb-4"
          >
            كيف تشارك في المزاد؟
          </motion.h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg px-4">
            خطوات بسيطة تفصلك عن امتلاك السيارة التي تحلم بها
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`flex ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} items-center mb-8 md:mb-12`}
            >
              <div className="flex-1">
                <div className={`bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 ${index % 2 === 0 ? 'mr-4 md:mr-8' : 'ml-4 md:ml-8'}`}>
                  <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                      {step.icon}
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white">{step.title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm md:text-base">{step.description}</p>
                </div>
              </div>
              <div className="relative">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-lg md:text-xl z-10 relative">
                  {step.step}
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute top-12 md:top-16 left-1/2 transform -translate-x-1/2 w-1 h-8 md:h-12 bg-gradient-to-b from-amber-400 to-amber-600"></div>
                )}
              </div>
              <div className="flex-1"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========== قسم الإحصائيات (Infographic) ==========
const StatsSection = () => {
  const stats = [
    {
      value: "10,000+",
      label: "سيارة مباعة",
      icon: <Car className="w-6 h-6 md:w-8 md:h-8" />,
      color: "from-cyan-400 to-cyan-600",
    },
    {
      value: "50,000+",
      label: "مستخدم نشط",
      icon: <Users className="w-6 h-6 md:w-8 md:h-8" />,
      color: "from-blue-400 to-blue-600",
    },
    {
      value: "95%",
      label: "رضا العملاء",
      icon: <Award className="w-6 h-6 md:w-8 md:h-8" />,
      color: "from-amber-400 to-amber-600",
    },
    {
      value: "2.5B+",
      label: "قيمة الصفقات",
      icon: <TrendingUp className="w-6 h-6 md:w-8 md:h-8" />,
      color: "from-emerald-400 to-emerald-600",
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4"
          >
            أرقام تُحدث الفرق
          </motion.h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-base md:text-lg px-4">
            إحصائيات حقيقية تثبت جودة خدماتنا وثقة عملائنا
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center text-white mx-auto mb-4 md:mb-6 shadow-lg`}>
                {stat.icon}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">{stat.value}</h3>
              <p className="text-slate-300 text-sm md:text-base">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========== قسم أنواع السيارات ==========
const CarTypes = () => {
  const types = [
    {
      name: "سيارات السيدان",
      count: "2,450",
      image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    },
    {
      name: "سيارات الدفع الرباعي",
      count: "3,120",
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    },
    {
      name: "سيارات رياضية",
      count: "890",
      image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    },
    {
      name: "سيارات فاخرة",
      count: "760",
      image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-cyan-400 mb-3 md:mb-4"
          >
            اكتشف أنواع السيارات
          </motion.h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg px-4">
            مجموعة متنوعة من السيارات تناسب جميع الأذواق والميزانيات
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {types.map((type, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl cursor-pointer"
            >
              <div className="h-48 sm:h-56 md:h-64 overflow-hidden">
                <img
                  src={type.image}
                  alt={type.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col justify-end p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-white mb-1">{type.name}</h3>
                <p className="text-slate-300 text-sm md:text-base">{type.count} سيارة متاحة</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========== قسم المزايا ==========
const BenefitsSection = () => {
  const benefits = [
    {
      title: "ضمان الجودة",
      description: "جميع السيارات تخضع لفحص دقيق قبل العرض",
      icon: <Shield className="w-6 h-6 md:w-8 md:h-8" />,
    },
    {
      title: "أسعار تنافسية",
      description: "احصل على أفضل الأسعار من خلال نظام المزادات",
      icon: <TrendingUp className="w-6 h-6 md:w-8 md:h-8" />,
    },
    {
      title: "شفافية كاملة",
      description: "جميع المعلومات متاحة وواضحة للجميع",
      icon: <CheckCircle className="w-6 h-6 md:w-8 md:h-8" />,
    },
    {
      title: "دعم متكامل",
      description: "فريق دعم فني وإداري على مدار الساعة",
      icon: <Users className="w-6 h-6 md:w-8 md:h-8" />,
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-cyan-400 mb-3 md:mb-4"
          >
            لماذا تختار داسم؟
          </motion.h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg px-4">
            نقدم لك تجربة فريدة ومميزة لشراء وبيع السيارات عبر المزادات
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-700 hover:border-cyan-500/30 transition-all duration-300"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white mb-3 md:mb-4">
                {benefit.icon}
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">{benefit.title}</h3>
              <p className="text-slate-400 text-sm md:text-base">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========== قسم الأسئلة الشائعة ==========
const FAQSection = () => {
  const faqs = [
    {
      question: "كيف يمكنني المشاركة في المزاد؟",
      answer: "يمكنك المشاركة بالتسجيل في المنصة، ثم اختيار السيارة المناسبة ووضع مزايدتك خلال فترة المزاد.",
    },
    {
      question: "هل يمكنني استرجاع السيارة بعد الشراء؟",
      answer: "نعم، يوجد سياسة استرجاع محددة توضح شروط وإجراءات استرجاع السيارة في حال وجود عيوب خفية.",
    },
    {
      question: "ما هي طرق الدفع المتاحة؟",
      answer: "نوفر多种 طرق دفع تشمل التحويل البنكي وبطاقات الائتمان والدفع الإلكتروني عبر منصات آمنة.",
    },
    {
      question: "كيف يتم فحص السيارات قبل المزاد؟",
      answer: "جميع السيارات تخضع لفحص فني دقيق يشمل المحرك، الهيكل، النظام الكهربائي، والتأكد من عدم وجود عيوب هيكلية.",
    },
  ];

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="py-16 md:py-20 bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-cyan-400 mb-3 md:mb-4"
          >
            الأسئلة الشائعة
          </motion.h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg px-4">
            إجابات على أكثر الأسئلة شيوعًا حول منصة داسم للمزادات
          </p>
        </div>

        <div className="space-y-3 md:space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-slate-800 rounded-xl md:rounded-2xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-colors duration-300"
            >
              <button
                className="w-full text-right p-4 md:p-6 flex justify-between items-center text-white font-medium text-base md:text-lg hover:bg-slate-750 transition-colors duration-200"
                onClick={() => toggleFAQ(index)}
              >
                <span className="flex-1 text-right pr-3 md:pr-4">{faq.question}</span>
                <motion.div
                  animate={{ rotate: activeIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-5 h-5 md:w-6 md:h-6 text-cyan-400 flex-shrink-0"
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              </button>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ 
                  height: activeIndex === index ? 'auto' : 0,
                  opacity: activeIndex === index ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-4 md:p-6 pt-0 text-slate-400 border-t border-slate-700 text-sm md:text-base leading-relaxed">
                  {faq.answer}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
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

        <div className="container mx-auto px-4 sm:px-6 py-20 md:py-24 lg:py-32 relative z-10 text-center">
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
            <p className="text-slate-300 text-base md:text-lg lg:text-xl max-w-3xl mx-auto mt-4 md:mt-6 leading-relaxed px-4">
              منصة وطنية رقمية شاملة تُعيد تعريف تجربة المزادات عبر تقنيات ذكية، شفافية مطلقة، ووصول عالمي.
            </p>
          </motion.div>

          {/* العد التنازلي – مركز فخم */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 md:mt-12 flex justify-center"
          >
            <div className="bg-slate-800 px-4 md:px-6 py-3 md:py-4 rounded-2xl border border-slate-700 shadow-xl">
              <div className="flex items-center gap-2 md:gap-3 justify-center">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
                <span className="text-slate-300 font-medium text-sm md:text-base">الانطلاقة في:</span>
              </div>
              <div className="mt-2 md:mt-3">
                <CountdownTimer targetDate={targetDate} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* أنواع الأسواق — ✅ تم إصلاح الخلفية هنا */}
      <section className="py-8 md:py-12 bg-slate-900 border-y border-slate-800/40">
        <div className="container mx-auto px-4 sm:px-6">
          <MarketTypeNav />
        </div>
      </section>

      {/* الأقسام الجديدة لصفحة مزادات السيارات */}
      <FeaturedCars />
      <AuctionTimeline />
      <StatsSection />
      <CarTypes />
      <BenefitsSection />
      <FAQSection />

      <Footer />
    </>
  );
}