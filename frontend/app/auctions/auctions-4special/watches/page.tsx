'use client';

import LoadingLink from "@/components/LoadingLink";
import { ChevronRight, Watch, Clock, Shield, Award, Calendar, Star, Search, Filter, Tag } from 'lucide-react';

export default function WatchesMarketPage() {
  // بيانات الساعات المميزة - سيتم استبدالها لاحقًا بجلب من قاعدة البيانات
  const featuredWatches = [
    {
      id: 1,
      title: 'Rolex Daytona',
      brand: 'Rolex',
      reference: '116500LN',
      description: 'ساعة رياضية فاخرة مع مؤقت كرونوغراف ومينا سيراميك أسود، حالة ممتازة كالجديدة',
      price: 290000,
      currentBid: 295000,
      condition: 'ممتازة',
      year: '2021',
      bidCount: 8,
      image: '/watches/rolex-daytona.jpg',
      hasBox: true,
      hasWarranty: true,
    },
    {
      id: 2,
      title: 'Patek Philippe Nautilus',
      brand: 'Patek Philippe',
      reference: '5711/1A-010',
      description: 'ساعة رياضية أنيقة مع مينا أزرق مموج وسوار متكامل من الستانلس ستيل',
      price: 875000,
      currentBid: 880000,
      condition: 'جيدة جدًا',
      year: '2019',
      bidCount: 12,
      image: '/watches/patek-nautilus.jpg',
      hasBox: true,
      hasWarranty: true,
    },
    {
      id: 3,
      title: 'Audemars Piguet Royal Oak',
      brand: 'Audemars Piguet',
      reference: '15400ST.OO.1220ST.01',
      description: 'ساعة رياضية أيقونية مع مينا أزرق وسوار متكامل من الستانلس ستيل',
      price: 350000,
      currentBid: 352000,
      condition: 'ممتازة',
      year: '2020',
      bidCount: 5,
      image: '/watches/ap-royal-oak.jpg',
      hasBox: true,
      hasWarranty: false,
    },
    {
      id: 4,
      title: 'Richard Mille RM 35-02',
      brand: 'Richard Mille',
      reference: 'RM 35-02',
      description: 'ساعة فائقة الفخامة مع هيكل من الكربون فايبر ومقاومة للصدمات',
      price: 1950000,
      currentBid: 1975000,
      condition: 'ممتازة',
      year: '2022',
      bidCount: 3,
      image: '/watches/richard-mille.jpg',
      hasBox: true,
      hasWarranty: true,
    },
    {
      id: 5,
      title: 'Omega Speedmaster Professional',
      brand: 'Omega',
      reference: '311.30.42.30.01.005',
      description: 'ساعة الفضاء الشهيرة مع مؤقت كرونوغراف، الإصدار الكلاسيكي بالإعداد اليدوي',
      price: 45000,
      currentBid: 46500,
      condition: 'جيدة',
      year: '2018',
      bidCount: 7,
      image: '/watches/omega-speedmaster.jpg',
      hasBox: false,
      hasWarranty: false,
    },
    {
      id: 6,
      title: 'Cartier Santos',
      brand: 'Cartier',
      reference: 'WSSA0018',
      description: 'ساعة أنيقة من كارتييه مع علبة وسوار من الستانلس ستيل ومينا أبيض',
      price: 72000,
      currentBid: 73500,
      condition: 'ممتازة',
      year: '2021',
      bidCount: 6,
      image: '/watches/cartier-santos.jpg',
      hasBox: true,
      hasWarranty: true,
    },
  ];

  // العلامات التجارية الفاخرة
  const luxuryBrands = [
    { name: 'Rolex', count: 24 },
    { name: 'Patek Philippe', count: 12 },
    { name: 'Audemars Piguet', count: 8 },
    { name: 'Richard Mille', count: 5 },
    { name: 'Omega', count: 18 },
    { name: 'Cartier', count: 9 },
    { name: 'Jaeger-LeCoultre', count: 6 },
    { name: 'Hublot', count: 7 },
    { name: 'Grand Seiko', count: 4 },
  ];

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* بانر علوي */}
      <div className="relative h-48 bg-gradient-to-r from-indigo-500/80 to-blue-400/80 overflow-hidden">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10 pt-4">
          <div className="flex justify-between mb-2">
            <div className="flex-1 text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">سوق الساعات الفاخرة المستعملة</h1>
            </div>
            <LoadingLink href="/auctions/auctions-4special" className="flex items-center text-white/90 hover:text-white transition rtl:flex-row-reverse">
              <ChevronRight className="ml-1 rtl:mr-1 rtl:ml-0 transform group-hover:-translate-x-1 transition-transform" size={16} />
              <span>العودة للأسواق المتخصصة</span>
            </LoadingLink>
          </div>
          <p className="text-base text-white/90 max-w-2xl mx-auto mb-4 text-center">
            منصة آمنة وموثوقة لشراء وبيع أفخم الساعات السويسرية المستعملة بضمان أصلي ومعتمد
          </p>
          <div className="flex justify-center items-center gap-4">
            <LoadingLink 
              href="/forms/watch-auction-request" 
              className="px-5 py-2 bg-white text-indigo-600 hover:bg-gray-100 font-medium rounded-full shadow-md hover:shadow-lg transition-all text-sm"
            >
              بيع ساعتك معنا
            </LoadingLink>
            <LoadingLink 
              href="#featured-watches" 
              className="px-5 py-2 bg-transparent border border-white text-white hover:bg-white/10 font-medium rounded-full transition-all text-sm"
            >
              تصفح الساعات
            </LoadingLink>
          </div>
        </div>
      </div>

      {/* ميزات السوق */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <Award className="text-indigo-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">أصالة مضمونة</h3>
            <p className="text-gray-600">جميع الساعات تخضع لفحص دقيق ومعتمد للتأكد من أصالتها قبل العرض</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <Shield className="text-indigo-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">ضمان الحماية</h3>
            <p className="text-gray-600">يتم حجز المبلغ لحين استلام وفحص الساعة لضمان حماية كاملة للمشتري والبائع</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <Tag className="text-indigo-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">أسعار تنافسية</h3>
            <p className="text-gray-600">عمولات منخفضة مقارنة بالمنصات العالمية مع ضمان شفافية كاملة للأسعار</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <Clock className="text-indigo-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">سهولة البيع والشراء</h3>
            <p className="text-gray-600">منصة سهلة الاستخدام لتجربة مزايدة سلسة مع خيارات بيع مباشر وتفاوضي</p>
          </div>
        </div>
      </div>

      {/* فلتر البحث */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="ابحث عن ساعة، موديل أو رقم مرجعي..." 
                  className="w-full pl-4 pr-12 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
                <Filter size={18} />
                <span>فلترة متقدمة</span>
              </button>
              <select 
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white" 
                aria-label="ترتيب الساعات"
              >
                <option value="">ترتيب حسب</option>
                <option value="newest">الأحدث</option>
                <option value="price_asc">السعر: الأقل إلى الأعلى</option>
                <option value="price_desc">السعر: الأعلى إلى الأقل</option>
                <option value="popular">الأكثر شعبية</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* محتوى رئيسي مع العلامات التجارية والساعات */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* قسم التصفية الجانبي */}
          <div className="lg:w-1/4">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-4 border-b pb-2">العلامات التجارية</h3>
              <ul className="space-y-2">
                {luxuryBrands.map((brand) => (
                  <li key={brand.name}>
                    <LoadingLink 
                      href={`/auctions/auctions-4special/watches/brand/${brand.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded-md"
                    >
                      <span>{brand.name}</span>
                      <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                        {brand.count}
                      </span>
                    </LoadingLink>
                  </li>
                ))}
              </ul>

              <h3 className="text-xl font-bold mt-8 mb-4 border-b pb-2">الحالة</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600" />
                  <span className="mr-2 text-gray-700">جديدة</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600" />
                  <span className="mr-2 text-gray-700">ممتازة</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600" />
                  <span className="mr-2 text-gray-700">جيدة جدًا</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600" />
                  <span className="mr-2 text-gray-700">جيدة</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600" />
                  <span className="mr-2 text-gray-700">متوسطة</span>
                </label>
              </div>

              <h3 className="text-xl font-bold mt-8 mb-4 border-b pb-2">السعر</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-sm text-gray-600 mb-1">من</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      className="w-full p-2 rounded-lg border border-gray-300"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-sm text-gray-600 mb-1">إلى</label>
                    <input 
                      type="number" 
                      placeholder="2,000,000" 
                      className="w-full p-2 rounded-lg border border-gray-300"
                    />
                  </div>
                </div>
                <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition">
                  تطبيق
                </button>
              </div>

              <h3 className="text-xl font-bold mt-8 mb-4 border-b pb-2">المواصفات</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600" />
                  <span className="mr-2 text-gray-700">مع العلبة الأصلية</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600" />
                  <span className="mr-2 text-gray-700">مع كرت الضمان</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600" />
                  <span className="mr-2 text-gray-700">مع الأوراق</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600" />
                  <span className="mr-2 text-gray-700">مع العلبة والأوراق</span>
                </label>
              </div>
            </div>
          </div>

          {/* قسم الساعات */}
          <div className="lg:w-3/4">
            <h2 id="featured-watches" className="text-2xl font-bold mb-6">الساعات المميزة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {featuredWatches.map((watch) => (
                <LoadingLink 
                  key={watch.id} 
                  href={`/auctions/auctions-4special/watches/${watch.id}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition group"
                >
                  <div className="relative h-52">
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">صورة الساعة</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold group-hover:text-indigo-600 transition">{watch.title}</h3>
                      <div className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">{watch.reference}</div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 mb-3 line-clamp-2">{watch.description}</p>
                    
                    <div className="flex justify-between items-center border-t pt-3 mt-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">المزايدة الحالية</div>
                        <div className="text-lg font-bold text-indigo-600">{formatPrice(watch.currentBid)} ريال</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                          <Calendar size={14} />
                          <span>{watch.year}</span>
                          {watch.bidCount > 0 && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{watch.bidCount} مزايدة</span>
                            </>
                          )}
                        </div>
                        <div className="text-xs bg-gray-100 rounded-full px-2 py-1">{watch.condition}</div>
                      </div>
                    </div>
                    
                    <div className="flex mt-4 gap-2">
                      {watch.hasBox && (
                        <div className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">مع العلبة</div>
                      )}
                      {watch.hasWarranty && (
                        <div className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">مع الضمان</div>
                      )}
                    </div>
                  </div>
                </LoadingLink>
              ))}
            </div>
            
            <div className="flex justify-center mt-12">
              <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition">
                عرض المزيد من الساعات
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* قسم الأسئلة الشائعة */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold mb-8 text-center">الأسئلة الشائعة حول شراء الساعات الفاخرة</h2>
          <div className="space-y-6 text-gray-700 text-lg">
            <div>
              <h3 className="font-semibold mb-2">كيف تضمنون أصالة الساعات المعروضة؟</h3>
              <p>جميع الساعات تخضع لعملية تحقق دقيقة من قبل خبراء معتمدين. نفحص الرقم المرجعي، التفاصيل الدقيقة، ونتأكد من مطابقة كل ساعة لمواصفات المصنع الأصلية.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">ما هي الرسوم المترتبة على البيع والشراء؟</h3>
              <p>نحن نتقاضى عمولة 5% من البائع على البيع عبر المزاد، و3% فقط للبيع المباشر. رسوم إدخال الساعة في النظام هي 118 ريال غير مستردة لضمان جدية العرض.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">كيف يتم تسليم الساعة بعد الشراء؟</h3>
              <p>لدينا ثلاث خيارات للتسليم: عبر المنصة برسوم 200 ريال، عبر مندوب خارجي مثل DHL أو Aramex ببوليصة خاصة، أو الاستلام الشخصي مع توثيق عملية التسليم.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">ماذا لو اكتشفت عيبًا في الساعة بعد الاستلام؟</h3>
              <p>نظامنا يحمي المشتري حيث يتم حجز المبلغ حتى استلام وفحص الساعة. في حالة وجود أي خلاف حول الحالة، يمكنك فتح نزاع داخلي وسيتم مراجعة الحالة من قبل خبرائنا.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">ما هي أنواع الساعات المقبولة في المنصة؟</h3>
              <p>نقبل الساعات الفاخرة من ماركات محددة مثل Rolex، Patek Philippe، Audemars Piguet، Richard Mille، Omega، Cartier، Hublot، Jaeger-LeCoultre، وGrand Seiko. لا نقبل ساعات من فئات Fossil أو Casio أو التقليد.</p>
            </div>
          </div>
        </div>
      </div>

      {/* قسم الإضافة والتسجيل */}
      <div className="bg-indigo-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">هل لديك ساعة فاخرة ترغب في بيعها؟</h2>
            <p className="text-gray-600 mb-8">
              سجل ساعتك الفاخرة في منصتنا ليتم عرضها للمهتمين والمستثمرين. نوفر خدمة تقييم احترافية وعرض مميز يضمن لك أفضل سعر ممكن.
            </p>
            <LoadingLink 
              href="/forms/watch-auction-request"
              className="inline-block px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition"
            >
              تسجيل ساعة للبيع
            </LoadingLink>
          </div>
        </div>
      </div>
    </div>
  );
} 