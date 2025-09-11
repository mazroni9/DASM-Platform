'use client';

import LoadingLink from "@/components/LoadingLink";
import { ChevronLeft } from 'lucide-react';

export default function GovernmentAuctionPage() {
  return (
    <div className="container mx-auto p-4 py-8">
      <div className="mb-6">
        <LoadingLink 
          href="/auctions/auctions-2car" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-4 py-2 rounded-full border border-blue-200 hover:border-blue-300 bg-white hover:bg-blue-50 rtl:flex-row-reverse"
        >
          <ChevronLeft className="h-4 w-4 rtl:ml-1 ltr:mr-1" />
          <span>العودة لقطاع السيارات</span>
        </LoadingLink>
      </div>
      
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="uppercase tracking-wide text-lg text-red-600 font-semibold mb-2">سوق السيارات الحكومية المستعملة</div>
          <h1 className="text-3xl font-bold mb-6">مركبات حكومية بحالة ممتازة</h1>
          
          <div className="prose lg:prose-lg mb-6">
            <p>نقدم مجموعة متميزة من المركبات الحكومية المستعملة التي تم صيانتها بشكل دوري ومنتظم.</p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">مميزات سوق المركبات الحكومية:</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>جميع المركبات خضعت للصيانة الدورية</li>
              <li>تاريخ صيانة كامل وموثق</li>
              <li>فحص فني شامل لكل مركبة</li>
              <li>تنوع في الفئات والموديلات</li>
              <li>أسعار أولية مناسبة</li>
            </ul>
            
            <p className="mt-6">ترقبوا أسواقنا القادمة للمركبات الحكومية من مختلف الجهات والمؤسسات الحكومية.</p>
          </div>
          
          <div className="mt-8 text-center">
            <div className="inline-block px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
              الأسواق القادمة قريباً
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
