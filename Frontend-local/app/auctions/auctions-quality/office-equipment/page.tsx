'use client';

import BackToAuctionsButton from '@/components/shared/BackToAuctionsButton';

export default function OfficeEquipmentAuctionPage() {
  return (
    <div className="container mx-auto p-4 py-8">
      <div className="mb-6">
        <BackToAuctionsButton />
      </div>
      
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="uppercase tracking-wide text-lg text-sky-500 font-semibold mb-2">الآلات المكتبية المستعملة</div>
          <h1 className="text-3xl font-bold mb-6">معدات وأجهزة مكتبية بأسعار تنافسية</h1>
          
          <div className="prose lg:prose-lg mb-6">
            <p>نقدم مجموعة متنوعة من المعدات المكتبية المستعملة مثل آلات التصوير متوسطة وكبيرة الحجم والأجهزة الإلكترونية.</p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">مميزات مزاد المعدات المكتبية:</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>أجهزة تصوير ذات جودة عالية من أشهر الشركات العالمية</li>
              <li>أجهزة كمبيوتر ومعدات إلكترونية متنوعة</li>
              <li>أثاث مكتبي بحالة ممتازة</li>
              <li>أسعار مناسبة للشركات الناشئة والمتوسطة</li>
              <li>جميع الأجهزة مفحوصة وبحالة تشغيلية ممتازة</li>
            </ul>
            
            <p className="mt-6">ترقبوا مزاداتنا القادمة للمعدات المكتبية المستعملة، فرصة مميزة لتجهيز مكتبك بأقل التكاليف.</p>
          </div>
          
          <div className="mt-8 text-center">
            <div className="inline-block px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sky-500 hover:bg-sky-600">
              المزادات القادمة قريباً
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
