'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Upload } from 'lucide-react';

export default function RegisterCaravanPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [currentFeature, setCurrentFeature] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // نموذج معلومات الكرفان
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: 2023,
    title: '',
    description: '',
    full_description: '',
    length: '',
    width: '',
    height: '',
    weight: '',
    engine: '',
    fuel: '',
    transmission: '',
    drive: '',
    mileage: '',
    capacity: '',
    location: '',
    condition: 'excellent',
    evaluation_price: ''
  });

  // تحديث قيم النموذج
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // إضافة ميزة جديدة
  const addFeature = () => {
    if (currentFeature && !features.includes(currentFeature)) {
      setFeatures([...features, currentFeature]);
      setCurrentFeature('');
    }
  };

  // حذف ميزة
  const removeFeature = (featureToRemove: string) => {
    setFeatures(features.filter(feature => feature !== featureToRemove));
  };

  // محاكاة تحميل الصور
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // في التطبيق الحقيقي، سيتم تحميل الصور إلى الخادم
      // هنا نقوم بمحاكاة ذلك عن طريق إنشاء عناوين URL وهمية
      const newImages = [...images];
      for (let i = 0; i < files.length; i++) {
        const fakeImageUrl = `/auctionsPIC/car-caravanPIC/caravan-${images.length + i + 1}.jpg`;
        newImages.push(fakeImageUrl);
      }
      setImages(newImages);
    }
  };

  // حذف صورة
  const removeImage = (imageToRemove: string) => {
    setImages(images.filter(image => image !== imageToRemove));
  };

  // إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (images.length === 0) {
      setMessage({ type: 'error', text: 'يجب إضافة صورة واحدة على الأقل' });
      return;
    }

    if (features.length === 0) {
      setMessage({ type: 'error', text: 'يجب إضافة ميزة واحدة على الأقل' });
      return;
    }

    setIsSubmitting(true);

    // تجميع البيانات لإرسالها للخادم
    const caravanData = {
      ...formData,
      features: features,
      images: images,
    };

    try {
      // في التطبيق الحقيقي، نرسل البيانات إلى API باستخدام fetch
      const response = await fetch('/api/caravans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(caravanData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'حدث خطأ أثناء تسجيل الكرفان');
      }
      
      setMessage({ 
        type: 'success', 
        text: 'تم تسجيل الكرفان بنجاح! سيتم مراجعته وإضافته للمزادات قريباً.' 
      });
      
      // إعادة تعيين النموذج بعد الإرسال الناجح
      setFormData({
        make: '',
        model: '',
        year: 2023,
        title: '',
        description: '',
        full_description: '',
        length: '',
        width: '',
        height: '',
        weight: '',
        engine: '',
        fuel: '',
        transmission: '',
        drive: '',
        mileage: '',
        capacity: '',
        location: '',
        condition: 'excellent',
        evaluation_price: ''
      });
      setFeatures([]);
      setImages([]);
      
      // إعادة توجيه المستخدم بعد فترة قصيرة
      setTimeout(() => {
        router.push('/auctions/auctions-2car/caravan');
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting caravan:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الكرفان. يرجى المحاولة مرة أخرى.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-green-400 to-green-500 py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-start mb-4">
            <Link 
              href="/auctions/auctions-2car/caravan" 
              className="flex items-center text-white hover:text-white/90 transition"
            >
              <ArrowLeft size={20} className="ml-2" />
              <span>العودة إلى سوق الكرفانات</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-white text-center">تسجيل كرفان للسوق</h1>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* معلومات أساسية */}
              <div className="md:col-span-3">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">المعلومات الأساسية</h2>
              </div>
              
              <div>
                <label htmlFor="title" className="block text-gray-700 mb-2">عنوان الكرفان *</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="make" className="block text-gray-700 mb-2">الشركة المصنعة *</label>
                <input
                  id="make"
                  name="make"
                  type="text"
                  value={formData.make}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="model" className="block text-gray-700 mb-2">الموديل *</label>
                <input
                  id="model"
                  name="model"
                  type="text"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="year" className="block text-gray-700 mb-2">سنة الصنع *</label>
                <input
                  id="year"
                  name="year"
                  type="number"
                  min="1990"
                  max="2030"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="condition" className="block text-gray-700 mb-2">الحالة *</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                  required
                >
                  <option value="new">جديد</option>
                  <option value="excellent">ممتاز</option>
                  <option value="good">جيد</option>
                  <option value="fair">متوسط</option>
                  <option value="poor">ضعيف</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="location" className="block text-gray-700 mb-2">الموقع *</label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                  required
                />
              </div>

              <div className="md:col-span-3">
                <label htmlFor="description" className="block text-gray-700 mb-2">وصف مختصر *</label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="وصف مختصر للكرفان (يظهر في صفحة القائمة)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                  required
                />
              </div>
              
              <div className="md:col-span-3">
                <label htmlFor="full_description" className="block text-gray-700 mb-2">الوصف الكامل *</label>
                <textarea
                  id="full_description"
                  name="full_description"
                  value={formData.full_description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                  required
                ></textarea>
              </div>

              {/* المواصفات التقنية */}
              <div className="md:col-span-3">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 mt-6">المواصفات التقنية</h2>
              </div>
              
              <div>
                <label htmlFor="length" className="block text-gray-700 mb-2">الطول (متر) *</label>
                <input
                  id="length"
                  name="length"
                  type="number"
                  step="0.1"
                  value={formData.length}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="width" className="block text-gray-700 mb-2">العرض (متر) *</label>
                <input
                  id="width"
                  name="width"
                  type="number"
                  step="0.1"
                  value={formData.width}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="height" className="block text-gray-700 mb-2">الارتفاع (متر) *</label>
                <input
                  id="height"
                  name="height"
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="weight" className="block text-gray-700 mb-2">الوزن (كجم) *</label>
                <input
                  id="weight"
                  name="weight"
                  type="number"
                  step="1"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="capacity" className="block text-gray-700 mb-2">السعة (عدد الأشخاص) *</label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  max="12"
                  value={formData.capacity}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="engine" className="block text-gray-700 mb-2">المحرك</label>
                <input
                  id="engine"
                  name="engine"
                  type="text"
                  value={formData.engine}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="fuel" className="block text-gray-700 mb-2">نوع الوقود</label>
                <input
                  id="fuel"
                  name="fuel"
                  type="text"
                  value={formData.fuel}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                />
              </div>
              
              <div>
                <label htmlFor="transmission" className="block text-gray-700 mb-2">ناقل الحركة</label>
                <input
                  id="transmission"
                  name="transmission"
                  type="text"
                  value={formData.transmission}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                />
              </div>
              
              <div>
                <label htmlFor="drive" className="block text-gray-700 mb-2">نظام الدفع</label>
                <input
                  id="drive"
                  name="drive"
                  type="text"
                  value={formData.drive}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                />
              </div>
              
              <div>
                <label htmlFor="mileage" className="block text-gray-700 mb-2">المسافة المقطوعة (كم)</label>
                <input
                  id="mileage"
                  name="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="evaluation_price" className="block text-gray-700 mb-2">السعر التقديري (ريال) *</label>
                <input
                  id="evaluation_price"
                  name="evaluation_price"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.evaluation_price}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                  required
                />
              </div>

              {/* المميزات */}
              <div className="md:col-span-3">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 mt-6">المميزات</h2>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {features.map((feature, index) => (
                    <div 
                      key={index} 
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center"
                    >
                      <span>{feature}</span>
                      <button 
                        type="button" 
                        onClick={() => removeFeature(feature)}
                        className="ml-2 text-green-700 hover:text-green-900"
                        title="حذف الميزة"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex">
                  <input
                    type="text"
                    value={currentFeature}
                    onChange={(e) => setCurrentFeature(e.target.value)}
                    placeholder="أضف ميزة جديدة (مثال: مطبخ، حمام، تدفئة...)"
                    className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-green-300 focus:border-green-500"
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-4 bg-green-500 text-white rounded-r-lg hover:bg-green-600"
                    title="إضافة ميزة"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* الصور */}
              <div className="md:col-span-3">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 mt-6">صور الكرفان</h2>
                
                <div className="flex flex-wrap gap-4 mb-6">
                  {images.map((image, index) => (
                    <div key={index} className="relative w-32 h-32 rounded-md overflow-hidden bg-gray-100">
                      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }}></div>
                      <button 
                        type="button" 
                        onClick={() => removeImage(image)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        title="حذف الصورة"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  
                  <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                    <Upload size={24} className="text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500">أضف صورة</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg font-medium ${
                  isSubmitting
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } transition-colors`}
              >
                {isSubmitting ? 'جاري تسجيل الكرفان...' : 'تسجيل الكرفان'}
              </button>
              
              <p className="mt-4 text-sm text-gray-500">
                * الحقول المطلوبة
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 