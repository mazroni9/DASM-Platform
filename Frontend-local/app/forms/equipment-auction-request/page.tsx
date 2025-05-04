/**
 * 📝 الصفحة: نموذج إدخال المعدات للمزاد
 * 📁 المسار: Frontend-local/app/forms/equipment-auction-request/page.tsx
 * 
 * ✅ الوظيفة:
 * - هذه الصفحة تعرض نموذجًا مخصصًا يسمح للمستخدم بإدخال بيانات المعدات (النوع، الماركة، المواصفات، الصور...).
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
 * - يستخدم هذا النموذج لإضافة المعدات والأدوات إلى المنصة لعرضها لاحقًا في صفحة العرض الخاصة.
 * - يتكامل بشكل مباشر مع صفحة: /auctions/auctions-general/equipment/page.tsx
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Info, HelpCircle, RotateCw } from 'lucide-react';

export default function EquipmentAuctionRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    sellerName: '',
    sellerPhone: '',
    equipmentTitle: '',
    category: 'equipment',
    equipmentType: '',
    brand: '',
    model: '',
    productionYear: '',
    powerSource: '',
    condition: '',
    usageHours: '',
    specifications: '',
    description: '',
  });

  const [images, setImages] = useState<FileList | null>(null);
  const [manual, setManual] = useState<File | null>(null);

  // أنواع المعدات
  const equipmentTypes = [
    { value: 'hand_tools', label: 'أدوات يدوية' },
    { value: 'power_tools', label: 'أدوات كهربائية' },
    { value: 'construction', label: 'معدات بناء' },
    { value: 'garden', label: 'معدات حدائق' },
    { value: 'welding', label: 'معدات لحام' },
    { value: 'measurement', label: 'أدوات قياس' },
    { value: 'safety', label: 'معدات سلامة' },
    { value: 'cleaning', label: 'معدات تنظيف' },
    { value: 'generators', label: 'مولدات كهربائية' },
    { value: 'compressors', label: 'ضواغط هواء' },
    { value: 'lifts', label: 'رافعات ومعدات رفع' },
    { value: 'other', label: 'أخرى' }
  ];

  // ماركات المعدات الشائعة
  const equipmentBrands = [
    { value: 'bosch', label: 'بوش (Bosch)' },
    { value: 'dewalt', label: 'ديوالت (DeWALT)' },
    { value: 'makita', label: 'ماكيتا (Makita)' },
    { value: 'milwaukee', label: 'ميلواكي (Milwaukee)' },
    { value: 'stanley', label: 'ستانلي (Stanley)' },
    { value: 'hitachi', label: 'هيتاشي (Hitachi)' },
    { value: 'black_decker', label: 'بلاك آند ديكر (Black & Decker)' },
    { value: 'craftsman', label: 'كرافتسمان (Craftsman)' },
    { value: 'ryobi', label: 'ريوبي (Ryobi)' },
    { value: 'hilti', label: 'هيلتي (Hilti)' },
    { value: 'snap_on', label: 'سناب أون (Snap-on)' },
    { value: 'other', label: 'أخرى' }
  ];

  // أنواع مصادر الطاقة
  const powerSources = [
    { value: 'electric', label: 'كهربائي (تيار متردد)' },
    { value: 'battery', label: 'بطارية (قابلة للشحن)' },
    { value: 'fuel', label: 'وقود (بنزين/ديزل)' },
    { value: 'pneumatic', label: 'هوائي (ضغط هواء)' },
    { value: 'hydraulic', label: 'هيدروليكي' },
    { value: 'manual', label: 'يدوي (بدون طاقة)' },
    { value: 'other', label: 'أخرى' }
  ];

  // حالات المعدات
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

  const handleManualChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setManual(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();

    formData.append('title', formValues.equipmentTitle);
    formData.append('description', formValues.description);
    formData.append('category', 'equipment');
    formData.append('type', 'auction');

    formData.append('min_price', '200');
    formData.append('max_price', '8000');
    formData.append('start_price', '500');
    formData.append('current_price', '500');
    formData.append('high_price', '500');
    formData.append('low_price', '500');

    if (images) {
      Array.from(images).forEach((file) => {
        formData.append('images', file);
      });
    }

    if (manual) {
      formData.append('inspection_report', manual);
    } else {
      formData.append('inspection_report', '');
    }

    const additional = {
      sellerName: formValues.sellerName,
      sellerPhone: formValues.sellerPhone,
      equipmentType: formValues.equipmentType,
      brand: formValues.brand,
      model: formValues.model,
      productionYear: formValues.productionYear,
      powerSource: formValues.powerSource,
      condition: formValues.condition,
      usageHours: formValues.usageHours,
      specifications: formValues.specifications
    };

    formData.append('additional_info', JSON.stringify(additional));

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('تم إرسال بيانات المعدة بنجاح');
        setFormValues({
          sellerName: '',
          sellerPhone: '',
          equipmentTitle: '',
          category: 'equipment',
          equipmentType: '',
          brand: '',
          model: '',
          productionYear: '',
          powerSource: '',
          condition: '',
          usageHours: '',
          specifications: '',
          description: '',
        });
        setImages(null);
        setManual(null);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white py-12 px-4">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 py-6 rounded-t-lg">
        <div className="container mx-auto px-4">
          <Link 
            href="/auctions/auctions-general/equipment" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى سوق المعدات</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">تسجيل معدة للمزاد</h1>
          <p className="text-white/80 mt-2">
            سجل معداتك وأدواتك في منصتنا وانضم إلى سوق المعدات المستعملة
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-b-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">معلومات المعدة</h2>
        
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
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
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
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>
          </div>

          {/* القسم الثاني: معلومات المعدة */}
          <div>
            <label htmlFor="equipmentTitle" className="block text-gray-700 font-medium mb-2">عنوان المعدة <span className="text-red-500">*</span></label>
            <input 
              type="text"
              id="equipmentTitle"
              name="equipmentTitle"
              value={formValues.equipmentTitle}
              onChange={handleChange}
              required
              placeholder="مثال: مثقاب بوش احترافي 18 فولت مع بطاريتين"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="equipmentType" className="block text-gray-700 font-medium mb-2">نوع المعدة <span className="text-red-500">*</span></label>
              <select 
                id="equipmentType"
                name="equipmentType"
                value={formValues.equipmentType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="">-- اختر نوع المعدة --</option>
                {equipmentTypes.map(type => (
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
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="">-- اختر الماركة --</option>
                {equipmentBrands.map(brand => (
                  <option key={brand.value} value={brand.value}>{brand.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="model" className="block text-gray-700 font-medium mb-2">الموديل <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="model"
                name="model"
                value={formValues.model}
                onChange={handleChange}
                required
                placeholder="رقم الموديل أو الإصدار"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>

            <div>
              <label htmlFor="powerSource" className="block text-gray-700 font-medium mb-2">مصدر الطاقة <span className="text-red-500">*</span></label>
              <select 
                id="powerSource"
                name="powerSource"
                value={formValues.powerSource}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="">-- اختر مصدر الطاقة --</option>
                {powerSources.map(source => (
                  <option key={source.value} value={source.value}>{source.label}</option>
                ))}
              </select>
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
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>

            <div>
              <label htmlFor="usageHours" className="block text-gray-700 font-medium mb-2">عدد ساعات الاستخدام</label>
              <input 
                type="text"
                id="usageHours"
                name="usageHours"
                value={formValues.usageHours}
                onChange={handleChange}
                placeholder="عدد تقريبي لساعات الاستخدام"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>

            <div>
              <label htmlFor="condition" className="block text-gray-700 font-medium mb-2">حالة المعدة <span className="text-red-500">*</span></label>
              <select 
                id="condition"
                name="condition"
                value={formValues.condition}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="">-- اختر الحالة --</option>
                {conditions.map(condition => (
                  <option key={condition.value} value={condition.value}>{condition.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="specifications" className="block text-gray-700 font-medium mb-2">المواصفات الفنية <span className="text-red-500">*</span></label>
            <textarea 
              id="specifications"
              name="specifications"
              value={formValues.specifications}
              onChange={handleChange}
              required
              rows={3}
              placeholder="المواصفات الفنية مثل: القدرة، السرعة، الحجم، القياسات، الملحقات..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">وصف المعدة <span className="text-red-500">*</span></label>
            <textarea 
              id="description"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="يرجى وصف المعدة بالتفصيل: الاستخدام السابق، أي مشاكل أو عيوب، الميزات الخاصة، سبب البيع..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>

          {/* القسم الثالث: الصور والوثائق */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">صور المعدة <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input 
                type="file"
                id="equipment-images"
                onChange={handleImageChange}
                multiple
                accept="image/*"
                className="hidden"
              />
              <label htmlFor="equipment-images" className="cursor-pointer flex flex-col items-center">
                <Upload size={40} className="text-gray-400 mb-2" />
                <p className="text-gray-600 mb-1">اسحب الصور هنا أو انقر للاختيار</p>
                <p className="text-sm text-gray-500">يرجى تقديم صور واضحة للمعدة من جميع الجوانب</p>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {images ? `تم اختيار ${images.length} صورة` : 'لم يتم اختيار أي صور'}
            </p>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">دليل الاستخدام أو كتالوج (اختياري)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input 
                type="file"
                id="manual"
                onChange={handleManualChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <label htmlFor="manual" className="cursor-pointer flex flex-col items-center">
                <Upload size={40} className="text-gray-400 mb-2" />
                <p className="text-gray-600 mb-1">أرفق دليل الاستخدام أو الكتالوج</p>
                <p className="text-sm text-gray-500">PDF أو صورة</p>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {manual ? `تم اختيار: ${manual.name}` : 'لم يتم اختيار أي ملف'}
            </p>
          </div>

          {/* القسم الرابع: الرسوم والأحكام */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-2 flex items-center">
              <Info size={18} className="ml-2 text-gray-600" />
              الرسوم والعمولات
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex justify-between">
                <span>رسوم تسجيل المعدة:</span>
                <span className="font-medium">30 ريال (غير مستردة)</span>
              </li>
              <li className="flex justify-between">
                <span>عمولة البيع عبر المزاد:</span>
                <span className="font-medium">8% من السعر النهائي</span>
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
              className="w-5 h-5 text-gray-600 rounded focus:ring-2 focus:ring-gray-500 mt-1"
            />
            <label htmlFor="terms" className="mr-2 text-gray-700">
              أوافق على <Link href="/terms" className="text-gray-600 hover:underline">شروط وأحكام</Link> المنصة وأتعهد بصحة المعلومات المدخلة وملكيتي للمعدة.
            </label>
          </div>

          {/* زر الإرسال */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </button>
            <Link 
              href="/auctions/auctions-general/equipment"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition text-center"
            >
              إلغاء
            </Link>
          </div>
        </form>

        {/* ملاحظة مساعدة */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4 flex items-start">
          <HelpCircle size={24} className="text-gray-600 ml-3 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-gray-800 mb-1">نصائح لزيادة فرص البيع:</h3>
            <ul className="text-gray-700 space-y-1 text-sm">
              <li>• التقط صوراً واضحة للمعدة من جميع الجوانب وأثناء تشغيلها إن أمكن</li>
              <li>• اذكر حالة البطاريات ومدة عملها في المعدات التي تعمل بالبطارية</li>
              <li>• وثّق أي ملحقات أو قطع غيار إضافية مشمولة مع المعدة</li>
              <li>• ذكر تاريخ الصيانة الأخيرة أو أي إصلاحات تمت على المعدة</li>
              <li>• كن صريحاً بشأن أي مشاكل أو عيوب في المعدة</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 