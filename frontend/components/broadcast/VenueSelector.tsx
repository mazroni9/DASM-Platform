import React from 'react';
import { MapPin, Clock, User, Tv } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

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

// واجهة خصائص المكون
interface VenueSelectorProps {
  venues: Venue[];
  selectedVenue: Venue | null;
  onVenueSelect: (venue: Venue) => void;
  isLoading: boolean;
}

// تنسيق عدد المشاهدين
const formatViewers = (viewers: number): string => {
  if (viewers >= 1000) {
    return `${(viewers / 1000).toFixed(1)}K`;
  }
  return viewers.toString();
};

// الحصول على نص نوع المزاد بالعربية
const getAuctionTypeText = (type: string): string => {
  switch (type) {
    case 'live':
      return 'مزاد مباشر';
    case 'silent':
      return 'مزاد صامت';
    case 'instant':
      return 'سوق فوري';
    default:
      return 'غير معروف';
  }
};

// ترجمة الفترة الزمنية إلى العربية
const formatTimeDistance = (date: string): string => {
  try {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true,
      locale: ar
    });
  } catch (error) {
    return 'تاريخ غير صالح';
  }
};

export default function VenueSelector({ venues, selectedVenue, onVenueSelect, isLoading }: VenueSelectorProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-medium text-gray-800 mb-4">المعارض المتاحة</h2>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 border border-gray-200 rounded-md">
              <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-medium text-gray-800 mb-4">المعارض المتاحة</h2>
        <div className="text-center p-6 text-gray-500">
          لا توجد معارض متاحة بناءً على معايير التصفية
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-medium text-gray-800 mb-4">المعارض المتاحة</h2>
      <div className="space-y-3">
        {venues.map((venue) => (
          <div
            key={venue.id}
            onClick={() => onVenueSelect(venue)}
            className={`p-3 border rounded-md cursor-pointer transition-all hover:border-teal-500 hover:shadow-sm ${
              selectedVenue?.id === venue.id
                ? 'border-teal-500 bg-teal-50'
                : 'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-gray-800">{venue.name}</h3>
              {venue.isLive && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse mr-1"></span>
                  مباشر
                </span>
              )}
            </div>
            
            <div className="mt-2 flex items-start space-x-2 rtl:space-x-reverse">
              <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">{venue.location}</p>
            </div>
            
            <div className="mt-1 flex items-start space-x-2 rtl:space-x-reverse">
              <Clock className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                {venue.isLive ? 'مباشر الآن' : formatTimeDistance(venue.startTime)}
              </p>
            </div>
            
            <div className="flex justify-between items-center mt-3 border-t pt-2">
              <span className="text-xs flex items-center text-gray-500">
                <Tv className="h-3.5 w-3.5 ml-1" />
                {getAuctionTypeText(venue.auctionType)}
              </span>
              
              {venue.currentViewers > 0 && (
                <span className="text-xs flex items-center text-gray-500">
                  <User className="h-3.5 w-3.5 ml-1" />
                  {formatViewers(venue.currentViewers)} مشاهد
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 