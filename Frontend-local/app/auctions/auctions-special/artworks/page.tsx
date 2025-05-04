'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Filter, Award, ArrowLeft, Heart, Clock, User, Search } from 'lucide-react';

export default function ArtworksPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // بيانات القطع الفنية (مؤقتة - ستأتي من API في التطبيق الفعلي)
  const artworks = [
    {
      id: 'a1',
      title: 'لوحة الصحراء العربية',
      artist: 'محمد العبدالله',
      year: '2018',
      description: 'لوحة زيتية تصور الصحراء العربية بألوان دافئة ومناظر طبيعية خلابة',
      category: 'لوحات',
      medium: 'زيت على قماش',
      dimensions: '120 × 80 سم',
      estimatedPrice: '25,000 - 35,000',
      currentBid: '27,500',
      bids: 8,
      endDate: '2025-07-15',
      image: '/artwork1.jpg',
    },
    {
      id: 'a2',
      title: 'منحوتة الخيول العربية',
      artist: 'سارة الفيصل',
      year: '2020',
      description: 'منحوتة برونزية تجسد الخيول العربية الأصيلة في حركة انطلاق',
      category: 'منحوتات',
      medium: 'برونز',
      dimensions: '45 × 30 × 20 سم',
      estimatedPrice: '40,000 - 60,000',
      currentBid: '45,000',
      bids: 12,
      endDate: '2025-07-10',
      image: '/artwork2.jpg',
    },
    {
      id: 'a3',
      title: 'الخط العربي - آية الكرسي',
      artist: 'عبدالرحمن الخطاط',
      year: '2017',
      description: 'لوحة خط عربي تجسد آية الكرسي بالخط الديواني المذهب',
      category: 'خط عربي',
      medium: 'حبر وذهب على ورق خاص',
      dimensions: '60 × 80 سم',
      estimatedPrice: '20,000 - 30,000',
      currentBid: '28,000',
      bids: 15,
      endDate: '2025-07-20',
      image: '/artwork3.jpg',
    },
    {
      id: 'a4',
      title: 'تحفة عثمانية قديمة',
      artist: 'غير معروف',
      year: 'القرن الـ 18',
      description: 'تحفة نحاسية منقوشة يدوياً بزخارف إسلامية من العصر العثماني',
      category: 'تحف',
      medium: 'نحاس منقوش',
      dimensions: '25 × 25 × 15 سم',
      estimatedPrice: '70,000 - 90,000',
      currentBid: '75,000',
      bids: 9,
      endDate: '2025-07-05',
      image: '/artwork4.jpg',
    },
    {
      id: 'a5',
      title: 'سجادة فارسية أنتيكة',
      artist: 'صناعة يدوية - أصفهان',
      year: 'القرن الـ 19',
      description: 'سجادة فارسية نادرة منسوجة يدوياً بخيوط حريرية وصباغة طبيعية',
      category: 'تحف',
      medium: 'نسيج حريري يدوي',
      dimensions: '300 × 200 سم',
      estimatedPrice: '120,000 - 150,000',
      currentBid: '130,000',
      bids: 18,
      endDate: '2025-07-08',
      image: '/artwork5.jpg',
    },
    {
      id: 'a6',
      title: 'مجموعة مخطوطات نادرة',
      artist: 'متنوع',
      year: 'القرن الـ 17 - 19',
      description: 'مجموعة من المخطوطات العربية النادرة في العلوم والأدب والفلك',
      category: 'مخطوطات',
      medium: 'حبر على ورق',
      dimensions: 'متنوعة',
      estimatedPrice: '200,000 - 250,000',
      currentBid: '210,000',
      bids: 7,
      endDate: '2025-07-12',
      image: '/artwork6.jpg',
    },
  ];

  // فئات القطع الفنية
  const categories = [
    { id: 'all', name: 'جميع القطع' },
    { id: 'لوحات', name: 'لوحات' },
    { id: 'منحوتات', name: 'منحوتات' },
    { id: 'خط عربي', name: 'خط عربي' },
    { id: 'تحف', name: 'تحف' },
    { id: 'مخطوطات', name: 'مخطوطات' },
  ];

  // تصفية القطع حسب الفئة والبحث
  const filteredArtworks = artworks.filter(artwork => {
    const matchesCategory = activeCategory === 'all' || artwork.category === activeCategory;
    const matchesSearch = !searchQuery || 
      artwork.title.includes(searchQuery) || 
      artwork.artist.includes(searchQuery) || 
      artwork.description.includes(searchQuery);
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* رأس الصفحة */}
      <div className="relative bg-gradient-to-r from-purple-800 to-indigo-900 py-16">
        <div className="absolute inset-0 opacity-20 bg-pattern"></div>
        <div className="container mx-auto px-4 relative z-10">
          {/* زر العودة */}
          <div className="mb-8">
            <Link 
              href="/auctions/auctions-special" 
              className="inline-flex items-center text-white/90 hover:text-white transition"
            >
              <ArrowLeft size={20} className="ml-2" />
              <span>العودة إلى الأسواق المتخصصة</span>
            </Link>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-4 text-center">معرض الفنون والقطع النادرة</h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto text-center">
            اكتشف لوحات فنية نادرة، منحوتات متميزة، قطع خط عربي أصيلة، وتحف أثرية ذات قيمة استثمارية عالية
          </p>
          
          {/* زر إضافة لوحة فنية جديدة */}
          <div className="mt-8 flex justify-center">
            <Link
              href="/forms/artwork-auction-request"
              className="bg-white text-purple-700 hover:bg-purple-50 px-6 py-3 rounded-lg font-bold transition shadow-lg hover:shadow-xl flex items-center"
            >
              <span>سجل لوحتك الفنية للمزاد</span>
              <span className="mr-2 bg-purple-100 text-purple-800 text-xs py-1 px-2 rounded-full">جديد</span>
            </Link>
          </div>
        </div>
      </div>

      {/* شريط البحث والتصفية */}
      <div className="bg-white shadow-md py-4 sticky top-0 z-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* فلترة الفئات */}
            <div className="flex overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ml-2 ${
                    activeCategory === category.id
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            
            {/* حقل البحث */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="ابحث عن قطعة فنية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
              />
              <Search size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* عرض القطع الفنية */}
      <div className="container mx-auto px-4 py-12">
        {filteredArtworks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">لم يتم العثور على قطع فنية تطابق معايير البحث</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArtworks.map(artwork => (
              <Link 
                key={artwork.id} 
                href={`/auctions/auctions-special/artworks/${artwork.id}`}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition group"
              >
                <div className="relative h-64">
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">صورة القطعة الفنية</span>
                  </div>
                  <button 
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-purple-500 z-10"
                    onClick={(e) => {
                      e.preventDefault();
                      // إضافة للمفضلة (سيتم تنفيذها لاحقًا)
                    }}
                    aria-label="إضافة للمفضلة"
                  >
                    <Heart size={20} />
                  </button>
                </div>
                
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-2 group-hover:text-purple-700 transition">{artwork.title}</h2>
                  
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center text-gray-600">
                      <User size={16} className="ml-1" />
                      <span>{artwork.artist}</span>
                    </div>
                    <div className="text-gray-600 text-sm">{artwork.year}</div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">{artwork.description}</p>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {artwork.category}
                      </span>
                    </div>
                    <div>
                      {artwork.dimensions}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">المزايدة الحالية</p>
                        <p className="text-lg font-bold text-purple-700">{artwork.currentBid} ريال</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center text-gray-500 text-sm">
                          <Clock size={14} className="ml-1" />
                          <span>ينتهي في {artwork.endDate}</span>
                        </div>
                        <div className="text-gray-500 text-sm mt-1">
                          {artwork.bids} مزايدة
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* قسم المعلومات */}
      <div className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">معرض الفنون والقطع النادرة</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                يضم معرض الفنون والقطع النادرة في منصتنا مجموعة منتقاة من أرقى وأندر القطع الفنية من مختلف العصور والثقافات، تشمل لوحات فنية أصلية، منحوتات متميزة، قطع خط عربي أصيلة، تحف أثرية، مخطوطات نادرة، وغيرها من القطع ذات القيمة التاريخية والفنية والاستثمارية العالية.
              </p>
              <p>
                جميع القطع المعروضة في المزاد تخضع لتقييم دقيق من قبل خبراء متخصصين في مجالات الفنون المختلفة، كما يتم توفير شهادات أصالة وتقارير حالة مفصلة لكل قطعة، لضمان الثقة والشفافية التامة لعملائنا.
              </p>
              <p>
                تتيح منصتنا فرصة استثنائية لهواة ومحبي الفنون والقطع النادرة لامتلاك قطع فريدة ذات قيمة تاريخية وفنية متميزة، مع إمكانية المعاينة والاطلاع على التفاصيل الكاملة قبل المشاركة في المزاد.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 