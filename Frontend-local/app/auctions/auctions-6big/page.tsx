'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronRight, Calendar, Clock, Sparkles } from 'lucide-react';

export default function BazarPage() {
  const [confetti, setConfetti] = useState(null);
  const [fireworksActive, setFireworksActive] = useState(false);
  
  // وقت الافتتاح
  const launchDate = "2025-12-01T18:00:00";
  
  // كلمات الاحتفال التي ستتناثر
  const celebrationWords = [
    "مفاجآت",
    "عروض",
    "هدايا",
    "خصومات",
    "تخفيضات",
    "السوق الكبير",
    "حصري",
    "فرص",
    "كنوز",
    "مزادات",
    "أسعار مذهلة",
  ];
  
  useEffect(() => {
    // تهيئة مكتبة الاحتفالات - استخدام dynamic import
    const loadConfetti = async () => {
      try {
        const JSConfetti = (await import('js-confetti')).default;
        const jsConfetti = new JSConfetti();
        setConfetti(jsConfetti);
        
        // إطلاق الألعاب النارية عند تحميل الصفحة
        jsConfetti.addConfetti({
          confettiColors: [
            '#FFD700', '#FFA500', '#FF4500', '#9370DB', '#FF6347', '#00BFFF'
          ],
          confettiRadius: 6,
          confettiNumber: 200,
        });
        
        // جدولة إطلاق المزيد من الألعاب النارية كل 5 ثوانٍ
        const interval = setInterval(() => {
          jsConfetti.addConfetti({
            emojis: ['🎁', '🎉', '🎊', '💰', '💎', '🏆', '✨', '⭐'],
            emojiSize: 50,
            confettiNumber: 30,
          });
          
          // إطلاق الكلمات الاحتفالية
          jsConfetti.addConfetti({
            confettiColors: [
              '#FFD700', '#FFA500', '#FF8C00', '#FF4500', '#DA70D6'
            ],
            confettiNumber: 50,
            confettiRadius: 8,
          });
        }, 5000);
        
        return () => clearInterval(interval);
      } catch (error) {
        console.error("Failed to load confetti:", error);
      }
    };
    
    loadConfetti();
  }, []);
  
  // حساب الوقت المتبقي للافتتاح
  const calculateTimeLeft = () => {
    const difference = +new Date(launchDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        أيام: Math.floor(difference / (1000 * 60 * 60 * 24)),
        ساعات: Math.floor((difference / (1000 * 60 * 60)) % 25),
        دقائق: Math.floor((difference / 1000 / 60) % 60),
        ثواني: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  };
  
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });
  
  const triggerFireworks = () => {
    if (confetti) {
      setFireworksActive(true);
      
      // إطلاق الألعاب النارية من نوع المذر لود
      confetti.addConfetti({
        confettiColors: [
          '#FFD700', '#FF8C00', '#FF4500', '#9370DB', '#BA55D3', '#9400D3'
        ],
        confettiNumber: 500,
        confettiRadius: 7,
      });
      
      // إطلاق الكلمات الاحتفالية
      const randomWords = [...celebrationWords].sort(() => 0.5 - Math.random()).slice(0, 5);
      setTimeout(() => {
        confetti.addConfetti({
          emojis: randomWords,
          emojiSize: 100,
          confettiNumber: 30,
        });
      }, 700);
      
      setTimeout(() => setFireworksActive(false), 3000);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 relative overflow-hidden">
      {/* خلفية الكواكب المتوهجة */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {[...Array(20)].map((_, index) => (
          <div
            key={index}
            className="absolute rounded-full bg-white"
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              boxShadow: `0 0 ${Math.random() * 30 + 10}px ${Math.random() * 10 + 2}px rgba(255,255,255,0.8)`,
              animation: `twinkle ${Math.random() * 5 + 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>
      
      {/* رأس الصفحة */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Link 
              href="/auctions" 
              className="flex items-center text-purple-600 hover:text-purple-800 transition group"
            >
              <ChevronRight className="ml-1 transform group-hover:-translate-x-1 transition-transform" size={20} />
              <span>العودة للسوق الرئيسي</span>
            </Link>
          </div>
          
          {/* عنوان البازار الكبير */}
          <div className="text-center mb-8">
            <motion.h1 
              className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-500 to-green-700 mb-2 px-4 py-2 tracking-wide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              السوق السعودي الشامل
            </motion.h1>
            <motion.p 
              className="text-lg md:text-xl text-gray-700 mt-4 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              المنصة الوطنية الأولى للأسواق الرقمية المتقدمة لمختلف القطاعات في المملكة العربية السعودية
            </motion.p>
            
            {/* إعلان دعوة التسجيل */}
            <motion.div
              className="max-w-3xl mx-auto mt-6 bg-green-50 border-2 border-green-200 rounded-lg p-5 text-right shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.7 }}
            >
              <h3 className="text-xl font-bold text-green-800 mb-2">
                دعوة للشركات والمؤسسات التجارية
              </h3>
              <p className="text-green-700 text-lg leading-relaxed">
                تدعوكم شركة أسواق المزادات الرقمية السعودية لكافة القطاعات لتسجيل محلاتكم في السوق السعودي الشامل، ونحن نوصلكم بكافة أرجاء السعودية بإذن الله بل العالم أجمع.
              </p>
              <div className="mt-4 flex justify-start">
                <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md font-medium transition-colors duration-300 flex items-center gap-2">
                  <span>سجل محلك الآن</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </motion.div>
          </div>
          
          {/* بطاقة الافتتاح القريب */}
          <motion.div 
            className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mb-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 md:p-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">الافتتاح قريبًا</h2>
                <p className="text-gray-600 mb-6">
                  نستعد لإطلاق السوق السعودي الشامل، حيث ستجد أفضل المنتجات الوطنية والعالمية بأسعار تنافسية من خلال نظام المزادات الرقمية الفريد الخاص بنا.
                </p>
                
                <div className="flex items-center gap-3 text-purple-600 mb-3">
                  <Calendar size={20} />
                  <span className="font-medium">1 ديسمبر 2025</span>
                </div>
                
                <div className="flex items-center gap-3 text-purple-600 mb-6">
                  <Clock size={20} />
                  <span className="font-medium">6:00 مساءً</span>
                </div>
                
                <button 
                  onClick={triggerFireworks}
                  className={`px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-medium rounded-lg flex items-center gap-2 hover:shadow-lg transition transform hover:-translate-y-1 ${fireworksActive ? 'scale-105 animate-pulse' : ''}`}
                >
                  <Sparkles size={18} />
                  <span>احتفل معنا بالافتتاح القريب</span>
                </button>
              </div>
              
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-8 md:p-12 text-white flex flex-col justify-center">
                <h3 className="text-xl font-bold mb-6">الوقت المتبقي للافتتاح</h3>
                
                <div className="grid grid-cols-4 gap-4 text-center">
                  {Object.keys(timeLeft).map((interval) => (
                    <div key={interval} className="flex flex-col">
                      <div className="text-3xl md:text-4xl font-bold mb-1">{timeLeft[interval]}</div>
                      <div className="text-xs md:text-sm text-pink-100">{interval}</div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 bg-white/10 rounded-lg p-4">
                  <h4 className="text-lg font-medium mb-3">ما الذي ينتظرك؟</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 bg-pink-300 rounded-full"></span>
                      <span>منتجات حصرية وممبزة</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 bg-pink-300 rounded-full"></span>
                      <span>خصومات تصل إلى 70% لأول 10 مشتركين في السوق السعودي الشامل</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 bg-pink-300 rounded-full"></span>
                      <span>هدايا وجوائز للمشاركين</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* بطاقات مميزات البازار */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                title: "تشكيلة واسعة",
                description: "آلاف المنتجات المتنوعة من مختلف الفئات والماركات ",
                color: "from-blue-500 to-purple-600"
              },
              {
                title: "عروض حصرية",
                description: "خصومات وعروض لا تجدها في أي مكان آخر بأسعار منافسة",
                color: "from-amber-500 to-pink-500"
              },
              {
                title: "مفاجآت يومية",
                description: "جوائز وهدايا يومية للمشاركين في المزادات خلال فترة البازار",
                color: "from-emerald-500 to-teal-600"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl shadow-md overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.2, duration: 0.5 }}
              >
                <div className={`h-2 bg-gradient-to-r ${feature.color}`}></div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* قسم التسجيل للإشعارات */}
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.8 }}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">كن أول من يعلم</h2>
            <p className="text-gray-600 mb-6">سجل بريدك الإلكتروني للحصول على إشعار فوري عند افتتاح السوق السعودي الشامل</p>
            
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="أدخل بريدك الإلكتروني" 
                className="flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition whitespace-nowrap">
                تسجيل
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* تذييل الصفحة */}
      <div className="bg-gray-50 border-t py-8 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 mb-2">
            السوق السعودي الشامل - جزء من منصة أسواق المزادات الرقمية السعودية
          </p>
          <p className="text-sm text-gray-500">
            جميع الحقوق محفوظة © 2025
          </p>
        </div>
      </div>
      
      {/* الأنماط للرسوم المتحركة */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
} 