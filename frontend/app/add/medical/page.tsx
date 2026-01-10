'use client';

import { useState } from 'react';
import { QrCode, Stethoscope } from 'lucide-react'; // Using Stethoscope icon

export default function AddMedicalDeviceForm() {
  const [formData, setFormData] = useState({
    type: '', // e.g., Ultrasound, X-Ray Monitor
    make: '',
    model: '',
    serialNumber: '', // Required
    condition: '', // e.g., Working, Refurbished, Parts Only
    description: '',
    lastMaintenance: '', // Optional: Date as string
    location: '', // Optional
    images: [],
    technicalReport: null, // Added for PDF report
  });

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    if (name === "images") { // Handle multiple images
      setFormData({ ...formData, images: Array.from(files) });
    } else if (name === "technicalReport") { // Handle single PDF report
      setFormData({ ...formData, technicalReport: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleBarcodeScan = () => {
    alert('ميزة مسح الباركود غير مفعلة بعد.');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
     if (!formData.serialNumber) {
       alert('الرجاء إدخال الرقم التسلسلي.');
       return;
    }
    alert('تم إرسال البيانات (للتجربة فقط).');
  };

  const inputClasses = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const labelClasses = "block text-sm font-medium text-gray-700";

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 flex items-center justify-center gap-3">
         <Stethoscope size={28} />
         إضافة جهاز طبي مستعمل للمزاد
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="type" className={labelClasses}>نوع الجهاز</label>
              <input type="text" name="type" id="type" placeholder="جهاز أشعة، جهاز تخطيط قلب..." onChange={handleChange} className={inputClasses} />
            </div>
             <div>
              <label htmlFor="make" className={labelClasses}>الشركة المصنعة</label>
              <input type="text" name="make" id="make" placeholder="Siemens, GE, Philips..." onChange={handleChange} className={inputClasses} />
            </div>
            <div>
              <label htmlFor="model" className={labelClasses}>الموديل</label>
              <input type="text" name="model" id="model" onChange={handleChange} className={inputClasses} />
            </div>
             <div>
              <label htmlFor="serialNumber" className={labelClasses}>الرقم التسلسلي (إجباري)</label>
               <div className="flex items-center gap-2">
                 <input type="text" name="serialNumber" id="serialNumber" onChange={handleChange} className={inputClasses} required />
                 <button type="button" onClick={handleBarcodeScan} title="مسح الباركود/الرقم التسلسلي" className="p-2 text-gray-600 hover:text-sky-600">
                    <QrCode size={20}/>
                 </button>
              </div>
            </div>
             <div>
              <label htmlFor="condition" className={labelClasses}>الحالة</label>
              <select name="condition" id="condition" onChange={handleChange} className={inputClasses}>
                  <option value="">اختر الحالة...</option>
                  <option value="يعمل - كالجديد">يعمل - كالجديد</option>
                  <option value="يعمل - جيد">يعمل - جيد</option>
                  <option value="يحتاج صيانة">يحتاج صيانة</option>
                  <option value="قطع غيار فقط">قطع غيار فقط</option>
                  <option value="غير معروفة">غير معروفة</option>
              </select>
            </div>
            <div>
              <label htmlFor="lastMaintenance" className={labelClasses}>تاريخ آخر صيانة (اختياري)</label>
              <input type="date" name="lastMaintenance" id="lastMaintenance" onChange={handleChange} className={inputClasses} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="location" className={labelClasses}>الموقع (اختياري)</label>
              <input type="text" name="location" id="location" placeholder="مستشفى/عيادة في الرياض..." onChange={handleChange} className={inputClasses} />
            </div>
             <div className="md:col-span-2">
               <label htmlFor="description" className={labelClasses}>الوصف / الميزات / الملحقات</label>
               <textarea name="description" id="description" rows={3} onChange={handleChange} className={inputClasses}></textarea>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col gap-4">
           <div>
             <label htmlFor="images" className={labelClasses}>صور الجهاز</label>
             <input type="file" name="images" id="images" multiple accept="image/*" onChange={handleChange} className={`${inputClasses} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100`} />
             <p className="mt-1 text-xs text-gray-500">يمكنك اختيار صور متعددة</p>
           </div>
        </div>

        {/* Technical Report Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <label htmlFor="technicalReport" className={labelClasses}>التقرير الفني/شهادة المعايرة (PDF) - إن وجد</label>
          <input type="file" name="technicalReport" id="technicalReport" accept="application/pdf" onChange={handleChange} className={`${inputClasses} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100`} />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-6 rounded-lg transition">إضافة الجهاز الطبي</button>
        </div>
      </form>
    </main>
  );
} 