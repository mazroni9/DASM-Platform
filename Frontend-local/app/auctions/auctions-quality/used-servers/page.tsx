'use client';

import BackToAuctionsButton from '@/components/shared/BackToAuctionsButton';

export default function UsedServersAuctionPage() {
  return (
    <div className="container mx-auto p-4 py-8">
      <div className="mb-6">
        <BackToAuctionsButton />
      </div>
      
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="uppercase tracking-wide text-lg text-slate-500 font-semibold mb-2">السيرفرات المستعملة</div>
          <h1 className="text-3xl font-bold mb-6">أجهزة سيرفرات وتخزين بمواصفات عالية</h1>
          
          <div className="prose lg:prose-lg mb-6">
            <p>نقدم مجموعة متميزة من أجهزة السيرفرات وأنظمة التخزين والشبكات المستعملة بمواصفات جيدة وبأسعار تنافسية.</p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">مميزات مزاد السيرفرات:</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>سيرفرات من شركات عالمية معروفة: HP، Dell، IBM وغيرها</li>
              <li>أجهزة تخزين ونظم شبكات متنوعة</li>
              <li>جميع الأجهزة مفحوصة وتعمل بكفاءة</li>
              <li>مناسبة للشركات الناشئة ومراكز البيانات الصغيرة</li>
              <li>أسعار تنافسية مقارنة بالأجهزة الجديدة</li>
            </ul>
            
            <p className="mt-6">ترقبوا مزاداتنا القادمة لأجهزة السيرفرات والتخزين، فرصة مميزة لتطوير بنيتكم التحتية التقنية بتكلفة أقل.</p>
          </div>
          
          <div className="mt-8 text-center">
            <div className="inline-block px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-slate-500 hover:bg-slate-600">
              المزادات القادمة قريباً
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
