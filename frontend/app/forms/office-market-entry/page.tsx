/**
 * 📝 الصفحة: نموذج إدخال بيانات الآلات المكتبية المستعملة
 * 📁 المسار: Frontend-local/app/forms/office-market-entry/page.tsx
 * 
 * ✅ الوظيفة:
 * - هذه الصفحة تعرض نموذجًا يسمح بإدخال بيانات الآلات المكتبية المستعملة للبيع في السوق النوعي
 * - تتضمن حقول للبيانات الأساسية مثل الاسم والوصف والمواصفات والسعر والحالة
 * - تدعم رفع صور متعددة وملف PDF
 * 
 * ✅ طريقة الربط:
 * - ترسل البيانات إلى API في: /api/office-market/add
 * - يتم تخزين البيانات في جدول products مع category = "الآلات المكتبية"
 */

'use client';

import React, { useState } from 'react';
import LoadingLink from "@/components/LoadingLink";
import { ArrowLeft, Upload, Info, Printer, Save, HelpCircle, X } from 'lucide-react';

export default function OfficeMarketEntryPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    specs: '',
    price: '',
    condition: '',
    manufacturer: '',
    model_year: '',
    type: '',
  });

  const [images, setImages] = useState<FileList | null>(null);
  const [pdfReport, setPdfReport] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // خيارات حالة المنتج
  const conditionOptions = [
    { value: 'new', label: 'جديد' },
    { value: 'excellent', label: 'مستعمل ممتاز' },
    { value: 'good', label: 'مستعمل مقبول' },
    { value: 'refurbished', label: 'مجدد' },
  ];

  // خيارات نوع الآلات المكتبية
  const typeOptions = [
    { value: 'printer', label: 'طابعة' },
    { value: 'scanner', label: 'ماسح ضوئي' },
    { value: 'photocopier', label: 'آلة تصوير' },
    { value: 'fax', label: 'فاكس' },
    { value: 'multifunction', label: 'جهاز متعدد الوظائف' },
    { value: 'shredder', label: 'آلة تقطيع أوراق' },
    { value: 'other', label: 'أخرى' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setImages(e.target.files);
    }
  };

  const handlePdfChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setPdfReport(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setFormValues({
      name: '',
      description: '',
      specs: '',
      price: '',
      condition: '',
      manufacturer: '',
      model_year: '',
      type: '',
    });
    setImages(null);
    setPdfReport(null);
    setUploadProgress(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    setUploadProgress(10);

    try {
      // إنشاء FormData لرفع الملفات والبيانات
      const formData = new FormData();
      
      // إضافة البيانات الأساسية
      formData.append('name', formValues.name);
      formData.append('description', formValues.description);
      formData.append('specs', formValues.specs);
      formData.append('price', formValues.price);
      formData.append('condition', formValues.condition);
      formData.append('manufacturer', formValues.manufacturer);
      formData.append('model_year', formValues.model_year);
      formData.append('type', formValues.type);
      formData.append('category', 'الآلات المكتبية');
      
      // إضافة الصور
      if (images) {
        Array.from(images).forEach(file => {
          formData.append('images', file);
        });
      }
      
      // إضافة ملف PDF
      if (pdfReport) {
        formData.append('pdf_report', pdfReport);
      }

      setUploadProgress(30);
      
      // إرسال البيانات إلى API
      const response = await fetch('/api/office-market/add', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(90);
      
      if (response.ok) {
        const data = await response.json();
        setSuccessMessage('تم إضافة الآلة المكتبية بنجاح');
        resetForm();
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'حدث خطأ أثناء إضافة الآلة المكتبية');
      }
    } catch (error) {
      console.error('خطأ في إرسال النموذج:', error);
      setErrorMessage('حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(100);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white py-12 px-4">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-sky-600 to-sky-800 py-6 rounded-t-lg">
        <div className="container mx-auto px-4">
          <LoadingLink 
            href="/auctions" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى الأسواق الرئيسية</span>
          </LoadingLink>
          <div className="flex items-center">
            <Printer className="text-white mr-3 h-8 w-8" />
            <h1 className="text-3xl font-bold text-white">إضافة آلة مكتبية للسوق النوعي</h1>
          </div>
          <p className="text-white/80 mt-2">
            أدخل بيانات الآلة المكتبية المستعملة وصورها وتفاصيلها لإضافتها إلى سوق الآلات المكتبية المستعملة
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto bg-white p-8 rounded-b-lg shadow-md">
        {successMessage && (
          <div className="mb-6 bg-green-50 text-green-800 p-4 rounded-lg flex items-start">
            <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="mr-3">
              <p className="font-medium">{successMessage}</p>
            </div>
            <button 
              onClick={() => setSuccessMessage(null)} 
              className="mr-auto text-green-600 hover:text-green-800"
              aria-label="إغلاق الرسالة"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-lg flex items-start">
            <div className="flex-shrink-0 bg-red-100 rounded-full p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="mr-3">
              <p className="font-medium">{errorMessage}</p>
            </div>
            <button 
              onClick={() => setErrorMessage(null)} 
              className="mr-auto text-red-600 hover:text-red-800"
              aria-label="إغلاق الرسالة"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Printer className="text-sky-700 mr-2 h-6 w-6" />
          <span>معلومات الآلة المكتبية</span>
        </h2>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* بيانات الآلة المكتبية الأساسية */}
          <div>
            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">اسم الآلة <span className="text-red-500">*</span></label>
            <input 
              type="text"
              id="name"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              required
              placeholder="مثال: آلة تصوير كانون موديل IR-2520"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="type" className="block text-gray-700 font-medium mb-2">نوع الآلة <span className="text-red-500">*</span></label>
              <select 
                id="type"
                name="type"
                value={formValues.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="">-- اختر نوع الآلة --</option>
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="manufacturer" className="block text-gray-700 font-medium mb-2">الشركة المصنعة <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="manufacturer"
                name="manufacturer"
                value={formValues.manufacturer}
                onChange={handleChange}
                required
                placeholder="مثال: Canon"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="model_year" className="block text-gray-700 font-medium mb-2">سنة الصنع <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="model_year"
                name="model_year"
                value={formValues.model_year}
                onChange={handleChange}
                required
                placeholder="مثال: 2018"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label htmlFor="condition" className="block text-gray-700 font-medium mb-2">حالة الآلة <span className="text-red-500">*</span></label>
              <select 
                id="condition"
                name="condition"
                value={formValues.condition}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="">-- اختر حالة الآلة --</option>
                {conditionOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">وصف الآلة <span className="text-red-500">*</span></label>
            <textarea 
              id="description"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="وصف تفصيلي للآلة وميزاتها وحالتها العامة"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div>
            <label htmlFor="specs" className="block text-gray-700 font-medium mb-2">
              المواصفات التقنية <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 mr-2">يمكن كتابة كل مواصفة في سطر</span>
            </label>
            <textarea 
              id="specs"
              name="specs"
              value={formValues.specs}
              onChange={handleChange}
              required
              rows={6}
              placeholder="السرعة: 20 صفحة في الدقيقة
الدقة: 600 × 600 نقطة في البوصة
الاتصال: شبكة، USB
قياس الورق: A3، A4، A5
سعة الورق: 550 ورقة
الذاكرة: 512 ميجابايت"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono text-sm"
            />
            <p className="text-sm text-gray-500 mt-1">أدخل المواصفات التقنية للآلة بتنسيق واضح</p>
          </div>

          <div>
            <label htmlFor="price" className="block text-gray-700 font-medium mb-2">السعر (بالريال) <span className="text-red-500">*</span></label>
            <input 
              type="number"
              id="price"
              name="price"
              value={formValues.price}
              onChange={handleChange}
              required
              placeholder="مثال: 4500"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          {/* صور الآلة المكتبية */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">صور الآلة <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input 
                type="file"
                id="office-images"
                onChange={handleImageChange}
                multiple
                accept="image/*"
                className="hidden"
              />
              <label htmlFor="office-images" className="cursor-pointer flex flex-col items-center">
                <Upload size={40} className="text-gray-400 mb-2" />
                <p className="text-gray-600 mb-1">اسحب الصور هنا أو انقر للاختيار</p>
                <p className="text-sm text-gray-500">يمكنك اختيار صور متعددة (الواجهة الأمامية، الخلفية، لوحة التحكم...)</p>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {images ? `تم اختيار ${images.length} صورة` : 'لم يتم اختيار أي صور'}
            </p>
          </div>

          {/* ملف تقرير PDF */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">ملف تقرير PDF (اختياري)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input 
                type="file"
                id="pdf-report"
                onChange={handlePdfChange}
                accept=".pdf"
                className="hidden"
              />
              <label htmlFor="pdf-report" className="cursor-pointer flex flex-col items-center">
                <Upload size={40} className="text-gray-400 mb-2" />
                <p className="text-gray-600 mb-1">ارفع ملف PDF للتقرير الفني أو شهادة الضمان</p>
                <p className="text-sm text-gray-500">الحد الأقصى: 10 ميجابايت</p>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {pdfReport ? `تم اختيار: ${pdfReport.name}` : 'لم يتم اختيار أي ملف'}
            </p>
          </div>

          {/* معلومات إضافية */}
          <div className="bg-sky-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-2 flex items-center">
              <Info size={18} className="ml-2 text-sky-600" />
              معلومات هامة
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="inline-block h-5 w-5 rounded-full bg-sky-200 text-sky-700 text-center flex-shrink-0 mr-2">1</span>
                <span>سيتم مراجعة بيانات الآلة المكتبية قبل نشرها في السوق</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block h-5 w-5 rounded-full bg-sky-200 text-sky-700 text-center flex-shrink-0 mr-2">2</span>
                <span>يُفضل إضافة صور واضحة للآلة من جميع الزوايا</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block h-5 w-5 rounded-full bg-sky-200 text-sky-700 text-center flex-shrink-0 mr-2">3</span>
                <span>يمكن إرفاق تقرير فحص أو شهادة ضمان إن وجدت</span>
              </li>
            </ul>
          </div>

          {/* زر الإرسال */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-lg transition flex justify-center items-center disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Save className="ml-2" size={18} />
                  إضافة الآلة المكتبية
                </>
              )}
            </button>
            <LoadingLink 
              href="/auctions"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition text-center"
            >
              إلغاء
            </LoadingLink>
          </div>
        </form>

        {/* نصائح مساعدة */}
        <div className="mt-10 bg-sky-50 rounded-lg p-4 flex items-start">
          <HelpCircle size={24} className="text-sky-600 ml-3 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-sky-800 mb-1">نصائح لزيادة فرص البيع:</h3>
            <ul className="text-sky-700 space-y-1 text-sm">
              <li>• قدم وصفًا دقيقًا وشاملًا للآلة المكتبية</li>
              <li>• أضف صورًا واضحة لجميع المكونات الرئيسية</li>
              <li>• اذكر تاريخ شراء الآلة وفترة الاستخدام</li>
              <li>• وثّق عدد الصفحات المطبوعة أو المصورة (العداد)</li>
              <li>• حدد إذا كانت الآلة تحتاج إلى أي قطع استهلاكية</li>
              <li>• حدد سعرًا تنافسيًا مناسبًا لحالة الآلة</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 