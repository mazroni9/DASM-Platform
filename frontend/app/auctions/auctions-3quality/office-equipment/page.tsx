'use client';

import React, { useState, useEffect } from 'react';
import LoadingLink from "@/components/LoadingLink";
import Image from 'next/image';
import { useLoadingRouter } from "@/hooks/useLoadingRouter";

import { ArrowLeft, Printer, FilterX, Search, Tag, SortAsc, Monitor, ChevronLeft } from 'lucide-react';

// واجهة نموذج البيانات للآلات المكتبية
interface OfficeProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  condition: string;
  images: string[];
  created_at: string;
}

export default function OfficeEquipmentPage() {
  const router = useLoadingRouter();
  
  const [products, setProducts] = useState<OfficeProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ترجمة حالة المنتج
  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'new': return 'جديد';
      case 'excellent': return 'ممتاز';
      case 'good': return 'جيد';
      default: return condition;
    }
  };

  // استرجاع بيانات المنتجات
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // استدعاء API لجلب الآلات المكتبية
        const response = await fetch('/api/products?category=الآلات المكتبية');
        
        if (!response.ok) {
          throw new Error('فشل في جلب بيانات المنتجات');
        }
        
        const data = await response.json();
        
        // معالجة البيانات بعد استلامها
        const productsData = data.products.map((product: any) => ({
          ...product,
          // تحويل سلسلة JSON إلى مصفوفة إذا كانت الصور مخزنة كسلسلة
          images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images
        }));
        
        setProducts(productsData);
      } catch (err) {
        console.error("خطأ في جلب البيانات:", err);
        setError('حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // تصفية المنتجات حسب البحث
  const filteredProducts = products.filter(product => 
    product.name.includes(searchTerm) || 
    product.description.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white py-8">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 py-6">
        <div className="container mx-auto px-4">
          <div className="mb-4">
            <LoadingLink 
              href="/auctions/auctions-quality" 
              className="inline-flex items-center text-white/90 hover:text-white transition-colors px-4 py-2 rounded-full border border-sky-400 hover:border-sky-300 bg-sky-600/50 hover:bg-sky-600/70 rtl:flex-row-reverse"
            >
              <ChevronLeft className="h-4 w-4 rtl:ml-1 ltr:mr-1" />
              <span>العودة للسوق النوعي</span>
            </LoadingLink>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Printer className="text-white ml-3 h-8 w-8" />
              <h1 className="text-3xl font-bold text-white">الآلات المكتبية المستعملة</h1>
            </div>
            <p className="text-white/80 mt-2">
              نقدم مجموعة متنوعة من المعدات المكتبية المستعملة بأسعار تنافسية
            </p>
          </div>
        </div>
      </div>

      {/* محتوى الصفحة */}
      <div className="container mx-auto px-4 py-8">
        {/* شريط البحث */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث عن منتج..."
                className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
              <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>
        </div>

        {/* عرض رسالة التحميل */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mb-4"></div>
            <p className="text-lg text-gray-600">جاري تحميل المنتجات...</p>
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
        {!isLoading && !error && filteredProducts.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FilterX size={48} className="mx-auto text-gray-400 mb-3" />
            {searchTerm ? (
              <>
                <h3 className="text-xl font-bold text-gray-700 mb-2">لم يتم العثور على نتائج</h3>
                <p className="text-gray-500">لا توجد منتجات تطابق بحثك "{searchTerm}"</p>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition"
                >
                  إظهار جميع المنتجات
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد منتجات متاحة حاليًا</h3>
                <p className="text-gray-500">لم يتم إضافة أي منتجات للبيع بعد</p>
              </>
            )}
          </div>
        )}

        {/* عرض قائمة المنتجات */}
        {!isLoading && !error && filteredProducts.length > 0 && (
          <>
            <p className="text-gray-600 mb-4">تم العثور على {filteredProducts.length} منتج</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition"
                >
                  {/* صورة المنتج */}
                  <div className="relative h-48 bg-gray-100">
                    {product.images && product.images.length > 0 ? (
                      <Image 
                        src={product.images[0]} 
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Monitor size={64} className="text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-sky-600 text-white px-2 py-1 rounded-lg text-sm">
                      {getConditionLabel(product.condition)}
                    </div>
                  </div>
                  
                  {/* بيانات المنتج */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 truncate">{product.name}</h3>
                    <p className="text-gray-600 text-sm h-12 overflow-hidden">
                      {product.description.substring(0, 90)}
                      {product.description.length > 90 ? '...' : ''}
                    </p>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sky-700 font-bold">
                        {product.price.toLocaleString()} ريال
                      </span>
                      <LoadingLink 
                        href={`/auctions/auctions-quality/office-equipment/${product.id}`}
                        className="bg-sky-100 hover:bg-sky-200 text-sky-800 px-3 py-1 rounded transition text-sm"
                      >
                        عرض التفاصيل
                      </LoadingLink>
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
