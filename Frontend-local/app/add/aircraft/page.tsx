/**
 * 📝 الصفحة: تسجيل بيانات الطائرات 
 * 📁 المسار: Frontend-local/app/add/aircraft/page.tsx
 *
 * ✅ الوظيفة:
 * - نموذج إدخال بيانات شامل لتسجيل الطائرات الخاصة والتجارية للمزادات
 * - جمع المعلومات الفنية التفصيلية وفق معايير الطيران
 * - تحميل الصور والوثائق المطلوبة
 * - التحقق من صحة البيانات وإرسالها للتقييم
 * 
 * 🔄 الارتباط:
 * - مرتبط بصفحة مزادات الطائرات /auctions/auctions-special/jets
 * - يرسل البيانات إلى API لإدارة المزادات
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Upload, Info, Plane } from 'lucide-react';

export default function AircraftRegistrationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // نموذج معلومات الطائرة
  const [formData, setFormData] = useState({
    // بيانات أساسية
    type: 'jet', // jet, turboprop, piston, helicopter, glider
    title: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    year: new Date().getFullYear(),
    
    // المواصفات الفنية
    engine_make: '',
    engine_model: '',
    engine_count: 2,
    engine_hours: '',
    total_time: '',
    last_inspection: '',
    max_altitude: '',
    cruise_speed: '',
    fuel_capacity: '',
    range: '',
    
    // التجهيزات والمقصورة
    seating_capacity: '',
    cabin_configuration: '',
    cabin_amenities: '',
    avionics: '',
    exterior_condition: 'excellent',
    interior_condition: 'excellent',
    
    // المعلومات الوصفية
    description: '',
    full_description: '',
    location: '',
    registration_country: '',
    registration_number: '',
    
    // معلومات المزاد
    asking_price: '',
    reserve_price: '',
    
    // معلومات الاتصال
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    
    // معلومات تكميلية
    airworthiness_certificate: '',
    registration_status: 'current',
    maintenance_history: '',
    damage_history: '',
    modifications: '',
    
    // المعاينة
    inspection_location: '',
    inspection_availability: '',
    demo_flight_available: false,
  });

  // تحديث قيم النموذج
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // محاكاة تحميل الصور
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length + images.length <= 10) {
      // في التطبيق الحقيقي، سيتم تحميل الصور إلى الخادم
      // هنا نقوم بمحاكاة ذلك عن طريق إنشاء عناوين URL وهمية
      const newImages = [...images];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target && typeof e.target.result === 'string') {
            newImages.push(e.target.result);
            setImages([...newImages]);
          }
        };
        reader.readAsDataURL(file);
      }
    } else {
      setMessage({ type: 'error', text: 'يمكنك تحميل 10 صور كحد أقصى' });
    }
  };

  // حذف صورة
  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  // محاكاة تحميل المستندات
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // في التطبيق الحقيقي، سيتم تحميل المستندات إلى الخادم
      const newDocs = [...documents];
      for (let i = 0; i < files.length; i++) {
        newDocs.push(`وثيقة ${documents.length + i + 1} - ${files[i].name}`);
      }
      setDocuments(newDocs);
    }
  };

  // حذف مستند
  const removeDocument = (indexToRemove: number) => {
    setDocuments(documents.filter((_, index) => index !== indexToRemove));
  };

  // التنقل بين الخطوات
  const goToNextStep = () => {
    // يمكن إضافة التحقق من صحة البيانات قبل الانتقال للخطوة التالية
    setCurrentStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const goToPrevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  // إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من الحد الأدنى للصور
    if (images.length < 3) {
      setMessage({ type: 'error', text: 'يجب إضافة 3 صور على الأقل' });
      return;
    }

    setIsSubmitting(true);

    // تجميع البيانات لإرسالها للخادم
    const aircraftData = {
      ...formData,
      images: images,
      documents: documents,
    };

    try {
      // في التطبيق الحقيقي، نرسل البيانات إلى API باستخدام fetch
      console.log('Submitting aircraft data:', aircraftData);
      
      // محاكاة الاستجابة من الخادم
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage({ 
        type: 'success', 
        text: 'تم تسجيل بيانات الطائرة بنجاح! سيتم مراجعتها وإضافتها للمزادات قريباً.' 
      });
      
      // إعادة توجيه المستخدم بعد فترة قصيرة
      setTimeout(() => {
        router.push('/auctions/auctions-special/jets');
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting aircraft data:', error);
      setMessage({ 
        type: 'error', 
        text: 'حدث خطأ أثناء تسجيل بيانات الطائرة. يرجى المحاولة مرة أخرى.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 py-6">
        <div className="container mx-auto px-4">
          <Link 
            href="/auctions/auctions-special/jets" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى سوق الطائرات النفاثة المستعملة</span>
          </Link>
          <h1 className="text-3xl font-bold text-white text-center">تسجيل طائرة للمزاد</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
          {message && (
            <div 
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* مؤشر الخطوات */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-cyan-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${currentStep >= 1 ? 'bg-cyan-600' : 'bg-gray-300'}`}>1</div>
                <span className="mt-2 text-sm">المعلومات الأساسية</span>
              </div>
              <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-cyan-600' : 'bg-gray-300'}`}></div>
              <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-cyan-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${currentStep >= 2 ? 'bg-cyan-600' : 'bg-gray-300'}`}>2</div>
                <span className="mt-2 text-sm">المواصفات الفنية</span>
              </div>
              <div className={`flex-1 h-1 mx-2 ${currentStep >= 3 ? 'bg-cyan-600' : 'bg-gray-300'}`}></div>
              <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-cyan-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${currentStep >= 3 ? 'bg-cyan-600' : 'bg-gray-300'}`}>3</div>
                <span className="mt-2 text-sm">الصور والمستندات</span>
              </div>
              <div className={`flex-1 h-1 mx-2 ${currentStep >= 4 ? 'bg-cyan-600' : 'bg-gray-300'}`}></div>
              <div className={`flex flex-col items-center ${currentStep >= 4 ? 'text-cyan-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${currentStep >= 4 ? 'bg-cyan-600' : 'bg-gray-300'}`}>4</div>
                <span className="mt-2 text-sm">معلومات المزاد</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* الخطوة 1: المعلومات الأساسية */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">المعلومات الأساسية</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="type" className="block text-gray-700 mb-2">نوع الطائرة *</label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    >
                      <option value="jet">طائرة نفاثة</option>
                      <option value="turboprop">توربينية</option>
                      <option value="piston">مكبسية</option>
                      <option value="helicopter">هليكوبتر</option>
                      <option value="glider">شراعية</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="title" className="block text-gray-700 mb-2">عنوان الطائرة *</label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="مثال: إمبراير ليغاسي 450 بحالة ممتازة"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="manufacturer" className="block text-gray-700 mb-2">الشركة المصنعة *</label>
                    <input
                      id="manufacturer"
                      name="manufacturer"
                      type="text"
                      value={formData.manufacturer}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="model" className="block text-gray-700 mb-2">الطراز *</label>
                    <input
                      id="model"
                      name="model"
                      type="text"
                      value={formData.model}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="serial_number" className="block text-gray-700 mb-2">الرقم التسلسلي *</label>
                    <input
                      id="serial_number"
                      name="serial_number"
                      type="text"
                      value={formData.serial_number}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="year" className="block text-gray-700 mb-2">سنة الصنع *</label>
                    <input
                      id="year"
                      name="year"
                      type="number"
                      min="1950"
                      max={new Date().getFullYear()}
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="registration_country" className="block text-gray-700 mb-2">بلد التسجيل *</label>
                    <input
                      id="registration_country"
                      name="registration_country"
                      type="text"
                      value={formData.registration_country}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="registration_number" className="block text-gray-700 mb-2">رقم التسجيل *</label>
                    <input
                      id="registration_number"
                      name="registration_number"
                      type="text"
                      value={formData.registration_number}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="location" className="block text-gray-700 mb-2">موقع الطائرة *</label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="المدينة، المطار"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label htmlFor="description" className="block text-gray-700 mb-2">وصف مختصر *</label>
                  <input
                    id="description"
                    name="description"
                    type="text"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="وصف مختصر للطائرة (سيظهر في صفحة المزادات)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                    required
                  />
                </div>
                
                <div className="mt-6">
                  <label htmlFor="full_description" className="block text-gray-700 mb-2">الوصف التفصيلي *</label>
                  <textarea
                    id="full_description"
                    name="full_description"
                    value={formData.full_description}
                    onChange={handleChange}
                    rows={5}
                    placeholder="اذكر جميع المعلومات المهمة عن الطائرة، مثل المميزات، تاريخ الصيانة، التعديلات..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                    required
                  ></textarea>
                </div>
                
                <div className="flex justify-end mt-8">
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition"
                  >
                    التالي: المواصفات الفنية
                  </button>
                </div>
              </div>
            )}

            {/* الخطوة 2: المواصفات الفنية */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">المواصفات الفنية</h2>
                
                <h3 className="text-lg font-semibold text-gray-700 mb-4">المحرك والأداء</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="engine_make" className="block text-gray-700 mb-2">شركة تصنيع المحرك *</label>
                    <input
                      id="engine_make"
                      name="engine_make"
                      type="text"
                      value={formData.engine_make}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="engine_model" className="block text-gray-700 mb-2">طراز المحرك *</label>
                    <input
                      id="engine_model"
                      name="engine_model"
                      type="text"
                      value={formData.engine_model}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="engine_count" className="block text-gray-700 mb-2">عدد المحركات *</label>
                    <input
                      id="engine_count"
                      name="engine_count"
                      type="number"
                      min="1"
                      value={formData.engine_count}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="engine_hours" className="block text-gray-700 mb-2">عدد ساعات تشغيل المحرك *</label>
                    <input
                      id="engine_hours"
                      name="engine_hours"
                      type="number"
                      min="0"
                      value={formData.engine_hours}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="total_time" className="block text-gray-700 mb-2">إجمالي ساعات الطيران *</label>
                    <input
                      id="total_time"
                      name="total_time"
                      type="number"
                      min="0"
                      value={formData.total_time}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="last_inspection" className="block text-gray-700 mb-2">تاريخ آخر فحص *</label>
                    <input
                      id="last_inspection"
                      name="last_inspection"
                      type="date"
                      value={formData.last_inspection}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-700 mb-4 mt-8">مواصفات الأداء</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="max_altitude" className="block text-gray-700 mb-2">أقصى ارتفاع (قدم)</label>
                    <input
                      id="max_altitude"
                      name="max_altitude"
                      type="number"
                      min="0"
                      value={formData.max_altitude}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="cruise_speed" className="block text-gray-700 mb-2">سرعة الإبحار (عقدة)</label>
                    <input
                      id="cruise_speed"
                      name="cruise_speed"
                      type="number"
                      min="0"
                      value={formData.cruise_speed}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="range" className="block text-gray-700 mb-2">المدى (ميل بحري)</label>
                    <input
                      id="range"
                      name="range"
                      type="number"
                      min="0"
                      value={formData.range}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="fuel_capacity" className="block text-gray-700 mb-2">سعة الوقود (لتر)</label>
                    <input
                      id="fuel_capacity"
                      name="fuel_capacity"
                      type="number"
                      min="0"
                      value={formData.fuel_capacity}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                    />
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-700 mb-4 mt-8">المقصورة والتجهيزات</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="seating_capacity" className="block text-gray-700 mb-2">سعة المقاعد *</label>
                    <input
                      id="seating_capacity"
                      name="seating_capacity"
                      type="number"
                      min="1"
                      value={formData.seating_capacity}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="cabin_configuration" className="block text-gray-700 mb-2">تكوين المقصورة</label>
                    <input
                      id="cabin_configuration"
                      name="cabin_configuration"
                      type="text"
                      value={formData.cabin_configuration}
                      onChange={handleChange}
                      placeholder="مثال: مقاعد تنفيذية، صالون، غرفة اجتماعات"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="cabin_amenities" className="block text-gray-700 mb-2">ميزات المقصورة</label>
                    <textarea
                      id="cabin_amenities"
                      name="cabin_amenities"
                      value={formData.cabin_amenities}
                      onChange={handleChange}
                      placeholder="مثال: واي فاي، نظام ترفيهي، مطبخ، ثلاجة..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="avionics" className="block text-gray-700 mb-2">أنظمة الملاحة والإلكترونيات</label>
                    <textarea
                      id="avionics"
                      name="avionics"
                      value={formData.avionics}
                      onChange={handleChange}
                      placeholder="مثال: رادار طقس، نظام الطيار الآلي، نظام تحديد المواقع..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="exterior_condition" className="block text-gray-700 mb-2">حالة الطلاء الخارجي *</label>
                    <select
                      id="exterior_condition"
                      name="exterior_condition"
                      value={formData.exterior_condition}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    >
                      <option value="new">جديد</option>
                      <option value="excellent">ممتاز</option>
                      <option value="good">جيد</option>
                      <option value="fair">متوسط</option>
                      <option value="poor">يحتاج صيانة</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="interior_condition" className="block text-gray-700 mb-2">حالة المقصورة الداخلية *</label>
                    <select
                      id="interior_condition"
                      name="interior_condition"
                      value={formData.interior_condition}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    >
                      <option value="new">جديدة</option>
                      <option value="excellent">ممتازة</option>
                      <option value="good">جيدة</option>
                      <option value="fair">متوسطة</option>
                      <option value="poor">تحتاج تجديد</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg transition"
                  >
                    السابق: المعلومات الأساسية
                  </button>
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition"
                  >
                    التالي: الصور والمستندات
                  </button>
                </div>
              </div>
            )}

            {/* الخطوة 3: الصور والوثائق */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">الصور والوثائق</h2>
                
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-blue-800 flex items-start">
                  <Info size={24} className="ml-2 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">إرشادات تحميل الصور:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>يجب تحميل 3 صور على الأقل، والحد الأقصى 10 صور.</li>
                      <li>يُفضل صور بدقة عالية (لا تقل عن 1920×1080 بكسل) وبحجم لا يتجاوز 5 ميجابايت للصورة.</li>
                      <li>تأكد من تضمين صور خارجية للطائرة من زوايا مختلفة.</li>
                      <li>أضف صوراً داخلية توضح المقصورة وقمرة القيادة.</li>
                      <li>إذا كانت الطائرة بها أي ضرر أو عيوب، قم بتصويرها بوضوح.</li>
                    </ul>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-700 mb-4">صور الطائرة *</h3>
                
                <div className="flex flex-wrap gap-4 mb-8">
                  {images.map((image, index) => (
                    <div key={index} className="relative w-40 h-40 rounded-md overflow-hidden bg-gray-100">
                      <img 
                        src={image} 
                        alt={`صورة الطائرة ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <button 
                        type="button" 
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        title="حذف الصورة"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  
                  {images.length < 10 && (
                    <label className="w-40 h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                      <Upload size={24} className="text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">{images.length === 0 ? 'أضف صوراً' : 'أضف المزيد'}</span>
                      <span className="text-xs text-gray-400 mt-1">{images.length}/10 صور</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-700 mb-4">وثائق الطائرة</h3>
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-blue-800 text-sm">
                  <p>يمكنك تحميل المستندات المهمة مثل شهادة الصلاحية، سجل الصيانة، شهادة التسجيل، الخ.</p>
                </div>
                
                <div className="flex flex-col gap-4 mb-8">
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span>{doc}</span>
                      <button 
                        type="button" 
                        onClick={() => removeDocument(index)}
                        className="text-red-500 hover:text-red-700"
                        title="حذف المستند"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  
                  <label className="flex items-center justify-center gap-2 p-4 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <Upload size={20} className="text-gray-400" />
                    <span className="text-gray-500">تحميل مستندات (PDF, DOC)</span>
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx" 
                      multiple 
                      className="hidden" 
                      onChange={handleDocumentUpload}
                    />
                  </label>
                </div>
                
                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg transition"
                  >
                    السابق: المواصفات الفنية
                  </button>
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition"
                  >
                    التالي: معلومات المزاد
                  </button>
                </div>
              </div>
            )}

            {/* الخطوة 4: معلومات المزاد */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">معلومات المزاد ومعلومات الاتصال</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="asking_price" className="block text-gray-700 mb-2">السعر المطلوب (ريال) *</label>
                    <input
                      id="asking_price"
                      name="asking_price"
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.asking_price}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="reserve_price" className="block text-gray-700 mb-2">
                      <span>السعر الاحتياطي (ريال)</span>
                      <span className="text-sm text-gray-500 mr-2">(اختياري - أقل سعر مقبول للبيع)</span>
                    </label>
                    <input
                      id="reserve_price"
                      name="reserve_price"
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.reserve_price}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-700 mb-4 mt-8">معلومات المعاينة</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="inspection_location" className="block text-gray-700 mb-2">موقع المعاينة *</label>
                    <input
                      id="inspection_location"
                      name="inspection_location"
                      type="text"
                      value={formData.inspection_location}
                      onChange={handleChange}
                      placeholder="المدينة، المطار، الهنجر"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="inspection_availability" className="block text-gray-700 mb-2">أوقات المعاينة المتاحة *</label>
                    <input
                      id="inspection_availability"
                      name="inspection_availability"
                      type="text"
                      value={formData.inspection_availability}
                      onChange={handleChange}
                      placeholder="مثال: الأيام، الساعات المتاحة"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="demo_flight_available"
                      name="demo_flight_available"
                      type="checkbox"
                      checked={formData.demo_flight_available as boolean}
                      onChange={handleChange}
                      className="h-5 w-5 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                    />
                    <label htmlFor="demo_flight_available" className="mr-2 block text-gray-700">
                      إمكانية إجراء رحلة تجريبية للمشتري الجاد
                    </label>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-700 mb-4 mt-8">معلومات تكميلية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="airworthiness_certificate" className="block text-gray-700 mb-2">حالة شهادة الصلاحية *</label>
                    <input
                      id="airworthiness_certificate"
                      name="airworthiness_certificate"
                      type="text"
                      value={formData.airworthiness_certificate}
                      onChange={handleChange}
                      placeholder="مثال: سارية حتى (التاريخ)..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="registration_status" className="block text-gray-700 mb-2">حالة التسجيل *</label>
                    <select
                      id="registration_status"
                      name="registration_status"
                      value={formData.registration_status}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    >
                      <option value="current">سارٍ</option>
                      <option value="expired">منتهي</option>
                      <option value="pending">قيد الإجراء</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="maintenance_history" className="block text-gray-700 mb-2">سجل الصيانة</label>
                    <textarea
                      id="maintenance_history"
                      name="maintenance_history"
                      value={formData.maintenance_history}
                      onChange={handleChange}
                      rows={3}
                      placeholder="وصف موجز لتاريخ الصيانة والإصلاحات الرئيسية"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="damage_history" className="block text-gray-700 mb-2">تاريخ الأضرار (إن وجدت)</label>
                    <textarea
                      id="damage_history"
                      name="damage_history"
                      value={formData.damage_history}
                      onChange={handleChange}
                      rows={3}
                      placeholder="أي حوادث أو أضرار تعرضت لها الطائرة وتم إصلاحها"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                    ></textarea>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-700 mb-4 mt-8">معلومات الاتصال *</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="contact_name" className="block text-gray-700 mb-2">الاسم *</label>
                    <input
                      id="contact_name"
                      name="contact_name"
                      type="text"
                      value={formData.contact_name}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="contact_phone" className="block text-gray-700 mb-2">رقم الهاتف *</label>
                    <input
                      id="contact_phone"
                      name="contact_phone"
                      type="tel"
                      value={formData.contact_phone}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="contact_email" className="block text-gray-700 mb-2">البريد الإلكتروني *</label>
                    <input
                      id="contact_email"
                      name="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-4">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      required
                      className="h-5 w-5 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                    />
                    <label htmlFor="terms" className="mr-2 block text-gray-700">
                      أقر بأن جميع المعلومات المقدمة صحيحة ودقيقة، وأوافق على شروط وأحكام المزاد
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg transition"
                  >
                    السابق: الصور والمستندات
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-3 rounded-lg font-medium ${
                      isSubmitting
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    } transition-colors`}
                  >
                    {isSubmitting ? 'جاري تسجيل البيانات...' : 'تسجيل البيانات'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
} 