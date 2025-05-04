'use client';

import Link from 'next/link';
import { 
  ChevronRight, 
  Search, 
  Filter, 
  Award, 
  Shield, 
  Clock,
  BookOpen,
  Gem, 
  Scroll,
  Compass,
  Feather
} from 'lucide-react';

export default function PreciousItemsPage() {
  // تصنيفات التحف والقطع النادرة
  const categories = [
    { id: 'antiques', name: 'تحف أثرية', icon: Gem, description: 'تماثيل، أواني فخارية، قطع من العصور القديمة' },
    { id: 'rare-tools', name: 'أدوات نادرة', icon: Compass, description: 'ساعات جيب، بوصلة أثرية، أدوات ملاحة بحرية' },
    { id: 'documents', name: 'مستندات قديمة', icon: Scroll, description: 'كتب نادرة، خرائط، طوابع بريد أصلية' },
    { id: 'decorative', name: 'ديكورات فنية', icon: Feather, description: 'منحوتات، مزهريات نادرة، أدوات خشب محفور يدوي' },
    { id: 'jewelry', name: 'مجوهرات قديمة', icon: Gem, description: 'قطع مصنوعة يدويًا من عصور ماضية' },
  ];

  // القطع النادرة المميزة - سيتم استبدالها بجلب البيانات من قاعدة البيانات
  const featuredItems = [
    {
      id: 1,
      title: 'تمثال برونزي من العصر الروماني',
      category: 'antiques',
      description: 'تمثال برونزي نادر يعود للقرن الثاني الميلادي، بحالة ممتازة وتفاصيل دقيقة محفوظة بشكل كامل',
      origin: 'إيطاليا',
      age: 'القرن الثاني الميلادي',
      condition: 'ممتازة',
      price: 35000,
      currentBid: 38500,
      bidCount: 12,
      image: '/rare-items/roman-bronze.jpg',
      hasCertificate: true,
    },
    {
      id: 2,
      title: 'خريطة عثمانية أصلية',
      category: 'documents',
      description: 'خريطة أصلية مرسومة باليد تعود للعهد العثماني، تصور مناطق الجزيرة العربية والبحر الأحمر',
      origin: 'الدولة العثمانية',
      age: 'القرن الثامن عشر',
      condition: 'جيدة',
      price: 18000,
      currentBid: 22000,
      bidCount: 7,
      image: '/rare-items/ottoman-map.jpg',
      hasCertificate: true,
    },
    {
      id: 3,
      title: 'ساعة جيب ذهبية فيكتورية',
      category: 'rare-tools',
      description: 'ساعة جيب ذهبية نادرة من العصر الفيكتوري، مزخرفة يدويًا بنقوش بارزة وتعمل بشكل ممتاز',
      origin: 'بريطانيا',
      age: 'حوالي 1880',
      condition: 'ممتازة',
      price: 12500,
      currentBid: 14000,
      bidCount: 9,
      image: '/rare-items/victorian-watch.jpg',
      hasCertificate: true,
    },
    {
      id: 4,
      title: 'صندوق خشبي مطعم بالصدف',
      category: 'decorative',
      description: 'صندوق أثري مصنوع من خشب الأبنوس ومطعم بالصدف والعاج، عمل فني دقيق من الشام',
      origin: 'سوريا',
      age: 'أوائل القرن العشرين',
      condition: 'جيدة جدًا',
      price: 8500,
      currentBid: 9200,
      bidCount: 5,
      image: '/rare-items/shell-box.jpg',
      hasCertificate: false,
    },
    {
      id: 5,
      title: 'قلادة فضية بديعة من العصر القاجاري',
      category: 'jewelry',
      description: 'قلادة فضية مع أحجار كريمة متناسقة، صناعة يدوية فارسية من العصر القاجاري',
      origin: 'إيران',
      age: 'القرن التاسع عشر',
      condition: 'جيدة',
      price: 15000,
      currentBid: 15800,
      bidCount: 3,
      image: '/rare-items/persian-necklace.jpg',
      hasCertificate: true,
    },
    {
      id: 6,
      title: 'مخطوطة عربية نادرة',
      category: 'documents',
      description: 'مخطوطة عربية نادرة مزينة بالذهب والرسومات الدقيقة، مكتوبة على ورق معالج خاص',
      origin: 'شمال أفريقيا',
      age: 'القرن السابع عشر',
      condition: 'جيدة',
      price: 28000,
      currentBid: 29500,
      bidCount: 6,
      image: '/rare-items/arabic-manuscript.jpg',
      hasCertificate: true,
    },
  ];

  // تنسيق الأرقام بالفواصل
  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // تحويل المُعرف إلى اسم التصنيف
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* بانر علوي */}
      <div className="relative h-96 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10 py-16">
          <Link href="/auctions/auctions-special" className="flex items-center text-white/80 hover:text-white mb-6 transition group">
            <ChevronRight className="ml-2 transform group-hover:-translate-x-1 transition-transform" size={20} />
            <span>العودة للأسواق المتخصصة</span>
          </Link>
          <h1 className="text-5xl font-bold text-white mb-4">Heritage - القطع النادرة والتحف الثمينة</h1>
          <p className="text-xl text-white/90 max-w-2xl mb-8">
            سوق موثوق للتحف والقطع النادرة الأصلية ذات القيمة التاريخية والثقافية، مع نظام تحقق معتمد
          </p>
          <div className="flex items-center gap-4 mt-4">
            <Link 
              href="/forms/precious-auction-request" 
              className="px-6 py-3 bg-white text-amber-500 hover:bg-gray-100 font-bold rounded-full shadow-md hover:shadow-lg transition-all"
            >
              عرض قطعة للبيع
            </Link>
            <Link 
              href="#featured-items" 
              className="px-6 py-3 bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold rounded-full transition-all"
            >
              تصفح القطع النادرة
            </Link>
          </div>
        </div>
      </div>

      {/* ميزات السوق */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <Award className="text-amber-500" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">توثيق وأصالة</h3>
            <p className="text-gray-600">جميع القطع تخضع للفحص والتوثيق من خبراء متخصصين للتأكد من أصالتها وقيمتها التاريخية</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <Shield className="text-amber-500" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">حماية المتعاملين</h3>
            <p className="text-gray-600">نظام متكامل لضمان حقوق البائع والمشتري مع إمكانية المعاينة والتحقق قبل إتمام البيع</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <Clock className="text-amber-500" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">تاريخ موثق</h3>
            <p className="text-gray-600">معلومات تفصيلية عن تاريخ كل قطعة ومنشأها وأهميتها، مع شهادات توثيق معتمدة عند توفرها</p>
          </div>
        </div>
      </div>

      {/* أقسام السوق - التصنيفات */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-center mb-10">تصفح حسب التصنيف</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link 
                key={category.id}
                href={`/auctions/auctions-special/precious/category/${category.id}`}
                className="flex flex-col items-center text-center p-5 bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 hover:border-amber-200 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-3">
                  <Icon className="text-amber-500" size={28} />
                </div>
                <h3 className="text-lg font-bold mb-2">{category.name}</h3>
                <p className="text-sm text-gray-500">{category.description}</p>
              </Link>
            );
          })}
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
                  placeholder="ابحث عن قطعة نادرة، تحفة، أو مجوهرات قديمة..." 
                  className="w-full pl-4 pr-12 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                aria-label="ترتيب العناصر"
              >
                <option value="">ترتيب حسب</option>
                <option value="newest">الأحدث</option>
                <option value="price_asc">السعر: الأقل إلى الأعلى</option>
                <option value="price_desc">السعر: الأعلى إلى الأقل</option>
                <option value="popular">الأكثر تميزًا</option>
                <option value="age_asc">الأقدم تاريخيًا</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* القطع المميزة */}
      <div id="featured-items" className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8">القطع النادرة المميزة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredItems.map((item) => (
            <Link 
              key={item.id} 
              href={`/auctions/auctions-special/precious/${item.id}`}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition group"
            >
              <div className="relative h-56">
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">صورة القطعة</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold group-hover:text-amber-500 transition line-clamp-1">{item.title}</h3>
                  <div className="text-xs bg-amber-50 text-amber-500 px-2 py-1 rounded-full">
                    {getCategoryName(item.category)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                
                <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                  <div className="flex items-center">
                    <BookOpen size={14} className="ml-1" />
                    <span>{item.origin}</span>
                  </div>
                  <div>
                    {item.age}
                  </div>
                </div>
                
                <div className="flex justify-between items-center border-t pt-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">المزايدة الحالية</div>
                    <div className="text-lg font-bold text-amber-500">{formatPrice(item.currentBid)} ريال</div>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-gray-500">{item.bidCount} مزايدة</span>
                    {item.hasCertificate && (
                      <div className="mr-2 text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full flex items-center">
                        <Award size={12} className="ml-1" />
                        <span>موثقة</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="flex justify-center mt-12">
          <button className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition">
            عرض المزيد من القطع النادرة
          </button>
        </div>
      </div>

      {/* قسم الأسئلة الشائعة */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold mb-8 text-center">الأسئلة الشائعة حول سوق التحف والقطع النادرة</h2>
          <div className="space-y-6 text-gray-700 text-lg">
            <div>
              <h3 className="font-semibold mb-2">كيف تضمنون أصالة القطع المعروضة؟</h3>
              <p>تخضع جميع القطع لعملية تحقق وتوثيق دقيقة من قبل خبراء متخصصين. نقبل فقط القطع المرفقة بتقارير من جهات معترف بها أو التي تمر بمراجعة لجنة التقييم الداخلية.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">هل يمكنني معاينة القطعة قبل الشراء؟</h3>
              <p>نعم، القطع ذات القيمة العالية يمكن معاينتها في الكنترول روم بعد التنسيق المسبق. كما نوفر صورًا عالية الدقة وتقارير مفصلة عن حالة كل قطعة.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">ما هي رسوم البيع والشراء؟</h3>
              <p>نتقاضى عمولة 7% من البائع على البيع عبر المزاد، و4% فقط للبيع المباشر. رسوم إدراج القطعة في النظام هي 100 ريال غير مستردة لضمان جدية العرض.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">كيف يتم توصيل القطع الأثرية؟</h3>
              <p>نوفر خدمة توصيل متخصصة للقطع الأثرية مع تغليف احترافي وتأمين شامل. يمكن أيضًا الاتفاق على التسليم الشخصي عبر الكنترول روم في أقرب فرع.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">هل المنصة تقبل القطع من جميع العصور؟</h3>
              <p>نعم، نقبل القطع الأثرية من مختلف العصور والحضارات، لكن بشرط أن تكون ذات قيمة تاريخية أو فنية وألا تكون مقلدة أو غير موثقة الأصل.</p>
            </div>
          </div>
        </div>
      </div>

      {/* قسم التسجيل */}
      <div className="bg-amber-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">هل لديك قطع نادرة ترغب في بيعها؟</h2>
            <p className="text-gray-600 mb-8">
              سجل قطعتك النادرة في منصتنا لتصل إلى آلاف المهتمين والمقتنين حول العالم. نوفر عملية توثيق احترافية وعرض مميز لجذب أفضل العروض.
            </p>
            <Link 
              href="/forms/precious-auction-request"
              className="inline-block px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition"
            >
              تسجيل قطعة للبيع
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
