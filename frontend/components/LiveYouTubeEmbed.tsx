/**
 * مكون البث المباشر من YouTube
 * يتيح عرض بث مباشر من YouTube في واجهة المزادات
 * يدعم روابط RTMP وروابط YouTube المعتادة
 */

import React, { useRef, useEffect, useState } from 'react';

interface LiveYouTubeEmbedProps {
  videoId?: string;         // معرف الفيديو على YouTube
  overlayId?: string;       // معرف ملحق البث المباشر
  rtmpUrl?: string;         // رابط RTMP للبث المباشر
  streamKey?: string;       // مفتاح الاستريم 
  width?: string | number;  // عرض مشغل الفيديو
  height?: string | number; // ارتفاع مشغل الفيديو
  autoplay?: boolean;       // تشغيل تلقائي
  muted?: boolean;          // كتم الصوت
  title?: string;           // عنوان البث
  className?: string;       // فئات CSS الإضافية
  posterImage?: string;     // صورة العرض قبل التشغيل
  showControls?: boolean;   // إظهار أدوات التحكم
}

const LiveYouTubeEmbed: React.FC<LiveYouTubeEmbedProps> = ({
  videoId = 'XFX5GBLgFXQ',
  overlayId,
  rtmpUrl = 'rtmp://a.rtmp.youtube.com/live2',
  streamKey = 'gyy-e58u-872x-261u-1f7t3',
  width = '100%',
  height = '100%',
  autoplay = true,
  muted = true,
  title = 'البث المباشر من منصة داسم-اي',
  className = '',
  posterImage = '/showroom.jpg',
  showControls = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // تحديد نوع الرابط المطلوب استخدامه
  let embedUrl = '';
  const useRtmp = rtmpUrl && streamKey;
  
  // استخدام رابط يوتيوب المعتاد وإضافة معرّف ممكّن للبث المباشر الفوري
  const usePublicStream = useRtmp && streamKey === 'w54k-w336-dmyd-j5b7-dhpq';
  
  // البث العام المباشر - يمكن استخدام رابط مباشر من يوتيوب
  const publicStreamUrl = 'https://www.youtube.com/embed/uofSUDsAETY?autoplay=1&mute=0&controls=1&rel=0';
  
  if (overlayId) {
    // استخدام رابط ملحق البث المباشر
    embedUrl = `https://www.youtube.com/live_apps/overlay?id=${overlayId}`;
  } else if (videoId) {
    // استخدام رابط الفيديو العادي
    embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=${muted ? 1 : 0}&controls=${showControls ? 1 : 0}&rel=0`;
  }

  useEffect(() => {
    if (!useRtmp || usePublicStream) {
      const handleLoad = () => {
        setIsLoaded(true);
      };

      const handleError = () => {
        setError('حدث خطأ أثناء تحميل البث المباشر. يرجى المحاولة مرة أخرى لاحقًا.');
      };

      const iframe = iframeRef.current;
      if (iframe) {
        iframe.addEventListener('load', handleLoad);
        iframe.addEventListener('error', handleError);
        
        return () => {
          iframe.removeEventListener('load', handleLoad);
          iframe.removeEventListener('error', handleError);
        };
      }
    } else {
      // للتعامل مع روابط RTMP، سنعرض معلومات الاتصال
      setIsLoaded(true);
    }
  }, [useRtmp, usePublicStream]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: width,
    height: height,
    overflow: 'hidden',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  return (
    <div style={containerStyle} className={`live-youtube-embed ${className}`}>
      {!isLoaded && posterImage && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${posterImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          <div className="animate-pulse flex flex-col items-center justify-center bg-black bg-opacity-60 rounded-full p-8">
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="mt-2 text-white font-medium">جاري تحميل البث المباشر...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--color-card-background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            padding: '20px',
            textAlign: 'center'
          }}
        >
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-foreground">{error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
              onClick={() => {
                setError(null);
                setIsLoaded(false);
                if (iframeRef.current && (!useRtmp || usePublicStream)) {
                  iframeRef.current.src = usePublicStream ? publicStreamUrl : embedUrl;
                }
              }}
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      )}
      
      {useRtmp && !usePublicStream ? (
        <div className="flex flex-col items-center justify-center h-full w-full bg-background text-foreground">
          <div className="bg-card p-4 rounded-lg text-center max-w-md">
            <div className="font-bold text-xl mb-2">جاري البث المباشر</div>
            <div className="mb-3">
              <div className="text-sm mb-1">رابط البث:</div>
              <div className="bg-border p-2 rounded text-green-400 font-mono text-xs overflow-auto whitespace-nowrap">
                {rtmpUrl}
              </div>
            </div>
            <div>
              <div className="text-sm mb-1">مفتاح الإستريم:</div>
              <div className="bg-border p-2 rounded text-green-400 font-mono text-xs overflow-auto whitespace-nowrap">
                {streamKey}
              </div>
            </div>
            <div className="mt-4 text-sm text-foreground/70">
              يتم استخدام هذه المعلومات لإعداد البث المباشر على منصات البث مثل OBS Studio
            </div>
          </div>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          src={usePublicStream ? publicStreamUrl : embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: isLoaded ? 10 : 0
          }}
        ></iframe>
      )}
      
      {/* شريط العنوان (اختياري) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-2 text-sm font-medium z-20">
        {title}
      </div>
    </div>
  );
};

export default LiveYouTubeEmbed; 