'use client';

import BackToAuctionsButton from '@/components/shared/BackToAuctionsButton';

export default function MedicalAuctionPage() {
  return (
    <div className="container mx-auto p-4 py-8">
      <div className="mb-6">
        <BackToAuctionsButton />
      </div>
      
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="uppercase tracking-wide text-lg text-teal-500 font-semibold mb-2">الأجهزة الطبية المستعملة</div>
          <h1 className="text-3xl font-bold mb-6">معدات وأجهزة طبية بحالة ممتازة</h1>
          
          <div className="prose lg:prose-lg mb-6">
            <p>نقدم مجموعة متنوعة من الأجهزة والمعدات الطبية المستعملة بحالة جيدة وبأسعار تنافسية.</p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">مميزات مزاد الأجهزة الطبية:</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>أجهزة ومعدات طبية معتمدة وذات جودة عالية</li>
              <li>جميع الأجهزة تم فحصها والتأكد من سلامتها</li>
              <li>أسعار أولية تنافسية</li>
              <li>مناسبة للعيادات والمستشفيات الصغيرة</li>
              <li>صيانة دورية سابقة موثقة</li>
            </ul>
            
            <p className="mt-6">ترقبوا مزاداتنا القادمة للأجهزة والمعدات الطبية المستعملة من مختلف التخصصات.</p>
          </div>
          
          <div className="mt-8 text-center">
            <div className="inline-block px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-teal-500 hover:bg-teal-600">
              المزادات القادمة قريباً
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
