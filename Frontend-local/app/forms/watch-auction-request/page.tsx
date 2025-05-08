'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Info, HelpCircle, X } from 'lucide-react';

export default function WatchAuctionRequestPage() {
  const [formData, setFormData] = useState({
    watchName: '',
    brand: '',
    referenceNumber: '',
    condition: '',
    year: '',
    hasBox: false,
    hasWarranty: false,
    hasPapers: false,
    description: '',
    minPrice: '',
    maxPrice: '',
    acceptDirectOffers: true,
    deliveryMethod: 'platform',
    images: [] as File[],
  });

  // الماركات المعتمدة
  const approvedBrands = [
    { name: 'Rolex', models: ['Daytona', 'Submariner', 'GMT-Master', 'Datejust', 'Day-Date', 'Explorer'] },
    { name: 'Patek Philippe', models: ['Nautilus', 'Aquanaut', 'Calatrava', 'Grand Complications'] },
    { name: 'Audemars Piguet', models: ['Royal Oak', 'Royal Oak Offshore'] },
    { name: 'Richard Mille', models: ['RM 11', 'RM 27', 'RM 35'] },
    { name: 'Omega', models: ['Speedmaster', 'Seamaster', 'Constellation', 'De Ville'] },
    { name: 'Cartier', models: ['Santos', 'Tank', 'Ballon Bleu', 'Panthère'] },
    { name: 'Hublot', models: ['Big Bang', 'Classic Fusion'] },
    { name: 'Jaeger-LeCoultre', models: ['Reverso', 'Master', 'Polaris'] },
    { name: 'Grand Seiko', models: ['Heritage', 'Sport', 'Elegance'] },
  ];

  // حالات الساعة
  const conditions = [
    { value: 'new', label: 'جديدة (لم تستخدم)' },
    { value: 'excellent', label: 'ممتازة (شبه جديدة، بدون خدوش أو علامات استخدام)' },
    { value: 'very_good', label: 'جيدة جدًا (علامات استخدام بسيطة غير ملحوظة)' },
    { value: 'good', label: 'جيدة (علامات استخدام واضحة لكن بدون أضرار)' },
    { value: 'fair', label: 'متوسطة (خدوش واضحة ويمكن إصلاحها)' },
  ];

  // طرق التوصيل
  const deliveryMethods = [
    { value: 'platform', label: 'من خلال المنصة (رسوم 200 ريال)' },
    { value: 'courier', label: 'شركة توصيل خارجية (DHL / Aramex)' },
    { value: 'personal', label: 'استلام شخصي' },
  ];

  // وظيفة معالجة التغييرات في الحقول
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // وظيفة معالجة اختيار الصور
  const handleImageChange = (e) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      if (formData.images.length + newImages.length <= 10) { // الحد الأقصى 10 صور
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
      } else {
        alert('لا يمكن رفع أكثر من 10 صور');
      }
    }
  };

  // وظيفة حذف صورة
  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // وظيفة إرسال النموذج
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('تم إرسال النموذج:', formData);
    // سيتم هنا إرسال البيانات إلى الخادم لاحقًا
    alert(`تم استلام طلبك بنجاح! سنقوم بمراجعته والتواصل معك قريبًا.
الحد الأدنى: ${formData.minPrice} ريال
الحد الأعلى: ${formData.maxPrice} ريال`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-600 py-6">
        <div className="container mx-auto px-4">
          <Link 
            href="/auctions/auctions-4special/watches" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى سوق الساعات الفاخرة</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">تسجيل ساعة للبيع</h1>
          <p className="text-white/80 mt-2">
            سجل ساعتك الفاخرة وانضم إلى عالم المزادات الآمن والموثوق
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6">معلومات الساعة</h2>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* القسم الأول: معلومات الساعة الأساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="brand" className="block text-gray-700 font-medium mb-2">الماركة <span className="text-red-500">*</span></label>
                <select 
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="اختر ماركة الساعة"
                >
                  <option value="">-- اختر الماركة --</option>
                  {approvedBrands.map(brand => (
                    <option key={brand.name} value={brand.name}>{brand.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="watchName" className="block text-gray-700 font-medium mb-2">اسم/موديل الساعة <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  id="watchName"
                  name="watchName"
                  value={formData.watchName}
                  onChange={handleChange}
                  required
                  placeholder="مثال: Daytona / Submariner / Royal Oak"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="referenceNumber" className="block text-gray-700 font-medium mb-2">الرقم المرجعي <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  id="referenceNumber"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleChange}
                  required
                  placeholder="مثال: 116500LN"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="year" className="block text-gray-700 font-medium mb-2">سنة الإنتاج</label>
                <input 
                  type="text"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  placeholder="مثال: 2020"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* القسم الثاني: حالة الساعة والمرفقات */}
            <div>
              <label htmlFor="condition" className="block text-gray-700 font-medium mb-2">حالة الساعة <span className="text-red-500">*</span></label>
              <select 
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="اختر حالة الساعة"
              >
                <option value="">-- اختر الحالة --</option>
                {conditions.map(condition => (
                  <option key={condition.value} value={condition.value}>{condition.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center">
                <input 
                  type="checkbox"
                  id="hasBox"
                  name="hasBox"
                  checked={formData.hasBox}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="hasBox" className="mr-2 text-gray-700">مع العلبة الأصلية</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox"
                  id="hasWarranty"
                  name="hasWarranty"
                  checked={formData.hasWarranty}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="hasWarranty" className="mr-2 text-gray-700">مع بطاقة الضمان</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox"
                  id="hasPapers"
                  name="hasPapers"
                  checked={formData.hasPapers}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="hasPapers" className="mr-2 text-gray-700">مع الأوراق الرسمية</label>
              </div>
            </div>

            {/* القسم الثالث: الوصف والسعر */}
            <div>
              <label htmlFor="description" className="block text-gray-700 font-medium mb-2">وصف الساعة <span className="text-red-500">*</span></label>
              <textarea 
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="يرجى تقديم وصف دقيق للساعة، بما في ذلك الحالة، والمميزات الخاصة، وأي علامات استخدام أو خدوش..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="minPrice" className="block text-gray-700 font-medium mb-2">الحد الأدنى المقبول (بالريال) <span className="text-red-500">*</span></label>
                <input 
                  type="number"
                  id="minPrice"
                  name="minPrice"
                  value={formData.minPrice}
                  onChange={handleChange}
                  required
                  min="1000"
                  placeholder="أدخل الحد الأدنى المقبول"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">سيكون مخفياً عن المشترين</p>
              </div>

              <div>
                <label htmlFor="maxPrice" className="block text-gray-700 font-medium mb-2">الحد الأعلى المرغوب فيه (بالريال) <span className="text-red-500">*</span></label>
                <input 
                  type="number"
                  id="maxPrice"
                  name="maxPrice"
                  value={formData.maxPrice}
                  onChange={handleChange}
                  required
                  min="1000"
                  placeholder="أدخل الحد الأعلى المرغوب فيه"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">سيكون مخفياً عن المشترين</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 italic">سيتم تحديد سعر الافتتاح من قبل غرفة التحكم (الكنترول روم) بناءً على تقييم الساعة.</p>

            {/* القسم الرابع: الصور */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">صور الساعة <span className="text-red-500">*</span></label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input 
                  type="file"
                  id="watch-images"
                  onChange={handleImageChange}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <label htmlFor="watch-images" className="cursor-pointer flex flex-col items-center">
                  <Upload size={40} className="text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-1">اسحب الصور هنا أو انقر للاختيار</p>
                  <p className="text-sm text-gray-500">يمكنك رفع حتى 10 صور عالية الجودة للساعة</p>
                </label>
              </div>
              
              {formData.images.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-gray-700 font-medium mb-2">الصور المرفوعة ({formData.images.length}/10)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative h-24 bg-gray-100 rounded-md overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">صورة {index + 1}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                          aria-label={`حذف الصورة ${index + 1}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* قسم طريقة التوصيل */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">طريقة التسليم <span className="text-red-500">*</span></label>
              <div className="space-y-3">
                {deliveryMethods.map(method => (
                  <div 
                    key={method.value}
                    className="flex items-center"
                  >
                    <input 
                      type="radio"
                      id={`delivery-${method.value}`}
                      name="deliveryMethod"
                      value={method.value}
                      checked={formData.deliveryMethod === method.value}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor={`delivery-${method.value}`} className="mr-2 font-medium">{method.label}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* قسم الرسوم والأحكام */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <Info size={18} className="ml-2 text-blue-600" />
                الرسوم والعمولات
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex justify-between">
                  <span>رسوم إدخال الساعة في النظام:</span>
                  <span className="font-medium">118 ريال (غير مستردة)</span>
                </li>
                <li className="flex justify-between">
                  <span>عمولة البيع عبر المزاد:</span>
                  <span className="font-medium">5% من السعر النهائي</span>
                </li>
                <li className="flex justify-between">
                  <span>عمولة البيع المباشر:</span>
                  <span className="font-medium">3% فقط</span>
                </li>
              </ul>
            </div>

            {/* الموافقة على الشروط */}
            <div className="flex items-start">
              <input 
                type="checkbox"
                id="terms"
                required
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-1"
              />
              <label htmlFor="terms" className="mr-2 text-gray-700">
                أوافق على <Link href="/terms" className="text-blue-600 hover:underline">شروط وأحكام</Link> المنصة وأتعهد بصحة المعلومات المدخلة.
              </label>
            </div>

            {/* زر الإرسال */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                إرسال الطلب
              </button>
              <Link 
                href="/auctions/auctions-4special/watches"
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition text-center"
              >
                إلغاء
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* ملاحظة مساعدة */}
      <div className="container mx-auto px-4 mt-8">
        <div className="max-w-4xl mx-auto bg-blue-50 rounded-xl p-4 flex items-start">
          <HelpCircle size={24} className="text-blue-600 ml-3 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-blue-800 mb-1">نصائح للحصول على أفضل سعر</h3>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>• قم بتصوير الساعة من جميع الزوايا بضوء جيد ومناسب</li>
              <li>• أضف صورًا واضحة للإبزيم والمينا والرقم المرجعي</li>
              <li>• كن صادقًا في وصف الحالة والخدوش إن وجدت</li>
              <li>• أرفق شهادات الفحص والأوراق الرسمية إن وجدت</li>
              <li>• حدد سعرًا تنافسيًا مناسبًا لحالة وسنة إنتاج الساعة</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 