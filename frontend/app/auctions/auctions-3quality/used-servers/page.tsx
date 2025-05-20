/**
 * 📝 الصفحة: عرض السيرفرات المستعملة
 * 📁 المسار: Frontend-local/app/auctions/auctions-3quality/used-servers/page.tsx
 * 
 * ✅ الوظيفة:
 * - تعرض قائمة السيرفرات المستعملة المتاحة للبيع
 * - تعرض صورًا ومعلومات أساسية عن كل سيرفر
 * - تسمح بالانتقال إلى صفحة تفاصيل السيرفر
 * 
 * 🔄 الارتباطات:
 * - ترتبط مع: صفحة تفاصيل السيرفر (/auctions/auctions-3quality/used-servers/[id])
 * - تعود إلى: صفحة السوق النوعي (/auctions/auctions-3quality)
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Database, FilterX, Search, Server, SortAsc, Tag } from 'lucide-react';

// واجهة نموذج البيانات للسيرفرات
interface ServerProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  condition: string;
  images: string[];
  created_at: string;
}

export default function UsedServersPage() {
  const router = useRouter();
  const [servers, setServers] = useState<ServerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'price-asc' | 'price-desc' | 'newest'>('newest');
  const [conditionFilter, setConditionFilter] = useState<string | null>(null);

  // جلب بيانات السيرفرات
  useEffect(() => {
    const fetchServers = async () => {
      setIsLoading(true);
      try {
        // محاكاة استدعاء API
        // في التطبيق الحقيقي سيتم استبدال هذا باستدعاء API فعلي
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // بيانات تجريبية للعرض
        const mockServers: ServerProduct[] = [
          {
            id: 1,
            name: 'سيرفر HP ProLiant DL380 Gen10',
            description: 'سيرفر مستعمل بحالة ممتازة مع معالجين Intel Xeon Silver وذاكرة 64GB',
            price: 8500,
            condition: 'excellent',
            images: ['/servers/server1.jpg', '/servers/server1-2.jpg'],
            created_at: '2023-05-15T14:30:00Z'
          },
          {
            id: 2,
            name: 'سيرفر Dell PowerEdge R740',
            description: 'سيرفر بأداء فائق مع وحدات تخزين SSD بسعة 2TB',
            price: 10200,
            condition: 'good',
            images: ['/servers/server2.jpg'],
            created_at: '2023-06-02T10:15:00Z'
          },
          {
            id: 3,
            name: 'Cisco UCS C240 M5',
            description: 'سيرفر كامل المواصفات مناسب للشركات وتطبيقات الأعمال المتوسطة',
            price: 7800,
            condition: 'good',
            images: ['/servers/server3.jpg', '/servers/server3-2.jpg', '/servers/server3-3.jpg'],
            created_at: '2023-04-28T09:45:00Z'
          },
          {
            id: 4,
            name: 'IBM Power System S924',
            description: 'سيرفر قوي للتطبيقات الحسابية المعقدة وقواعد البيانات الكبيرة',
            price: 15000,
            condition: 'excellent',
            images: ['/servers/server4.jpg'],
            created_at: '2023-05-20T11:30:00Z'
          },
          {
            id: 5,
            name: 'Lenovo ThinkSystem SR650',
            description: 'سيرفر اقتصادي مناسب للشركات الناشئة والمشاريع الصغيرة',
            price: 6200,
            condition: 'good',
            images: ['/servers/server5.jpg', '/servers/server5-2.jpg'],
            created_at: '2023-06-10T13:20:00Z'
          }
        ];

        setServers(mockServers);
      } catch (err) {
        console.error("خطأ في جلب البيانات:", err);
        setError('حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServers();
  }, []);

  // مرشح للبحث والفلترة
  const filteredServers = servers
    .filter(server => 
      (searchQuery === '' || 
       server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       server.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .filter(server => 
      (conditionFilter === null || server.condition === conditionFilter)
    )
    .sort((a, b) => {
      if (sortOrder === 'price-asc') return a.price - b.price;
      if (sortOrder === 'price-desc') return b.price - a.price;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // ترجمة حالة السيرفر
  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'new': return 'جديد';
      case 'excellent': return 'مستعمل ممتاز';
      case 'good': return 'مستعمل مقبول';
      default: return condition;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-6">
        <div className="container mx-auto px-4">
          <Link 
            href="/auctions/auctions-3quality" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى السوق النوعي</span>
          </Link>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Server className="text-white ml-3" size={24} />
              <h1 className="text-3xl font-bold text-white">السيرفرات المستعملة</h1>
            </div>
            <p className="text-white/80">سيرفرات وأجهزة تخزين وشبكات بمواصفات جيدة للأعمال والشركات</p>
          </div>
        </div>
      </div>
      
      {/* محتوى الصفحة */}
      <div className="container mx-auto px-4 py-8">
        {/* أدوات البحث والفلترة */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* البحث */}
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full p-2 pr-10 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-right"
                placeholder="ابحث عن سيرفر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* الفرز */}
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                الترتيب حسب
              </label>
              <div className="relative">
                <select
                  id="sort"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="block w-full p-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-right"
                >
                  <option value="newest">الأحدث</option>
                  <option value="price-asc">السعر: من الأقل إلى الأعلى</option>
                  <option value="price-desc">السعر: من الأعلى إلى الأقل</option>
                </select>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <SortAsc className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* فلترة الحالة */}
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                حالة السيرفر
              </label>
              <div className="relative">
                <select
                  id="condition"
                  value={conditionFilter ?? ''}
                  onChange={(e) => setConditionFilter(e.target.value === '' ? null : e.target.value)}
                  className="block w-full p-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-right"
                >
                  <option value="">جميع الحالات</option>
                  <option value="excellent">مستعمل ممتاز</option>
                  <option value="good">مستعمل مقبول</option>
                  <option value="new">جديد</option>
                </select>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Tag className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
          
          {/* زر إعادة تعيين الفلاتر */}
          {(searchQuery || conditionFilter || sortOrder !== 'newest') && (
            <div className="mt-4 flex justify-start">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setConditionFilter(null);
                  setSortOrder('newest');
                }}
                className="flex items-center text-blue-600 hover:text-blue-800 transition text-sm"
              >
                <FilterX size={16} className="ml-1" />
                <span>إعادة تعيين الفلاتر</span>
              </button>
            </div>
          )}
        </div>
        
        {isLoading ? (
          // حالة التحميل
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-lg text-gray-600">جاري تحميل السيرفرات...</p>
            </div>
          </div>
        ) : error ? (
          // حالة الخطأ
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p>{error}</p>
          </div>
        ) : filteredServers.length === 0 ? (
          // لا توجد نتائج
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <Database size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد سيرفرات متطابقة</h3>
            <p className="text-gray-500 mb-4">
              لم نتمكن من العثور على سيرفرات تطابق معايير البحث الخاصة بك
            </p>
          </div>
        ) : (
          // عرض قائمة السيرفرات
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServers.map((server) => (
              <div key={server.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
                {/* صورة السيرفر */}
                <div className="relative h-48 bg-gray-100">
                  {server.images && server.images.length > 0 ? (
                    <Image 
                      src={server.images[0]} 
                      alt={server.name}
                      fill
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Server size={64} className="text-gray-200" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    {getConditionLabel(server.condition)}
                  </div>
                </div>
                
                {/* تفاصيل السيرفر */}
                <div className="p-4">
                  <h2 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1">{server.name}</h2>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{server.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-blue-700">{server.price.toLocaleString()} ريال</span>
                    <Link 
                      href={`/auctions/auctions-3quality/used-servers/${server.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition text-sm"
                    >
                      عرض التفاصيل
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
