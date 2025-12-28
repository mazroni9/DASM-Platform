/**
 * 📝 الصفحة: نموذج إدخال اللوحات الفنية للمزاد
 * 📁 المسار: Frontend-local/app/forms/artwork-auction-request/page.tsx
 * 
 * ✅ الوظيفة:
 * - هذه الصفحة تعرض نموذجًا مخصصًا يسمح للمستخدم بإدخال بيانات لوحة فنية (الوصف، الفنان، المقاسات، الصور...).
 * - بعد إدخال البيانات يتم إرسالها باستخدام `FormData` إلى واجهة API محلية.
 * 
 * ✅ طريقة الربط:
 * - ترسل البيانات إلى API في: /api/items (POST)
 * - يتم تخزين البيانات مباشرة في قاعدة البيانات auctions.db في جدول اسمه `items`.
 * 
 * ✅ المرفقات المدعومة:
 * - صور متعددة بصيغة FileList
 * - شهادة أصالة أو وثائق مهمة بصيغة PDF أو صورة
 * 
 * ✅ الفائدة:
 * - يستخدم هذا النموذج لإضافة اللوحات الفنية إلى المنصة لعرضها لاحقًا في صفحة العرض الخاصة.
 * - يتكامل بشكل مباشر مع صفحة: /auctions/auctions-4special/artworks/page.tsx
 */

'use client';

import React, { useState } from 'react';
import LoadingLink from "@/components/LoadingLink";
import { ArrowLeft, Upload, Info, HelpCircle, X } from 'lucide-react';

