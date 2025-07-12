'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface ImageGalleryProps {
  images: string[];
  title?: string;
  aspectRatio?: 'square' | '16:9' | '4:3';
}

export default function ImageGallery({ images, title, aspectRatio = '16:9' }: ImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
  if (isZoomed) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}, [isZoomed]);

  if (!images || images.length === 0) {
    return <div className="bg-gray-200 w-full h-80 flex items-center justify-center">لا توجد صور</div>;
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const selectImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  // تحديد نسبة العرض إلى الارتفاع
  const aspectRatioClass = 
    aspectRatio === 'square' ? 'aspect-square' : 
    aspectRatio === '4:3' ? 'aspect-[4/3]' : 
    'aspect-[16/9]';

  return (
    <div className="w-full">
      {/* عنوان الصورة إذا كان موجودًا */}
      {title && (
        <h2 className="text-center text-2xl font-bold mb-4">{title}</h2>
      )}

      {/* الصورة الرئيسية مع أزرار التنقل */}
    <div className={`relative ${aspectRatioClass} mb-2 overflow-hidden rounded-lg bg-gray-100 cursor-zoom-in`}
    onClick={() => setIsZoomed(true)}>
    <Image
      src={images[currentImageIndex]}
      alt={title || `صورة ${currentImageIndex + 1}`}
      fill
      className="object-cover transition duration-300"
      unoptimized
    />
        
        {/* زر السابق */}
        {images.length > 1 && (
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 p-2 rounded-full text-white transition"
            aria-label="الصورة السابقة"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        
        {/* زر التالي */}
        {images.length > 1 && (
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 p-2 rounded-full text-white transition"
            aria-label="الصورة التالية"
          >
            <ChevronRight size={24} />
          </button>
        )}
        
        {/* مؤشر الصورة الحالية */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <div className="bg-black/40 px-3 py-1 rounded-full text-white text-xs">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>
      </div>

      {/* الصور المصغرة */}
      
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => selectImage(index)}
              className={`relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden ${
                index === currentImageIndex ? 'ring-2 ring-orange-500' : 'ring-1 ring-gray-300'
              }`}
              aria-label={`عرض صورة ${index + 1}`}
            >
              <Image
                src={image}
                alt={`صورة مصغرة ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
      {isZoomed && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setIsZoomed(false)}
          >
            <div className="relative w-full max-w-4xl max-h-full">
              <Image
                src={images[currentImageIndex]}
                alt={`تكبير ${currentImageIndex + 1}`}
                width={1200}
                height={800}
                className="w-full h-auto rounded-lg object-contain"
                unoptimized
              />
              <button
                onClick={() => setIsZoomed(false)}
                className="absolute top-4 right-4 text-white text-2xl bg-black/50 hover:bg-black/70 p-2 rounded-full"
                aria-label="إغلاق التكبير"
              >
                ✕
              </button>
            </div>
          </div>
        )}
    </div>
  );
} 