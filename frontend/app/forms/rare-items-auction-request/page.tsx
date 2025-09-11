'use client';

import { useState } from 'react';
import LoadingLink from "@/components/LoadingLink";
import { ArrowLeft, Upload, Info, HelpCircle, X, FileText } from 'lucide-react';

export default function RareItemAuctionRequestPage() {
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    yearProduced: '',
    origin: '',
    condition: '',
    description: '',
    story: '',
    minPrice: '',
    hasCertificate: false,
    certificateDetails: '',
    deliveryMethod: 'platform',
    images: [],
    certificate: null,
  });

  // تصنيفات التحف والقطع النادرة
  const categories = [
    { value: 'antiques', label: 'تحف أثرية' },
    { value: 'rare-tools', label: 'أدوات نادرة' },
    { value: 'documents', label: 'مستندات قديمة' },
    { value: 'decorative', label: 'ديكورات فنية' },
    { value: 'jewelry', label: 'مجوهرات قديمة' },
  ];

  // حالات القطع
  const conditions = [
    { value: 'excellent', label: 'ممتازة (حالة استثنائية مع حفظ كامل للتفاصيل)' },
    { value: 'very_good', label: 'جيدة جدًا (حالة ممتازة مع آثار استخدام طفيفة)' },
    { value: 'good', label: 'جيدة (حالة جيدة مع بعض علامات الاستخدام أو الترميم)' },
    { value: 'fair', label: 'متوسطة (تحتاج لبعض الترميم وبها علامات تقادم واضحة)' },
    { value: 'poor', label: 'ضعيفة (بحاجة لترميم كبير، لكن ذات قيمة تاريخية)' },
  ];

  // طرق التوصيل
  const deliveryMethods = [
    { value: 'platform', label: 'خدمة توصيل المنصة المتخصصة (رسوم إضافية)' },
    { value: 'courier', label: 'شركة شحن خارجية متخصصة (DHL/Aramex)' },
    { value: 'personal', label: 'تسليم شخصي في الكنترول روم' },
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

  // وظيفة معالجة رفع شهادة التوثيق
  const handleCertificateUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        certificate: e.target.files[0]
      }));
    }
  };

  // وظيفة إرسال النموذج
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('تم إرسال النموذج:', formData);
    // سيتم هنا إرسال البيانات إلى الخادم لاحقًا
    alert('تم استلام طلبك بنجاح! سيتم مراجعته والتواصل معك قريبًا.');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-amber-800 to-amber-600 py-6">
        <div className="container mx-auto px-4">
          <LoadingLink 
            href="/auctions/auctions-4special/precious" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى سوق التحف والقطع النادرة</span>
          </LoadingLink>
          <h1 className="text-3xl font-bold text-white">تسجيل قطعة نادرة للبيع</h1>
          <p className="text-white/80 mt-2">
            سجل قطعتك النادرة بكافة التفاصيل لعرضها في منصة Heritage للمقتنيات الفاخرة
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6">معلومات القطعة</h2>

          <div className="bg-blue-50 p-4 rounded-lg mb-8">
            <div className="flex items-start">
              <HelpCircle size={22} className="text-blue-600 ml-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-blue-800 mb-1">ملاحظة مهمة</h3>
                <p className="text-blue-700 text-sm">
                  نرحب بالقطع النادرة ذات القيمة التاريخية والفنية. جميع القطع ستخضع للتحقق من الأصالة والموثوقية قبل العرض للبيع. يرجى تقديم أكبر قدر ممكن من المعلومات الدقيقة لتسهيل عملية التحقق.
                </p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* القسم الأول: معلومات القطعة الأساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="itemName" className="block text-gray-700 font-medium mb-2">اسم القطعة <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  id="itemName"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleChange}
                  required
                  placeholder="مثال: تمثال برونزي روماني، مخطوطة عثمانية..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-gray-700 font-medium mb-2">التصنيف <span className="text-red-500">*</span></label>
                <select 
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  aria-label="اختر تصنيف القطعة"
                >
                  <option value="">-- اختر التصنيف --</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="yearProduced" className="block text-gray-700 font-medium mb-2">العصر/سنة الصنع <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  id="yearProduced"
                  name="yearProduced"
                  value={formData.yearProduced}
                  onChange={handleChange}
                  required
                  placeholder="مثال: القرن التاسع عشر، 1860-1880..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label htmlFor="origin" className="block text-gray-700 font-medium mb-2">الأصل/المنشأ <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  id="origin"
                  name="origin"
                  value={formData.origin}
                  onChange={handleChange}
                  required
                  placeholder="مثال: الإمبراطورية العثمانية، إيطاليا..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            {/* حالة القطعة */}
            <div>
              <label htmlFor="condition" className="block text-gray-700 font-medium mb-2">حالة القطعة <span className="text-red-500">*</span></label>
              <select 
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                aria-label="اختر حالة القطعة"
              >
                <option value="">-- اختر الحالة --</option>
                {conditions.map(condition => (
                  <option key={condition.value} value={condition.value}>{condition.label}</option>
                ))}
              </select>
            </div>

            {/* وصف القطعة */}
            <div>
              <label htmlFor="description" className="block text-gray-700 font-medium mb-2">وصف القطعة <span className="text-red-500">*</span></label>
              <textarea 
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="يرجى وصف القطعة بالتفصيل: المواد المصنوعة منها، الأبعاد، التفاصيل المميزة، النقوش إن وجدت، الحالة العامة..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            {/* قصة وتاريخ القطعة */}
            <div>
              <label htmlFor="story" className="block text-gray-700 font-medium mb-2">القصة والتاريخ (إن وجد)</label>
              <textarea 
                id="story"
                name="story"
                value={formData.story}
                onChange={handleChange}
                rows={3}
                placeholder="تاريخ القطعة، مصدرها، أين تم الحصول عليها، إذا كانت جزءًا من مجموعة، أو معلومات عن مالكيها السابقين..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            {/* السعر */}
            <div>
              <label htmlFor="minPrice" className="block text-gray-700 font-medium mb-2">السعر الأدنى المتوقع (بالريال) <span className="text-red-500">*</span></label>
              <input 
                type="number"
                id="minPrice"
                name="minPrice"
                value={formData.minPrice}
                onChange={handleChange}
                required
                min="1000"
                placeholder="أدخل السعر الأدنى المتوقع"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <p className="text-sm text-gray-500 mt-1">سيتم استخدام هذا كأساس للسعر الافتتاحي للمزاد</p>
            </div>

            {/* توثيق القطعة */}
            <div>
              <div className="flex items-center mb-4">
                <input 
                  type="checkbox"
                  id="hasCertificate"
                  name="hasCertificate"
                  checked={formData.hasCertificate}
                  onChange={handleChange}
                  className="w-5 h-5 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
                />
                <label htmlFor="hasCertificate" className="mr-2 text-gray-700 font-medium">
                  لدي شهادة توثيق أو أوراق تثبت أصالة القطعة
                </label>
              </div>

              {formData.hasCertificate && (
                <div className="ml-7 space-y-4">
                  <div>
                    <label htmlFor="certificateDetails" className="block text-gray-700 font-medium mb-2">
                      تفاصيل الشهادة/التوثيق
                    </label>
                    <input 
                      type="text"
                      id="certificateDetails"
                      name="certificateDetails"
                      value={formData.certificateDetails}
                      onChange={handleChange}
                      placeholder="مصدر الشهادة، الجهة المانحة، التاريخ..."
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      رفع نسخة من الشهادة (PDF أو صورة)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input 
                        type="file"
                        id="certificate-file"
                        onChange={handleCertificateUpload}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                      />
                      <label htmlFor="certificate-file" className="cursor-pointer flex flex-col items-center">
                        <FileText size={36} className="text-gray-400 mb-2" />
                        <p className="text-gray-600 mb-1">انقر لرفع ملف الشهادة</p>
                        <p className="text-sm text-gray-500">PDF أو صورة واضحة للشهادة</p>
                      </label>
                    </div>

                    {formData.certificate && (
                      <div className="mt-2 flex items-center text-green-600">
                        <div className="bg-green-100 p-1 rounded">
                          <FileText size={16} />
                        </div>
                        <span className="mr-2">{formData.certificate.name}</span>
                        <button 
                          type="button" 
                          onClick={() => setFormData(prev => ({ ...prev, certificate: null }))}
                          className="mr-2 text-red-500 p-1 hover:bg-red-50 rounded-full"
                          aria-label="حذف الشهادة"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* صور القطعة */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">صور القطعة <span className="text-red-500">*</span></label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input 
                  type="file"
                  id="item-images"
                  onChange={handleImageChange}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <label htmlFor="item-images" className="cursor-pointer flex flex-col items-center">
                  <Upload size={40} className="text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-1">اسحب الصور هنا أو انقر للاختيار</p>
                  <p className="text-sm text-gray-500">يرجى رفع صور واضحة من جميع الزوايا (حتى 10 صور)</p>
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

            {/* طريقة التوصيل */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">طريقة التسليم المفضلة <span className="text-red-500">*</span></label>
              <div className="space-y-3">
                {deliveryMethods.map(method => (
                  <div 
                    key={method.value}
                    className={`border rounded-lg p-4 cursor-pointer transition ${
                      formData.deliveryMethod === method.value 
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-300 hover:border-amber-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, deliveryMethod: method.value }))}
                  >
                    <div className="flex items-center">
                      <input 
                        type="radio"
                        id={`delivery-${method.value}`}
                        name="deliveryMethod"
                        value={method.value}
                        checked={formData.deliveryMethod === method.value}
                        onChange={handleChange}
                        className="w-5 h-5 text-amber-600 focus:ring-2 focus:ring-amber-500"
                      />
                      <label htmlFor={`delivery-${method.value}`} className="mr-2 font-medium">{method.label}</label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* قسم الرسوم والعمولات */}
            <div className="bg-amber-50 p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <Info size={18} className="ml-2 text-amber-600" />
                الرسوم والعمولات
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex justify-between">
                  <span>رسوم إدخال القطعة في النظام:</span>
                  <span className="font-medium">100 ريال (غير مستردة)</span>
                </li>
                <li className="flex justify-between">
                  <span>عمولة البيع عبر المزاد:</span>
                  <span className="font-medium">7% من السعر النهائي</span>
                </li>
                <li className="flex justify-between">
                  <span>عمولة البيع المباشر:</span>
                  <span className="font-medium">4% فقط</span>
                </li>
              </ul>
            </div>

            {/* ملاحظات مساعدة */}
            <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100">
              <h3 className="text-lg font-bold mb-2 flex items-center text-amber-800">
                <HelpCircle size={18} className="ml-2 text-amber-600" />
                نصائح لتقديم طلب ناجح
              </h3>
              <ul className="list-disc mr-5 space-y-1 text-sm text-amber-700">
                <li>قدم وصفًا دقيقًا وشاملًا للقطعة، بما في ذلك التفاصيل التي تميزها.</li>
                <li>أرفق صورًا واضحة للقطعة من جميع الزوايا والتفاصيل المهمة والنقوش.</li>
                <li>قدم معلومات موثقة عن تاريخ القطعة ومصدرها إذا كانت متوفرة.</li>
                <li>حدد حالة القطعة بدقة، بما في ذلك أي علامات استخدام أو ترميم.</li>
                <li>احرص على رفع أي وثائق أو شهادات تثبت أصالة القطعة.</li>
              </ul>
            </div>

            {/* الموافقة على الشروط */}
            <div className="flex items-start">
              <input 
                type="checkbox"
                id="terms"
                required
                className="w-5 h-5 text-amber-600 rounded focus:ring-2 focus:ring-amber-500 mt-1"
              />
              <label htmlFor="terms" className="mr-2 text-gray-700">
                أقر بصحة جميع المعلومات المقدمة وأن القطعة أصلية ومملوكة لي بشكل قانوني. أوافق على <LoadingLink href="/terms" className="text-amber-600 hover:underline">شروط وأحكام</LoadingLink> المنصة.
              </label>
            </div>

            {/* زر الإرسال */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                type="submit"
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
              >
                إرسال الطلب
              </button>
              <LoadingLink 
                href="/auctions/auctions-4special/precious"
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition text-center"
              >
                إلغاء
              </LoadingLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 