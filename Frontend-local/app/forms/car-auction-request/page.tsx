/**
 * 📝 الصفحة: نموذج إدخال سيارة للمزاد
 * 📁 المسار: Frontend-local/app/forms/car-auction-request/page.tsx
 *
 * ✅ الوظيفة:
 * - هذه الصفحة تعرض نموذجًا مخصصًا يسمح للمستخدم بإدخال بيانات سيارة (الماركة، الموديل، الوقود...).
 * - بعد إدخال البيانات يتم إرسالها باستخدام `FormData` إلى واجهة API محلية.
 *
 * ✅ طريقة الربط:
 * - ترسل البيانات إلى API في: /api/items (POST)
 * - يتم تخزين البيانات مباشرة في قاعدة البيانات auctions.db في جدول `items`، مع category = 'cars'
 *
 * ✅ المرفقات المدعومة:
 * - صور متعددة للسيارة
 * - تقرير فحص بصيغة PDF أو صورة
 *
 * ✅ الفائدة:
 * - يستخدم هذا النموذج لإضافة سيارات إلى منصة المزاد (الفوري أو الصامت أو المباشر).
 * - البيانات تُعرض لاحقًا في صفحة: /auctions/auctions-car/page.tsx
 */

'use client';

import React, { useState } from 'react';

// تعريف دالة getCurrentAuctionType محلياً لتفادي مشاكل الاستيراد
function getCurrentAuctionType(): string {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 16 && hour < 19) {
    return 'live'; // الحراج المباشر
  } else if (hour >= 19 && hour < 22) {
    return 'immediate'; // السوق الفوري
  } else {
    return 'late'; // السوق المتأخر
  }
}

export default function CarAuctionRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    fuel_type: '',
    vin: '',
    year: '',
    mileage: '',
    color: '',
    inspection_company: '',
  });

  const [images, setImages] = useState<FileList | null>(null);
  const [inspectionFile, setInspectionFile] = useState<File | null>(null);

  const handleChange = (e: any) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', formValues.title);
    formData.append('description', formValues.description);
    formData.append('category', 'cars');

    // ✅ تحديد نوع المزاد تلقائيًا من الدالة
    const currentType = getCurrentAuctionType();
    formData.append('type', currentType);

    formData.append('min_price', '10000');
    formData.append('max_price', '90000');
    formData.append('start_price', '20000');
    formData.append('current_price', '20000');
    formData.append('high_price', '20000');
    formData.append('low_price', '20000');

    if (images) {
      Array.from(images).forEach((file) => {
        formData.append('images', file);
      });
    }

    if (inspectionFile) {
      formData.append('inspection_report', inspectionFile);
    } else {
      formData.append('inspection_report', '');
    }

    const additional = {
      vin: formValues.vin,
      fuel_type: formValues.fuel_type,
      year: formValues.year,
      mileage: formValues.mileage,
      color: formValues.color,
      inspection_company: formValues.inspection_company,
    };

    formData.append('additional_info', JSON.stringify(additional));

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('تم إدخال السيارة بنجاح');
      } else {
        alert('حدث خطأ أثناء الإرسال');
      }
    } catch (error) {
      alert('فشل الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">نموذج إدخال سيارة للمزاد</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="title" value={formValues.title} onChange={handleChange} placeholder="اسم السيارة (مثال: تويوتا كامري 2021)" className="w-full border p-3 rounded" />
        <input type="text" name="description" value={formValues.description} onChange={handleChange} placeholder="الوصف" className="w-full border p-3 rounded" />
        <input type="text" name="fuel_type" value={formValues.fuel_type} onChange={handleChange} placeholder="نوع الوقود" className="w-full border p-3 rounded" />
        <input type="text" name="vin" value={formValues.vin} onChange={handleChange} placeholder="رقم الشاصي" className="w-full border p-3 rounded" />
        <input type="text" name="year" value={formValues.year} onChange={handleChange} placeholder="سنة التصنيع" className="w-full border p-3 rounded" />
        <input type="text" name="mileage" value={formValues.mileage} onChange={handleChange} placeholder="عدد الكيلومترات" className="w-full border p-3 rounded" />
        <input type="text" name="color" value={formValues.color} onChange={handleChange} placeholder="اللون" className="w-full border p-3 rounded" />
        <input type="text" name="inspection_company" value={formValues.inspection_company} onChange={handleChange} placeholder="شركة الفحص (إن وجدت)" className="w-full border p-3 rounded" />

        <input type="file" multiple onChange={(e) => setImages(e.target.files)} className="w-full border p-3 rounded" />
        <input type="file" onChange={(e) => setInspectionFile(e.target.files?.[0] || null)} className="w-full border p-3 rounded" />

        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-semibold">
          {isSubmitting ? 'جاري الإرسال...' : 'إرسال'}
        </button>
      </form>
    </div>
  );
}
