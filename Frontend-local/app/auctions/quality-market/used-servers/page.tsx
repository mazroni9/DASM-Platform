/**
 * 📝 الصفحة: عرض السيرفرات المستعملة
 * 📁 المسار: Frontend-local/app/auctions/quality-market/used-servers/page.tsx
 * 
 * ✅ الوظيفة:
 * - تعرض قائمة السيرفرات المستعملة المتاحة للبيع
 * - تعرض صورًا ومعلومات أساسية عن كل سيرفر
 * - تسمح بالانتقال إلى صفحة تفاصيل السيرفر
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
  const [searchTerm, setSearchTerm] = useState('');

  // ترجمة حالة السيرفر
  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'new': return 'جديد';
      case 'excellent': return 'مستعمل ممتاز';
      case 'good': return 'مستعمل مقبول';
      default: return condition;
    }
  };

  // استرجاع بيانات السيرفرات
  useEffect(() => {
    const fetchServers = async () => {
      setIsLoading(true);
      try {
        // استدعاء API لجلب السيرفرات المستعملة
        const response = await fetch('/api/products?category=السيرفرات');
        
        if (!response.ok) {
          throw new Error('فشل في جلب بيانات السيرفرات');
        }
        
        const data = await response.json();
        
        // معالجة البيانات بعد استلامها
        const serversData = data.products.map((product: any) => ({
          ...product,
          // تحويل سلسلة JSON إلى مصفوفة إذا كانت الصور مخزنة كسلسلة
          images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images
        }));
        
        setServers(serversData);
      } catch (err) {
        console.error("خطأ في جلب البيانات:", err);
        setError('حدث خطأ أثناء تحميل بيانات السيرفرات. يرجى المحاولة مرة أخرى.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServers();
  }, []);

  // تصفية السيرفرات حسب البحث
  const filteredServers = servers.filter(server => 
    server.name.includes(searchTerm) || 
    server.description.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 py-6">
        <div className="container mx-auto px-4">
          <Link 
            href="/auctions" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى الأسواق الرئيسية</span>
          </Link>
          <div className="flex items-center">
            <Server className="text-white mr-3 h-8 w-8" />
            <h1 className="text-3xl font-bold text-white">السيرفرات المستعملة</h1>
          </div>
          <p className="text-white/80 mt-2">
            تصفح مجموعة من السيرفرات المستعملة بمواصفات متنوعة وأسعار تنافسية
          </p>
        </div>
      </div>

      {/* محتوى الصفحة */}
      <div className="container mx-auto px-4 py-8">
        {/* شريط البحث والفلترة */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث عن سيرفر..."
                className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
            </div>
            
            <Link 
              href="/forms/server-market-entry" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center"
            >
              <Database className="ml-2" size={18} />
              <span>إضافة سيرفر للبيع</span>
            </Link>
          </div>
        </div>

        {/* عرض رسالة التحميل */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg text-gray-600">جاري تحميل السيرفرات...</p>
          </div>
        )}

        {/* عرض رسالة الخطأ */}
        {error && !isLoading && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-8">
            <p className="font-medium">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-sm text-red-600 hover:underline"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        )}

        {/* عرض رسالة عندما لا توجد نتائج للبحث */}
        {!isLoading && !error && filteredServers.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FilterX size={48} className="mx-auto text-gray-400 mb-3" />
            {searchTerm ? (
              <>
                <h3 className="text-xl font-bold text-gray-700 mb-2">لم يتم العثور على نتائج</h3>
                <p className="text-gray-500">لا توجد سيرفرات تطابق بحثك "{searchTerm}"</p>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                >
                  إظهار جميع السيرفرات
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد سيرفرات متاحة حاليًا</h3>
                <p className="text-gray-500">لم يتم إضافة أي سيرفرات للبيع بعد</p>
                <Link 
                  href="/forms/server-market-entry" 
                  className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  كن أول من يضيف سيرفر للبيع
                </Link>
              </>
            )}
          </div>
        )}

        {/* عرض قائمة السيرفرات */}
        {!isLoading && !error && filteredServers.length > 0 && (
          <>
            <p className="text-gray-600 mb-4">تم العثور على {filteredServers.length} سيرفر</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServers.map((server) => (
                <div 
                  key={server.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition"
                >
                  {/* صورة السيرفر */}
                  <div className="relative h-48 bg-gray-100">
                    {server.images && server.images.length > 0 ? (
                      <Image 
                        src={server.images[0]} 
                        alt={server.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Server size={64} className="text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-lg text-sm">
                      {getConditionLabel(server.condition)}
                    </div>
                  </div>
                  
                  {/* بيانات السيرفر */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 truncate">{server.name}</h3>
                    <p className="text-gray-600 text-sm h-12 overflow-hidden">
                      {server.description.substring(0, 90)}
                      {server.description.length > 90 ? '...' : ''}
                    </p>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-blue-700 font-bold">
                        {server.price.toLocaleString()} ريال
                      </span>
                      <Link 
                        href={`/auctions/quality-market/used-servers/${server.id}`}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded transition text-sm"
                      >
                        عرض التفاصيل
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 