'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUpload, FiInfo, FiCheckCircle, FiX, FiChevronDown } from 'react-icons/fi'
import { FaTachometerAlt } from 'react-icons/fa'
import { GiGearStick } from 'react-icons/gi'

type Condition = 'excellent' | 'good' | 'fair' | 'poor'
type Transmission = 'automatic' | 'manual' | 'cvt'
type MarketCategory = 'luxuryCars' | 'classic' | 'caravan' | 'busesTrucks' | 'companiesCars' | 'government'

interface FormData {
  make: string
  model: string
  year: string | number
  vin: string
  odometer: string | number
  condition: Condition | ''
  evaluation_price: string | number
  color: string
  engine: string
  transmission: Transmission | ''
  market_category: MarketCategory | ''
  description: string
  min_price: string | number
  max_price: string | number
  province: string
  city: string
  plate: string
}

interface PreviewImage {
  url: string
  name: string
  file?: File
}

interface OcrData {
  make?: string
  model?: string
  year?: string
  vin?: string
  engine?: string
}

export default function AddCarForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    make: '',
    model: '',
    year: '',
    vin: '',
    odometer: '',
    condition: '',
    evaluation_price: '',
    color: '',
    engine: '',
    transmission: '',
    market_category: '',
    description: '',
    min_price: '',
    max_price: '',
    province: '',
    city: '',
    plate: ''
  })
  
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [serverMsg, setServerMsg] = useState<string | null>(null)

  // صور السيارة (تبقى بدون ربط backend الآن)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([])

  // مستندات السيارة/الاستمارة (بدون ربط backend الآن)
  const [ocrFile, setOcrFile] = useState<File | null>(null)
  const [ocrData, setOcrData] = useState<OcrData | null>(null)

  useEffect(() => {
    // ممكن لاحقًا تجيب خيارات enum من /api/cars/enum-options
    // حالياً ثابتة لتجنب أي تبعيات
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    if (previewImages.length + files.length > 10) {
      setErrorMsg('يمكنك رفع 10 صور كحد أقصى')
      return
    }
    const newPreviewImages = files.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name,
      file
    }))
    setPreviewImages([...previewImages, ...newPreviewImages])
  }

  const removeImage = (index: number) => {
    const newImages = [...previewImages]
    newImages.splice(index, 1)
    setPreviewImages(newImages)
  }

  const handleOcrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setOcrFile(file)

    // محاكاة استخراج بيانات من الاستمارة (OCR) — لا يتم ربط backend الآن
    setTimeout(() => {
      const mocked: OcrData = {
        make: 'Toyota',
        model: 'Camry',
        year: '2020',
        vin: '1HGCM82633A123456',
        engine: '2.5L',
      }
      setOcrData(mocked)
    }, 1200)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const nextStep = () => setStep(prev => prev + 1)
  const prevStep = () => setStep(prev => prev - 1)

  const requiredFields: (keyof FormData)[] = [
    'make','model','year','vin','odometer','condition','evaluation_price',
    'color','engine','transmission','market_category',
    'min_price','max_price','province','city','plate'
  ]

  const validate = (): string | null => {
    for (const key of requiredFields) {
      const v = formData[key]
      if (v === '' || v === null || v === undefined) {
        return `الرجاء تعبئة الحقل المطلوب: ${labelFor(key)}`
      }
    }

    // قيم enum
    const allowedConditions: Condition[] = ['excellent','good','fair','poor']
    if (!allowedConditions.includes(formData.condition as Condition)) {
      return 'قيمة "condition" غير صحيحة'
    }

    const allowedTransmissions: Transmission[] = ['automatic','manual','cvt']
    if (!allowedTransmissions.includes(formData.transmission as Transmission)) {
      return 'قيمة "transmission" غير صحيحة'
    }

    const allowedCategories: MarketCategory[] = ['luxuryCars','classic','caravan','busesTrucks','companiesCars','government']
    if (!allowedCategories.includes(formData.market_category as MarketCategory)) {
      return 'قيمة "market_category" غير صحيحة'
    }

    // year رقم ضمن المدى
    const y = Number(formData.year)
    const thisYearPlusOne = new Date().getFullYear() + 1
    if (isNaN(y) || y < 1900 || y > thisYearPlusOne) {
      return `سنة الصنع يجب أن تكون بين 1900 و ${thisYearPlusOne}`
    }

    // أرقام منطقية
    const od = Number(formData.odometer)
    if (isNaN(od) || od < 0) return 'العداد (odometer) غير صحيح'

    const evalPrice = Number(formData.evaluation_price)
    if (isNaN(evalPrice) || evalPrice < 0) return 'evaluation_price غير صحيح'

    const minP = Number(formData.min_price)
    const maxP = Number(formData.max_price)
    if (isNaN(minP) || isNaN(maxP) || minP < 0 || maxP < 0) return 'min_price/max_price غير صحيح'
    if (minP > maxP) return 'min_price يجب أن يكون أقل من أو يساوي max_price'

    if (!/^[A-Za-z0-9]{1,17}$/.test(formData.vin)) {
      // الباكند يطلب max:17 وفريد — هنا فقط تحقق شكلي
      return 'رقم الهيكل (VIN) يجب أن يكون من حروف/أرقام بطول حتى 17'
    }

    return null
  }

  const labelFor = (key: keyof FormData): string => {
    const map: Record<keyof FormData, string> = {
      make: 'الشركة المصنعة',
      model: 'الموديل',
      year: 'سنة الصنع',
      vin: 'رقم الهيكل (VIN)',
      odometer: 'عدد الكيلومترات',
      condition: 'حالة السيارة',
      evaluation_price: 'السعر المقيّم',
      color: 'اللون',
      engine: 'سعة/نوع المحرك',
      transmission: 'ناقل الحركة',
      market_category: 'فئة السوق',
      description: 'الوصف',
      min_price: 'الحد الأدنى',
      max_price: 'الحد الأعلى',
      province: 'المحافظة',
      city: 'المدينة',
      plate: 'رقم اللوحة'
    }
    return map[key]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)
    setServerMsg(null)

    // تعبئة تلقائية من OCR (اختياري) — لا يرسل الملفات
    if (ocrData) {
      setFormData(prev => ({
        ...prev,
        make: prev.make || ocrData.make || '',
        model: prev.model || ocrData.model || '',
        year: prev.year || ocrData.year || '',
        vin: prev.vin || ocrData.vin || '',
        engine: prev.engine || ocrData.engine || ''
      }))
    }

    const validationError = validate()
    if (validationError) {
      setErrorMsg(validationError)
      setIsSubmitting(false)
      return
    }

    // تجهيز الجسم المطلوب للـ backend — بدون صور الآن
    const payload = {
      make: String(formData.make).trim(),
      model: String(formData.model).trim(),
      year: Number(formData.year),
      vin: String(formData.vin).trim(),
      odometer: Number(formData.odometer),
      condition: formData.condition,
      evaluation_price: Number(formData.evaluation_price),
      color: String(formData.color).trim(),
      engine: String(formData.engine).trim(),
      transmission: formData.transmission,
      market_category: formData.market_category,
      description: String(formData.description || ''),
      min_price: Number(formData.min_price),
      max_price: Number(formData.max_price),
      province: String(formData.province).trim(),
      city: String(formData.city).trim(),
      plate: String(formData.plate).trim()
    }

    try {
   const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

if (!token) {
  setIsSubmitting(false);
  setErrorMsg('غير مصرح: مفقود رمز الدخول. الرجاء تسجيل الدخول أولاً.');
  return;
}

const res = await fetch('/api/cars', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(payload)
});

      const data = await res.json()

      if (!res.ok) {
        // إظهار أخطاء الفاليديشن من الباكند إن وجدت
        if (data?.errors) {
          const firstKey = Object.keys(data.errors)[0]
          const firstMsg = data.errors[firstKey]?.[0] || 'فشل إنشاء السيارة'
          setErrorMsg(firstMsg)
        } else {
          setErrorMsg(data?.message || 'حدث خطأ غير متوقع')
        }
        setIsSubmitting(false)
        return
      }

      setServerMsg(data?.message || 'تمت الإضافة بنجاح')
      // محاكاة تقدّم بعد نجاح الإرسال
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsSubmitting(false)
            setIsSuccess(true)
            return 100
          }
          return prev + 20
        })
      }, 150)

    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذّر الاتصال بالخادم')
      setIsSubmitting(false)
    }
  }

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* شريط التقدم */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center 
                    ${step === stepNumber ? 'bg-indigo-600 text-white' : 
                    step > stepNumber ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  {step > stepNumber ? <FiCheckCircle size={20} /> : stepNumber}
                </div>
                <span className="text-sm mt-1 text-gray-600">
                  {stepNumber === 1 ? 'البيانات الأساسية' : 
                   stepNumber === 2 ? 'التفاصيل الإضافية' : 'المرفقات (بدون ربط)'}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-indigo-600 h-2 rounded-full"
              initial={{ width: `${(step - 1) * 50}%` }}
              animate={{ width: `${(step - 1) * 50}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* تنبيهات */}
        {errorMsg && (
          <div className="mb-4 bg-red-100 border border-red-300 text-red-700 rounded-lg p-3">
            {errorMsg}
          </div>
        )}
        {serverMsg && !isSuccess && (
          <div className="mb-4 bg-green-100 border border-green-300 text-green-700 rounded-lg p-3">
            {serverMsg}
          </div>
        )}

        {/* بطاقة النموذج */}
        <motion.div 
          key={step}
          initial={{ opacity: 0, x: step > 1 ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: step > 1 ? -50 : 50 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          {/* العنوان */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-800">إضافة سيارة جديدة</h2>
            <p className="text-gray-600 mt-1">املأ التفاصيل أدناه لإضافة سيارة</p>
          </div>

          {/* الخطوة 1: الأساسية */}
          {step === 1 && (
            <div className="p-6">
              {ocrData && (
                <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center text-blue-800 mb-2">
                    <FiInfo className="ml-2" />
                    <h3 className="font-medium">تم استخراج بيانات مبدئية من الاستمارة (محاكاة)</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(ocrData).map(([k, v]) => (
                      <div key={k} className="bg-white p-3 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-600">{k}</p>
                        <p className="font-medium">{v}</p>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setFormData(prev => ({ ...prev, ...ocrData }))}
                    className="mt-3 text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition"
                  >
                    تعبئة تلقائية
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">الشركة المصنعة *</label>
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Toyota"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">الموديل *</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Camry"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">سنة الصنع *</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="2020"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">رقم الهيكل (VIN) *</label>
                  <input
                    type="text"
                    name="vin"
                    value={formData.vin}
                    onChange={handleInputChange}
                    maxLength={17}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="1HGCM82633A123456"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">عدد الكيلومترات *</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="odometer"
                      value={formData.odometer}
                      onChange={handleInputChange}
                      className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="45000"
                    />
                    <div className="absolute left-3 top-2.5 text-gray-400">
                      <FaTachometerAlt />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">حالة السيارة *</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">اختر الحالة</option>
                    <option value="excellent">ممتازة</option>
                    <option value="good">جيدة</option>
                    <option value="fair">متوسطة</option>
                    <option value="poor">ضعيفة</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-gray-700 mb-2">الوصف</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="أدخل وصفًا تفصيليًا للسيارة..."
                />
              </div>
            </div>
          )}

          {/* الخطوة 2: التفاصيل الإضافية المطابقة للباكند */}
          {step === 2 && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">السعر المقيّم *</label>
                  <input
                    type="number"
                    name="evaluation_price"
                    value={formData.evaluation_price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="80000"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">اللون *</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="أبيض"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">ناقل الحركة *</label>
                  <div className="relative">
                    <select
                      name="transmission"
                      value={formData.transmission}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                    >
                      <option value="">اختر ناقل الحركة</option>
                      <option value="automatic">أوتوماتيك</option>
                      <option value="manual">يدوي</option>
                      <option value="cvt">CVT</option>
                    </select>
                    <div className="absolute right-3 top-2.5 text-gray-400 pointer-events-none">
                      <FiChevronDown />
                    </div>
                    <div className="absolute left-3 top-2.5 text-gray-400">
                      <GiGearStick />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">سعة/نوع المحرك *</label>
                  <input
                    type="text"
                    name="engine"
                    value={formData.engine}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="2.5L"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">فئة السوق *</label>
                  <select
                    name="market_category"
                    value={formData.market_category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">اختر الفئة</option>
                    <option value="luxuryCars">سوق السيارات الفارهة</option>
                    <option value="classic">سوق السيارات الكلاسيكية</option>
                    <option value="caravan">سوق الكرافانات</option>
                    <option value="busesTrucks">سوق الشاحنات والحافلات</option>
                    <option value="companiesCars">سوق سيارات الشركات</option>
                    <option value="government">سوق سيارات الجهات الحكومية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">الحد الأدنى *</label>
                  <input
                    type="number"
                    name="min_price"
                    value={formData.min_price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="75000"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">الحد الأعلى *</label>
                  <input
                    type="number"
                    name="max_price"
                    value={formData.max_price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="85000"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">المحافظة *</label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="الرياض"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">المدينة *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="الرياض"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">رقم اللوحة *</label>
                  <input
                    type="text"
                    name="plate"
                    value={formData.plate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="1234 ABC"
                  />
                </div>
              </div>
            </div>
          )}

          {/* الخطوة 3: الصور والمستندات — تبقى بدون ربط بالباكند الآن */}
          {step === 3 && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2">رفع صور السيارة (بدون ربط حاليًا)</h3>
                <p className="text-gray-600 mb-4">الحد الأقصى 10 صور</p>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <FiUpload size={40} className="mb-3" />
                    <p className="text-lg">انقر أو اسحب الصور هنا</p>
                    <p className="text-sm mt-1">JPEG, PNG (5MB كحد أقصى لكل صورة)</p>
                  </div>
                </motion.button>
              </div>

              {previewImages.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">الصور المرفوعة</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {previewImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={`Preview ${index}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* رفع استمارة السيارة (بدون ربط) */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-800 mb-2">رفع استمارة السيارة (بدون ربط)</h3>
                <p className="text-gray-600 mb-4">سيتم استخدامها لاحقًا للتحقق عبر OCR</p>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleOcrUpload}
                  className="hidden"
                  id="ocr-upload"
                />
                <label htmlFor="ocr-upload">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                  >
                    اختر ملف الاستمارة
                  </motion.button>
                </label>
                {ocrFile && (
                  <div className="mt-3 text-sm text-gray-700">
                    تم اختيار الملف: {ocrFile.name}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* أزرار التنقل / الإرسال */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex justify-between">
              {step > 1 ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                >
                  السابق
                </motion.button>
              ) : <div />}

              {step < 3 ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={nextStep}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  التالي
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-green-400"
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'إضافة السيارة'}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* رسالة النجاح */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle size={40} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">تمت الإضافة بنجاح!</h3>
              <p className="text-gray-600 mb-6">تمت إضافة السيارة وسيتم مراجعتها قبل النشر.</p>
              <div className="space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsSuccess(false)
                    setStep(1)
                    setFormData({
                      make: '', model: '', year: '', vin: '', odometer: '',
                      condition: '', evaluation_price: '', color: '', engine: '',
                      transmission: '', market_category: '', description: '',
                      min_price: '', max_price: '', province: '', city: '', plate: ''
                    })
                    setPreviewImages([])
                    setOcrFile(null)
                    setOcrData(null)
                    setUploadProgress(0)
                    setServerMsg(null)
                    setErrorMsg(null)
                  }}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  إضافة سيارة جديدة
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsSuccess(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                >
                  إغلاق
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
