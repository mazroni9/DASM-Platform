/**
 * 📝 الصفحة: نموذج إدخال القطع النادرة والتحف الثمينة للمزاد
 * 📁 المسار: Frontend-local/app/forms/precious-auction-request/page.tsx
 * 
 * ✅ الوظيفة:
 * - صفحة لتسجيل بيانات القطع النادرة والتحف الثمينة للمزادات
 * - جمع المعلومات المفصلة عن التحفة وتاريخها ومصدرها
 * - تحميل صور متعددة وشهادات الأصالة والتوثيق
 */

'use client';

import React, { useState } from 'react';
import LoadingLink from "@/components/LoadingLink";
import { ArrowLeft, Upload, Info, HelpCircle, X } from 'lucide-react';

export default function PreciousItemAuctionRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    ownerName: '',
    ownerPhone: '',
    itemTitle: '',
    category: 'precious',
    itemType: '',
    era: '',
    origin: '',
    materials: '',
    dimensions: '',
    condition: '',
    provenance: '',
    description: '',
    minPrice: '',
    maxPrice: ''
  });

  const [images, setImages] = useState<FileList | null>(null);
  const [certificate, setCertificate] = useState<File | null>(null);

  // أنواع القطع النادرة
  const itemTypes = [
    { value: 'antique', label: 'تحفة قديمة' },
    { value: 'antiquity', label: 'قطعة أثرية' },
    { value: 'rare_book', label: 'كتاب/مخطوطة نادرة' },
    { value: 'numismatic', label: 'عملة قديمة' },
    { value: 'artifact', label: 'قطعة فنية نادرة' },
    { value: 'memorabilia', label: 'تذكار تاريخي' },
    { value: 'collection', label: 'مجموعة متكاملة' },
    { value: 'other', label: 'أخرى' }
  ];

  // العصور/الفترات الزمنية
  const eras = [
    { value: 'ancient', label: 'عصور قديمة (قبل 500 م)' },
    { value: 'medieval', label: 'العصور الوسطى (500-1500 م)' },
    { value: 'early_islamic', label: 'العصور الإسلامية المبكرة' },
    { value: 'ottoman', label: 'العصر العثماني' },
    { value: 'colonial', label: 'عصر الاستعمار' },
    { value: '19th_century', label: 'القرن 19' },
    { value: 'early_20th', label: 'أوائل القرن 20' },
    { value: 'modern', label: 'حديث (بعد 1950)' },
    { value: 'contemporary', label: 'معاصر' },
    { value: 'unknown', label: 'غير معروف' }
  ];

  // بلدان المنشأ
  const origins = [
    { value: 'egypt', label: 'مصر' },
    { value: 'mesopotamia', label: 'بلاد الرافدين' },
    { value: 'arabia', label: 'الجزيرة العربية' },
    { value: 'levant', label: 'بلاد الشام' },
    { value: 'persia', label: 'فارس/إيران' },
    { value: 'andalusia', label: 'الأندلس' },
    { value: 'europe', label: 'أوروبا' },
    { value: 'asia', label: 'آسيا' },
    { value: 'africa', label: 'أفريقيا' },
    { value: 'americas', label: 'الأمريكتين' },
    { value: 'other', label: 'أخرى' },
    { value: 'unknown', label: 'غير معروف' }
  ];

  // حالة القطعة
  const conditions = [
    { value: 'mint', label: 'ممتازة (كحالة جديدة)' },
    { value: 'excellent', label: 'ممتازة مع علامات طفيفة للعمر' },
    { value: 'very_good', label: 'جيدة جداً مع بعض علامات الاستخدام' },
    { value: 'good', label: 'جيدة مع علامات استخدام واضحة' },
    { value: 'fair', label: 'مقبولة مع تلف طفيف' },
    { value: 'damaged', label: 'بها أضرار أو تم ترميمها' }
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

  const handleCertificateChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCertificate(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();

    formData.append('title', formValues.itemTitle);
    formData.append('description', formValues.description);
    formData.append('category', 'precious');
    formData.append('type', 'auction');

    formData.append('min_price', formValues.minPrice);
    formData.append('max_price', formValues.maxPrice);
    formData.append('start_price', '0');
    formData.append('current_price', '0');
    formData.append('high_price', '0');
    formData.append('low_price', '0');

    if (images) {
      Array.from(images).forEach((file) => {
        formData.append('images', file);
      });
    }

    if (certificate) {
      formData.append('inspection_report', certificate);
    } else {
      formData.append('inspection_report', '');
    }

    const additional = {
      ownerName: formValues.ownerName,
      ownerPhone: formValues.ownerPhone,
      itemType: formValues.itemType,
      era: formValues.era,
      origin: formValues.origin,
      materials: formValues.materials,
      dimensions: formValues.dimensions,
      condition: formValues.condition,
      provenance: formValues.provenance
    };

    formData.append('additional_info', JSON.stringify(additional));

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('تم إرسال بيانات القطعة النادرة بنجاح');
        setFormValues({
          ownerName: '',
          ownerPhone: '',
          itemTitle: '',
          category: 'precious',
          itemType: '',
          era: '',
          origin: '',
          materials: '',
          dimensions: '',
          condition: '',
          provenance: '',
          description: '',
          minPrice: '',
          maxPrice: ''
        });
        setImages(null);
        setCertificate(null);
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
      <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 py-6 rounded-t-lg">
        <div className="container mx-auto px-4">
          <LoadingLink 
            href="/auctions/auctions-4special/precious" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى سوق القطع النادرة والتحف الثمينة</span>
          </LoadingLink>
          <h1 className="text-3xl font-bold text-white">تسجيل قطعة نادرة للمزاد</h1>
          <p className="text-white/80 mt-2">
            سجل قطعتك النادرة أو تحفتك الثمينة في منصتنا وانضم إلى مجتمع هواة ومقتني التحف
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-b-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">معلومات القطعة النادرة</h2>
        
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
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
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
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
          </div>

          {/* القسم الثاني: معلومات القطعة النادرة */}
          <div>
            <label htmlFor="itemTitle" className="block text-gray-700 font-medium mb-2">اسم/عنوان القطعة <span className="text-red-500">*</span></label>
            <input 
              type="text"
              id="itemTitle"
              name="itemTitle"
              value={formValues.itemTitle}
              onChange={handleChange}
              required
              placeholder="وصف مختصر للقطعة"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="itemType" className="block text-gray-700 font-medium mb-2">نوع القطعة <span className="text-red-500">*</span></label>
              <select 
                id="itemType"
                name="itemType"
                value={formValues.itemType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              >
                <option value="">-- اختر نوع القطعة --</option>
                {itemTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="era" className="block text-gray-700 font-medium mb-2">العصر/الفترة الزمنية <span className="text-red-500">*</span></label>
              <select 
                id="era"
                name="era"
                value={formValues.era}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              >
                <option value="">-- اختر العصر/الفترة --</option>
                {eras.map(era => (
                  <option key={era.value} value={era.value}>{era.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="origin" className="block text-gray-700 font-medium mb-2">بلد/منطقة المنشأ <span className="text-red-500">*</span></label>
              <select 
                id="origin"
                name="origin"
                value={formValues.origin}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              >
                <option value="">-- اختر بلد/منطقة المنشأ --</option>
                {origins.map(origin => (
                  <option key={origin.value} value={origin.value}>{origin.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="materials" className="block text-gray-700 font-medium mb-2">المواد <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="materials"
                name="materials"
                value={formValues.materials}
                onChange={handleChange}
                required
                placeholder="مثال: خشب، معدن، حجر، سيراميك..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dimensions" className="block text-gray-700 font-medium mb-2">الأبعاد <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="dimensions"
                name="dimensions"
                value={formValues.dimensions}
                onChange={handleChange}
                required
                placeholder="مثال: 30×20×15 سم"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>

            <div>
              <label htmlFor="condition" className="block text-gray-700 font-medium mb-2">حالة القطعة <span className="text-red-500">*</span></label>
              <select 
                id="condition"
                name="condition"
                value={formValues.condition}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              >
                <option value="">-- اختر الحالة --</option>
                {conditions.map(condition => (
                  <option key={condition.value} value={condition.value}>{condition.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="provenance" className="block text-gray-700 font-medium mb-2">مصدر/تاريخ الاقتناء (إن وجد)</label>
            <input 
              type="text"
              id="provenance"
              name="provenance"
              value={formValues.provenance}
              onChange={handleChange}
              placeholder="معلومات عن مصدر القطعة وتاريخ اقتنائها"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">وصف القطعة <span className="text-red-500">*</span></label>
            <textarea 
              id="description"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="وصف تفصيلي للقطعة، تاريخها، أهميتها، ميزاتها الخاصة..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>

          {/* القسم الثالث: السعر */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="minPrice" className="block text-gray-700 font-medium mb-2">الحد الأدنى المقبول (بالريال) <span className="text-red-500">*</span></label>
              <input 
                type="number"
                id="minPrice"
                name="minPrice"
                value={formValues.minPrice}
                onChange={handleChange}
                required
                min="1"
                placeholder="السعر الأدنى المقبول للبيع"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
              <p className="text-xs text-gray-500 mt-1">سيكون هذا السعر مخفيًا عن المشترين</p>
            </div>

            <div>
              <label htmlFor="maxPrice" className="block text-gray-700 font-medium mb-2">الحد الأعلى المرغوب (بالريال) <span className="text-red-500">*</span></label>
              <input 
                type="number"
                id="maxPrice"
                name="maxPrice"
                value={formValues.maxPrice}
                onChange={handleChange}
                required
                min="1"
                placeholder="السعر المتوقع/المرغوب به"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
              <p className="text-xs text-gray-500 mt-1">سيكون هذا السعر مخفيًا عن المشترين</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 italic">* سيتم تحديد سعر الافتتاح من قبل غرفة التحكم بعد مراجعة القطعة</p>

          {/* القسم الرابع: الصور والوثائق */}
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
                <p className="text-sm text-gray-500">يرجى تقديم صور عالية الدقة من زوايا متعددة</p>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {images ? `تم اختيار ${images.length} صورة` : 'لم يتم اختيار أي صور'}
            </p>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">شهادة أصالة أو وثائق إثبات (اختياري)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input 
                type="file"
                id="certificate"
                onChange={handleCertificateChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <label htmlFor="certificate" className="cursor-pointer flex flex-col items-center">
                <Upload size={40} className="text-gray-400 mb-2" />
                <p className="text-gray-600 mb-1">أرفق شهادة أصالة أو وثائق إثبات ملكية</p>
                <p className="text-sm text-gray-500">PDF أو صورة</p>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {certificate ? `تم اختيار: ${certificate.name}` : 'لم يتم اختيار أي ملف'}
            </p>
          </div>

          {/* القسم الخامس: الرسوم والأحكام */}
          <div className="bg-amber-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-2 flex items-center">
              <Info size={18} className="ml-2 text-amber-500" />
              الرسوم والعمولات
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex justify-between">
                <span>رسوم تسجيل القطعة النادرة:</span>
                <span className="font-medium">150 ريال (غير مستردة)</span>
              </li>
              <li className="flex justify-between">
                <span>عمولة البيع عبر المزاد:</span>
                <span className="font-medium">10% من سعر البيع النهائي</span>
              </li>
              <li className="flex justify-between">
                <span>رسوم التقييم والتوثيق:</span>
                <span className="font-medium">تحدد حسب نوع وقيمة القطعة</span>
              </li>
            </ul>
          </div>

          {/* الموافقة على الشروط */}
          <div className="flex items-start">
            <input 
              type="checkbox"
              id="terms"
              required
              className="w-5 h-5 text-amber-500 rounded focus:ring-2 focus:ring-amber-500 mt-1"
            />
            <label htmlFor="terms" className="mr-2 text-gray-700">
              أؤكد أن المعلومات المقدمة صحيحة وأن لدي حق ملكية هذه القطعة، وأوافق على <LoadingLink href="/terms" className="text-amber-500 hover:underline">شروط وأحكام</LoadingLink> المنصة.
            </label>
          </div>

          {/* زر الإرسال */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </button>
            <LoadingLink 
              href="/auctions/auctions-4special/precious"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition text-center"
            >
              إلغاء
            </LoadingLink>
          </div>
        </form>

        {/* ملاحظة مساعدة */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4 flex items-start">
          <HelpCircle size={24} className="text-blue-600 ml-3 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-blue-800 mb-1">نصائح لزيادة فرص البيع:</h3>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>• قدم صوراً واضحة عالية الدقة للقطعة من جميع الزوايا</li>
              <li>• اذكر تفاصيل عن تاريخ القطعة ومصدرها إذا كانت متوفرة</li>
              <li>• وثق حالة القطعة بدقة واذكر أي عيوب أو ترميمات سابقة</li>
              <li>• أرفق أي شهادات أصالة أو وثائق تدعم قيمة وأهمية القطعة</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 