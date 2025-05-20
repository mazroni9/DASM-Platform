/**
 * 📝 الصفحة: نموذج إدخال الأجهزة الإلكترونية للمزاد
 * 📁 المسار: Frontend-local/app/forms/electronics-auction-request/page.tsx
 * 
 * ✅ الوظيفة:
 * - هذه الصفحة تعرض نموذجًا مخصصًا يسمح للمستخدم بإدخال بيانات الأجهزة الإلكترونية (النوع، الماركة، المواصفات، الصور...).
 * - بعد إدخال البيانات يتم إرسالها باستخدام `FormData` إلى واجهة API محلية.
 * 
 * ✅ طريقة الربط:
 * - ترسل البيانات إلى API في: /api/items (POST)
 * - يتم تخزين البيانات مباشرة في قاعدة البيانات auctions.db في جدول اسمه `items`.
 * 
 * ✅ المرفقات المدعومة:
 * - صور متعددة بصيغة FileList
 * - تقرير فحص أو كتالوج أو دليل المستخدم بصيغة PDF أو صورة
 * 
 * ✅ الفائدة:
 * - يستخدم هذا النموذج لإضافة الأجهزة الإلكترونية إلى المنصة لعرضها لاحقًا في صفحة العرض الخاصة.
 * - يتكامل بشكل مباشر مع صفحة: /auctions/auctions-5general/electronics/page.tsx
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Info, HelpCircle, X } from 'lucide-react';

export default function ElectronicsAuctionRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    sellerName: '',
    sellerPhone: '',
    deviceTitle: '',
    category: 'electronics',
    deviceType: '',
    brand: '',
    model: '',
    productionYear: '',
    storageCapacity: '',
    specifications: '',
    condition: '',
    accessories: '',
    description: '',
  });

  const [images, setImages] = useState<FileList | null>(null);
  const [warranty, setWarranty] = useState<File | null>(null);

  // أنواع الأجهزة الإلكترونية
  const deviceTypes = [
    { value: 'smartphone', label: 'هاتف ذكي' },
    { value: 'laptop', label: 'حاسوب محمول' },
    { value: 'tablet', label: 'جهاز لوحي' },
    { value: 'desktop', label: 'حاسوب مكتبي' },
    { value: 'tv', label: 'تلفزيون' },
    { value: 'camera', label: 'كاميرا' },
    { value: 'audio', label: 'أجهزة صوتية' },
    { value: 'gaming', label: 'أجهزة ألعاب' },
    { value: 'accessories', label: 'ملحقات وإكسسوارات' },
    { value: 'other', label: 'أخرى' }
  ];

  // الماركات الشائعة
  const brands = [
    { value: 'apple', label: 'آبل (Apple)' },
    { value: 'samsung', label: 'سامسونج (Samsung)' },
    { value: 'sony', label: 'سوني (Sony)' },
    { value: 'hp', label: 'إتش بي (HP)' },
    { value: 'dell', label: 'ديل (Dell)' },
    { value: 'lenovo', label: 'لينوفو (Lenovo)' },
    { value: 'lg', label: 'إل جي (LG)' },
    { value: 'asus', label: 'أسوس (Asus)' },
    { value: 'huawei', label: 'هواوي (Huawei)' },
    { value: 'xiaomi', label: 'شاومي (Xiaomi)' },
    { value: 'microsoft', label: 'مايكروسوفت (Microsoft)' },
    { value: 'other', label: 'أخرى' }
  ];

  // حالات الجهاز
  const conditions = [
    { value: 'new', label: 'جديد (غير مستخدم)' },
    { value: 'like_new', label: 'كالجديد (مستخدم لفترة قصيرة)' },
    { value: 'excellent', label: 'ممتازة (علامات استخدام بسيطة)' },
    { value: 'very_good', label: 'جيدة جداً (بعض علامات الاستخدام)' },
    { value: 'good', label: 'جيدة (استخدام عادي)' },
    { value: 'acceptable', label: 'مقبولة (تحتاج بعض الإصلاحات البسيطة)' }
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

  const handleWarrantyChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setWarranty(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();

    formData.append('title', formValues.deviceTitle);
    formData.append('description', formValues.description);
    formData.append('category', 'electronics');
    formData.append('type', 'auction');

    formData.append('min_price', '500');
    formData.append('max_price', '10000');
    formData.append('start_price', '1000');
    formData.append('current_price', '1000');
    formData.append('high_price', '1000');
    formData.append('low_price', '1000');

    if (images) {
      Array.from(images).forEach((file) => {
        formData.append('images', file);
      });
    }

    if (warranty) {
      formData.append('inspection_report', warranty);
    } else {
      formData.append('inspection_report', '');
    }

    const additional = {
      sellerName: formValues.sellerName,
      sellerPhone: formValues.sellerPhone,
      deviceType: formValues.deviceType,
      brand: formValues.brand,
      model: formValues.model,
      productionYear: formValues.productionYear,
      storageCapacity: formValues.storageCapacity,
      specifications: formValues.specifications,
      condition: formValues.condition,
      accessories: formValues.accessories
    };

    formData.append('additional_info', JSON.stringify(additional));

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('تم إرسال بيانات الجهاز الإلكتروني بنجاح');
        setFormValues({
          sellerName: '',
          sellerPhone: '',
          deviceTitle: '',
          category: 'electronics',
          deviceType: '',
          brand: '',
          model: '',
          productionYear: '',
          storageCapacity: '',
          specifications: '',
          condition: '',
          accessories: '',
          description: '',
        });
        setImages(null);
        setWarranty(null);
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-6 rounded-t-lg">
        <div className="container mx-auto px-4">
          <Link 
            href="/auctions/auctions-5general/electronics" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى سوق الأجهزة الإلكترونية</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">تسجيل جهاز إلكتروني للمزاد</h1>
          <p className="text-white/80 mt-2">
            سجل جهازك الإلكتروني في منصتنا وانضم إلى سوق الأجهزة المستعملة بكل سهولة وأمان
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-b-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">معلومات الجهاز الإلكتروني</h2>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* القسم الأول: معلومات البائع */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sellerName" className="block text-gray-700 font-medium mb-2">اسم البائع <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="sellerName"
                name="sellerName"
                value={formValues.sellerName}
                onChange={handleChange}
                required
                placeholder="الاسم الكامل"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="sellerPhone" className="block text-gray-700 font-medium mb-2">رقم الهاتف <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="sellerPhone"
                name="sellerPhone"
                value={formValues.sellerPhone}
                onChange={handleChange}
                required
                placeholder="رقم هاتف للتواصل"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* القسم الثاني: معلومات الجهاز */}
          <div>
            <label htmlFor="deviceTitle" className="block text-gray-700 font-medium mb-2">عنوان الجهاز <span className="text-red-500">*</span></label>
            <input 
              type="text"
              id="deviceTitle"
              name="deviceTitle"
              value={formValues.deviceTitle}
              onChange={handleChange}
              required
              placeholder="مثال: آيفون 13 برو ماكس - 256 جيجا - أزرق"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="deviceType" className="block text-gray-700 font-medium mb-2">نوع الجهاز <span className="text-red-500">*</span></label>
              <select 
                id="deviceType"
                name="deviceType"
                value={formValues.deviceType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- اختر نوع الجهاز --</option>
                {deviceTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="brand" className="block text-gray-700 font-medium mb-2">الماركة <span className="text-red-500">*</span></label>
              <select 
                id="brand"
                name="brand"
                value={formValues.brand}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- اختر الماركة --</option>
                {brands.map(brand => (
                  <option key={brand.value} value={brand.value}>{brand.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="model" className="block text-gray-700 font-medium mb-2">الموديل / الإصدار <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="model"
                name="model"
                value={formValues.model}
                onChange={handleChange}
                required
                placeholder="مثال: iPhone 13 Pro Max، Galaxy S21 Ultra"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="productionYear" className="block text-gray-700 font-medium mb-2">سنة الإنتاج <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="productionYear"
                name="productionYear"
                value={formValues.productionYear}
                onChange={handleChange}
                required
                placeholder="مثال: 2022"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="storageCapacity" className="block text-gray-700 font-medium mb-2">سعة التخزين</label>
              <input 
                type="text"
                id="storageCapacity"
                name="storageCapacity"
                value={formValues.storageCapacity}
                onChange={handleChange}
                placeholder="مثال: 256 جيجابايت، 1 تيرابايت"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="condition" className="block text-gray-700 font-medium mb-2">حالة الجهاز <span className="text-red-500">*</span></label>
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
            <label htmlFor="specifications" className="block text-gray-700 font-medium mb-2">المواصفات التقنية <span className="text-red-500">*</span></label>
            <textarea 
              id="specifications"
              name="specifications"
              value={formValues.specifications}
              onChange={handleChange}
              required
              rows={3}
              placeholder="المعالج، الذاكرة، الشاشة، البطارية، الكاميرا، إلخ..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="accessories" className="block text-gray-700 font-medium mb-2">الملحقات المرفقة</label>
            <input 
              type="text"
              id="accessories"
              name="accessories"
              value={formValues.accessories}
              onChange={handleChange}
              placeholder="الشاحن، السماعات، الكابلات، العلبة، إلخ..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">وصف إضافي للجهاز <span className="text-red-500">*</span></label>
            <textarea 
              id="description"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="يرجى تقديم وصف تفصيلي للجهاز، مدة الاستخدام، أي عيوب أو مشاكل، سبب البيع، إلخ..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* القسم الثالث: الصور والوثائق */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">صور الجهاز <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input 
                type="file"
                id="device-images"
                onChange={handleImageChange}
                multiple
                accept="image/*"
                className="hidden"
              />
              <label htmlFor="device-images" className="cursor-pointer flex flex-col items-center">
                <Upload size={40} className="text-gray-400 mb-2" />
                <p className="text-gray-600 mb-1">اسحب الصور هنا أو انقر للاختيار</p>
                <p className="text-sm text-gray-500">يرجى تقديم صور واضحة من جميع الزوايا</p>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {images ? `تم اختيار ${images.length} صورة` : 'لم يتم اختيار أي صور'}
            </p>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">كفالة أو تقرير فحص (اختياري)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input 
                type="file"
                id="warranty"
                onChange={handleWarrantyChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <label htmlFor="warranty" className="cursor-pointer flex flex-col items-center">
                <Upload size={40} className="text-gray-400 mb-2" />
                <p className="text-gray-600 mb-1">أرفق كفالة أو تقرير فحص للجهاز</p>
                <p className="text-sm text-gray-500">PDF أو صورة</p>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {warranty ? `تم اختيار: ${warranty.name}` : 'لم يتم اختيار أي ملف'}
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
                <span>رسوم تسجيل الجهاز:</span>
                <span className="font-medium">50 ريال (غير مستردة)</span>
              </li>
              <li className="flex justify-between">
                <span>عمولة البيع عبر المزاد:</span>
                <span className="font-medium">10% من السعر النهائي</span>
              </li>
              <li className="flex justify-between">
                <span>عمولة البيع المباشر:</span>
                <span className="font-medium">7% فقط</span>
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
              أوافق على <Link href="/terms" className="text-blue-600 hover:underline">شروط وأحكام</Link> المنصة وأتعهد بصحة المعلومات المدخلة وملكيتي للجهاز.
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
              href="/auctions/auctions-5general/electronics"
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
              <li>• التقط صوراً واضحة للجهاز من جميع الجوانب</li>
              <li>• اذكر جميع العيوب الصغيرة بصراحة لبناء الثقة</li>
              <li>• أرفق تقرير فحص الجهاز إن وجد</li>
              <li>• قدم تفاصيل دقيقة عن نسبة صحة البطارية وأداء الجهاز</li>
              <li>• حدد سعراً منطقياً يتناسب مع حالة الجهاز وعمره</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 