export default function ArtworkAuctionRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    artistName: '',
    artistPhone: '',
    artworkTitle: '',
    category: 'artworks',
    artType: '',
    artStyle: '',
    creationYear: '',
    dimensions: '',
    materials: '',
    condition: '',
    provenance: '',
    description: '',
  });

  const [images, setImages] = useState<FileList | null>(null);
  const [certificate, setCertificate] = useState<File | null>(null);

  // أنواع اللوحات والأعمال الفنية
  const artTypes = [
    { value: 'painting', label: 'لوحة زيتية' },
    { value: 'drawing', label: 'رسم' },
    { value: 'print', label: 'طباعة فنية' },
    { value: 'sculpture', label: 'منحوتة' },
    { value: 'calligraphy', label: 'خط عربي' },
    { value: 'photography', label: 'تصوير فوتوغرافي' },
    { value: 'mixed', label: 'تقنيات مختلطة' },
    { value: 'other', label: 'أخرى' }
  ];

  // أساليب فنية
  const artStyles = [
    { value: 'abstract', label: 'تجريدي' },
    { value: 'realism', label: 'واقعي' },
    { value: 'impressionism', label: 'انطباعي' },
    { value: 'surrealism', label: 'سريالي' },
    { value: 'expressionism', label: 'تعبيري' },
    { value: 'cubism', label: 'تكعيبي' },
    { value: 'modernism', label: 'حداثي' },
    { value: 'contemporary', label: 'معاصر' },
    { value: 'traditional', label: 'تقليدي' },
    { value: 'islamic', label: 'إسلامي' },
    { value: 'calligraphic', label: 'خطي' },
    { value: 'other', label: 'أخرى' }
  ];

  // حالات العمل الفني
  const conditions = [
    { value: 'excellent', label: 'ممتازة (كحالة جديدة)' },
    { value: 'very_good', label: 'جيدة جداً (علامات استخدام بسيطة)' },
    { value: 'good', label: 'جيدة (بعض علامات الاستخدام)' },
    { value: 'fair', label: 'مقبولة (تحتاج بعض الترميم)' },
    { value: 'poor', label: 'ضعيفة (تحتاج ترميم كبير)' }
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

    formData.append('title', formValues.artworkTitle);
    formData.append('description', formValues.description);
    formData.append('category', 'artworks');
    formData.append('type', 'auction');

    formData.append('min_price', '1000');
    formData.append('max_price', '20000');
    formData.append('start_price', '3000');
    formData.append('current_price', '3000');
    formData.append('high_price', '3000');
    formData.append('low_price', '3000');

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
      artistName: formValues.artistName,
      artistPhone: formValues.artistPhone,
      artType: formValues.artType,
      artStyle: formValues.artStyle,
      creationYear: formValues.creationYear,
      dimensions: formValues.dimensions,
      materials: formValues.materials,
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
        alert('تم إرسال بيانات اللوحة الفنية بنجاح');
        setFormValues({
          artistName: '',
          artistPhone: '',
          artworkTitle: '',
          category: 'artworks',
          artType: '',
          artStyle: '',
          creationYear: '',
          dimensions: '',
          materials: '',
          condition: '',
          provenance: '',
          description: '',
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 py-6 rounded-t-lg">
        <div className="container mx-auto px-4">
          <LoadingLink 
            href="/auctions/auctions-4special/artworks" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى معرض اللوحات الفنية</span>
          </LoadingLink>
          <h1 className="text-3xl font-bold text-white">تسجيل عمل فني للمزاد</h1>
          <p className="text-white/80 mt-2">
            سجل لوحتك الفنية أو عملك الإبداعي في منصتنا وانضم إلى عالم المزادات الفنية الآمن والموثوق
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-b-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">معلومات العمل الفني</h2>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* القسم الأول: معلومات الفنان */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="artistName" className="block text-gray-700 font-medium mb-2">اسم الفنان <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="artistName"
                name="artistName"
                value={formValues.artistName}
                onChange={handleChange}
                required
                placeholder="اسم الفنان الكامل"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label htmlFor="artistPhone" className="block text-gray-700 font-medium mb-2">رقم الهاتف <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="artistPhone"
                name="artistPhone"
                value={formValues.artistPhone}
                onChange={handleChange}
                required
                placeholder="رقم هاتف للتواصل"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          {/* القسم الثاني: معلومات العمل الفني */}
          <div>
            <label htmlFor="artworkTitle" className="block text-gray-700 font-medium mb-2">عنوان العمل الفني <span className="text-red-500">*</span></label>
            <input 
              type="text"
              id="artworkTitle"
              name="artworkTitle"
              value={formValues.artworkTitle}
              onChange={handleChange}
              required
              placeholder="عنوان اللوحة أو العمل الفني"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="artType" className="block text-gray-700 font-medium mb-2">نوع العمل الفني <span className="text-red-500">*</span></label>
              <select 
                id="artType"
                name="artType"
                value={formValues.artType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">-- اختر نوع العمل الفني --</option>
                {artTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="artStyle" className="block text-gray-700 font-medium mb-2">الأسلوب الفني <span className="text-red-500">*</span></label>
              <select 
                id="artStyle"
                name="artStyle"
                value={formValues.artStyle}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">-- اختر الأسلوب الفني --</option>
                {artStyles.map(style => (
                  <option key={style.value} value={style.value}>{style.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="creationYear" className="block text-gray-700 font-medium mb-2">سنة الإنتاج <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="creationYear"
                name="creationYear"
                value={formValues.creationYear}
                onChange={handleChange}
                required
                placeholder="مثال: 2020"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label htmlFor="dimensions" className="block text-gray-700 font-medium mb-2">أبعاد العمل الفني <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="dimensions"
                name="dimensions"
                value={formValues.dimensions}
                onChange={handleChange}
                required
                placeholder="مثال: 60×80 سم"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="materials" className="block text-gray-700 font-medium mb-2">خامات العمل <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="materials"
                name="materials"
                value={formValues.materials}
                onChange={handleChange}
                required
                placeholder="مثال: زيت على قماش، أكريليك، برونز"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label htmlFor="condition" className="block text-gray-700 font-medium mb-2">حالة العمل الفني <span className="text-red-500">*</span></label>
              <select 
                id="condition"
                name="condition"
                value={formValues.condition}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">-- اختر الحالة --</option>
                {conditions.map(condition => (
                  <option key={condition.value} value={condition.value}>{condition.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="provenance" className="block text-gray-700 font-medium mb-2">مصدر العمل الفني</label>
            <input 
              type="text"
              id="provenance"
              name="provenance"
              value={formValues.provenance}
              onChange={handleChange}
              placeholder="معلومات عن مصدر العمل وتاريخ الملكية (إن وجدت)"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">وصف العمل الفني <span className="text-red-500">*</span></label>
            <textarea 
              id="description"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="يرجى تقديم وصف تفصيلي للعمل الفني، مثل القصة خلفه أو التقنيات المستخدمة أو معناه..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* القسم الثالث: الصور والوثائق */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">صور العمل الفني <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input 
                type="file"
                id="artwork-images"
                onChange={handleImageChange}
                multiple
                accept="image/*"
                className="hidden"
              />
              <label htmlFor="artwork-images" className="cursor-pointer flex flex-col items-center">
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
            <label className="block text-gray-700 font-medium mb-2">شهادة أصالة أو توثيق (اختياري)</label>
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
                <p className="text-gray-600 mb-1">أرفق شهادة أصالة أو توثيق</p>
                <p className="text-sm text-gray-500">PDF أو صورة</p>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {certificate ? `تم اختيار: ${certificate.name}` : 'لم يتم اختيار أي ملف'}
            </p>
          </div>

          {/* القسم الرابع: الرسوم والأحكام */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-2 flex items-center">
              <Info size={18} className="ml-2 text-purple-600" />
              الرسوم والعمولات
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex justify-between">
                <span>رسوم تسجيل العمل الفني:</span>
                <span className="font-medium">100 ريال (غير مستردة)</span>
              </li>
              <li className="flex justify-between">
                <span>عمولة البيع عبر المزاد:</span>
                <span className="font-medium">15% من السعر النهائي</span>
              </li>
              <li className="flex justify-between">
                <span>عمولة البيع المباشر:</span>
                <span className="font-medium">10% فقط</span>
              </li>
            </ul>
          </div>

          {/* الموافقة على الشروط */}
          <div className="flex items-start">
            <input 
              type="checkbox"
              id="terms"
              required
              className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 mt-1"
            />
            <label htmlFor="terms" className="mr-2 text-gray-700">
              أوافق على <LoadingLink href="/terms" className="text-purple-600 hover:underline">شروط وأحكام</LoadingLink> المنصة وأتعهد بصحة المعلومات المدخلة وملكيتي للعمل الفني.
            </label>
          </div>

          {/* زر الإرسال */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </button>
            <LoadingLink 
              href="/auctions/auctions-4special/artworks"
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
              <li>• التقط صوراً واضحة بإضاءة جيدة من زوايا متعددة</li>
              <li>• قدم وصفاً دقيقاً وشاملاً للعمل الفني</li>
              <li>• أرفق أي وثائق تثبت أصالة العمل إن وجدت</li>
              <li>• حدد سعراً عادلاً يتناسب مع قيمة العمل في السوق</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 