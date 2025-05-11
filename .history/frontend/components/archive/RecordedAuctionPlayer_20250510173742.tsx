/**
 * --------------------------------------
 * 📝 الملف: مكون مشغل المزاد المسجل
 * 📁 المسار: frontend/components/archive/RecordedAuctionPlayer.tsx
 * 🚀 الإصدار: 1.0
 * 🗓️ تاريخ الإنشاء: 2025/05/11
 * --------------------------------------
 * 
 * ✅ الوظيفة الرئيسية:
 * - عرض تسجيل فيديو المزاد السابق مع أدوات تحكم متقدمة
 * - عرض البيانات المتزامنة مع لحظات الفيديو مثل أسعار المزايدة 
 * - إمكانية التحكم في التشغيل والوصول إلى لحظات محددة
 * 
 * 🔄 الترابطات:
 * - يتم استخدامه في صفحة تفاصيل المزاد (frontend/app/auction-archive/[id]/page.tsx)
 * - يتكامل مع نظام البيانات التاريخية للمزادات والسيارات
 * - يعمل بتزامن مع مكون AuctionCarList لعرض السيارات المباعة وإمكانية الانتقال للحظات بيعها
 * 
 * 🧩 المكونات المستخدمة:
 * - lucide-react: للأيقونات
 * - React Hooks: لإدارة حالة المشغل والفيديو
 * - formatMoney, formatTime: لتنسيق البيانات المعروضة بجانب الفيديو
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipForward, 
  Clock, 
  Tag, 
  Bookmark, 
  Share2 
} from 'lucide-react';
import { formatMoney, formatTime } from '@/app/lib/format-utils';

// معلومات السيارة المُباعة
interface AuctionCarEvent {
  id: number;
  timestamp: number; // الوقت بالثواني من بداية المزاد
  make: string;
  model: string;
  year: number;
  finalPrice: number;
  startPrice: number;
  totalBids: number;
  bidDuration: number; // مدة المزايدة بالثواني
  imageUrl: string;
}

// أحداث المزايدة المهمة
interface AuctionEventData {
  timestamp: number; // الوقت بالثواني من بداية المزاد
  type: 'bid' | 'sale' | 'announcement' | 'highlight';
  description: string;
  amount?: number;
  carId?: number;
}

interface RecordedAuctionPlayerProps {
  recordingUrl: string;
  title: string;
  carEvents: AuctionCarEvent[];
  auctionEvents: AuctionEventData[];
  thumbnailUrl: string;
  hasHighlights?: boolean;
}

export default function RecordedAuctionPlayer({
  recordingUrl,
  title,
  carEvents,
  auctionEvents,
  thumbnailUrl,
  hasHighlights = false
}: RecordedAuctionPlayerProps) {
  // حالة المشغل
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [activeEvents, setActiveEvents] = useState<AuctionEventData[]>([]);
  const [currentCar, setCurrentCar] = useState<AuctionCarEvent | null>(null);
  
  // مراجع للعناصر
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // إعداد المشغل
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // تحديث المدة عند تحميل البيانات الوصفية
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };
    
    // تحديث الوقت الحالي أثناء التشغيل
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
      
      // تحديث الأحداث النشطة بناءً على الوقت الحالي
      updateActiveEvents(video.currentTime);
      updateCurrentCar(video.currentTime);
    };
    
    // معالجة انتهاء الفيديو
    const handleEnded = () => {
      setIsPlaying(false);
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    
    // تعيين مستوى الصوت الأولي
    video.volume = volume / 100;
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);
  
  // تحديث الأحداث النشطة
  const updateActiveEvents = (currentTimeInSeconds: number) => {
    // نعتبر الحدث نشطًا إذا كان في نطاق +-10 ثواني من الوقت الحالي
    const currentActiveEvents = auctionEvents.filter(
      event => Math.abs(event.timestamp - currentTimeInSeconds) <= 10
    );
    
    setActiveEvents(currentActiveEvents);
  };
  
  // تحديث السيارة الحالية
  const updateCurrentCar = (currentTimeInSeconds: number) => {
    // البحث عن السيارة الحالية في المزاد
    for (const car of carEvents) {
      if (
        currentTimeInSeconds >= car.timestamp &&
        currentTimeInSeconds <= car.timestamp + car.bidDuration
      ) {
        setCurrentCar(car);
        return;
      }
    }
    
    setCurrentCar(null);
  };
  
  // تشغيل وإيقاف الفيديو
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // كتم وإلغاء كتم الصوت
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };
  
  // ضبط مستوى الصوت
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const value = Number(e.target.value);
    video.volume = value / 100;
    setVolume(value);
    setIsMuted(value === 0);
  };
  
  // تغيير موضع التشغيل
  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    
    if (!video || !progressBar) return;
    
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = (clickPosition / rect.width) * 100;
    
    // تحديث شريط التقدم والوقت
    setProgress(percentage);
    const newTime = (percentage / 100) * duration;
    setCurrentTime(newTime);
    
    // تحديث موضع الفيديو
    video.currentTime = newTime;
  };
  
  // تفعيل وضع ملء الشاشة
  const toggleFullscreen = () => {
    if (!playerRef.current) return;
    
    if (!isFullscreen) {
      if (playerRef.current.requestFullscreen) {
        playerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  // مراقبة تغيرات حالة ملء الشاشة
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // إظهار وإخفاء أدوات التحكم
  const showControls = () => {
    setIsControlsVisible(true);
    
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setIsControlsVisible(false);
      }
    }, 3000);
  };
  
  // الانتقال إلى نقطة زمنية محددة (للأحداث المهمة)
  const seekToTimestamp = (timestamp: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = timestamp;
    setCurrentTime(timestamp);
    setProgress((timestamp / duration) * 100);
    
    if (!isPlaying) {
      togglePlay();
    }
  };
  
  // تنسيق الوقت (MM:SS)
  const formatTimeDisplay = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // الانتقال إلى اللحظات المهمة التالية
  const nextHighlight = () => {
    if (!hasHighlights || !auctionEvents.length) return;
    
    const highlights = auctionEvents.filter(event => event.type === 'highlight');
    if (!highlights.length) return;
    
    // البحث عن أقرب لحظة مهمة بعد الوقت الحالي
    const nextEvent = highlights.find(event => event.timestamp > currentTime);
    
    if (nextEvent) {
      seekToTimestamp(nextEvent.timestamp);
    } else {
      // العودة إلى أول لحظة مهمة إذا كنا في نهاية الفيديو
      seekToTimestamp(highlights[0].timestamp);
    }
  };
  
  return (
    <div 
      ref={playerRef}
      className="relative bg-black rounded-lg overflow-hidden aspect-video w-full"
      onMouseMove={showControls}
      onMouseLeave={() => isPlaying && setIsControlsVisible(false)}
    >
      {/* الفيديو */}
      <video
        ref={videoRef}
        src={recordingUrl}
        poster={thumbnailUrl}
        className="w-full h-full object-contain"
        onClick={togglePlay}
      ></video>
      
      {/* زر التشغيل المركزي */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <button
            onClick={togglePlay}
            className="w-20 h-20 bg-teal-600 bg-opacity-90 rounded-full flex items-center justify-center hover:bg-teal-700 transition-colors focus:outline-none"
          >
            <Play className="h-10 w-10 text-white ml-2" />
          </button>
        </div>
      )}
      
      {/* أدوات التحكم */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent px-4 py-2 transition-opacity duration-300 ${
          isControlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* شريط التقدم */}
        <div 
          ref={progressRef}
          className="w-full h-1.5 bg-gray-600 rounded-full mb-2 cursor-pointer relative"
          onClick={handleProgressChange}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-teal-500 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* الصف الأول: أزرار التحكم والوقت */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* زر التشغيل/الإيقاف */}
            <button 
              onClick={togglePlay}
              className="hover:text-teal-400 transition-colors focus:outline-none"
              title={isPlaying ? 'إيقاف' : 'تشغيل'}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            
            {/* زر تخطي للحظة المهمة التالية */}
            {hasHighlights && (
              <button
                onClick={nextHighlight}
                className={`hover:text-teal-400 transition-colors focus:outline-none ${
                  !hasHighlights ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title="اللحظة المهمة التالية"
                disabled={!hasHighlights}
              >
                <SkipForward className="h-5 w-5" />
              </button>
            )}
            
            {/* عنصر التحكم في الصوت */}
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
              <button 
                onClick={toggleMute}
                className="hover:text-teal-400 transition-colors focus:outline-none"
                title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1.5 bg-gray-600 rounded-full appearance-none cursor-pointer"
              />
            </div>
            
            {/* عداد الوقت */}
            <div className="text-xs font-mono">
              {formatTimeDisplay(currentTime)} / {formatTimeDisplay(duration)}
            </div>
          </div>
          
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            {/* عنوان المزاد */}
            <span className="text-sm hidden sm:inline-block ml-4">{title}</span>
            
            {/* أزرار أخرى */}
            <button
              onClick={() => {/* تنفيذ المشاركة */}}
              className="hover:text-teal-400 transition-colors focus:outline-none hidden sm:block"
              title="مشاركة"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => {/* تنفيذ الحفظ */}}
              className="hover:text-teal-400 transition-colors focus:outline-none hidden sm:block"
              title="حفظ في المفضلة"
            >
              <Bookmark className="h-4 w-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="hover:text-teal-400 transition-colors focus:outline-none"
              title={isFullscreen ? 'إلغاء ملء الشاشة' : 'ملء الشاشة'}
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* الصف الثاني: معلومات السيارة الحالية والأحداث */}
        {(currentCar || activeEvents.length > 0) && (
          <div className="mt-3 mb-1 bg-black bg-opacity-60 p-2 rounded text-white flex flex-wrap justify-between items-center">
            {/* معلومات السيارة الحالية */}
            {currentCar && (
              <div className="flex-1 space-y-1">
                <div className="flex items-center">
                  <Tag className="h-4 w-4 ml-1 text-teal-400" />
                  <div className="text-sm font-medium">{currentCar.make} {currentCar.model} {currentCar.year}</div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-300">
                  <span>سعر البداية: {formatMoney(currentCar.startPrice)} ريال</span>
                  <span className="text-teal-400 font-semibold">
                    سعر البيع: {formatMoney(currentCar.finalPrice)} ريال
                  </span>
                </div>
              </div>
            )}
            
            {/* أحداث نشطة */}
            {activeEvents.length > 0 && (
              <div className="flex-1 flex flex-col items-end">
                {activeEvents.slice(0, 2).map((event, index) => (
                  <div 
                    key={`${event.timestamp}-${index}`}
                    className={`text-xs px-2 py-0.5 rounded-full mb-1 flex items-center ${
                      event.type === 'highlight' 
                        ? 'bg-amber-500 text-black'
                        : event.type === 'bid'
                          ? 'bg-teal-600'
                          : event.type === 'sale'
                            ? 'bg-green-600'
                            : 'bg-blue-600'
                    }`}
                  >
                    <Clock className="h-3 w-3 ml-1" />
                    {event.description}
                    {event.amount && <span className="mr-1.5 font-semibold">{formatMoney(event.amount)} ريال</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 