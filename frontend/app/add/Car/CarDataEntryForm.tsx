/**
 * 📝 نموذج إدخال بيانات السيارة
 * 📁 المسار: Frontend-local/app/add/Car/CarDataEntryForm.tsx
 *
 * ✅ الوظيفة:
 * - نموذج آمن ذو اتجاه واحد لإدخال بيانات السيارة إلى قاعدة البيانات
 * - يدعم رفع الصور وتقارير الفحص
 * - لا يمكن تعديل مساره أو تغيير وظيفته
 * 
 * 🔄 الارتباط:
 * - يرتبط بـ API: /api/cars/add - لحفظ بيانات السيارة
 * - يرتبط بـ API: /api/upload - لرفع الصور والملفات
 * - يرتبط بـ API: /api/sadad - للتوقيع الإلكتروني عبر صادق
 */

'use client';

import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import { Upload, FileX, Car, CheckCircle2, AlertCircle } from 'lucide-react';

interface CarFormData {
  الماركة: string;
  الموديل: string;
  سنة_الصنع: string;
  رقم_اللوحة: string;
  نوع_الوقود: string;
  رقم_العداد: string;
  لون_السيارة: string;
  نوع_ناقل_الحركة: string;
  حالة_السيارة: string;
  الموقع: string;
  الحد_الأدنى_المقبول: string;
  الحد_الأعلى_المرغوب: string;
}

