'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Plane, Calendar, Info, ChevronRight } from 'lucide-react';

export default function JetsAuctionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">

      {/* بانر علوي */}
      <div className="relative h-80 bg-gradient-to-r from-cyan-800 to-blue-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10">
          <Link href="/auctions/auctions-4special" className="flex items-center text-white/80 hover:text-white mb-6 transition group">
            <ChevronRight className="ml-2 transform group-hover:-translate-x-1 transition-transform" size={20} />
            <span>العودة للأسواق المتخصصة</span>
          </Link>
          <h1 className="text-5xl font-bold text-white mb-4">سوق الطائرات النفاثة المستعملة</h1>
          <p className="text-xl text-white/90 max-w-2xl">
            استكشف فرص شراء طائرات نفاثة فاخرة عبر مزادات عالمية منظمة وآمنة
          </p>
        </div>
      </div>

      {/* فقرة تسويقية */}
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8 space-y-6">
          <ul className="text-gray-700 text-lg space-y-4">
            <li>✈️ اقتني الحرية المطلقة مع طائرتك الخاصة – استثمر في رفاهيتك اليوم.</li>
            <li>✈️ فرص نادرة لامتلاك طائرات بحالة شبه جديدة.</li>
            <li>✈️ تجربة شراء ذكية وآمنة عبر منصتنا المعتمدة عالميًا.</li>
            <li>✈️ جميع الطائرات خضعت لمراجعات فنية وقانونية دقيقة.</li>
            <li>✈️ انطلق بأحلامك إلى السماء – مزاداتنا تفتح لك أبواب السماء بدون حدود.</li>
          </ul>
        </div>
      </div>

      {/* معرض صور الطائرات */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">استعرض بعض الطائرات المعروضة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* كروت الطائرات */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
            <div className="relative h-60">
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">صورة الطائرة</span>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">طائرة سيسنا سيتيشن XLS+</h3>
              <p className="text-gray-600 mb-4">طائرة نفاثة رجال أعمال ذات سعة 9 ركاب وقمرة قيادة متطورة</p>
              <div className="text-xl font-bold text-cyan-600 mb-4">17,500,000 ريال</div>
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center text-gray-500">
                  <Calendar size={18} className="ml-2" />
                  <span>2019</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <Plane size={18} className="ml-2" />
                  <span>3,200 ساعة طيران</span>
                </div>
              </div>
              <button className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition">
                قدم عرضك
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
            <div className="relative h-60">
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">صورة الطائرة</span>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">إمبراير فينوم 300</h3>
              <p className="text-gray-600 mb-4">طائرة نفاثة مدى متوسط مع كابينة فاخرة وأداء ممتاز على المدرجات القصيرة</p>
              <div className="text-xl font-bold text-cyan-600 mb-4">14,200,000 ريال</div>
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center text-gray-500">
                  <Calendar size={18} className="ml-2" />
                  <span>2018</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <Plane size={18} className="ml-2" />
                  <span>2,800 ساعة طيران</span>
                </div>
              </div>
              <button className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition">
                قدم عرضك
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
            <div className="relative h-60">
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">صورة الطائرة</span>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">بيتش كينج إير 350i</h3>
              <p className="text-gray-600 mb-4">طائرة توربينية مزدوجة المحرك ذات قدرة استثنائية على الملاحة في مختلف الظروف</p>
              <div className="text-xl font-bold text-cyan-600 mb-4">9,800,000 ريال</div>
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center text-gray-500">
                  <Calendar size={18} className="ml-2" />
                  <span>2016 (محدثة)</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <Plane size={18} className="ml-2" />
                  <span>4,500 ساعة طيران</span>
                </div>
              </div>
              <button className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition">
                قدم عرضك
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* أزرار إضافية للتفاعل */}
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="flex flex-wrap gap-6 justify-center">
          <Link href="/forms/request-inspection" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
            طلب معاينة الطائرة
          </Link>
          <Link href="/forms/request-report" className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
            طلب تقرير فني مفصل
          </Link>
          <Link href="/forms/contact-seller" className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition">
            تواصل مع البائع
          </Link>
        </div>
      </div>

      {/* قسم الأسئلة الشائعة */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold mb-8 text-center">الأسئلة الشائعة حول شراء الطائرات النفاثة</h2>
          <div className="space-y-6 text-gray-700 text-lg">
            <div>
              <h3 className="font-semibold mb-2">هل الطائرات تخضع للفحص قبل البيع؟</h3>
              <p>نعم، جميع الطائرات تمر بفحص فني معتمد لضمان مطابقتها للمعايير الدولية.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">هل أحتاج إلى موافقات حكومية لشراء طائرة؟</h3>
              <p>يختلف حسب الدولة، وسنوفر لك استشارة قانونية لضمان الامتثال الكامل.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">هل يمكنني طلب تجربة طيران قبل الشراء؟</h3>
              <p>نعم، يمكن ترتيب جلسة معاينة وتجربة بالتنسيق مع المالك وخبراء فنيين معتمدين.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">كيف يتم شحن أو تسليم الطائرة بعد الشراء؟</h3>
              <p>يتم عادة التوصيل المباشر عبر طيارين معتمدين أو شركات نقل جوية خاصة لضمان الاستلام الآمن.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">هل يمكنني تمويل شراء الطائرة عبر البنك؟</h3>
              <p>نعم، بعض البنوك تقدم برامج تمويل مخصصة لشراء الطائرات الخاصة حسب الشروط.</p>
            </div>
          </div>
        </div>
      </div>

      {/* قسم إضافة طائرة للمزاد */}
      <div className="bg-cyan-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">هل لديك طائرة ترغب في بيعها؟</h2>
            <p className="text-gray-600 mb-8">
              سجل بيانات طائرتك في منصتنا ليتم عرضها في المزادات القادمة. نوفر خدمة تقييم مجانية وعرض احترافي يضمن أعلى سعر ممكن.
            </p>
            <Link 
              href="/add/aircraft"
              className="inline-block px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition"
            >
              سجل البيانات
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
