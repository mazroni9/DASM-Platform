'use client';

import BackToAuctionsButton from '@/components/shared/BackToAuctionsButton';

export default function PrivateAuctionPage() {
  return (
    <div className="container mx-auto p-4 py-8">
      <div className="mb-6">
        <BackToAuctionsButton />
      </div>
      
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="uppercase tracking-wide text-lg text-gray-700 font-semibold mb-2">المزادات الخاصة</div>
          <h1 className="text-3xl font-bold mb-6">مزادات بحسب الطلب</h1>
          
          <div className="prose lg:prose-lg mb-6">
            <p>نقدم مزادات بحسب الطلب لمناسبات خاصه تكون حصرية بدعوة حصرية لعملائنا المميزين، مع عروض استثنائية لا تتوفر في المزادات العامة.</p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">مميزات المزادات الخاصة:</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>جلسات مزاد بعدد محدود من المزايدين</li>
            </ul>
            
            <p className="mt-6">للحصول على دعوة للمزادات الخاصة، يرجى التواصل مع فريق خدمة العملاء أو ترقية حسابك إلى العضوية الذهبية.</p>
          </div>
          
          <div className="mt-8 text-center">
            <div className="inline-block px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-700 hover:bg-gray-800">
              طلب دعوة للمزادات الخاصة
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
