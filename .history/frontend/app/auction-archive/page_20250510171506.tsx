/**
 * 📝 الصفحة: أرشيف المزادات
 * 📁 المسار: frontend/app/auction-archive/page.tsx
 *
 * ✅ الوظيفة:
 * - عرض تاريخ المزادات السابقة مع إمكانية البحث والتصفية
 * - توفير روابط للوصول إلى تسجيلات المزادات مع البيانات المرتبطة
 * - عرض إحصائيات وتحليلات عن المزادات الماضية
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Search, Calendar, ChevronDown, Filter, Zap, Car, ChevronLeft } from 'lucide-react';
import AuctionHistoryRecord from '@/components/archive/AuctionHistoryRecord';
import { AuctionHistoryData } from '@/components/archive/AuctionHistoryRecord';

interface FilterOptions {
  period: 'all' | 'week' | 'month' | 'quarter';
  category: string;
  sorting: 'date-desc' | 'date-asc' | 'sales-desc' | 'cars-desc';
}

export default function AuctionArchivePage() {
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState<AuctionHistoryData[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<AuctionHistoryData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    period: 'all',
    category: 'all',
    sorting: 'date-desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalAuctions: 0,
    totalSales: 0,
    totalCars: 0,
    avgSalePrice: 0
  });
  
  // محاكاة جلب البيانات من الخادم
  useEffect(() => {
    const fetchAuctions = async () => {
      setLoading(true);
      
      try {
        // محاكاة تأخير الشبكة
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // بيانات تجريبية للمزادات
        const mockAuctions: AuctionHistoryData[] = [
          {
            id: 1,
            title: 'مزاد السيارات الفاخرة - الرياض 2023',
            date: '2023-11-15T18:00:00Z',
            venue: 'معرض الرياض للسيارات',
            location: 'الرياض - حي العليا',
            thumbnailUrl: 'https://example.com/images/auction1.jpg',
            recordingUrl: 'https://example.com/videos/auction1.mp4',
            duration: 180, // 3 ساعات
            totalCars: 25,
            soldCars: 22,
            totalBids: 348,
            totalParticipants: 156,
            totalSales: 8750000,
            cars: [],
            hasHighlights: true
          },
          {
            id: 2,
            title: 'مزاد السيارات الكلاسيكية - جدة',
            date: '2023-10-22T19:00:00Z',
            venue: 'صالة المزادات الكبرى',
            location: 'جدة - حي الحمراء',
            thumbnailUrl: 'https://example.com/images/auction2.jpg',
            recordingUrl: 'https://example.com/videos/auction2.mp4',
            duration: 150, // 2.5 ساعة
            totalCars: 15,
            soldCars: 12,
            totalBids: 187,
            totalParticipants: 92,
            totalSales: 6320000,
            cars: [],
            hasHighlights: true
          },
          {
            id: 3,
            title: 'مزاد السيارات الرياضية - الرياض',
            date: '2023-10-10T17:30:00Z',
            venue: 'قاعة الملك فهد',
            location: 'الرياض - طريق الملك فهد',
            thumbnailUrl: 'https://example.com/images/auction3.jpg',
            recordingUrl: 'https://example.com/videos/auction3.mp4',
            duration: 120, // ساعتان
            totalCars: 18,
            soldCars: 15,
            totalBids: 231,
            totalParticipants: 115,
            totalSales: 7450000,
            cars: [],
            hasHighlights: false
          },
          {
            id: 4,
            title: 'مزاد سيارات المدينة الشهري',
            date: '2023-09-28T18:00:00Z',
            venue: 'قاعة المدينة للمزادات',
            location: 'المدينة المنورة - المنطقة المركزية',
            thumbnailUrl: 'https://example.com/images/auction4.jpg',
            recordingUrl: 'https://example.com/videos/auction4.mp4',
            duration: 165, // 2.75 ساعة
            totalCars: 20,
            soldCars: 18,
            totalBids: 275,
            totalParticipants: 128,
            totalSales: 5820000,
            cars: [],
            hasHighlights: true
          },
          {
            id: 5,
            title: 'مزاد السيارات الاقتصادية - الدمام',
            date: '2023-09-15T16:00:00Z',
            venue: 'مركز الدمام التجاري',
            location: 'الدمام - حي العزيزية',
            thumbnailUrl: 'https://example.com/images/auction5.jpg',
            recordingUrl: 'https://example.com/videos/auction5.mp4',
            duration: 150, // 2.5 ساعة
            totalCars: 30,
            soldCars: 28,
            totalBids: 320,
            totalParticipants: 145,
            totalSales: 4250000,
            cars: [],
            hasHighlights: false
          },
          {
            id: 6,
            title: 'مزاد سيارات الدفع الرباعي - أبها',
            date: '2023-09-05T17:00:00Z',
            venue: 'مركز أبها للمزادات',
            location: 'أبها - حي النسيم',
            thumbnailUrl: 'https://example.com/images/auction6.jpg',
            recordingUrl: 'https://example.com/videos/auction6.mp4',
            duration: 135, // 2.25 ساعة
            totalCars: 16,
            soldCars: 14,
            totalBids: 190,
            totalParticipants: 85,
            totalSales: 5150000,
            cars: [],
            hasHighlights: true
          }
        ];
        
        setAuctions(mockAuctions);
        setFilteredAuctions(mockAuctions);
        
        // حساب الإحصائيات
        const totalAuctions = mockAuctions.length;
        const totalSales = mockAuctions.reduce((sum, auction) => sum + auction.totalSales, 0);
        const totalCars = mockAuctions.reduce((sum, auction) => sum + auction.soldCars, 0);
        const avgSalePrice = totalCars > 0 ? totalSales / totalCars : 0;
        
        setStats({
          totalAuctions,
          totalSales,
          totalCars,
          avgSalePrice
        });
      } catch (error) {
        console.error('خطأ في جلب بيانات الأرشيف:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuctions();
  }, []);
  
  // تصفية المزادات بناءً على المعايير
  useEffect(() => {
    let filtered = [...auctions];
    
    // تطبيق البحث النصي
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(auction => 
        auction.title.toLowerCase().includes(query) ||
        auction.venue.toLowerCase().includes(query) ||
        auction.location.toLowerCase().includes(query)
      );
    }
    
    // تطبيق تصفية الفترة الزمنية
    if (filters.period !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (filters.period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(auction => new Date(auction.date) >= startDate);
    }
    
    // تطبيق تصفية الفئة
    if (filters.category !== 'all') {
      // مثال لمحاكاة التصفية - في الواقع ستعتمد على البيانات الفعلية
      filtered = filtered.filter(auction => auction.title.includes(filters.category));
    }
    
    // تطبيق الترتيب
    switch (filters.sorting) {
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'sales-desc':
        filtered.sort((a, b) => b.totalSales - a.totalSales);
        break;
      case 'cars-desc':
        filtered.sort((a, b) => b.soldCars - a.soldCars);
        break;
    }
    
    setFilteredAuctions(filtered);
  }, [auctions, searchQuery, filters]);
  
  // معالجة تغيير التصفية
  const handleFilterChange = (filterType: keyof FilterOptions, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  
  // تنسيق المبلغ المالي
  const formatMoney = (amount: number): string => {
    return amount.toLocaleString('ar-SA');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-12">
      <div className="container mx-auto px-4">
        {/* رأس الصفحة */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">أرشيف المزادات</h1>
            <p className="text-gray-600">استعرض المزادات السابقة واستفد من تجارب المزايدين</p>
          </div>
          
          {/* شريط البحث */}
          <div className="relative w-full md:w-64 mt-4 md:mt-0">
            <input
              type="text"
              placeholder="ابحث عن مزاد..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        {/* لوحة الإحصائيات */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border-r border-gray-100 p-3">
            <div className="text-sm text-gray-500 mb-1">إجمالي المزادات</div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalAuctions}</div>
          </div>
          <div className="border-r border-gray-100 p-3">
            <div className="text-sm text-gray-500 mb-1">إجمالي المبيعات</div>
            <div className="text-2xl font-bold text-teal-600">{formatMoney(stats.totalSales)} ريال</div>
          </div>
          <div className="border-r border-gray-100 p-3">
            <div className="text-sm text-gray-500 mb-1">السيارات المباعة</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalCars}</div>
          </div>
          <div className="p-3">
            <div className="text-sm text-gray-500 mb-1">متوسط سعر البيع</div>
            <div className="text-2xl font-bold text-purple-600">{formatMoney(stats.avgSalePrice)} ريال</div>
          </div>
        </div>
        
        {/* شريط التصفية */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-700">تصفية وترتيب المزادات</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-teal-600 text-sm flex items-center focus:outline-none"
              title={showFilters ? "إخفاء خيارات التصفية" : "إظهار خيارات التصفية"}
            >
              <Filter className="h-4 w-4 ml-1" />
              {showFilters ? 'إخفاء' : 'إظهار'} خيارات التصفية
              <ChevronDown className={`h-4 w-4 mr-1 transition-transform duration-200 ${showFilters ? 'transform rotate-180' : ''}`} />
            </button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
              {/* فلتر الفترة الزمنية */}
              <div>
                <label htmlFor="period-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  الفترة الزمنية
                </label>
                <select
                  id="period-filter"
                  value={filters.period}
                  onChange={e => handleFilterChange('period', e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="all">جميع الفترات</option>
                  <option value="week">آخر أسبوع</option>
                  <option value="month">آخر شهر</option>
                  <option value="quarter">آخر ثلاثة أشهر</option>
                </select>
              </div>
              
              {/* فلتر الفئة */}
              <div>
                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  فئة المزاد
                </label>
                <select
                  id="category-filter"
                  value={filters.category}
                  onChange={e => handleFilterChange('category', e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="all">جميع الفئات</option>
                  <option value="فاخرة">السيارات الفاخرة</option>
                  <option value="كلاسيكية">السيارات الكلاسيكية</option>
                  <option value="رياضية">السيارات الرياضية</option>
                  <option value="اقتصادية">السيارات الاقتصادية</option>
                  <option value="رباعي">سيارات الدفع الرباعي</option>
                </select>
              </div>
              
              {/* ترتيب النتائج */}
              <div>
                <label htmlFor="sorting-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  ترتيب النتائج
                </label>
                <select
                  id="sorting-filter"
                  value={filters.sorting}
                  onChange={e => handleFilterChange('sorting', e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="date-desc">الأحدث أولاً</option>
                  <option value="date-asc">الأقدم أولاً</option>
                  <option value="sales-desc">الأعلى مبيعات</option>
                  <option value="cars-desc">الأكثر سيارات</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* عرض النتائج */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAuctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuctions.map(auction => (
              <AuctionHistoryRecord 
                key={auction.id} 
                auction={auction} 
                showDetails={false}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mb-4">
              <Car className="h-12 w-12 mx-auto text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد مزادات متطابقة</h3>
            <p className="text-gray-500 mb-4">جرّب تغيير معايير البحث أو التصفية للحصول على نتائج</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilters({
                  period: 'all',
                  category: 'all',
                  sorting: 'date-desc'
                });
              }}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              عرض كل المزادات
              <ChevronLeft className="h-4 w-4 mr-1" />
            </button>
          </div>
        )}
        
        {/* رابط للمزيد من المزادات */}
        {filteredAuctions.length > 0 && !loading && (
          <div className="mt-8 text-center">
            <button className="inline-flex items-center px-6 py-2.5 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors">
              تحميل المزيد من المزادات
              <ChevronDown className="h-5 w-5 mr-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 