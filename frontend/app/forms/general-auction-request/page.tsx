/**
 * 📝 الصفحة: نموذج عام لتسجيل المنتجات للبيع
 * 📁 المسار: Frontend-local/app/forms/general-auction-request/page.tsx
 * 
 * ✅ الوظيفة:
 * - هذه الصفحة تعرض نموذجًا عامًا يسمح للمستخدم بإدخال بيانات أي منتج يرغب في بيعه.
 * - بعد إدخال البيانات يتم إرسالها باستخدام `FormData` إلى واجهة API محلية.
 * 
 * ✅ طريقة الربط:
 * - ترسل البيانات إلى API في: /api/items (POST)
 * - يتم تخزين البيانات مباشرة في قاعدة البيانات auctions.db في جدول اسمه `items`.
 * 
 * ✅ المرفقات المدعومة:
 * - صور متعددة بصيغة FileList
 * - تقرير فحص أو كتالوج بصيغة PDF أو صورة
 * 
 * ✅ الفائدة:
 * - يستخدم هذا النموذج لإضافة أي منتج إلى المنصة لعرضه لاحقًا في صفحة العرض الخاصة.
 * - يتكامل بشكل مباشر مع صفحة: /auctions/auctions-5general/page.tsx
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Info, HelpCircle } from 'lucide-react';

export default function GeneralAuctionRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    title: '',
    ownerName: '',
    ownerPhone: '',
    category: '',
    productType: '',
    brand: '',
    model: '',
    manufactureYear: '',
    condition: '',
    dimensions: '',
    additionalInfo: '',
    description: '',
    startPrice: '',
    expectedPrice: '',
  });

  const [images, setImages] = useState<FileList | null>(null);
  const [document, setDocument] = useState<File | null>(null);

  // فئات المنتجات
  const categories = [
    { value: 'electronics', label: 'أجهزة إلكترونية' },
    { value: 'furniture', label: 'أثاث منزلي' },
    { value: 'equipment', label: 'معدات وأدوات' },
    { value: 'green', label: 'منتجات صديقة للبيئة' },
    { value: 'luxury', label: 'سلع فاخرة' },
    { value: 'collectibles', label: 'مقتنيات نادرة' },
    { value: 'vehicles', label: 'مركبات' },
    { value: 'other', label: 'أخرى' }
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
    formData.append('category', formValues.category);
    formData.append('type', 'auction');

    const minPrice = formValues.startPrice ? formValues.startPrice : '500';
    const maxPrice = formValues.expectedPrice ? formValues.expectedPrice : '5000';
    
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
      dimensions: formValues.dimensions,
      additionalInfo: formValues.additionalInfo
    };

    formData.append('additional_info', JSON.stringify(additional));

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('تم إرسال بيانات المنتج بنجاح');
        setFormValues({
          title: '',
          ownerName: '',
          ownerPhone: '',
          category: '',
          productType: '',
          brand: '',
          model: '',
          manufactureYear: '',
          condition: '',
          dimensions: '',
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-6 rounded-t-lg">
        <div className="container mx-auto px-4">
          <Link 
            href="/auctions/auctions-5general" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى الأسواق العامة</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">طلب مزاد عام</h1>
          <p className="text-white/80 mt-2">
            قم بتسجيل منتجك للبيع من خلال منصتنا واستفد من سوق واسع من المشترين المهتمين
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-b-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">معلومات المنتج</h2>
        
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
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              placeholder="عنوان وصفي للمنتج"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-gray-700 font-medium mb-2">فئة المنتج <span className="text-red-500">*</span></label>
              <select 
                id="category"
                name="category"
                value={formValues.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- اختر فئة المنتج --</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="productType" className="block text-gray-700 font-medium mb-2">نوع المنتج <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="productType"
                name="productType"
                value={formValues.productType}
                onChange={handleChange}
                required
                placeholder="نوع المنتج بالتفصيل"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="brand" className="block text-gray-700 font-medium mb-2">الماركة</label>
              <input 
                type="text"
                id="brand"
                name="brand"
                value={formValues.brand}
                onChange={handleChange}
                placeholder="الشركة المصنعة"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="model" className="block text-gray-700 font-medium mb-2">الموديل</label>
              <input 
                type="text"
                id="model"
                name="model"
                value={formValues.model}
                onChange={handleChange}
                placeholder="موديل المنتج"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                placeholder="مثال: 2020"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="condition" className="block text-gray-700 font-medium mb-2">حالة المنتج <span className="text-red-500">*</span></label>
              <select 
                id="condition"
                name="condition"
                value={formValues.condition}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- اختر الحالة --</option>
                {conditions.map(condition => (
                  <option key={condition.value} value={condition.value}>{condition.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="dimensions" className="block text-gray-700 font-medium mb-2">أبعاد المنتج</label>
            <input 
              type="text"
              id="dimensions"
              name="dimensions"
              value={formValues.dimensions}
              onChange={handleChange}
              placeholder="الطول × العرض × الارتفاع (سم)"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              placeholder="وصف تفصيلي للمنتج، حالته، ميزاته، وأي معلومات أخرى مهمة..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* القسم الثالث: الصور والوثائق */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">صور المنتج <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input 
                type="file"
                id="product-images"
                onChange={handleImageChange}
                multiple
                accept="image/*"
                className="hidden"
              />
              <label htmlFor="product-images" className="cursor-pointer flex flex-col items-center">
                <Upload size={40} className="text-gray-400 mb-2" />
                <p className="text-gray-600 mb-1">اسحب الصور هنا أو انقر للاختيار</p>
                <p className="text-sm text-gray-500">يرجى تقديم صور واضحة للمنتج من زوايا متعددة</p>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {images ? `تم اختيار ${images.length} صورة` : 'لم يتم اختيار أي صور'}
            </p>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">وثائق إضافية (اختياري)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input 
                type="file"
                id="document"
                onChange={handleDocumentChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <label htmlFor="document" className="cursor-pointer flex flex-col items-center">
                <Upload size={40} className="text-gray-400 mb-2" />
                <p className="text-gray-600 mb-1">أرفق فاتورة الشراء أو كتالوج المنتج</p>
                <p className="text-sm text-gray-500">PDF أو صورة</p>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {document ? `تم اختيار: ${document.name}` : 'لم يتم اختيار أي ملف'}
            </p>
          </div>

          {/* القسم الرابع: الرسوم والأحكام */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-2 flex items-center">
              <Info size={18} className="ml-2 text-blue-600" />
              الرسوم والعمولات
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex justify-between">
                <span>رسوم تسجيل المنتج:</span>
                <span className="font-medium">50 ريال (غير مستردة)</span>
              </li>
              <li className="flex justify-between">
                <span>عمولة البيع عبر المزاد:</span>
                <span className="font-medium">10% من السعر النهائي</span>
              </li>
              <li className="flex justify-between">
                <span>عمولة البيع المباشر:</span>
                <span className="font-medium">5% فقط</span>
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
              أوافق على <Link href="/terms" className="text-blue-600 hover:underline">شروط وأحكام</Link> المنصة وأتعهد بصحة المعلومات المدخلة وملكيتي للمنتج.
            </label>
          </div>

          {/* زر الإرسال */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </button>
            <Link 
              href="/auctions/auctions-5general"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition text-center"
            >
              إلغاء
            </Link>
          </div>
        </form>

        {/* ملاحظة مساعدة */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4 flex items-start">
          <HelpCircle size={24} className="text-blue-600 ml-3 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-blue-800 mb-1">نصائح لزيادة فرص البيع:</h3>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>• التقط صوراً واضحة للمنتج من جميع الزوايا</li>
              <li>• قدم وصفاً دقيقاً وشاملاً للمنتج</li>
              <li>• أرفق أي وثائق تثبت أصالة المنتج أو حالته</li>
              <li>• حدد سعراً عادلاً يتناسب مع قيمة المنتج في السوق</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 