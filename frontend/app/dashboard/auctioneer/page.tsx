// /**
//  * 📝 واجهة المُحرّج (المنادي)
//  * 📁 المسار: frontend/app/dashboard/auctioneer/page.tsx
//  *
//  * ✅ الوظيفة:
//  * - عرض واجهة خاصة للمُحرّج في غرفة الكنترول
//  * - عرض السيارة الحالية والمزايدات الواردة من الإنترنت
//  * - توفير أدوات التحكم في المزاد (إنهاء المزاد، الانتقال للسيارة التالية، إلخ)
//  * - عرض السيارات المقبلة في المزاد
//  * - عرض إحصائيات المزاد المباشرة
//  */

'use client';
export const dynamic = 'force-dynamic';

// import React, { useState, useEffect } from 'react';
// import { Eye, Users, Clock, AlertCircle, ThumbsUp, ThumbsDown, ChevronRight, ChevronLeft, LogOut } from 'lucide-react';
// import { useRouter } from 'next/navigation';
// import CurrentCar from './components/CurrentCar';
// import OnlineBids from './components/OnlineBids';
// import SpeechToText from './components/SpeechToText';
// import UpcomingCars from './components/UpcomingCars';
// import AuctionControls from './components/AuctionControls';
// import LiveStats from './components/LiveStats';
// // import { WebSocketProvider, useWebSocket } from '@/app/lib/websocket-provider';

// // نوع بيانات المستخدم
// interface User {
//   id: number;
//   name: string;
//   email: string;
//   role: string;
// }

// // المكون الرئيسي لواجهة المحرّج
// export default function AuctioneerPage() {
//   return (
//     // <WebSocketProvider>
//       <AuctioneerDashboard />
//     // </WebSocketProvider>
//   );
// }

// // واجهة المحرّج الداخلية التي تستخدم سياق WebSocket
// function AuctioneerDashboard() {
//   const router = useRouter();
//   const [user, setUser] = useState<User | null>(null);
//   const [transcribedText, setTranscribedText] = useState<string>('');
//   const [currentTime, setCurrentTime] = useState<string>('');
  
//   // استخدام سياق WebSocket
//   const {
//     currentCar,
//     upcomingCars,
//     bids,
//     auctionStatus,
//     stats,
//     connected,
//     handleNextCar,
//     handleEndAuction,
//     handleTogglePause
//   } = useWebSocket();
  
//   // فحص حالة تسجيل الدخول والصلاحيات
//   useEffect(() => {
//     // التحقق من وجود رمز المصادقة
//     const token = localStorage.getItem('auth_token');
//     const userData = localStorage.getItem('user');
    
//     if (!token || !userData) {
//       // إعادة التوجيه إلى صفحة تسجيل الدخول إذا لم يكن المستخدم مسجل الدخول
//       router.push('/auth/login');
//       return;
//     }
    
//     // محاولة تحليل بيانات المستخدم
//     try {
//       const parsedUser = JSON.parse(userData) as User;
      
//       // التحقق من أن المستخدم له صلاحيات المحرّج
//       if (parsedUser.role !== 'auctioneer' && parsedUser.role !== 'admin') {
//         // إعادة التوجيه إلى الصفحة المناسبة حسب الدور
//         router.push(`/dashboard/${parsedUser.role}`);
//         return;
//       }
      
//       // حفظ بيانات المستخدم في الحالة
//       setUser(parsedUser);
//     } catch (error) {
//       console.error('خطأ في تحليل بيانات المستخدم:', error);
//       // إعادة التوجيه إلى صفحة تسجيل الدخول في حالة وجود خطأ
//       router.push('/auth/login');
//     }
//   }, [router]);
  
//   // تحديث الوقت الحالي
//   useEffect(() => {
//     const updateTime = () => {
//       const now = new Date();
//       const timeStr = now.toLocaleTimeString('ar-SA', {
//         hour: '2-digit',
//         minute: '2-digit',
//         hour12: true
//       });
//       setCurrentTime(timeStr);
//     };
    
//     // تحديث الوقت فوراً ثم كل دقيقة
//     updateTime();
//     const interval = setInterval(updateTime, 60000);
    
