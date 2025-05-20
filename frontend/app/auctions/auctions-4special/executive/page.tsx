'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  Search, 
  Filter, 
  Shield, 
  Clock,
  BookOpen,
  Crown,
  Lock,
  Award,
  Star,
  Diamond,
  UserCheck,
  ArrowLeft
} from 'lucide-react';

export default function ExecutiveAuctionsPage() {
  // حالة المستخدم (مؤقتًا - سيتم استبدالها بمنطق حقيقي للتحقق)
  const [isExecutive, setIsExecutive] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    name: '',
    phone: '',
    note: '',
    acceptTerms: false
  });

  // بيانات المزادات الخاصة - مؤقتة (ستُجلب من قاعدة البيانات)
  const executiveItems = [
    {
      id: 1,
      title: 'مرسيدس SLS AMG',
      category: 'سيارات',
      description: 'سيارة مرسيدس SLS AMG موديل 2021 بتعديلات خاصة ومصفحة من الفئة B6، حالة ممتازة وضمان مفتوح',
      origin: 'ألمانيا',
      condition: 'ممتازة',
      price: 1250000,
      currentBid: 1350000,
      bidCount: 5,
      image: '/executive/mercedes-sls.jpg',
      hasCertificate: true,
      specialBadge: 'ملك سابق'
    },
    {
      id: 2,
      title: 'ساعة Patek Philippe Nautilus',
      category: 'ساعات',
      description: 'ساعة Patek Philippe Nautilus إصدار محدود رقم 18/25 مصنوعة من الذهب الوردي، مع توثيق من الشركة الأم',
      origin: 'سويسرا',
      condition: 'جديدة',
      price: 875000,
      currentBid: 880000,
      bidCount: 3,
      image: '/executive/patek-nautilus.jpg',
      hasCertificate: true,
      specialBadge: 'إصدار محدود'
    },
    {
      id: 3,
      title: 'طقم ألماس VAN CLEEF',
      category: 'مجوهرات',
      description: 'طقم ألماس فاخر من VAN CLEEF يتكون من عقد وسوار وخاتم، إجمالي قيراط 18.5 بشهادة GIA',
      origin: 'فرنسا',
      condition: 'ممتازة',
      price: 650000,
      currentBid: 655000,
      bidCount: 2,
      image: '/executive/diamond-set.jpg',
      hasCertificate: true,
      specialBadge: 'استثماري'
    },
  ];

  // تنسيق الأرقام بالفواصل
  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    // عملية إرسال الطلب للخادم (سيتم تنفيذها لاحقًا)
    alert('تم إرسال طلب العضوية بنجاح. سنتواصل معك قريبًا للتأكيد.');
    setShowRequestForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* زر العودة للسوق الرئيسي */}
      <div className="container mx-auto px-4 pt-4 flex justify-end">
        <Link 
          href="/auctions" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition p-2 rounded-full hover:bg-blue-50"
        >
          <ArrowLeft size={16} className="ml-1" />
          <span>العودة للسوق الرئيسي</span>
        </Link>
      </div>

      {/* بانر علوي */}
      <div className="relative h-96 bg-gradient-to-r from-indigo-900 via-purple-800 to-indigo-800 overflow-hidden">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10 py-16">
          <Link href="/auctions/auctions-special" className="flex items-center text-white/80 hover:text-white mb-6 transition group">
            <ChevronRight className="ml-2 transform group-hover:-translate-x-1 transition-transform" size={20} />
            <span>العودة للأسواق المتخصصة</span>
          </Link>
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center">
            مزادات VIP الخاصة
            <Crown className="mr-3 text-yellow-400" size={32} />
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mb-8">
            سوق حصري لعرض وبيع المنتجات النادرة والمميزة للشخصيات التنفيذية والمؤسسات بضمان وموثوقية عالية
          </p>
        </div>
      </div>

      {/* قسم معلومات العضو */}
      <div className="container mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-600">
          {isExecutive ? (
            <div className="flex items-center text-green-600">
              <UserCheck size={24} className="ml-2" />
              <div>
                <h3 className="text-xl font-bold">مرحبًا بك في سوق النخبة</h3>
                <p className="text-gray-600">يمكنك الآن الوصول إلى جميع المزادات الخاصة والمنتجات الحصرية</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center text-gray-600 mb-4 md:mb-0">
                <Lock size={24} className="ml-2 text-red-500" />
                <div>
                  <h3 className="text-xl font-bold">أنت غير مشترك في مزادات VIP</h3>
                  <p>للوصول إلى المنتجات الحصرية، يرجى طلب دعوة للانضمام</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRequestForm(true)} 
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow transition"
              >
                طلب دعوة للانضمام
              </button>
            </div>
          )}
        </div>
      </div>

      {/* نموذج طلب الدعوة */}
      {showRequestForm && !isExecutive && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">طلب عضوية مزادات VIP</h3>
              <button onClick={() => setShowRequestForm(false)} className="text-white hover:text-gray-200">
                &times;
              </button>
            </div>
            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">الاسم الكامل</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                  value={requestForm.name}
                  onChange={(e) => setRequestForm({...requestForm, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">رقم الجوال</label>
                <input 
                  type="tel" 
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-400 focus:border-purple-400" 
                  value={requestForm.phone}
                  onChange={(e) => setRequestForm({...requestForm, phone: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">سبب الانضمام / المنتجات التي تهتم بها</label>
                <textarea 
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-400 focus:border-purple-400 h-24" 
                  value={requestForm.note}
                  onChange={(e) => setRequestForm({...requestForm, note: e.target.value})}
                  required
                ></textarea>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  className="h-5 w-5 text-purple-600" 
                  checked={requestForm.acceptTerms}
                  onChange={(e) => setRequestForm({...requestForm, acceptTerms: e.target.checked})}
                  required
                />
                <label className="mr-2 text-gray-700">أوافق على شروط وأحكام مزادات VIP الخاصة</label>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                <p>تكلفة العضوية السنوية: <span className="font-bold">999 ريال</span></p>
                <p>سيتم التواصل معك خلال 24 ساعة لتأكيد العضوية</p>
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow transition"
                >
                  إرسال الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ميزات المزادات الخاصة */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8 text-center">مميزات مزادات VIP الخاصة</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4">
              <Lock className="text-purple-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">خصوصية مطلقة</h3>
            <p className="text-gray-600">تضمن منصتنا سرية البيانات والمزادات المغلقة للأعضاء المعتمدين فقط</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4">
              <Diamond className="text-purple-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">منتجات استثنائية</h3>
            <p className="text-gray-600">نوفر منتجات نادرة ذات قيمة عالية تم اختيارها بعناية وتخضع لتقييم صارم</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4">
              <Shield className="text-purple-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">ضمان وحماية</h3>
            <p className="text-gray-600">نقدم ضمان شامل على المنتجات مع حماية للمشتري والبائع بإشراف مباشر من فريقنا</p>
          </div>
        </div>
      </div>

      {/* محتوى المنتجات - يظهر فقط للأعضاء التنفيذيين */}
      <div className="container mx-auto px-4 py-12">
        {isExecutive ? (
          <>
            <h2 className="text-2xl font-bold mb-8">المنتجات الحصرية المتاحة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {executiveItems.map((item) => (
                <Link 
                  key={item.id} 
                  href={`/auctions/auctions-special/executive/${item.id}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition group"
                >
                  <div className="relative h-56">
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">صورة المنتج</span>
                    </div>
                    {item.specialBadge && (
                      <div className="absolute top-4 left-4 bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        {item.specialBadge}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold group-hover:text-purple-600 transition line-clamp-1">{item.title}</h3>
                      <div className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                        {item.category}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                      <div className="flex items-center">
                        <BookOpen size={14} className="ml-1" />
                        <span>{item.origin}</span>
                      </div>
                      <div>
                        {item.condition}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center border-t pt-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">المزايدة الحالية</div>
                        <div className="text-lg font-bold text-purple-600">{formatPrice(item.currentBid)} ريال</div>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-gray-500">{item.bidCount} مزايدة</span>
                        {item.hasCertificate && (
                          <div className="mr-2 text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full flex items-center">
                            <Award size={12} className="ml-1" />
                            <span>موثق</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
            <Lock className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">محتوى مخصص لأعضاء VIP فقط</h3>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              هذا المحتوى مخصص للأعضاء المعتمدين فقط. يرجى طلب دعوة للانضمام للوصول إلى المنتجات الحصرية والمزادات الخاصة.
            </p>
            <button 
              onClick={() => setShowRequestForm(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow transition"
            >
              طلب دعوة للانضمام
            </button>
          </div>
        )}
      </div>

      {/* معلومات إضافية - الأسئلة الشائعة */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold mb-8 text-center">الأسئلة الشائعة حول مزادات VIP</h2>
          <div className="space-y-6 text-gray-700 text-lg">
            <div>
              <h3 className="font-semibold mb-2">كيف يمكنني الانضمام إلى مزادات VIP الخاصة؟</h3>
              <p>يمكنك طلب دعوة للانضمام عبر النموذج المخصص. سيقوم فريقنا بمراجعة الطلب والتواصل معك خلال 24 ساعة لاستكمال إجراءات العضوية.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">ما هي تكلفة العضوية في مزادات VIP؟</h3>
              <p>تبلغ تكلفة العضوية السنوية 999 ريال، أو 199 ريال شهريًا. تتيح لك العضوية الوصول الكامل لجميع المزادات الخاصة والمنتجات الحصرية.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">كيف يتم التحقق من المنتجات المعروضة؟</h3>
              <p>جميع المنتجات تخضع لعملية تحقق صارمة من قبل خبراء متخصصين. نوفر شهادات أصالة وتقارير فحص تفصيلية للمنتجات الثمينة.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">هل يمكنني معاينة المنتجات قبل المزايدة؟</h3>
              <p>نعم، أعضاء VIP لديهم ميزة معاينة المنتجات بترتيب مسبق في مقراتنا المخصصة. كما نوفر صورًا وفيديوهات عالية الدقة لجميع التفاصيل.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">ما هي طرق الدفع المتاحة؟</h3>
              <p>نوفر طرق دفع متعددة تناسب الشخصيات التنفيذية، بما في ذلك التحويل البنكي والدفع المباشر. كما نوفر خدمة الضمان البنكي للمعاملات عالية القيمة.</p>
            </div>
          </div>
        </div>
      </div>

      {/* زر التبديل المؤقت للعرض التجريبي - سيتم إزالته في الإصدار النهائي */}
      <div className="fixed bottom-4 left-4 p-3 bg-gray-800 text-white rounded-lg shadow-lg cursor-pointer" onClick={() => setIsExecutive(!isExecutive)}>
        {isExecutive ? "تجربة عضو عادي" : "تجربة عضو VIP"}
      </div>
    </div>
  );
} 