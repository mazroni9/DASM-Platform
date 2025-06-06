/**
 * 📝 الصفحة: نموذج إدخال الأثاث المنزلي للمزاد
 * 📁 المسار: Frontend-local/app/forms/furniture-auction-request/page.tsx
 * 
 * ✅ الوظيفة:
 * - هذه الصفحة تعرض نموذجًا مخصصًا يسمح للمستخدم بإدخال بيانات قطع الأثاث (النوع، المواد، الأبعاد، الصور...).
 * - بعد إدخال البيانات يتم إرسالها باستخدام `FormData` إلى واجهة API محلية.
 * 
 * ✅ طريقة الربط:
 * - ترسل البيانات إلى API في: /api/items (POST)
 * - يتم تخزين البيانات مباشرة في قاعدة البيانات auctions.db في جدول اسمه `items`.
 * 
 * ✅ المرفقات المدعومة:
 * - صور متعددة بصيغة FileList
 * - معلومات الضمان أو شهادة المنشأ بصيغة PDF أو صورة
 * 
 * ✅ الفائدة:
 * - يستخدم هذا النموذج لإضافة قطع الأثاث إلى المنصة لعرضها لاحقًا في صفحة العرض الخاصة.
 * - يتكامل بشكل مباشر مع صفحة: /auctions/auctions-5general/furniture/page.tsx
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Info, HelpCircle, X } from 'lucide-react';

export default function FurnitureAuctionRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    sellerName: '',
    sellerPhone: '',
    furnitureTitle: '',
    category: 'furniture',
    furnitureType: '',
    roomType: '',
    materials: '',
    dimensions: '',
    productionYear: '',
    brand: '',
    condition: '',
    description: '',
  });

  const [images, setImages] = useState<FileList | null>(null);
  const [warranty, setWarranty] = useState<File | null>(null);

  // أنواع الأثاث
  const furnitureTypes = [
    { value: 'sofa', label: 'أريكة/كنبة' },
    { value: 'chair', label: 'كرسي' },
    { value: 'table', label: 'طاولة' },
    { value: 'bed', label: 'سرير' },
    { value: 'cabinet', label: 'خزانة/دولاب' },
    { value: 'shelf', label: 'رف/مكتبة' },
    { value: 'desk', label: 'مكتب' },
    { value: 'dining_set', label: 'طقم طعام' },
    { value: 'coffee_table', label: 'طاولة قهوة' },
    { value: 'dresser', label: 'خزانة أدراج' },
    { value: 'other', label: 'أخرى' }
  ];

  // أنواع الغرف
  const roomTypes = [
    { value: 'living_room', label: 'غرفة المعيشة' },
    { value: 'bedroom', label: 'غرفة النوم' },
    { value: 'dining_room', label: 'غرفة الطعام' },
    { value: 'office', label: 'مكتب/غرفة عمل' },
    { value: 'kitchen', label: 'مطبخ' },
    { value: 'bathroom', label: 'حمام' },
    { value: 'outdoor', label: 'خارجي/حديقة' },
    { value: 'other', label: 'أخرى' }
  ];

  // أنواع المواد
  const materialTypes = [
    { value: 'wood', label: 'خشب' },
    { value: 'mdf', label: 'MDF/خشب مضغوط' },
    { value: 'metal', label: 'معدن' },
    { value: 'glass', label: 'زجاج' },
    { value: 'plastic', label: 'بلاستيك' },
    { value: 'fabric', label: 'قماش/نسيج' },
    { value: 'leather', label: 'جلد' },
    { value: 'rattan', label: 'خيزران/روطان' },
    { value: 'mixed', label: 'مواد مختلطة' }
  ];

  // حالات الأثاث
  const conditions = [
    { value: 'new', label: 'جديد (غير مستخدم)' },
    { value: 'like_new', label: 'كالجديد (استخدام لفترة قصيرة)' },
    { value: 'excellent', label: 'ممتاز (علامات استخدام بسيطة)' },
    { value: 'very_good', label: 'جيد جداً (بعض علامات الاستخدام)' },
    { value: 'good', label: 'جيد (استخدام عادي)' },
    { value: 'acceptable', label: 'مقبول (يحتاج بعض الإصلاحات)' }
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

    formData.append('title', formValues.furnitureTitle);
    formData.append('description', formValues.description);
    formData.append('category', 'furniture');
    formData.append('type', 'auction');

    formData.append('min_price', '300');
    formData.append('max_price', '5000');
    formData.append('start_price', '500');
    formData.append('current_price', '500');
    formData.append('high_price', '500');
    formData.append('low_price', '500');

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
      furnitureType: formValues.furnitureType,
      roomType: formValues.roomType,
      materials: formValues.materials,
      dimensions: formValues.dimensions,
      productionYear: formValues.productionYear,
      brand: formValues.brand,
      condition: formValues.condition
    };

    formData.append('additional_info', JSON.stringify(additional));

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('تم إرسال بيانات قطعة الأثاث بنجاح');
        setFormValues({
          sellerName: '',
          sellerPhone: '',
          furnitureTitle: '',
          category: 'furniture',
          furnitureType: '',
          roomType: '',
          materials: '',
          dimensions: '',
          productionYear: '',
          brand: '',
          condition: '',
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 py-6 rounded-t-lg">
        <div className="container mx-auto px-4">
          <Link 
            href="/auctions/auctions-5general/furniture" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى سوق الأثاث المنزلي</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">تسجيل قطعة أثاث للمزاد</h1>
          <p className="text-white/80 mt-2">
            سجل قطعة الأثاث التي ترغب ببيعها في منصتنا وانضم إلى سوق الأثاث المنزلي
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-b-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">معلومات قطعة الأثاث</h2>
        
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
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* القسم الثاني: معلومات قطعة الأثاث */}
          <div>
            <label htmlFor="furnitureTitle" className="block text-gray-700 font-medium mb-2">عنوان قطعة الأثاث <span className="text-red-500">*</span></label>
            <input 
              type="text"
              id="furnitureTitle"
              name="furnitureTitle"
              value={formValues.furnitureTitle}
              onChange={handleChange}
              required
              placeholder="مثال: طاولة طعام خشبية كلاسيكية مع 6 كراسي"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="furnitureType" className="block text-gray-700 font-medium mb-2">نوع قطعة الأثاث <span className="text-red-500">*</span></label>
              <select 
                id="furnitureType"
                name="furnitureType"
                value={formValues.furnitureType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">-- اختر نوع قطعة الأثاث --</option>
                {furnitureTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="roomType" className="block text-gray-700 font-medium mb-2">نوع الغرفة <span className="text-red-500">*</span></label>
              <select 
                id="roomType"
                name="roomType"
                value={formValues.roomType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">-- اختر نوع الغرفة --</option>
                {roomTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="materials" className="block text-gray-700 font-medium mb-2">المواد المستخدمة <span className="text-red-500">*</span></label>
              <select 
                id="materials"
                name="materials"
                value={formValues.materials}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">-- اختر المواد المستخدمة --</option>
                {materialTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dimensions" className="block text-gray-700 font-medium mb-2">الأبعاد <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="dimensions"
                name="dimensions"
                value={formValues.dimensions}
                onChange={handleChange}
                required
                placeholder="مثال: 120×80×75 سم (طول×عرض×ارتفاع)"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="productionYear" className="block text-gray-700 font-medium mb-2">سنة الصنع</label>
              <input 
                type="text"
                id="productionYear"
                name="productionYear"
                value={formValues.productionYear}
                onChange={handleChange}
                placeholder="مثال: 2020"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label htmlFor="brand" className="block text-gray-700 font-medium mb-2">الماركة/الشركة المصنعة</label>
              <input 
                type="text"
                id="brand"
                name="brand"
                value={formValues.brand}
                onChange={handleChange}
                placeholder="مثال: IKEA، Ashley، Home Centre"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label htmlFor="condition" className="block text-gray-700 font-medium mb-2">حالة قطعة الأثاث <span className="text-red-500">*</span></label>
              <select 
                id="condition"
                name="condition"
                value={formValues.condition}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">-- اختر الحالة --</option>
                {conditions.map(condition => (
                  <option key={condition.value} value={condition.value}>{condition.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">وصف قطعة الأثاث <span className="text-red-500">*</span></label>
            <textarea 
              id="description"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="يرجى وصف قطعة الأثاث بالتفصيل: الاستخدام السابق، أي خدوش أو عيوب، الميزات الخاصة، سبب البيع..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* القسم الثالث: الصور والوثائق */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">صور قطعة الأثاث <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input 
                type="file"
                id="furniture-images"
                onChange={handleImageChange}
                multiple
                accept="image/*"
                className="hidden"
              />
              <label htmlFor="furniture-images" className="cursor-pointer flex flex-col items-center">
                <Upload size={40} className="text-gray-400 mb-2" />
                <p className="text-gray-600 mb-1">اسحب الصور هنا أو انقر للاختيار</p>
                <p className="text-sm text-gray-500">يرجى تقديم صور واضحة من زوايا مختلفة</p>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {images ? `تم اختيار ${images.length} صورة` : 'لم يتم اختيار أي صور'}
            </p>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">شهادة ضمان أو فاتورة شراء (اختياري)</label>
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
                <p className="text-gray-600 mb-1">أرفق شهادة ضمان أو فاتورة شراء</p>
                <p className="text-sm text-gray-500">PDF أو صورة</p>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {warranty ? `تم اختيار: ${warranty.name}` : 'لم يتم اختيار أي ملف'}
            </p>
          </div>

          {/* القسم الرابع: الرسوم والأحكام */}
          <div className="bg-amber-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-2 flex items-center">
              <Info size={18} className="ml-2 text-amber-600" />
              الرسوم والعمولات
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex justify-between">
                <span>رسوم تسجيل قطعة الأثاث:</span>
                <span className="font-medium">25 ريال (غير مستردة)</span>
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
              className="w-5 h-5 text-amber-600 rounded focus:ring-2 focus:ring-amber-500 mt-1"
            />
            <label htmlFor="terms" className="mr-2 text-gray-700">
              أوافق على <Link href="/terms" className="text-amber-600 hover:underline">شروط وأحكام</Link> المنصة وأتعهد بصحة المعلومات المدخلة وملكيتي لقطعة الأثاث.
            </label>
          </div>

          {/* زر الإرسال */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </button>
            <Link 
              href="/auctions/auctions-5general/furniture"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition text-center"
            >
              إلغاء
            </Link>
          </div>
        </form>

        {/* ملاحظة مساعدة */}
        <div className="mt-8 bg-amber-50 rounded-lg p-4 flex items-start">
          <HelpCircle size={24} className="text-amber-600 ml-3 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-amber-800 mb-1">نصائح لزيادة فرص البيع:</h3>
            <ul className="text-amber-700 space-y-1 text-sm">
              <li>• التقط صوراً واضحة لقطعة الأثاث من جميع الزوايا</li>
              <li>• اذكر أي عيوب أو خدوش بصراحة</li>
              <li>• قدم معلومات دقيقة عن مواد التصنيع والأبعاد</li>
              <li>• أرفق فاتورة الشراء أو دليل المنتج إن وجد</li>
              <li>• حدد سعراً معقولاً يتناسب مع عمر وحالة قطعة الأثاث</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 