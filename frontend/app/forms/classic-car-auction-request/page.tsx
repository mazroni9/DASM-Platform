/**
 * 📝 الصفحة: نموذج إدخال السيارات الكلاسيكية للمزاد
 * 📁 المسار: Frontend-local/app/forms/classic-car-auction-request/page.tsx
 *
 * ✅ الوظيفة:
 * - صفحة لتسجيل بيانات السيارات الكلاسيكية والنادرة للمزادات المتخصصة
 * - جمع المعلومات المفصلة عن السيارة الكلاسيكية وتاريخها ومواصفاتها
 * - تحميل صور متعددة وتقارير الفحص والوثائق
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Info, HelpCircle, Car, History, Wrench, FileText } from 'lucide-react';

export default function ClassicCarAuctionRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    ownerName: '',
    ownerPhone: '',
    title: '',
    category: 'classic_cars',
    make: '',
    model: '',
    year: '',
    bodyType: '',
    color: '',
    vin: '',
    mileage: '',
    engineType: '',
    engineSize: '',
    transmission: '',
    driveType: '',
    exteriorCondition: '',
    interiorCondition: '',
    mechanicalCondition: '',
    originalStatus: '',
    restorationDate: '',
    previousOwners: '',
    carHistory: '',
    specialFeatures: [] as string[],
    documents: [] as string[],
    description: '',
    minPrice: '',
    maxPrice: ''
  });

  const [images, setImages] = useState<FileList | null>(null);
  const [inspectionFile, setInspectionFile] = useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = useState<FileList | null>(null);
  
  // بيانات القوائم المنسدلة
  
  // الشركات المصنعة
  const carMakes = [
    { value: 'mercedes', label: 'مرسيدس-بنز' },
    { value: 'rolls_royce', label: 'رولز رويس' },
    { value: 'bentley', label: 'بنتلي' },
    { value: 'ferrari', label: 'فيراري' },
    { value: 'porsche', label: 'بورش' },
    { value: 'jaguar', label: 'جاكوار' },
    { value: 'aston_martin', label: 'أستون مارتن' },
    { value: 'cadillac', label: 'كاديلاك' },
    { value: 'bugatti', label: 'بوغاتي' },
    { value: 'ford', label: 'فورد' },
    { value: 'chevrolet', label: 'شيفروليه' },
    { value: 'dodge', label: 'دودج' },
    { value: 'alfa_romeo', label: 'ألفا روميو' },
    { value: 'other', label: 'أخرى' }
  ];
  
  // أنواع الهياكل
  const bodyTypes = [
    { value: 'coupe', label: 'كوبيه' },
    { value: 'convertible', label: 'مكشوفة' },
    { value: 'sedan', label: 'سيدان' },
    { value: 'roadster', label: 'رودستر' },
    { value: 'limousine', label: 'ليموزين' },
    { value: 'wagon', label: 'ستيشن واغن' },
    { value: 'pickup', label: 'بيك آب' },
    { value: 'supercar', label: 'سوبر كار' },
    { value: 'other', label: 'أخرى' }
  ];
  
  // أنواع المحركات
  const engineTypes = [
    { value: 'v8', label: 'V8' },
    { value: 'v6', label: 'V6' },
    { value: 'v12', label: 'V12' },
    { value: 'straight6', label: 'مستقيم 6 سلندر' },
    { value: 'straight4', label: 'مستقيم 4 سلندر' },
    { value: 'flat4', label: 'فلات 4 سلندر' },
    { value: 'flat6', label: 'فلات 6 سلندر' },
    { value: 'other', label: 'أخرى' }
  ];
  
  // أنواع ناقل الحركة
  const transmissions = [
    { value: 'manual', label: 'يدوي' },
    { value: 'automatic', label: 'أوتوماتيك' },
    { value: 'semi_auto', label: 'نصف أوتوماتيك' }
  ];
  
  // أنظمة الدفع
  const driveTypes = [
    { value: 'rwd', label: 'دفع خلفي' },
    { value: 'fwd', label: 'دفع أمامي' },
    { value: 'awd', label: 'دفع رباعي' }
  ];
  
  // حالات السيارة
  const conditions = [
    { value: 'mint', label: 'ممتازة (كالجديدة)' },
    { value: 'excellent', label: 'ممتازة مع علامات طفيفة' },
    { value: 'very_good', label: 'جيدة جداً' },
    { value: 'good', label: 'جيدة' },
    { value: 'fair', label: 'مقبولة' },
    { value: 'poor', label: 'ضعيفة (تحتاج ترميم)' }
  ];
  
  // حالة الأصالة
  const originalityStatuses = [
    { value: 'all_original', label: 'أصلية بالكامل' },
    { value: 'mostly_original', label: 'أصلية في معظمها' },
    { value: 'restored_original', label: 'مرممة وفق المواصفات الأصلية' },
    { value: 'restored_modified', label: 'مرممة مع تعديلات' },
    { value: 'restomod', label: 'ريستومود (مظهر كلاسيكي مع تقنيات حديثة)' },
    { value: 'replica', label: 'نسخة طبق الأصل' }
  ];
  
  // المميزات الخاصة
  const allSpecialFeatures = [
    { value: 'limited_edition', label: 'إصدار محدود' },
    { value: 'race_history', label: 'تاريخ في السباقات' },
    { value: 'celebrity_owned', label: 'مملوكة سابقاً لشخصية مشهورة' },
    { value: 'award_winner', label: 'فائزة بجوائز' },
    { value: 'matching_numbers', label: 'أرقام المحرك والشاصي متطابقة' },
    { value: 'original_paint', label: 'طلاء أصلي' },
    { value: 'original_interior', label: 'مقصورة داخلية أصلية' },
    { value: 'factory_options', label: 'خيارات إضافية من المصنع' },
    { value: 'documented_history', label: 'تاريخ موثق' }
  ];
  
  // أنواع الوثائق
  const documentTypes = [
    { value: 'title', label: 'شهادة ملكية أصلية' },
    { value: 'service_records', label: 'سجلات الصيانة' },
    { value: 'build_sheet', label: 'وثيقة التصنيع الأصلية' },
    { value: 'restoration_photos', label: 'صور الترميم' },
    { value: 'certificate_authenticity', label: 'شهادة أصالة' },
    { value: 'original_manual', label: 'كتيب المالك الأصلي' },
    { value: 'original_tools', label: 'عدة الصيانة الأصلية' },
    { value: 'awards_trophies', label: 'جوائز وتكريمات' },
    { value: 'magazine_features', label: 'ظهور في مجلات متخصصة' }
  ];

  // وظيفة معالجة التغييرات في حقول النموذج
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'specialFeatures' || name === 'documents') {
        handleArrayChange(name, value, checked);
      } else {
        setFormValues(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormValues(prev => ({ ...prev, [name]: value }));
    }
  };

  // وظيفة معالجة التغييرات في الحقول من نوع مصفوفة (checkboxes)
  const handleArrayChange = (name: string, value: string, checked: boolean) => {
    setFormValues(prev => {
      // Safely cast to string array
      const array = [...(prev[name as keyof typeof prev] as string[])];
      if (checked) {
        if (!array.includes(value)) {
          return { ...prev, [name]: [...array, value] };
        }
      } else {
        return { ...prev, [name]: array.filter(item => item !== value) };
      }
      return prev;
    });
  };

  // وظيفة معالجة تحميل الصور
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(e.target.files);
    }
  };

  // وظيفة معالجة تحميل ملف الفحص
  const handleInspectionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setInspectionFile(e.target.files[0]);
    }
  };

  // وظيفة معالجة تحميل ملفات الوثائق
  const handleDocumentFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocumentFiles(e.target.files);
    }
  };

  // وظيفة معالجة إرسال النموذج
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();

    // إضافة البيانات الأساسية
    formData.append('title', formValues.title);
    formData.append('description', formValues.description);
    formData.append('category', 'classic_cars');
    formData.append('type', 'auction');

    // إضافة بيانات السعر
    formData.append('min_price', formValues.minPrice);
    formData.append('max_price', formValues.maxPrice);
    formData.append('start_price', '0'); // سيتم تحديده من قبل غرفة التحكم
    formData.append('current_price', '0');
    formData.append('high_price', '0');
    formData.append('low_price', '0');

    // إضافة الصور
    if (images) {
      Array.from(images).forEach((file) => {
        formData.append('images', file);
      });
    }

    // إضافة ملف الفحص
    if (inspectionFile) {
      formData.append('inspection_report', inspectionFile);
    } else {
      formData.append('inspection_report', '');
    }

    // إضافة البيانات التفصيلية كمعلومات إضافية
    const additionalInfo = {
      ownerName: formValues.ownerName,
      ownerPhone: formValues.ownerPhone,
      make: formValues.make,
      model: formValues.model,
      year: formValues.year,
      bodyType: formValues.bodyType,
      color: formValues.color,
      vin: formValues.vin,
      mileage: formValues.mileage,
      engineType: formValues.engineType,
      engineSize: formValues.engineSize,
      transmission: formValues.transmission,
      driveType: formValues.driveType,
      exteriorCondition: formValues.exteriorCondition,
      interiorCondition: formValues.interiorCondition,
      mechanicalCondition: formValues.mechanicalCondition,
      originalStatus: formValues.originalStatus,
      restorationDate: formValues.restorationDate,
      previousOwners: formValues.previousOwners,
      carHistory: formValues.carHistory,
      specialFeatures: formValues.specialFeatures,
      documents: formValues.documents
    };

    formData.append('additional_info', JSON.stringify(additionalInfo));

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('تم إرسال بيانات السيارة الكلاسيكية بنجاح');
        // إعادة تعيين النموذج
        setFormValues({
          ownerName: '',
          ownerPhone: '',
          title: '',
          category: 'classic_cars',
          make: '',
          model: '',
          year: '',
          bodyType: '',
          color: '',
          vin: '',
          mileage: '',
          engineType: '',
          engineSize: '',
          transmission: '',
          driveType: '',
          exteriorCondition: '',
          interiorCondition: '',
          mechanicalCondition: '',
          originalStatus: '',
          restorationDate: '',
          previousOwners: '',
          carHistory: '',
          specialFeatures: [],
          documents: [],
          description: '',
          minPrice: '',
          maxPrice: ''
        });
        setImages(null);
        setInspectionFile(null);
        setDocumentFiles(null);
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
      <div className="bg-gradient-to-r from-amber-800 to-amber-600 py-6 rounded-t-lg">
        <div className="container mx-auto px-4">
          <Link 
            href="/auctions/auctions-special/classic-cars" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى سوق السيارات الكلاسيكية</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">تسجيل سيارة كلاسيكية للمزاد</h1>
          <p className="text-white/80 mt-2">
            سجل سيارتك الكلاسيكية في منصتنا وانضم إلى مجتمع هواة ومقتني السيارات الكلاسيكية
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 rounded-b-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">معلومات السيارة الكلاسيكية</h2>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* القسم الأول: معلومات المالك */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700 flex items-center">
              <Info size={20} className="ml-2 text-amber-600" />
              بيانات المالك
            </h3>
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* القسم الثاني: معلومات السيارة الأساسية */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700 flex items-center">
              <Car size={20} className="ml-2 text-amber-600" />
              المعلومات الأساسية للسيارة
            </h3>
            
            <div>
              <label htmlFor="title" className="block text-gray-700 font-medium mb-2">عنوان الإعلان <span className="text-red-500">*</span></label>
              <input 
                type="text"
                id="title"
                name="title"
                value={formValues.title}
                onChange={handleChange}
                required
                placeholder="وصف مختصر وجذاب للسيارة (مثال: مرسيدس 280SL 1969 حالة أصلية نادرة)"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label htmlFor="make" className="block text-gray-700 font-medium mb-2">الشركة المصنعة <span className="text-red-500">*</span></label>
                <select 
                  id="make"
                  name="make"
                  value={formValues.make}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">-- اختر الشركة المصنعة --</option>
                  {carMakes.map(make => (
                    <option key={make.value} value={make.value}>{make.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="model" className="block text-gray-700 font-medium mb-2">الطراز <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  id="model"
                  name="model"
                  value={formValues.model}
                  onChange={handleChange}
                  required
                  placeholder="طراز السيارة"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label htmlFor="year" className="block text-gray-700 font-medium mb-2">سنة الصنع <span className="text-red-500">*</span></label>
                <input 
                  type="number"
                  id="year"
                  name="year"
                  value={formValues.year}
                  onChange={handleChange}
                  required
                  min="1886"
                  max={new Date().getFullYear() - 25}
                  placeholder="سنة الصنع"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label htmlFor="bodyType" className="block text-gray-700 font-medium mb-2">نوع الهيكل <span className="text-red-500">*</span></label>
                <select 
                  id="bodyType"
                  name="bodyType"
                  value={formValues.bodyType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">-- اختر نوع الهيكل --</option>
                  {bodyTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="color" className="block text-gray-700 font-medium mb-2">اللون <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  id="color"
                  name="color"
                  value={formValues.color}
                  onChange={handleChange}
                  required
                  placeholder="لون السيارة"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label htmlFor="vin" className="block text-gray-700 font-medium mb-2">رقم الهيكل (VIN) <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  id="vin"
                  name="vin"
                  value={formValues.vin}
                  onChange={handleChange}
                  required
                  placeholder="رقم الهيكل (VIN)"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="mileage" className="block text-gray-700 font-medium mb-2">عدد الكيلومترات <span className="text-red-500">*</span></label>
              <input 
                type="number"
                id="mileage"
                name="mileage"
                value={formValues.mileage}
                onChange={handleChange}
                required
                min="0"
                placeholder="عدد الكيلومترات"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* القسم الثالث: المواصفات الفنية للسيارة */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700 flex items-center">
              <Wrench size={20} className="ml-2 text-amber-600" />
              المواصفات الفنية للسيارة
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="engineType" className="block text-gray-700 font-medium mb-2">نوع المحرك <span className="text-red-500">*</span></label>
                <select 
                  id="engineType"
                  name="engineType"
                  value={formValues.engineType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">-- اختر نوع المحرك --</option>
                  {engineTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="engineSize" className="block text-gray-700 font-medium mb-2">حجم المحرك (لتر) <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  id="engineSize"
                  name="engineSize"
                  value={formValues.engineSize}
                  onChange={handleChange}
                  required
                  placeholder="مثال: 3.0"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label htmlFor="transmission" className="block text-gray-700 font-medium mb-2">ناقل الحركة <span className="text-red-500">*</span></label>
                <select 
                  id="transmission"
                  name="transmission"
                  value={formValues.transmission}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">-- اختر نوع ناقل الحركة --</option>
                  {transmissions.map(trans => (
                    <option key={trans.value} value={trans.value}>{trans.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label htmlFor="driveType" className="block text-gray-700 font-medium mb-2">نظام الدفع <span className="text-red-500">*</span></label>
                <select 
                  id="driveType"
                  name="driveType"
                  value={formValues.driveType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">-- اختر نظام الدفع --</option>
                  {driveTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="exteriorCondition" className="block text-gray-700 font-medium mb-2">حالة الهيكل الخارجي <span className="text-red-500">*</span></label>
                <select 
                  id="exteriorCondition"
                  name="exteriorCondition"
                  value={formValues.exteriorCondition}
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

              <div>
                <label htmlFor="interiorCondition" className="block text-gray-700 font-medium mb-2">حالة المقصورة الداخلية <span className="text-red-500">*</span></label>
                <select 
                  id="interiorCondition"
                  name="interiorCondition"
                  value={formValues.interiorCondition}
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

            <div className="mt-4">
              <label htmlFor="mechanicalCondition" className="block text-gray-700 font-medium mb-2">الحالة الميكانيكية <span className="text-red-500">*</span></label>
              <select 
                id="mechanicalCondition"
                name="mechanicalCondition"
                value={formValues.mechanicalCondition}
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

          {/* القسم الرابع: تاريخ السيارة وأصالتها */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700 flex items-center">
              <History size={20} className="ml-2 text-amber-600" />
              تاريخ السيارة وأصالتها
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="originalStatus" className="block text-gray-700 font-medium mb-2">حالة الأصالة <span className="text-red-500">*</span></label>
                <select 
                  id="originalStatus"
                  name="originalStatus"
                  value={formValues.originalStatus}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">-- اختر حالة الأصالة --</option>
                  {originalityStatuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="restorationDate" className="block text-gray-700 font-medium mb-2">تاريخ الترميم (إن وجد)</label>
                <input 
                  type="text"
                  id="restorationDate"
                  name="restorationDate"
                  value={formValues.restorationDate}
                  onChange={handleChange}
                  placeholder="مثال: 2015"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="previousOwners" className="block text-gray-700 font-medium mb-2">عدد المالكين السابقين</label>
                <input 
                  type="text"
                  id="previousOwners"
                  name="previousOwners"
                  value={formValues.previousOwners}
                  onChange={handleChange}
                  placeholder="عدد ومعلومات عن المالكين السابقين (إن وجدت)"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label htmlFor="carHistory" className="block text-gray-700 font-medium mb-2">تاريخ السيارة <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  id="carHistory"
                  name="carHistory"
                  value={formValues.carHistory}
                  onChange={handleChange}
                  required
                  placeholder="نبذة مختصرة عن تاريخ السيارة"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-gray-700 font-medium mb-2">المميزات الخاصة</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {allSpecialFeatures.map(feature => (
                  <div key={feature.value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`feature-${feature.value}`}
                      name="specialFeatures"
                      value={feature.value}
                      checked={formValues.specialFeatures.includes(feature.value)}
                      onChange={handleChange}
                      className="h-5 w-5 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
                    />
                    <label htmlFor={`feature-${feature.value}`} className="mr-2 text-gray-700">
                      {feature.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-gray-700 font-medium mb-2">الوثائق المتوفرة</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {documentTypes.map(doc => (
                  <div key={doc.value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`doc-${doc.value}`}
                      name="documents"
                      value={doc.value}
                      checked={formValues.documents.includes(doc.value)}
                      onChange={handleChange}
                      className="h-5 w-5 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
                    />
                    <label htmlFor={`doc-${doc.value}`} className="mr-2 text-gray-700">
                      {doc.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* القسم الخامس: الوصف والسعر */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700">وصف السيارة والسعر المتوقع</h3>
            
            <div>
              <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                وصف تفصيلي للسيارة <span className="text-red-500">*</span>
              </label>
              <textarea 
                id="description"
                name="description"
                value={formValues.description}
                onChange={handleChange}
                required
                rows={5}
                placeholder="اكتب وصفاً تفصيلياً للسيارة، تاريخها، خصائصها، ميزاتها..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              ></textarea>
              <p className="text-xs text-gray-500 mt-1">
                وصف دقيق وشامل يساعد على جذب المشترين وتسهيل عملية البيع
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label htmlFor="minPrice" className="block text-gray-700 font-medium mb-2">
                  الحد الأدنى المقبول (بالريال) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number"
                  id="minPrice"
                  name="minPrice"
                  value={formValues.minPrice}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="أقل سعر مقبول للبيع"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  سيكون هذا السعر مخفيًا عن المشترين
                </p>
              </div>

              <div>
                <label htmlFor="maxPrice" className="block text-gray-700 font-medium mb-2">
                  السعر المتوقع/المرغوب (بالريال) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number"
                  id="maxPrice"
                  name="maxPrice"
                  value={formValues.maxPrice}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="السعر المتوقع للسيارة"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  سيكون هذا السعر مخفيًا عن المشترين
                </p>
              </div>
            </div>
          </div>

          {/* القسم السادس: الصور والوثائق */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700">الصور وتقارير الفحص</h3>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                صور السيارة <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input 
                  type="file"
                  id="car-images"
                  onChange={handleImageChange}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <label htmlFor="car-images" className="cursor-pointer flex flex-col items-center">
                  <Upload size={40} className="text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-1">اسحب الصور هنا أو انقر للاختيار</p>
                  <p className="text-sm text-gray-500">يرجى تقديم صور عالية الدقة للسيارة من الخارج والداخل والمحرك (الحد الأدنى 5 صور)</p>
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {images ? `تم اختيار ${images.length} صورة` : 'لم يتم اختيار أي صور'}
              </p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                تقرير الفحص
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input 
                  type="file"
                  id="inspection-file"
                  onChange={handleInspectionFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                />
                <label htmlFor="inspection-file" className="cursor-pointer flex flex-col items-center">
                  <FileText size={40} className="text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-1">أرفق تقرير فحص السيارة</p>
                  <p className="text-sm text-gray-500">PDF أو صورة أو مستند Word</p>
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {inspectionFile ? `تم اختيار: ${inspectionFile.name}` : 'لم يتم اختيار أي ملف'}
              </p>
            </div>
          </div>

          {/* القسم السابع: الرسوم والعمولات */}
          <div className="bg-amber-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-2 flex items-center">
              <Info size={18} className="ml-2 text-amber-600" />
              الرسوم والعمولات
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex justify-between">
                <span>رسوم تسجيل السيارة الكلاسيكية:</span>
                <span className="font-medium">300 ريال (غير مستردة)</span>
              </li>
              <li className="flex justify-between">
                <span>عمولة البيع عبر المزاد:</span>
                <span className="font-medium">5% من سعر البيع النهائي</span>
              </li>
              <li className="flex justify-between">
                <span>رسوم الفحص والتقييم:</span>
                <span className="font-medium">تحدد حسب نوع وقيمة السيارة</span>
              </li>
            </ul>
          </div>

          {/* الموافقة على الشروط */}
          <div className="flex items-start mb-6">
            <input 
              type="checkbox"
              id="terms"
              required
              className="w-5 h-5 text-amber-600 rounded focus:ring-2 focus:ring-amber-500 mt-1"
            />
            <label htmlFor="terms" className="mr-2 text-gray-700">
              أؤكد أن المعلومات المقدمة صحيحة وأن لدي حق ملكية هذه السيارة، وأوافق على <Link href="/terms" className="text-amber-600 hover:underline">شروط وأحكام</Link> المنصة.
            </label>
          </div>

          {/* أزرار الإرسال والإلغاء */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </button>
            <Link 
              href="/auctions/auctions-special/classic-cars"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition text-center"
            >
              إلغاء
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 