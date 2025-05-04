/**
 * 📝 الصفحة: نموذج إدخال العقارات التجارية المميزة للمزاد
 * 📁 المسار: Frontend-local/app/forms/real-estate-auction-request/page.tsx
 * 
 * ✅ الوظيفة:
 * - صفحة لتسجيل بيانات العقارات التجارية المميزة والفاخرة للمزادات
 * - جمع المعلومات المفصلة عن العقار وموقعه ومواصفاته
 * - تحميل صور متعددة وتقارير التقييم العقاري
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Info, HelpCircle, X, MapPin, Building, Home } from 'lucide-react';

export default function RealEstateAuctionRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    ownerName: '',
    ownerPhone: '',
    title: '',
    category: 'realstate',
    propertyType: '',
    city: '',
    district: '',
    propertySize: '',
    buildingSize: '',
    propertyAge: '',
    floors: '',
    rooms: '',
    bathrooms: '',
    facadeType: '',
    parkingSpaces: '',
    specialFeatures: [] as string[],
    propertyStatus: '',
    legalStatus: '',
    amenities: [] as string[],
    description: '',
    minPrice: '',
    maxPrice: ''
  });

  const [images, setImages] = useState<FileList | null>(null);
  const [documents, setDocuments] = useState<File | null>(null);
  
  // أنواع العقارات التجارية
  const propertyTypes = [
    { value: 'commercial_building', label: 'مبنى تجاري' },
    { value: 'office_space', label: 'مساحة مكتبية' },
    { value: 'retail', label: 'محل تجاري' },
    { value: 'showroom', label: 'معرض' },
    { value: 'warehouse', label: 'مستودع' },
    { value: 'industrial', label: 'منشأة صناعية' },
    { value: 'land', label: 'أرض تجارية' },
    { value: 'apartment_building', label: 'مبنى سكني استثماري' },
    { value: 'hotel', label: 'فندق' },
    { value: 'mixed_use', label: 'متعدد الاستخدامات' },
    { value: 'other', label: 'أخرى' }
  ];

  // المدن
  const cities = [
    { value: 'riyadh', label: 'الرياض' },
    { value: 'jeddah', label: 'جدة' },
    { value: 'makkah', label: 'مكة المكرمة' },
    { value: 'madinah', label: 'المدينة المنورة' },
    { value: 'dammam', label: 'الدمام' },
    { value: 'khobar', label: 'الخبر' },
    { value: 'abha', label: 'أبها' },
    { value: 'taif', label: 'الطائف' },
    { value: 'jubail', label: 'الجبيل' },
    { value: 'tabuk', label: 'تبوك' },
    { value: 'other', label: 'مدينة أخرى' }
  ];

  // أنواع الواجهات
  const facadeTypes = [
    { value: 'north', label: 'شمالية' },
    { value: 'south', label: 'جنوبية' },
    { value: 'east', label: 'شرقية' },
    { value: 'west', label: 'غربية' },
    { value: 'north_east', label: 'شمالية شرقية' },
    { value: 'north_west', label: 'شمالية غربية' },
    { value: 'south_east', label: 'جنوبية شرقية' },
    { value: 'south_west', label: 'جنوبية غربية' },
    { value: 'multiple', label: 'متعددة الواجهات' },
    { value: 'main_street', label: 'على شارع رئيسي' }
  ];

  // حالة العقار
  const propertyStatuses = [
    { value: 'ready', label: 'جاهز للاستخدام' },
    { value: 'under_construction', label: 'قيد الإنشاء' },
    { value: 'needs_renovation', label: 'يحتاج إلى تجديد' },
    { value: 'shell_and_core', label: 'عظم' },
    { value: 'fully_furnished', label: 'مفروش بالكامل' },
    { value: 'partially_furnished', label: 'مفروش جزئياً' }
  ];

  // الحالة القانونية
  const legalStatuses = [
    { value: 'title_deed', label: 'صك ملكية كامل' },
    { value: 'leasehold', label: 'حق انتفاع' },
    { value: 'joint_ownership', label: 'ملكية مشتركة' },
    { value: 'mortgage', label: 'مرهون' },
    { value: 'commercial_license', label: 'رخصة تجارية' },
    { value: 'under_settlement', label: 'قيد التسوية القانونية' }
  ];

  // المرافق والمميزات
  const allAmenities = [
    { value: 'central_ac', label: 'تكييف مركزي' },
    { value: 'elevator', label: 'مصعد' },
    { value: 'security_system', label: 'نظام أمان' },
    { value: 'fire_system', label: 'نظام إطفاء حريق' },
    { value: 'parking', label: 'مواقف سيارات' },
    { value: 'backup_generator', label: 'مولد كهربائي احتياطي' },
    { value: 'high_speed_internet', label: 'إنترنت عالي السرعة' },
    { value: 'meeting_rooms', label: 'قاعات اجتماعات' },
    { value: 'reception', label: 'استقبال' },
    { value: 'cafeteria', label: 'كافتيريا' },
    { value: 'gym', label: 'صالة رياضية' },
    { value: 'garden', label: 'حديقة' },
    { value: 'loading_dock', label: 'منصة تحميل' },
    { value: 'storage', label: 'مساحة تخزين' }
  ];

  // المميزات الخاصة
  const allSpecialFeatures = [
    { value: 'corner', label: 'موقع زاوية' },
    { value: 'main_street', label: 'على شارع رئيسي' },
    { value: 'sea_view', label: 'إطلالة بحرية' },
    { value: 'city_center', label: 'وسط المدينة' },
    { value: 'near_metro', label: 'قرب المترو' },
    { value: 'near_mall', label: 'قرب مركز تسوق' },
    { value: 'smart_building', label: 'مبنى ذكي' },
    { value: 'green_building', label: 'مبنى صديق للبيئة' },
    { value: 'historical', label: 'قيمة تاريخية' }
  ];

  // وظيفة معالجة التغييرات في حقول النموذج
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'amenities' || name === 'specialFeatures') {
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

  // وظيفة معالجة تحميل الوثائق
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDocuments(e.target.files[0]);
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
    formData.append('category', 'realstate');
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

    // إضافة الوثائق
    if (documents) {
      formData.append('inspection_report', documents);
    } else {
      formData.append('inspection_report', '');
    }

    // إضافة البيانات التفصيلية كمعلومات إضافية
    const additionalInfo = {
      ownerName: formValues.ownerName,
      ownerPhone: formValues.ownerPhone,
      propertyType: formValues.propertyType,
      city: formValues.city,
      district: formValues.district,
      propertySize: formValues.propertySize,
      buildingSize: formValues.buildingSize,
      propertyAge: formValues.propertyAge,
      floors: formValues.floors,
      rooms: formValues.rooms,
      bathrooms: formValues.bathrooms,
      facadeType: formValues.facadeType,
      parkingSpaces: formValues.parkingSpaces,
      specialFeatures: formValues.specialFeatures,
      propertyStatus: formValues.propertyStatus,
      legalStatus: formValues.legalStatus,
      amenities: formValues.amenities
    };

    formData.append('additional_info', JSON.stringify(additionalInfo));

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('تم إرسال بيانات العقار بنجاح');
        // إعادة تعيين النموذج
        setFormValues({
          ownerName: '',
          ownerPhone: '',
          title: '',
          category: 'realstate',
          propertyType: '',
          city: '',
          district: '',
          propertySize: '',
          buildingSize: '',
          propertyAge: '',
          floors: '',
          rooms: '',
          bathrooms: '',
          facadeType: '',
          parkingSpaces: '',
          specialFeatures: [] as string[],
          propertyStatus: '',
          legalStatus: '',
          amenities: [] as string[],
          description: '',
          minPrice: '',
          maxPrice: ''
        });
        setImages(null);
        setDocuments(null);
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 py-6 rounded-t-lg">
        <div className="container mx-auto px-4">
          <Link 
            href="/auctions/auctions-special/realstate" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى سوق العقارات التجارية المميزة</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">تسجيل عقار تجاري للمزاد</h1>
          <p className="text-white/80 mt-2">
            سجل عقارك التجاري في منصتنا وانضم إلى سوق العقارات المميزة لتصل إلى المستثمرين المهتمين
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 rounded-b-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">معلومات العقار التجاري</h2>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* القسم الأول: معلومات المالك */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700 flex items-center">
              <Info size={20} className="ml-2 text-blue-600" />
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* القسم الثاني: معلومات العقار الأساسية */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700 flex items-center">
              <Building size={20} className="ml-2 text-blue-600" />
              المعلومات الأساسية للعقار
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
                placeholder="وصف مختصر وجذاب للعقار (مثال: مبنى تجاري فاخر في وسط الرياض)"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="propertyType" className="block text-gray-700 font-medium mb-2">نوع العقار <span className="text-red-500">*</span></label>
                <select 
                  id="propertyType"
                  name="propertyType"
                  value={formValues.propertyType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- اختر نوع العقار --</option>
                  {propertyTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="legalStatus" className="block text-gray-700 font-medium mb-2">الحالة القانونية <span className="text-red-500">*</span></label>
                <select 
                  id="legalStatus"
                  name="legalStatus"
                  value={formValues.legalStatus}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- اختر الحالة القانونية --</option>
                  {legalStatuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="city" className="block text-gray-700 font-medium mb-2">المدينة <span className="text-red-500">*</span></label>
                <select 
                  id="city"
                  name="city"
                  value={formValues.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- اختر المدينة --</option>
                  {cities.map(city => (
                    <option key={city.value} value={city.value}>{city.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="district" className="block text-gray-700 font-medium mb-2">الحي <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  id="district"
                  name="district"
                  value={formValues.district}
                  onChange={handleChange}
                  required
                  placeholder="اسم الحي"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* القسم الثالث: مواصفات العقار التفصيلية */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700 flex items-center">
              <Home size={20} className="ml-2 text-blue-600" />
              مواصفات العقار التفصيلية
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="propertySize" className="block text-gray-700 font-medium mb-2">مساحة الأرض (م²) <span className="text-red-500">*</span></label>
                <input 
                  type="number"
                  id="propertySize"
                  name="propertySize"
                  value={formValues.propertySize}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="مساحة الأرض بالمتر المربع"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="buildingSize" className="block text-gray-700 font-medium mb-2">مساحة البناء (م²)</label>
                <input 
                  type="number"
                  id="buildingSize"
                  name="buildingSize"
                  value={formValues.buildingSize}
                  onChange={handleChange}
                  min="1"
                  placeholder="مساحة البناء بالمتر المربع"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="propertyAge" className="block text-gray-700 font-medium mb-2">عمر العقار (سنوات)</label>
                <input 
                  type="number"
                  id="propertyAge"
                  name="propertyAge"
                  value={formValues.propertyAge}
                  onChange={handleChange}
                  min="0"
                  placeholder="عمر العقار بالسنوات"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label htmlFor="floors" className="block text-gray-700 font-medium mb-2">عدد الطوابق</label>
                <input 
                  type="number"
                  id="floors"
                  name="floors"
                  value={formValues.floors}
                  onChange={handleChange}
                  min="1"
                  placeholder="عدد الطوابق"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="rooms" className="block text-gray-700 font-medium mb-2">عدد الغرف</label>
                <input 
                  type="number"
                  id="rooms"
                  name="rooms"
                  value={formValues.rooms}
                  onChange={handleChange}
                  min="0"
                  placeholder="عدد الغرف/المكاتب"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="bathrooms" className="block text-gray-700 font-medium mb-2">عدد دورات المياه</label>
                <input 
                  type="number"
                  id="bathrooms"
                  name="bathrooms"
                  value={formValues.bathrooms}
                  onChange={handleChange}
                  min="0"
                  placeholder="عدد دورات المياه"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label htmlFor="facadeType" className="block text-gray-700 font-medium mb-2">الواجهة</label>
                <select 
                  id="facadeType"
                  name="facadeType"
                  value={formValues.facadeType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- اختر الواجهة --</option>
                  {facadeTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="parkingSpaces" className="block text-gray-700 font-medium mb-2">عدد مواقف السيارات</label>
                <input 
                  type="number"
                  id="parkingSpaces"
                  name="parkingSpaces"
                  value={formValues.parkingSpaces}
                  onChange={handleChange}
                  min="0"
                  placeholder="عدد مواقف السيارات"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="propertyStatus" className="block text-gray-700 font-medium mb-2">حالة العقار <span className="text-red-500">*</span></label>
                <select 
                  id="propertyStatus"
                  name="propertyStatus"
                  value={formValues.propertyStatus}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- اختر حالة العقار --</option>
                  {propertyStatuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* القسم الرابع: المرافق والمميزات */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700">المرافق والمميزات</h3>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">المرافق المتوفرة</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {allAmenities.map(amenity => (
                  <div key={amenity.value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`amenity-${amenity.value}`}
                      name="amenities"
                      value={amenity.value}
                      checked={formValues.amenities.includes(amenity.value)}
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor={`amenity-${amenity.value}`} className="mr-2 text-gray-700">
                      {amenity.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
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
                      className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor={`feature-${feature.value}`} className="mr-2 text-gray-700">
                      {feature.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* القسم الخامس: وصف العقار */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700">وصف العقار</h3>
            
            <div>
              <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                وصف تفصيلي للعقار <span className="text-red-500">*</span>
              </label>
              <textarea 
                id="description"
                name="description"
                value={formValues.description}
                onChange={handleChange}
                required
                rows={5}
                placeholder="اكتب وصفاً تفصيلياً للعقار، موقعه المميز، خصائصه، ميزاته الاستثمارية..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
              <p className="text-xs text-gray-500 mt-1">
                وصف دقيق وشامل يساعد على جذب المستثمرين وتسهيل عملية البيع
              </p>
            </div>
          </div>

          {/* القسم السادس: السعر */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700">السعر المتوقع</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  placeholder="السعر المتوقع للعقار"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  سيكون هذا السعر مخفيًا عن المشترين
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 italic mt-4">
              * سيتم تحديد سعر الافتتاح من قبل غرفة التحكم بعد مراجعة العقار
            </p>
          </div>

          {/* القسم السابع: الصور والوثائق */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700">الصور والوثائق</h3>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                صور العقار <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input 
                  type="file"
                  id="property-images"
                  onChange={handleImageChange}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <label htmlFor="property-images" className="cursor-pointer flex flex-col items-center">
                  <Upload size={40} className="text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-1">اسحب الصور هنا أو انقر للاختيار</p>
                  <p className="text-sm text-gray-500">يرجى تقديم صور عالية الدقة للعقار من الداخل والخارج (الحد الأدنى 3 صور)</p>
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {images ? `تم اختيار ${images.length} صورة` : 'لم يتم اختيار أي صور'}
              </p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                الوثائق (صك الملكية، مخططات، تقارير)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input 
                  type="file"
                  id="property-documents"
                  onChange={handleDocumentChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                />
                <label htmlFor="property-documents" className="cursor-pointer flex flex-col items-center">
                  <Upload size={40} className="text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-1">أرفق وثائق العقار</p>
                  <p className="text-sm text-gray-500">PDF أو صور أو مستندات Word</p>
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {documents ? `تم اختيار: ${documents.name}` : 'لم يتم اختيار أي ملف'}
              </p>
            </div>
          </div>

          {/* القسم الثامن: الرسوم والعمولات */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-2 flex items-center">
              <Info size={18} className="ml-2 text-blue-600" />
              الرسوم والعمولات
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex justify-between">
                <span>رسوم تسجيل العقار:</span>
                <span className="font-medium">500 ريال (غير مستردة)</span>
              </li>
              <li className="flex justify-between">
                <span>عمولة البيع عبر المزاد:</span>
                <span className="font-medium">2.5% من سعر البيع النهائي</span>
              </li>
              <li className="flex justify-between">
                <span>رسوم التقييم العقاري:</span>
                <span className="font-medium">تحدد حسب نوع وقيمة العقار</span>
              </li>
            </ul>
          </div>

          {/* الموافقة على الشروط */}
          <div className="flex items-start mb-6">
            <input 
              type="checkbox"
              id="terms"
              required
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-1"
            />
            <label htmlFor="terms" className="mr-2 text-gray-700">
              أؤكد أن المعلومات المقدمة صحيحة وأن لدي حق ملكية هذا العقار، وأوافق على <Link href="/terms" className="text-blue-600 hover:underline">شروط وأحكام</Link> المنصة.
            </label>
          </div>

          {/* أزرار الإرسال والإلغاء */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </button>
            <Link 
              href="/auctions/auctions-special/realstate"
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