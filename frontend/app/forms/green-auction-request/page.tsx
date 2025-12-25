/**
 * 📝 الصفحة: نموذج طلب المنتجات الخضراء
 * 📁 المسار: Frontend-local/app/forms/green-auction-request/page.tsx
 * 
 * ✅ الوظيفة:
 * - هذه الصفحة تعرض نموذجًا مخصصًا للمنتجات الصديقة للبيئة والمستدامة.
 * - يمكن للمستخدم إدخال بيانات المنتجات الخضراء (نوع المنتج، شهادات الاستدامة، توفير الطاقة، الخ).
 * - بعد إدخال البيانات يتم إرسالها باستخدام `FormData` إلى واجهة API محلية.
 * 
 * ✅ طريقة الربط:
 * - ترسل البيانات إلى API في: /api/items (POST)
 * - يتم تخزين البيانات في قاعدة البيانات مع تصنيف "green".
 * 
 * ✅ المرفقات المدعومة:
 * - صور متعددة بصيغة FileList
 * - شهادات الاستدامة والجودة البيئية بصيغة PDF
 * 
 * ✅ الفائدة:
 * - يستخدم هذا النموذج لإضافة منتجات صديقة للبيئة إلى المنصة.
 * - يتكامل بشكل مباشر مع صفحة السوق الأخضر: /auctions/auctions-5general/green/page.tsx
 */

'use client';

import React, { useState } from 'react';
import LoadingLink from "@/components/LoadingLink";
import { ArrowLeft, Upload, Info, HelpCircle, Leaf } from 'lucide-react';

