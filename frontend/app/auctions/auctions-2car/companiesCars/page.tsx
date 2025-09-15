'use client';

import LoadingLink from "@/components/LoadingLink";
import { ChevronLeft } from 'lucide-react';

export default function CompanyCarsAuctionPage() {
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
          <div className="uppercase tracking-wide text-lg text-indigo-500 font-semibold mb-2">سوق سيارات الشركات</div>
          <h1 className="text-3xl font-bold mb-6">سيارات الشركات بتاريخ صيانة موثق</h1>
          
          <div className="prose lg:prose-lg mb-6">
            <p>نقدم لكم أسواق مميزة لسيارات الشركات المستعملة والرجيعة بحالة ممتازة وبأسعار تنافسية.</p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">مميزات سوق سيارات الشركات:</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>سيارات بتاريخ صيانة كامل وموثق</li>
              <li>فحص فني شامل لجميع السيارات</li>
              <li>سيارات بحالة ممتازة تم استخدامها في الشركات</li>
              <li>تنوع في الموديلات والفئات</li>
              <li>أسعار أولية مناسبة وتنافسية</li>
            </ul>
            
            <p className="mt-6">ترقبوا أسواقنا القادمة لسيارات الشركات المميزة من مختلف الماركات والموديلات.</p>
          </div>
          
          <div className="mt-8 text-center">
            <div className="inline-block px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600">
              الأسواق القادمة قريباً
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
