'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Calendar, ChevronDown } from 'lucide-react';
import BroadcastPlayer from '@/components/broadcast/BroadcastPlayer';
import VenueSelector from '@/components/broadcast/VenueSelector';
import AuctionInfo from '@/components/broadcast/AuctionInfo';

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

// واجهة للتصفية
interface FilterOptions {
  region: string;
  auctionType: string;
  onlyLive: boolean;
}

export default function BroadcastsPage() {
  // حالة المعارض
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // حالة التصفية
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    region: 'all',
    auctionType: 'all',
    onlyLive: false,
  });

  // المناطق المتاحة للتصفية
  const regions = [
    { id: 'all', name: 'جميع المناطق' },
    { id: 'central', name: 'المنطقة الوسطى' },
    { id: 'eastern', name: 'المنطقة الشرقية' },
    { id: 'western', name: 'المنطقة الغربية' },
    { id: 'northern', name: 'المنطقة الشمالية' },
    { id: 'southern', name: 'المنطقة الجنوبية' },
  ];

  // أنواع المزادات المتاحة
  const auctionTypes = [
    { id: 'all', name: 'جميع أنواع المزادات' },
    { id: 'live', name: 'مزاد مباشر' },
    { id: 'silent', name: 'مزاد صامت' },
    { id: 'instant', name: 'سوق فوري' },
  ];

  // جلب بيانات المعارض
  useEffect(() => {
    const fetchVenues = async () => {
      setIsLoading(true);
      try {
        // في بيئة الإنتاج، سنستخدم طلب API
        // لكن هنا نستخدم بيانات تجريبية
        const mockVenues: Venue[] = [
          {
            id: 'venue1',
            name: 'معرض الرياض للسيارات',
            location: 'الرياض، حي المعذر',
            region: 'central',
            youtubeChannel: 'UC1234567890',
            youtubeVideoId: 'jfKfPfyJRdk', // قناة تجريبية مباشرة
            isLive: true,
            startTime: '2023-10-20T18:00:00Z',
            auctionType: 'live',
            currentViewers: 1253,
          },
          {
            id: 'venue2',
            name: 'معرض الدمام للسيارات الفاخرة',
            location: 'الدمام، حي الشاطئ',
            region: 'eastern',
            youtubeChannel: 'UC0987654321',
            youtubeVideoId: 'QUvIWl3GWbs', // قناة تجريبية مباشرة
            isLive: true,
            startTime: '2023-10-20T19:30:00Z',
            auctionType: 'live',
            currentViewers: 892,
          },
          {
            id: 'venue3',
            name: 'معرض جدة للسيارات',
            location: 'جدة، حي الشرفية',
            region: 'western',
            youtubeChannel: 'UC1122334455',
            youtubeVideoId: '5qap5aO4i9A', // قناة تجريبية مباشرة
            isLive: true,
            startTime: '2023-10-20T20:00:00Z',
            auctionType: 'live',
            currentViewers: 743,
          },
          {
            id: 'venue4',
            name: 'سوق السيارات الفوري - الرياض',
            location: 'الرياض، حي العليا',
            region: 'central',
            youtubeChannel: 'UC5566778899',
            youtubeVideoId: '',
            isLive: false,
            startTime: '2023-10-21T18:00:00Z',
            auctionType: 'instant',
            currentViewers: 0,
          },
          {
            id: 'venue5',
            name: 'معرض الخبر للسيارات',
            location: 'الخبر، حي اليرموك',
            region: 'eastern',
            youtubeChannel: 'UC9988776655',
            youtubeVideoId: '',
            isLive: false,
            startTime: '2023-10-22T19:00:00Z',
            auctionType: 'silent',
            currentViewers: 0,
          }
        ];

        setVenues(mockVenues);
        setFilteredVenues(mockVenues);
        // تعيين أول معرض مباشر كمعرض افتراضي
        const liveVenue = mockVenues.find(venue => venue.isLive);
        setSelectedVenue(liveVenue || mockVenues[0]);
      } catch (error) {
        console.error('خطأ في جلب بيانات المعارض:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVenues();
  }, []);

  // تطبيق التصفية على المعارض
  useEffect(() => {
    let filtered = [...venues];

    // تطبيق البحث النصي
    if (searchQuery) {
      filtered = filtered.filter(venue =>
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // تطبيق تصفية المنطقة
    if (filters.region !== 'all') {
      filtered = filtered.filter(venue => venue.region === filters.region);
    }

    // تطبيق تصفية نوع المزاد
    if (filters.auctionType !== 'all') {
      filtered = filtered.filter(venue => venue.auctionType === filters.auctionType);
    }

    // تطبيق تصفية المعارض المباشرة فقط
    if (filters.onlyLive) {
      filtered = filtered.filter(venue => venue.isLive);
    }

    setFilteredVenues(filtered);
  }, [searchQuery, filters, venues]);

  // التعامل مع تغيير التصفية
  const handleFilterChange = (filterType: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // التعامل مع تحديد معرض
  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">بث المعارض المباشر</h1>
          <p className="text-gray-600 mt-2">شاهد المزادات المباشرة من المعارض المختلفة عبر المملكة</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* العمود الأيمن: قائمة المعارض والتصفية */}
          <div className="lg:col-span-1 space-y-4">
            {/* شريط البحث والتصفية */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث عن معرض..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              
              <div className="mt-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center text-sm text-gray-600"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  <span>تصفية المعارض</span>
                  <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showFilters ? 'transform rotate-180' : ''}`} />
                </button>
                
                {showFilters && (
                  <div className="mt-3 space-y-3 border-t pt-3">
                    {/* تصفية المنطقة */}
                    <div>
                      <label htmlFor="region-filter" className="block text-sm font-medium text-gray-700 mb-1">المنطقة</label>
                      <select
                        id="region-filter"
                        value={filters.region}
                        onChange={(e) => handleFilterChange('region', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        title="تصفية حسب المنطقة"
                      >
                        {regions.map(region => (
                          <option key={region.id} value={region.id}>{region.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* تصفية نوع المزاد */}
                    <div>
                      <label htmlFor="auction-type-filter" className="block text-sm font-medium text-gray-700 mb-1">نوع المزاد</label>
                      <select
                        id="auction-type-filter"
                        value={filters.auctionType}
                        onChange={(e) => handleFilterChange('auctionType', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        title="تصفية حسب نوع المزاد"
                      >
                        {auctionTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* تصفية المعارض المباشرة */}
                    <div className="flex items-center">
                      <input
                        id="onlyLive"
                        type="checkbox"
                        checked={filters.onlyLive}
                        onChange={(e) => handleFilterChange('onlyLive', e.target.checked)}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                      />
                      <label htmlFor="onlyLive" className="mr-2 block text-sm text-gray-700">
                        المعارض المباشرة فقط
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* قائمة المعارض */}
            <VenueSelector
              venues={filteredVenues}
              selectedVenue={selectedVenue}
              onVenueSelect={handleVenueSelect}
              isLoading={isLoading}
            />
          </div>
          
          {/* العمود الأيسر: عرض البث ومعلومات المزاد */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
              </div>
            ) : selectedVenue ? (
              <>
                {/* مشغل البث */}
                <BroadcastPlayer venue={selectedVenue} />
                
                {/* معلومات المزاد */}
                <AuctionInfo venueId={selectedVenue.id} />
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center justify-center h-96 text-center">
                <div className="p-3 bg-teal-50 rounded-full mb-4">
                  <Calendar className="h-8 w-8 text-teal-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">لم يتم اختيار أي معرض</h3>
                <p className="text-gray-500 mb-4">يرجى اختيار معرض من القائمة لمشاهدة البث المباشر</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 