export default function CarDataEntryForm() {
  const [formData, setFormData] = useState<CarFormData>({
    الماركة: '',
    الموديل: '',
    سنة_الصنع: '',
    رقم_اللوحة: '',
    نوع_الوقود: '',
    رقم_العداد: '',
    لون_السيارة: '',
    نوع_ناقل_الحركة: '',
    حالة_السيارة: '',
    الموقع: '',
    الحد_الأدنى_المقبول: '',
    الحد_الأعلى_المرغوب: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [reports, setReports] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const reportInputRef = useRef<HTMLInputElement>(null);

  // التعامل مع تغيير قيم حقول النموذج
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // إضافة الصور
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const newFiles = Array.from(e.target.files);
    setImages(prev => [...prev, ...newFiles]);

    // إنشاء روابط معاينة للصور الجديدة
    const newUrls = newFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
  };

  // إضافة تقارير الفحص
  const handleReportChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const newFiles = Array.from(e.target.files);
    setReports(prev => [...prev, ...newFiles]);
  };

  // حذف صورة
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    
    // إلغاء وتحرير رابط المعاينة
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // حذف تقرير
  const removeReport = (index: number) => {
    setReports(prev => prev.filter((_, i) => i !== index));
  };

  // تقديم النموذج
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);
    
    try {
      // التحقق من البيانات المدخلة
      const requiredFields = ['الماركة', 'الموديل', 'سنة_الصنع', 'رقم_اللوحة'];
      for (const field of requiredFields) {
        if (!formData[field as keyof CarFormData]) {
          throw new Error(`حقل ${field.replace('_', ' ')} مطلوب`);
        }
      }

      if (images.length === 0) {
        throw new Error('يجب إضافة صورة واحدة على الأقل للسيارة');
      }

      // رفع الصور أولاً
      const formDataImages = new FormData();
      images.forEach(image => {
        formDataImages.append('files', image);
      });
      formDataImages.append('type', 'car-images');

      const imageUploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formDataImages,
      });

      if (!imageUploadResponse.ok) {
        throw new Error('فشل في رفع الصور');
      }

      const imageData = await imageUploadResponse.json();
      const imageUrls = imageData.urls;

      // رفع تقارير الفحص
      let reportUrls: string[] = [];
      if (reports.length > 0) {
        const formDataReports = new FormData();
        reports.forEach(report => {
          formDataReports.append('files', report);
        });
        formDataReports.append('type', 'car-reports');

        const reportUploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formDataReports,
        });

        if (!reportUploadResponse.ok) {
          throw new Error('فشل في رفع تقارير الفحص');
        }

        const reportData = await reportUploadResponse.json();
        reportUrls = reportData.urls;
      }

      // إرسال بيانات السيارة مع روابط الصور والتقارير
      const response = await fetch('/api/cars/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          صور: imageUrls,
          تقارير_الفحص: reportUrls,
          تاريخ_الإضافة: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في حفظ بيانات السيارة');
      }

      const data = await response.json();
      
      // تم الحفظ بنجاح
      setSubmitResult({
        success: true,
        message: 'تم إضافة السيارة بنجاح'
      });

      // إعادة تعيين النموذج
      setFormData({
        الماركة: '',
        الموديل: '',
        سنة_الصنع: '',
        رقم_اللوحة: '',
        نوع_الوقود: '',
        رقم_العداد: '',
        لون_السيارة: '',
        نوع_ناقل_الحركة: '',
        حالة_السيارة: '',
        الموقع: '',
        الحد_الأدنى_المقبول: '',
        الحد_الأعلى_المرغوب: '',
      });
      setImages([]);
      setReports([]);
      setPreviewUrls([]);

    } catch (error: any) {
      console.error('خطأ في حفظ البيانات:', error);
      setSubmitResult({
        success: false,
        message: error.message || 'حدث خطأ أثناء حفظ البيانات'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto mb-10">
      <div className="border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">نموذج إدخال بيانات السيارة</h1>
        <p className="text-gray-600 mt-1">يرجى تعبئة جميع البيانات المطلوبة لإضافة سيارتك</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* بيانات السيارة الأساسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="الماركة" className="block text-sm font-medium text-gray-700 mb-1">الماركة *</label>
            <select
              id="الماركة"
              name="الماركة"
              value={formData.الماركة}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- اختر الماركة --</option>
              <option value="تويوتا">تويوتا</option>
              <option value="نيسان">نيسان</option>
              <option value="هونداي">هونداي</option>
              <option value="كيا">كيا</option>
              <option value="فورد">فورد</option>
              <option value="شيفروليه">شيفروليه</option>
              <option value="مرسيدس">مرسيدس</option>
              <option value="بي إم دبليو">بي إم دبليو</option>
              <option value="أودي">أودي</option>
              <option value="لكزس">لكزس</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>

          <div>
            <label htmlFor="الموديل" className="block text-sm font-medium text-gray-700 mb-1">الموديل *</label>
            <input
              type="text"
              id="الموديل"
              name="الموديل"
              value={formData.الموديل}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="سنة_الصنع" className="block text-sm font-medium text-gray-700 mb-1">سنة الصنع *</label>
            <select
              id="سنة_الصنع"
              name="سنة_الصنع"
              value={formData.سنة_الصنع}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- اختر السنة --</option>
              {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="رقم_اللوحة" className="block text-sm font-medium text-gray-700 mb-1">رقم اللوحة *</label>
            <input
              type="text"
              id="رقم_اللوحة"
              name="رقم_اللوحة"
              value={formData.رقم_اللوحة}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="مثال: ح د د ١٢٣٤"
              required
            />
          </div>

          <div>
            <label htmlFor="نوع_الوقود" className="block text-sm font-medium text-gray-700 mb-1">نوع الوقود</label>
            <select
              id="نوع_الوقود"
              name="نوع_الوقود"
              value={formData.نوع_الوقود}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- اختر نوع الوقود --</option>
              <option value="بنزين">بنزين</option>
              <option value="ديزل">ديزل</option>
              <option value="هجين">هجين</option>
              <option value="كهربائي">كهربائي</option>
            </select>
          </div>

          <div>
            <label htmlFor="رقم_العداد" className="block text-sm font-medium text-gray-700 mb-1">رقم العداد (كم)</label>
            <input
              type="number"
              id="رقم_العداد"
              name="رقم_العداد"
              value={formData.رقم_العداد}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>

          <div>
            <label htmlFor="لون_السيارة" className="block text-sm font-medium text-gray-700 mb-1">لون السيارة</label>
            <input
              type="text"
              id="لون_السيارة"
              name="لون_السيارة"
              value={formData.لون_السيارة}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="نوع_ناقل_الحركة" className="block text-sm font-medium text-gray-700 mb-1">نوع ناقل الحركة</label>
            <select
              id="نوع_ناقل_الحركة"
              name="نوع_ناقل_الحركة"
              value={formData.نوع_ناقل_الحركة}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- اختر نوع ناقل الحركة --</option>
              <option value="أوتوماتيك">أوتوماتيك</option>
              <option value="يدوي">يدوي</option>
              <option value="نصف أوتوماتيك">نصف أوتوماتيك</option>
            </select>
          </div>

          <div>
            <label htmlFor="حالة_السيارة" className="block text-sm font-medium text-gray-700 mb-1">حالة السيارة</label>
            <select
              id="حالة_السيارة"
              name="حالة_السيارة"
              value={formData.حالة_السيارة}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- اختر حالة السيارة --</option>
              <option value="جديدة">جديدة</option>
              <option value="ممتازة">ممتازة</option>
              <option value="جيدة جداً">جيدة جداً</option>
              <option value="جيدة">جيدة</option>
              <option value="متوسطة">متوسطة</option>
              <option value="تحتاج إصلاح">تحتاج إصلاح</option>
            </select>
          </div>

          <div>
            <label htmlFor="الموقع" className="block text-sm font-medium text-gray-700 mb-1">الموقع</label>
            <input
              type="text"
              id="الموقع"
              name="الموقع"
              value={formData.الموقع}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="المدينة / المنطقة"
            />
          </div>

          <div>
            <label htmlFor="الحد_الأدنى_المقبول" className="block text-sm font-medium text-gray-700 mb-1">الحد الأدنى المقبول (ريال)</label>
            <input
              type="number"
              id="الحد_الأدنى_المقبول"
              name="الحد_الأدنى_المقبول"
              value={formData.الحد_الأدنى_المقبول}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              placeholder="أقل سعر تقبل به للسيارة"
            />
          </div>

          <div>
            <label htmlFor="الحد_الأعلى_المرغوب" className="block text-sm font-medium text-gray-700 mb-1">الحد الأعلى المرغوب (ريال)</label>
            <input
              type="number"
              id="الحد_الأعلى_المرغوب"
              name="الحد_الأعلى_المرغوب"
              value={formData.الحد_الأعلى_المرغوب}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              placeholder="السعر المستهدف للبيع"
            />
          </div>
        </div>

        {/* قسم رفع الصور */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <Upload className="ml-2 h-5 w-5 text-blue-500" />
            صور السيارة <span className="text-red-500">*</span>
          </h3>
          
          <div className="mb-4">
            <input
              type="file"
              id="car-images"
              ref={imageInputRef}
              onChange={handleImageChange}
              accept="image/*"
              multiple
              className="hidden"
              title="إضافة صور السيارة"
              aria-label="إضافة صور السيارة"
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Upload className="ml-2 -mr-1 h-5 w-5" />
              إضافة صور السيارة
            </button>
            <p className="text-sm text-gray-500 mt-1">
              يمكنك رفع حتى 10 صور للسيارة بصيغة JPG أو PNG. يجب أن تكون الصور واضحة.
            </p>
          </div>

          {/* عرض الصور المضافة */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`صورة السيارة ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="حذف الصورة"
                  >
                    <FileX className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* قسم رفع تقارير الفحص */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <Upload className="ml-2 h-5 w-5 text-blue-500" />
            تقارير الفحص
          </h3>
          
          <div className="mb-4">
            <input
              type="file"
              id="car-reports"
              ref={reportInputRef}
              onChange={handleReportChange}
              accept=".pdf,.doc,.docx,.jpg,.png"
              multiple
              className="hidden"
              title="إضافة تقارير الفحص"
              aria-label="إضافة تقارير الفحص"
            />
            <button
              type="button"
              onClick={() => reportInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Upload className="ml-2 -mr-1 h-5 w-5" />
              إضافة تقارير الفحص
            </button>
            <p className="text-sm text-gray-500 mt-1">
              يمكنك رفع تقارير فحص السيارة بصيغة PDF أو DOC أو صور.
            </p>
          </div>

          {/* عرض التقارير المضافة */}
          {reports.length > 0 && (
            <div className="space-y-2 mb-4">
              {reports.map((report, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 border rounded-md">
                  <span className="text-sm truncate max-w-xs">{report.name}</span>
                  <button
                    type="button"
                    onClick={() => removeReport(index)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="حذف التقرير"
                  >
                    <FileX className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* إقرار الموافقة على الشروط والأحكام والتوقيع الإلكتروني */}
        <div className="border-t pt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-3">إقرار قبول الشروط والأحكام</h3>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
            <p className="text-gray-700 mb-4">
              أقر أنا مقدم هذا النموذج بموافقتي على جميع شروط وإجراءات المنصة، وأوافق على خصم جميع العمولات والرسوم المقررة من قيمة بيع السيارة. كما أتعهد بأن جميع البيانات المقدمة في هذا النموذج صحيحة وكاملة، وأتحمل المسؤولية القانونية الكاملة في حال ثبوت عدم صحة أي منها.
            </p>
            
            <p className="text-gray-700 mb-4">
              كما أوافق على التوقيع على هذا الإقرار بنظام التوقيع الإلكتروني بواسطة الشركة السعودية للمصادقة (صادق)، وأقر بأن هذا التوقيع يعتبر ملزماً قانونياً لي ولا يجوز لي الرجوع فيه بعد إتمام عملية البيع.
            </p>
            
            <div className="flex items-center mt-6 mb-2">
              <input
                type="checkbox"
                id="acceptTerms"
                name="acceptTerms"
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                required
              />
              <label htmlFor="acceptTerms" className="mr-2 text-sm font-medium text-gray-700">
                أوافق على جميع الشروط والأحكام والعمولات المذكورة أعلاه
              </label>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 mb-4">
            <h4 className="text-md font-semibold text-gray-800 mb-3">التوقيع الإلكتروني (صادق)</h4>
            
            <div className="flex items-center justify-center p-4 bg-white border border-dashed border-gray-300 rounded-md">
              <div className="text-center">
                <img 
                  src="/images/sadad-logo.png" 
                  alt="شعار صادق للتوقيع الإلكتروني" 
                  className="h-10 mb-2 mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjUwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iNTAiIGZpbGw9IiNmMWYxZjEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxNHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmaWxsPSIjODg4ODg4Ij7Ytdin2K/ZgiAtINin2YTYqtmI2YLZitisINin2YTYpdmE2YPYqtix2YjZhti5PC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
                <p className="text-sm text-gray-500">اضغط هنا للتوقيع بواسطة خدمة صادق</p>
                <button
                  type="button"
                  className="mt-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  توقيع إلكتروني
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* رسائل النظام */}
        {submitResult && (
          <div className={`p-4 rounded-md ${submitResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start">
              {submitResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 ml-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 ml-2" />
              )}
              <p className={submitResult.success ? 'text-green-700' : 'text-red-700'}>
                {submitResult.message}
              </p>
            </div>
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4 border-t">
          <button
            type="button"
            onClick={() => {
              setFormData({
                الماركة: '',
                الموديل: '',
                سنة_الصنع: '',
                رقم_اللوحة: '',
                نوع_الوقود: '',
                رقم_العداد: '',
                لون_السيارة: '',
                نوع_ناقل_الحركة: '',
                حالة_السيارة: '',
                الموقع: '',
                الحد_الأدنى_المقبول: '',
                الحد_الأعلى_المرغوب: '',
              });
              setImages([]);
              setReports([]);
              setPreviewUrls([]);
              setSubmitResult(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            مسح النموذج
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ بيانات السيارة'}
            <Car className="mr-2 h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
} 