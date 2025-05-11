import React, { useState, useEffect, useRef } from 'react';
import { Maximize, Volume2, VolumeX, ExternalLink } from 'lucide-react';

// واجهة بيانات المعرض
interface Venue {
  id: string;
  name: string;
  location: string;
  region: string;
  youtubeChannel: string;
  youtubeVideoId: string;
  isLive: boolean;
  startTime: string;
  auctionType: 'live' | 'silent' | 'instant';
  currentViewers: number;
}

interface BroadcastPlayerProps {
  venue: Venue;
}

export default function BroadcastPlayer({ venue }: BroadcastPlayerProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  
  // التعامل مع وضع ملء الشاشة
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (playerContainerRef.current?.requestFullscreen) {
        playerContainerRef.current.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(err => console.error('خطأ في ملء الشاشة:', err));
      }
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error('خطأ في الخروج من ملء الشاشة:', err));
    }
  };
  
  // مراقبة تغيرات وضع ملء الشاشة
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // بناء رابط البث
  const getYouTubeEmbedUrl = () => {
    const videoId = venue.youtubeVideoId;
    if (!videoId) return null;
    
    // إضافة معلمات إضافية للمشغل
    const params = new URLSearchParams({
      autoplay: '1',
      mute: isMuted ? '1' : '0',
      modestbranding: '1',
      rel: '0',
      showinfo: '0',
      controls: '1',
      enablejsapi: '1',
      hl: 'ar',
      origin: typeof window !== 'undefined' ? window.location.origin : ''
    });
    
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };
  
  // التعامل مع تغيير كتم الصوت
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // رابط البث المباشر
  const youtubeUrl = getYouTubeEmbedUrl();
  
  // إذا لم يكن هناك رابط بث
  if (!youtubeUrl) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-800 text-white">
          <h2 className="text-xl font-bold">{venue.name}</h2>
        </div>
        <div className="aspect-video bg-gray-900 flex items-center justify-center">
          <div className="text-center text-gray-400 p-6">
            <p className="mb-2">لا يوجد بث مباشر متاح حالياً لهذا المعرض</p>
            <p className="text-sm">يرجى المحاولة لاحقاً أو اختيار معرض آخر</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
        <h2 className="text-xl font-bold">{venue.name}</h2>
        <a
          href={`https://www.youtube.com/watch?v=${venue.youtubeVideoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-300 hover:text-white text-sm flex items-center"
        >
          <span className="mr-1">فتح في يوتيوب</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      
      <div ref={playerContainerRef} className="relative">
        <div className="aspect-video bg-gray-900">
          <iframe
            src={youtubeUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
            title={`بث مباشر - ${venue.name}`}
          ></iframe>
        </div>
        
        {/* أزرار التحكم */}
        <div className="absolute bottom-4 right-4 flex space-x-2 rtl:space-x-reverse">
          <button
            onClick={toggleMute}
            className="p-2 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80 transition-opacity"
            aria-label={isMuted ? "إلغاء كتم الصوت" : "كتم الصوت"}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80 transition-opacity"
            aria-label="ملء الشاشة"
          >
            <Maximize className="h-5 w-5" />
          </button>
        </div>
        
        {/* شارة البث المباشر */}
        {venue.isLive && (
          <div className="absolute top-4 left-4 px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded flex items-center">
            <span className="h-2 w-2 bg-white rounded-full animate-pulse mr-1.5"></span>
            مباشر
          </div>
        )}
      </div>
      
      {/* معلومات المشاهدة */}
      <div className="p-3 bg-gray-50 text-sm text-gray-600 border-t flex justify-between items-center">
        <div>
          {venue.isLive && venue.currentViewers > 0 && (
            <span>{venue.currentViewers.toLocaleString()} مشاهد الآن</span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {venue.isLive ? (
            <span className="flex items-center">
              <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse mr-1"></span>
              بث مباشر
            </span>
          ) : (
            <span>سيبدأ البث {new Date(venue.startTime).toLocaleDateString('ar-SA', { 
              day: 'numeric', 
              month: 'long', 
              hour: '2-digit', 
              minute: '2-digit'
            })}</span>
          )}
        </div>
      </div>
    </div>
  );
} 