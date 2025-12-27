/**
 * 📝 الصفحة: نموذج إدخال مجوهرات للمزاد
 * 📁 المسار: Frontend-local/app/forms/jewelry-auction-request/page.tsx
 * 
 * ✅ الوظيفة:
 * - هذه الصفحة تعرض نموذجًا مخصصًا يسمح للمستخدم بإدخال بيانات قطعة مجوهرات (الوصف، الوزن، الصور...).
 * - بعد إدخال البيانات يتم إرسالها باستخدام `FormData` إلى واجهة API محلية.
 * 
 * ✅ طريقة الربط:
 * - ترسل البيانات إلى API في: /api/items (POST)
 * - يتم تخزين البيانات مباشرة في قاعدة البيانات auctions.db في جدول اسمه `items`.
 * 
 * ✅ المرفقات المدعومة:
 * - صور متعددة بصيغة FileList
 * - تقرير فحص أو فاتورة بصيغة PDF أو صورة
 * 
 * ✅ الفائدة:
 * - يستخدم هذا النموذج لإضافة مزادات المجوهرات إلى المنصة لعرضها لاحقًا في صفحة العرض الخاصة.
 * - يتكامل بشكل مباشر مع صفحة: /auctions-special/jewelry/page.tsx
 * 
 * 📌 ملاحظة:
 * لا حاجة لأي سكربت خارجي لتشغيل قاعدة البيانات، حيث يتم الربط مع SQLite مباشرة داخل المشروع.
 */

'use client';

import React, { useState } from 'react';

export default function JewelryAuctionRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    sellerName: '',
    sellerPhone: '',
    description: '',
    category: 'jewelry',
    metalType: '',
    goldKarat: '',
    weight: '',
    expertCheck: '',
  });

  const [images, setImages] = useState<FileList | null>(null);
  const [invoice, setInvoice] = useState<File | null>(null);

  const handleChange = (e: any) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();

    formData.append('title', 'قطعة مجوهرات فاخرة');
    formData.append('description', formValues.description);
    formData.append('category', 'jewelry');
    formData.append('type', 'instant');

    formData.append('min_price', '1000');
    formData.append('max_price', '15000');
    formData.append('start_price', '3000');
    formData.append('current_price', '3000');
    formData.append('high_price', '3000');
    formData.append('low_price', '3000');

    if (images) {
      Array.from(images).forEach((file) => {
        formData.append('images', file);
      });
    }

    if (invoice) {
      formData.append('inspection_report', invoice);
    } else {
      formData.append('inspection_report', '');
    }

    const additional = {
      sellerName: formValues.sellerName,
      sellerPhone: formValues.sellerPhone,
      weight: formValues.weight,
      karat: formValues.goldKarat,
      metalType: formValues.metalType,
      expertCheck: formValues.expertCheck,
    };

    formData.append('additional_info', JSON.stringify(additional));

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('تم إرسال البيانات بنجاح');
        setFormValues({
          sellerName: '',
          sellerPhone: '',
          description: '',
          category: 'jewelry',
          metalType: '',
          goldKarat: '',
          weight: '',
          expertCheck: '',
        });
        setImages(null);
        setInvoice(null);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold mb-6 text-center">استمارة طرح قطعة مجوهرات في مزاد المنصة</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* معلومات البائع */}
          <input name="sellerName" value={formValues.sellerName} onChange={handleChange} placeholder="الاسم الكامل" className="w-full p-3 border rounded-lg mb-3" />
          <input name="sellerPhone" value={formValues.sellerPhone} onChange={handleChange} placeholder="رقم الهاتف" className="w-full p-3 border rounded-lg mb-3" />

          {/* معلومات القطعة */}
          <input name="metalType" value={formValues.metalType} onChange={handleChange} placeholder="نوع المعدن (ذهب/فضة/آخر)" className="w-full p-3 border rounded-lg mb-3" />
          <input name="goldKarat" value={formValues.goldKarat} onChange={handleChange} placeholder="عيار الذهب" className="w-full p-3 border rounded-lg mb-3" />
          <input name="weight" value={formValues.weight} onChange={handleChange} placeholder="وزن القطعة بالجرام" className="w-full p-3 border rounded-lg mb-3" />
          <textarea name="description" value={formValues.description} onChange={handleChange} placeholder="وصف تفصيلي" className="w-full p-3 border rounded-lg mb-3" />

          {/* توثيق */}
          <select name="expertCheck" value={formValues.expertCheck} onChange={handleChange} className="w-full p-3 border rounded-lg mb-3">
            <option value="">اختر توثيق القطعة</option>
            <option value="yes">أرغب بفحص خبير</option>
            <option value="no">لا أرغب بالفحص</option>
          </select>

          {/* صور وفيديو */}
          <input type="file" multiple onChange={(e) => setImages(e.target.files)} className="w-full p-3 border rounded-lg mb-3" />
          <input type="file" onChange={(e) => setInvoice(e.target.files?.[0] || null)} className="w-full p-3 border rounded-lg mb-3" />

          {/* زر الإرسال */}
          <button type="submit" disabled={isSubmitting} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 rounded-lg transition">
            {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
          </button>
        </form>
      </div>
    </div>
  );
}
