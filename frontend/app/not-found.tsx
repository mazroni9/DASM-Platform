'use client';

import Link from 'next/link';
import { Home, Search, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex items-center justify-center">
      <div className="container max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-blue-100">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-50 text-blue-500 p-4 rounded-full">
              <Search size={40} />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-800 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">الصفحة غير موجودة</h2>
          
          <p className="text-gray-600 mb-10 max-w-lg mx-auto text-lg">
            عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. ربما تم نقلها أو حذفها أو تغيير عنوانها.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link 
              href="/" 
              className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Home size={18} />
              <span>الرجوع للصفحة الرئيسية</span>
            </Link>
            
            <Link 
              href="/auctions" 
              className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <span>استكشاف الأسواق</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 