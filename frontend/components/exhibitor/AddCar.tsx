'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUpload, FiCamera, FiInfo, FiCheckCircle, FiX, FiChevronDown } from 'react-icons/fi'
import { FaCar, FaGasPump, FaTachometerAlt, FaCalendarAlt, FaCogs } from 'react-icons/fa'
import { IoMdSpeedometer } from 'react-icons/io'
import { GiCarDoor, GiGearStick } from 'react-icons/gi'

interface FormData {
  carType: string
  brand: string
  model: string
  year: string
  mileage: string
  fuelType: string
  transmission: string
  engineSize: string
  doors: string
  color: string
  price: string
  description: string
  features: string[]
  auctionType: string
  auctionStartPrice: string
  auctionMinPrice: string
  auctionMaxPrice: string
  auctionStartDate: string
  auctionEndDate: string
  status: string
  city: string
}

interface PreviewImage {
  url: string
  name: string
  file?: File
}

interface OcrData {
  brand: string
  model: string
  year: string
  chassisNumber: string
  engineSize: string
  fuelType: string
}

interface AiAnalysis {
  marketPrice: number
  demandLevel: string
  similarCars: number
  priceSuggestion: number
}

export default function AddCarForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    carType: '',
    brand: '',
    model: '',
    year: '',
    mileage: '',
    fuelType: '',
    transmission: '',
    engineSize: '',
    doors: '',
    color: '',
    price: '',
    description: '',
    features: [],
    auctionType: '',
    auctionStartPrice: '',
    auctionMinPrice: '',
    auctionMaxPrice: '',
    auctionStartDate: '',
    auctionEndDate: '',
    status: '',
    city: ''
  })
  
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([])
  const [ocrFile, setOcrFile] = useState<File | null>(null)
  const [ocrData, setOcrData] = useState<OcrData | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // محاكاة تحليل الذكاء الاصطناعي
  useEffect(() => {
    if (formData.brand && formData.model && formData.year) {
      const mockAnalysis: AiAnalysis = {
        marketPrice: Math.round(Math.random() * 50000 + 50000),
        demandLevel: ['منخفض', 'متوسط', 'مرتفع'][Math.floor(Math.random() * 3)],
        similarCars: Math.round(Math.random() * 50),
        priceSuggestion: Math.round(Math.random() * 50000 + 50000)
      }
      setAiAnalysis(mockAnalysis)
    }
  }, [formData.brand, formData.model, formData.year])

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
    setOcrFile(e.target.files[0])
    // محاكاة عملية OCR
    setTimeout(() => {
      setOcrData({
        brand: 'تويوتا',
        model: 'كامري',
        year: '2022',
        chassisNumber: 'JT2BF22KXW0123456',
        engineSize: '2.5L',
        fuelType: 'بنزين'
      })
    }, 1500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)
    // تحقق من الحقول المطلوبة
    if (!formData.brand || !formData.model || !formData.year || !formData.price || !formData.carType) {
      setErrorMsg('يرجى تعبئة جميع الحقول الأساسية المطلوبة')
      setIsSubmitting(false)
      return
    }
    // تحقق من رفع صورة الاستمارة
    if (!ocrFile) {
      setErrorMsg('يرجى رفع صورة استمارة السيارة')
      setIsSubmitting(false)
      return
    }
    // تحقق من رفع الصور
    if (previewImages.length === 0) {
      setErrorMsg('يرجى رفع صور السيارة')
      setIsSubmitting(false)
      return
    }

    // محاكاة عملية الإرسال
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsSubmitting(false)
          setIsSuccess(true)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const nextStep = () => setStep(prev => prev + 1)
  const prevStep = () => setStep(prev => prev - 1)

  const featuresList = [
    'مكيف هواء', 'نظام ملاحة', 'كاميرا خلفية', 'مقاعد جلد', 
    'شاشة لمس', 'تحكم بمقود', 'فتحة سقف', 'مرآة كهربائية',
    'حساسات ركن', 'نظام صوتي', 'بلوتوث', 'مثبت سرعة'
  ]

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
  }

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
                   stepNumber === 2 ? 'المواصفات والمزاد' : 'المرفقات'}
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

        {/* رسالة خطأ */}
        {errorMsg && (
          <div className="mb-4 bg-red-100 border border-red-300 text-red-700 rounded-lg p-3">
            {errorMsg}
          </div>
        )}

        {/* محتوى النموذج */}
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
            <p className="text-gray-600 mt-1">املأ التفاصيل أدناه لإضافة سيارة إلى معرضك</p>
          </div>

          {/* الخطوة 1: البيانات الأساسية */}
          {step === 1 && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* معلومات OCR */}
                {ocrData && (
                  <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center text-blue-800 mb-2">
                      <FiInfo className="ml-2" />
                      <h3 className="font-medium">تم التعرف على بيانات السيارة</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(ocrData).map(([key, value]) => (
                        <div key={key} className="bg-white p-3 rounded-lg border border-blue-100">
                          <p className="text-xs text-blue-600 capitalize">{key}</p>
                          <p className="font-medium">{value}</p>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setFormData({ ...formData, ...ocrData })}
                      className="mt-3 text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition"
                    >
                      تعبئة البيانات تلقائياً
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 mb-2">نوع السيارة *</label>
                  <select
                    name="carType"
                    value={formData.carType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">اختر نوع السيارة</option>
                    <option value="sedan">سيدان</option>
                    <option value="suv">SUV</option>
                    <option value="coupe">كوبيه</option>
                    <option value="hatchback">هاتشباك</option>
                    <option value="pickup">بيك أب</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">العلامة التجارية *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="مثال: تويوتا"
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
                    placeholder="مثال: كامري"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">سنة الصنع *</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="مثال: 2022"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">السعر (ر.س) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="مثال: 85000"
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
                    placeholder="مثال: أبيض"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">الحالة</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">اختر الحالة</option>
                    <option value="new">جديدة</option>
                    <option value="used">مستعملة</option>
                    <option value="under_review">تحت الفحص</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">المدينة</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="مثال: الرياض"
                  />
                </div>
              </div>

              {/* تحليل الذكاء الاصطناعي */}
              {aiAnalysis && (
                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-3">تحليل السوق الذكي</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500">متوسط السعر بالسوق</p>
                      <p className="text-xl font-bold">{aiAnalysis.marketPrice.toLocaleString()} ر.س</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500">مستوى الطلب</p>
                      <p className={`text-xl font-bold ${
                        aiAnalysis.demandLevel === 'مرتفع' ? 'text-green-600' : 
                        aiAnalysis.demandLevel === 'متوسط' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {aiAnalysis.demandLevel}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500">سيارات مشابهة</p>
                      <p className="text-xl font-bold">{aiAnalysis.similarCars}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500">السعر المقترح</p>
                      <p className="text-xl font-bold text-indigo-600">{aiAnalysis.priceSuggestion.toLocaleString()} ر.س</p>
                    </div>
                  </div>
                </div>
              )}

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

          {/* الخطوة 2: المواصفات والمزاد */}
          {step === 2 && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">عدد الكيلومترات</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="mileage"
                      value={formData.mileage}
                      onChange={handleInputChange}
                      className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="مثال: 45000"
                    />
                    <div className="absolute left-3 top-2.5 text-gray-400">
                      <FaTachometerAlt />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">نوع الوقود</label>
                  <div className="relative">
                    <select
                      name="fuelType"
                      value={formData.fuelType}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                    >
                      <option value="">اختر نوع الوقود</option>
                      <option value="gasoline">بنزين</option>
                      <option value="diesel">ديزل</option>
                      <option value="hybrid">هايبرد</option>
                      <option value="electric">كهرباء</option>
                    </select>
                    <div className="absolute right-3 top-2.5 text-gray-400 pointer-events-none">
                      <FiChevronDown />
                    </div>
                    <div className="absolute left-3 top-2.5 text-gray-400">
                      <FaGasPump />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">نوع ناقل الحركة</label>
                  <div className="relative">
                    <select
                      name="transmission"
                      value={formData.transmission}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                    >
                      <option value="">اختر ناقل الحركة</option>
                      <option value="automatic">أوتوماتيك</option>
                      <option value="manual">مانيوال</option>
                      <option value="semi-automatic">نصف أوتوماتيك</option>
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
                  <label className="block text-gray-700 mb-2">سعة المحرك</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="engineSize"
                      value={formData.engineSize}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="مثال: 2.5L"
                    />
                    <div className="absolute left-3 top-2.5 text-gray-400">
                      <FaCogs />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">عدد الأبواب</label>
                  <div className="relative">
                    <select
                      name="doors"
                      value={formData.doors}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                    >
                      <option value="">اختر عدد الأبواب</option>
                      <option value="2">2 أبواب</option>
                      <option value="3">3 أبواب</option>
                      <option value="4">4 أبواب</option>
                      <option value="5">5 أبواب</option>
                    </select>
                    <div className="absolute right-3 top-2.5 text-gray-400 pointer-events-none">
                      <FiChevronDown />
                    </div>
                    <div className="absolute left-3 top-2.5 text-gray-400">
                      <GiCarDoor />
                    </div>
                  </div>
                </div>
              </div>

              {/* المميزات الإضافية */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">المميزات الإضافية</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {featuresList.map((feature) => (
                    <motion.div
                      key={feature}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleFeature(feature)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.features.includes(feature)
                          ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        {formData.features.includes(feature) && (
                          <FiCheckCircle className="ml-2 text-indigo-600" />
                        )}
                        <span>{feature}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* بيانات المزاد */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">نوع المزاد</label>
                  <select
                    name="auctionType"
                    value={formData.auctionType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">اختر نوع المزاد</option>
                    <option value="live">مباشر</option>
                    <option value="instant">فوري</option>
                    <option value="silent">صامت</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">سعر افتتاح المزاد</label>
                  <input
                    type="number"
                    name="auctionStartPrice"
                    value={formData.auctionStartPrice}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="مثال: 50000"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">الحد الأدنى للبيع</label>
                  <input
                    type="number"
                    name="auctionMinPrice"
                    value={formData.auctionMinPrice}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="مثال: 55000"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">الحد الأعلى للبيع</label>
                  <input
                    type="number"
                    name="auctionMaxPrice"
                    value={formData.auctionMaxPrice}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="مثال: 60000"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">تاريخ بدء المزاد</label>
                  <input
                    type="datetime-local"
                    name="auctionStartDate"
                    value={formData.auctionStartDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">تاريخ نهاية المزاد</label>
                  <input
                    type="datetime-local"
                    name="auctionEndDate"
                    value={formData.auctionEndDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* الخطوة 3: الصور والمستندات */}
          {step === 3 && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2">رفع صور السيارة</h3>
                <p className="text-gray-600 mb-4">قم بتحميل صور واضحة للسيارة من زوايا مختلفة (الحد الأقصى 10 صور)</p>
                
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
                    <p className="text-sm mt-1">JPEG, PNG (الحد الأقصى 5MB لكل صورة)</p>
                  </div>
                </motion.button>
              </div>

              {/* معاينة الصور */}
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

              {/* رفع استمارة السيارة */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-800 mb-2">رفع استمارة السيارة</h3>
                <p className="text-gray-600 mb-4">سيتم استخدام الاستمارة للتحقق من بيانات السيارة عبر OCR</p>
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

          {/* أزرار التنقل */}
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
              ) : (
                <div></div>
              )}

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
              <p className="text-gray-600 mb-6">تمت إضافة السيارة إلى معرضك بنجاح وسيتم مراجعتها قبل النشر.</p>
              <div className="space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsSuccess(false)
                    setStep(1)
                    setFormData({
                      carType: '',
                      brand: '',
                      model: '',
                      year: '',
                      mileage: '',
                      fuelType: '',
                      transmission: '',
                      engineSize: '',
                      doors: '',
                      color: '',
                      price: '',
                      description: '',
                      features: [],
                      auctionType: '',
                      auctionStartPrice: '',
                      auctionMinPrice: '',
                      auctionMaxPrice: '',
                      auctionStartDate: '',
                      auctionEndDate: '',
                      status: '',
                      city: ''
                    })
                    setPreviewImages([])
                    setOcrFile(null)
                    setOcrData(null)
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
                  العودة للوحة التحكم
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}