//     return () => clearInterval(interval);
//   }, []);
  
//   // التعامل مع تسجيل الخروج
//   const handleLogout = () => {
//     // حذف بيانات المصادقة من التخزين المحلي
//     localStorage.removeItem('auth_token');
//     localStorage.removeItem('user');
    
//     // إعادة التوجيه إلى صفحة تسجيل الدخول
//     router.push('/auth/login');
//   };
  
//   // عرض شاشة التحميل حتى يتم التحقق من المصادقة
//   if (!user) {
//     return (
//       <div className="min-h-screen bg-gray-100 flex justify-center items-center">
//         <div className="flex flex-col items-center">
//           <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
//           <p className="mt-4 text-gray-600">جاري التحميل...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* الشريط العلوي */}
//       <header className="bg-gray-800 text-white p-4">
//         <div className="max-w-7xl mx-auto flex justify-between items-center">
//           <div className="flex items-center space-x-2 rtl:space-x-reverse">
//             <h1 className="text-2xl font-bold">واجهة المُحرّج</h1>
//             <div className={`h-3 w-3 rounded-full ${auctionStatus === 'active' ? 'bg-green-500 animate-pulse' : auctionStatus === 'paused' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
//             {!connected && (
//               <span className="text-red-300 text-xs mr-2 animate-pulse">غير متصل</span>
//             )}
//           </div>
          
//           <div className="flex items-center space-x-4 rtl:space-x-reverse">
//             <div className="flex items-center">
//               <Eye className="h-5 w-5 mr-1.5" />
//               <span>{stats.viewerCount} مشاهد</span>
//             </div>
//             <div className="flex items-center">
//               <Users className="h-5 w-5 mr-1.5" />
//               <span>{stats.bidderCount} مزايد</span>
//             </div>
//             <div className="flex items-center">
//               <Clock className="h-5 w-5 mr-1.5" />
//               <span>{currentTime}</span>
//             </div>
//             <button 
//               onClick={handleLogout}
//               className="flex items-center text-sm bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-white"
//             >
//               <LogOut className="h-4 w-4 mr-1.5" />
//               <span>تسجيل الخروج</span>
//             </button>
//           </div>
//         </div>
//       </header>
      
//       {/* المحتوى الرئيسي */}
//       <main className="max-w-7xl mx-auto py-6 px-4">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* العمود الأيمن: تفاصيل السيارة الحالية + أزرار التحكم */}
//           <div className="lg:col-span-1 space-y-6">
//             {/* السيارة الحالية */}
//             <CurrentCar car={currentCar} />
            
//             {/* أزرار التحكم */}
//             <AuctionControls 
//               auctionStatus={auctionStatus}
//               onNextCar={handleNextCar}
//               onEndAuction={handleEndAuction}
//               onTogglePause={handleTogglePause}
//             />
            
//             {/* الإحصائيات المباشرة */}
//             <LiveStats
//               viewerCount={stats.viewerCount}
//               bidderCount={stats.bidderCount}
//               highestBid={currentCar?.current_price || 0}
//               bidCount={stats.totalBids}
//             />
//           </div>
          
//           {/* العمود الأوسط: المزايدات الواردة + تحويل الصوت إلى نص */}
//           <div className="lg:col-span-1 space-y-6">
//             {/* المزايدات الواردة */}
//             <OnlineBids bids={bids} />
            
//             {/* تحويل الصوت إلى نص */}
//             <SpeechToText 
//               onTranscriptionChange={setTranscribedText} 
//               isActive={auctionStatus === 'active'}
//             />
            
//             {/* النص المحول (للعرض على شاشة المزاد) */}
//             {transcribedText && (
//               <div className="bg-white p-4 rounded-lg shadow-md">
//                 <h2 className="text-lg font-bold text-gray-800 mb-2">النص المعروض على الشاشة:</h2>
//                 <div className="bg-gray-100 p-3 rounded border border-gray-300 text-xl font-bold text-center">
//                   {transcribedText}
//                 </div>
//               </div>
//             )}
//           </div>
          
//           {/* العمود الأيسر: السيارات القادمة */}
//           <div className="lg:col-span-1">
//             <UpcomingCars cars={upcomingCars} />
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// } 