export default function GreenAuctionRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    title: '',
    ownerName: '',
    ownerPhone: '',
    productType: '',
    brand: '',
    model: '',
    manufactureYear: '',
    condition: '',
    ecoCert: '',
    energySaving: '',
    materials: '',
    origin: '',
    additionalInfo: '',
    description: '',
    startPrice: '',
    expectedPrice: '',
  });

  const [images, setImages] = useState<FileList | null>(null);
  const [document, setDocument] = useState<File | null>(null);

  // أنواع المنتجات الخضراء
  const greenProductTypes = [
    { value: 'renewable_energy', label: 'منتجات الطاقة المتجددة' },
    { value: 'recycled_products', label: 'منتجات معاد تدويرها' },
    { value: 'organic_farming', label: 'منتجات الزراعة العضوية' },
    { value: 'water_saving', label: 'منتجات توفير المياه' },
    { value: 'eco_transportation', label: 'وسائل نقل صديقة للبيئة' },
    { value: 'natural_products', label: 'منتجات طبيعية' },
    { value: 'eco_home', label: 'مستلزمات منزلية صديقة للبيئة' },
    { value: 'other', label: 'أخرى' }
  ];

  // شهادات الاستدامة
  const ecoCertifications = [
    { value: 'none', label: 'لا يوجد شهادة' },
    { value: 'energy_star', label: 'Energy Star' },
    { value: 'fsc', label: 'FSC (مجلس رعاية الغابات)' },
    { value: 'eco_label', label: 'Eco-label (الملصق البيئي الأوروبي)' },
    { value: 'leeds', label: 'LEED (الريادة في تصميمات الطاقة والبيئة)' },
    { value: 'organic', label: 'شهادة المنتجات العضوية' },
    { value: 'local_eco', label: 'شهادات محلية للاستدامة' },
    { value: 'other', label: 'شهادات أخرى' }
  ];

  // حالات المنتج
  const conditions = [
    { value: 'new', label: 'جديد (لم يستخدم)' },
    { value: 'like_new', label: 'كالجديد (استخدام بسيط)' },
    { value: 'excellent', label: 'ممتازة (علامات استخدام طفيفة)' },
    { value: 'very_good', label: 'جيدة جداً (علامات استخدام بسيطة)' },
    { value: 'good', label: 'جيدة (استخدام عادي)' },
    { value: 'acceptable', label: 'مقبولة (تحتاج إصلاحات بسيطة)' },
    { value: 'for_parts', label: 'للقطع (يحتاج إصلاحات كبيرة)' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      setImages(e.target.files);
    }
  };

  const handleDocumentChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setDocument(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();

    formData.append('title', formValues.title);
    formData.append('description', formValues.description);
    formData.append('category', 'green');
    formData.append('type', 'auction');

    const minPrice = formValues.startPrice ? formValues.startPrice : '200';
    const maxPrice = formValues.expectedPrice ? formValues.expectedPrice : '2000';
    
    formData.append('min_price', minPrice);
    formData.append('max_price', maxPrice);
    formData.append('start_price', minPrice);
    formData.append('current_price', minPrice);
    formData.append('high_price', minPrice);
    formData.append('low_price', minPrice);

    if (images) {
      Array.from(images).forEach((file) => {
        formData.append('images', file);
      });
    }

    if (document) {
      formData.append('inspection_report', document);
    } else {
      formData.append('inspection_report', '');
    }

    const additional = {
      ownerName: formValues.ownerName,
      ownerPhone: formValues.ownerPhone,
      productType: formValues.productType,
      brand: formValues.brand,
      model: formValues.model,
      manufactureYear: formValues.manufactureYear,
      condition: formValues.condition,
      ecoCert: formValues.ecoCert,
      energySaving: formValues.energySaving,
      materials: formValues.materials,
      origin: formValues.origin,
      additionalInfo: formValues.additionalInfo
    };

    formData.append('additional_info', JSON.stringify(additional));

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('تم إرسال بيانات المنتج الأخضر بنجاح');
        setFormValues({
          title: '',
          ownerName: '',
          ownerPhone: '',
          productType: '',
          brand: '',
          model: '',
          manufactureYear: '',
          condition: '',
          ecoCert: '',
          energySaving: '',
          materials: '',
          origin: '',
          additionalInfo: '',
          description: '',
          startPrice: '',
          expectedPrice: '',
        });
        setImages(null);
        setDocument(null);
      } else {
        alert('حدث خطأ في الحفظ');
      }
    } catch (error) {
      alert('فشل الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 py-6 rounded-t-lg">
        <div className="container mx-auto px-4">
          <LoadingLink 
            href="/auctions/auctions-5general/green" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى السوق الأخضر</span>
          </LoadingLink>
          <h1 className="text-3xl font-bold text-white">تسجيل منتج أخضر</h1>
          <p className="text-white/80 mt-2">
            ساهم في نشر ثقافة الاستدامة من خلال عرض منتجاتك الصديقة للبيئة
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-b-lg shadow-md border-t-0 border-l border-r border-b border-green-100">
        <div className="flex items-center mb-6 bg-green-50 p-3 rounded-lg">
          <Leaf className="text-green-600 mr-3" size={24} />
          <h2 className="text-2xl font-bold text-green-800">بيانات المنتج الأخضر</h2>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* القسم الأول: معلومات المالك */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ownerName" className="block text-gray-700 font-medium mb-2">اسم المالك <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="ownerName"
                name="ownerName"
                value={formValues.ownerName}
                onChange={handleChange}
                required
                placeholder="الاسم الكامل"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="ownerPhone" className="block text-gray-700 font-medium mb-2">رقم الهاتف <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="ownerPhone"
                name="ownerPhone"
                value={formValues.ownerPhone}
                onChange={handleChange}
                required
                placeholder="رقم هاتف للتواصل"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* القسم الثاني: معلومات المنتج */}
          <div>
            <label htmlFor="title" className="block text-gray-700 font-medium mb-2">عنوان المنتج <span className="text-red-500">*</span></label>
            <input 
              type="text"
              id="title"
              name="title"
              value={formValues.title}
              onChange={handleChange}
              required
              placeholder="عنوان وصفي للمنتج الأخضر"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="productType" className="block text-gray-700 font-medium mb-2">نوع المنتج الأخضر <span className="text-red-500">*</span></label>
              <select 
                id="productType"
                name="productType"
                value={formValues.productType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">-- اختر نوع المنتج --</option>
                {greenProductTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="condition" className="block text-gray-700 font-medium mb-2">حالة المنتج <span className="text-red-500">*</span></label>
              <select 
                id="condition"
                name="condition"
                value={formValues.condition}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">-- اختر الحالة --</option>
                {conditions.map(condition => (
                  <option key={condition.value} value={condition.value}>{condition.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="brand" className="block text-gray-700 font-medium mb-2">الشركة المصنعة</label>
              <input 
                type="text"
                id="brand"
                name="brand"
                value={formValues.brand}
                onChange={handleChange}
                placeholder="اسم الشركة المصنعة"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="model" className="block text-gray-700 font-medium mb-2">الموديل/الطراز</label>
              <input 
                type="text"
                id="model"
                name="model"
                value={formValues.model}
                onChange={handleChange}
                placeholder="موديل أو طراز المنتج"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="manufactureYear" className="block text-gray-700 font-medium mb-2">سنة الصنع</label>
              <input 
                type="text"
                id="manufactureYear"
                name="manufactureYear"
                value={formValues.manufactureYear}
                onChange={handleChange}
                placeholder="مثال: 2022"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="origin" className="block text-gray-700 font-medium mb-2">بلد المنشأ</label>
              <input 
                type="text"
                id="origin"
                name="origin"
                value={formValues.origin}
                onChange={handleChange}
                placeholder="البلد المصنع للمنتج"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ecoCert" className="block text-gray-700 font-medium mb-2">الشهادة البيئية <span className="text-red-500">*</span></label>
              <select 
                id="ecoCert"
                name="ecoCert"
                value={formValues.ecoCert}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">-- اختر الشهادة --</option>
                {ecoCertifications.map(cert => (
                  <option key={cert.value} value={cert.value}>{cert.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="energySaving" className="block text-gray-700 font-medium mb-2">توفير الطاقة/الموارد</label>
              <input 
                type="text"
                id="energySaving"
                name="energySaving"
                value={formValues.energySaving}
                onChange={handleChange}
                placeholder="مثال: يوفر 30% من الطاقة"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="materials" className="block text-gray-700 font-medium mb-2">المواد المستخدمة</label>
            <input 
              type="text"
              id="materials"
              name="materials"
              value={formValues.materials}
              onChange={handleChange}
              placeholder="المواد المكونة للمنتج"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startPrice" className="block text-gray-700 font-medium mb-2">السعر الأولي</label>
              <input 
                type="number"
                id="startPrice"
                name="startPrice"
                value={formValues.startPrice}
                onChange={handleChange}
                placeholder="سعر بداية المزاد"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="expectedPrice" className="block text-gray-700 font-medium mb-2">السعر المتوقع</label>
              <input 
                type="number"
                id="expectedPrice"
                name="expectedPrice"
                value={formValues.expectedPrice}
                onChange={handleChange}
                placeholder="السعر المتوقع للبيع"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="additionalInfo" className="block text-gray-700 font-medium mb-2">معلومات إضافية</label>
            <input 
              type="text"
              id="additionalInfo"
              name="additionalInfo"
              value={formValues.additionalInfo}
              onChange={handleChange}
              placeholder="أي معلومات إضافية مهمة عن المنتج"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">وصف المنتج <span className="text-red-500">*</span></label>
            <textarea 
              id="description"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="وصف تفصيلي للمنتج، ميزاته البيئية، وفوائده..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* القسم الثالث: الصور والوثائق */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">صور المنتج <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center">
              <input 
                type="file"
                id="product-images"
                onChange={handleImageChange}
                multiple
                accept="image/*"
                className="hidden"
              />
              <label htmlFor="product-images" className="cursor-pointer flex flex-col items-center">
                <Upload size={40} className="text-green-500 mb-2" />
                <p className="text-gray-600 mb-1">اسحب الصور هنا أو انقر للاختيار</p>
                <p className="text-sm text-gray-500">يرجى تقديم صور واضحة للمنتج من زوايا متعددة</p>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {images ? `تم اختيار ${images.length} صورة` : 'لم يتم اختيار أي صور'}
            </p>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">شهادة الاستدامة أو الوثائق البيئية</label>
            <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center">
              <input 
                type="file"
                id="document"
                onChange={handleDocumentChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <label htmlFor="document" className="cursor-pointer flex flex-col items-center">
                <Upload size={40} className="text-green-500 mb-2" />
                <p className="text-gray-600 mb-1">أرفق شهادات الاستدامة أو المعايير البيئية</p>
                <p className="text-sm text-gray-500">PDF أو صورة</p>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {document ? `تم اختيار: ${document.name}` : 'لم يتم اختيار أي ملف'}
            </p>
          </div>

          {/* القسم الرابع: الرسوم والأحكام */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-2 flex items-center text-green-800">
              <Info size={18} className="ml-2 text-green-600" />
              الرسوم والعمولات
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex justify-between">
                <span>رسوم تسجيل المنتج الأخضر:</span>
                <span className="font-medium">30 ريال (خصم خاص للمنتجات الخضراء)</span>
              </li>
              <li className="flex justify-between">
                <span>عمولة البيع عبر المزاد:</span>
                <span className="font-medium">8% من السعر النهائي</span>
              </li>
              <li className="flex justify-between">
                <span>عمولة البيع المباشر:</span>
                <span className="font-medium">4% فقط للمنتجات الخضراء</span>
              </li>
            </ul>
          </div>

          {/* الموافقة على الشروط */}
          <div className="flex items-start">
            <input 
              type="checkbox"
              id="terms"
              required
              className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 mt-1"
            />
            <label htmlFor="terms" className="mr-2 text-gray-700">
              أوافق على <LoadingLink href="/terms" className="text-green-600 hover:underline">شروط وأحكام</LoadingLink> المنصة وأتعهد بصحة المعلومات المدخلة وملكيتي للمنتج.
            </label>
          </div>

          {/* زر الإرسال */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              {isSubmitting ? 'جاري الإرسال...' : 'تسجيل المنتج الأخضر'}
            </button>
            <LoadingLink 
              href="/auctions/auctions-5general/green"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition text-center"
            >
              إلغاء
            </LoadingLink>
          </div>
        </form>

        {/* ملاحظة مساعدة */}
        <div className="mt-8 bg-green-50 rounded-lg p-4 flex items-start">
          <HelpCircle size={24} className="text-green-600 ml-3 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-green-800 mb-1">نصائح لزيادة فرص بيع المنتجات الخضراء:</h3>
            <ul className="text-green-700 space-y-1 text-sm">
              <li>• اذكر بوضوح الفوائد البيئية للمنتج وكيفية مساهمته في الاستدامة</li>
              <li>• أرفق صور واضحة تظهر حالة المنتج وميزاته</li>
              <li>• قم بإرفاق أي شهادات أو معايير بيئية حصل عليها المنتج</li>
              <li>• وضّح نسبة توفير الطاقة أو الموارد الطبيعية التي يوفرها المنتج</li>
              <li>• اذكر المواد المستخدمة في التصنيع ومدى قابليتها لإعادة التدوير</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 