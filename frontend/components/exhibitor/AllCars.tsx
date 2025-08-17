'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch, FiFilter, FiEdit, FiTrash2, FiEye, FiChevronLeft, FiChevronRight, FiPlus, FiX
} from 'react-icons/fi'
import { FaCar } from 'react-icons/fa'

interface Car {
  id: number
  title: string
  brand: string
  model: string
  year: number
  price: number
  mileage: number
  fuelType: string
  transmission: string
  status: 'معلن' | 'مباع' | 'محجوز'
  addedDate: string
  views: number
  inquiries: number
}

const brandsList = [
  'تويوتا', 'نيسان', 'هيونداي', 'شفروليه', 'مرسيدس', 'بي ام دبليو', 'لكزس', 'فورد'
]
const fuelTypes = ['بنزين', 'ديزل', 'كهرباء', 'هايبرد']
const transmissions = ['أوتوماتيك', 'عادي']
const statuses = ['معلن', 'محجوز', 'مباع']

// Popup Modal Component (فقط للإضافة)
function CarModal({ open, onClose, onSubmit }: {
  open: boolean,
  onClose: () => void,
  onSubmit: (car: Omit<Car, 'id' | 'addedDate' | 'views' | 'inquiries'>) => void
}) {
  const [form, setForm] = useState({
    title: '',
    brand: '',
    model: '',
    year: '',
    price: '',
    mileage: '',
    fuelType: '',
    transmission: '',
    status: 'معلن'
  })
  const [errors, setErrors] = useState<{ [k: string]: string }>({})
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 100)
      setForm({
        title: '',
        brand: '',
        model: '',
        year: '',
        price: '',
        mileage: '',
        fuelType: '',
        transmission: '',
        status: 'معلن'
      })
      setErrors({})
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!form.title.trim()) newErrors.title = 'اسم السيارة مطلوب'
    if (!form.brand) newErrors.brand = 'العلامة مطلوبة'
    if (!form.model.trim()) newErrors.model = 'الموديل مطلوب'
    if (!form.year || isNaN(Number(form.year)) || Number(form.year) < 1990) newErrors.year = 'سنة غير صحيحة'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 1000) newErrors.price = 'السعر غير صحيح'
    if (!form.mileage || isNaN(Number(form.mileage)) || Number(form.mileage) < 0) newErrors.mileage = 'الممشى غير صحيح'
    if (!form.fuelType) newErrors.fuelType = 'نوع الوقود مطلوب'
    if (!form.transmission) newErrors.transmission = 'ناقل الحركة مطلوب'
    return newErrors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length === 0) {
      onSubmit({
        ...form,
        year: Number(form.year),
        price: Number(form.price),
        mileage: Number(form.mileage)
      } as any)
      onClose()
    }
  }

  const modalRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'input,select,button,textarea,[tabindex]:not([tabindex="-1"])'
    )
    let first = focusable?.[0]
    let last = focusable?.[focusable.length - 1]
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (!focusable) return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [open])

  const backdropRef = useRef<HTMLDivElement>(null)
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={backdropRef}
          onMouseDown={handleBackdrop}
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8 relative"
            onMouseDown={e => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute left-4 top-4 text-gray-400 hover:text-gray-700 focus:outline-none"
              aria-label="إغلاق"
              tabIndex={0}
            >
              <FiX size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">إضافة سيارة جديدة</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-gray-700">اسم السيارة</label>
                <input
                  ref={firstInputRef}
                  type="text"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  autoComplete="off"
                />
                {errors.title && <div className="text-red-500 text-xs mt-1">{errors.title}</div>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-gray-700">العلامة</label>
                  <select
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.brand ? 'border-red-400' : 'border-gray-300'}`}
                    value={form.brand}
                    onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                  >
                    <option value="">اختر</option>
                    {brandsList.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {errors.brand && <div className="text-red-500 text-xs mt-1">{errors.brand}</div>}
                </div>
                <div>
                  <label className="block mb-1 text-gray-700">الموديل</label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.model ? 'border-red-400' : 'border-gray-300'}`}
                    value={form.model}
                    onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                  />
                  {errors.model && <div className="text-red-500 text-xs mt-1">{errors.model}</div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-gray-700">سنة الصنع</label>
                  <input
                    type="number"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.year ? 'border-red-400' : 'border-gray-300'}`}
                    value={form.year}
                    onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                    min={1990}
                    max={new Date().getFullYear() + 1}
                  />
                  {errors.year && <div className="text-red-500 text-xs mt-1">{errors.year}</div>}
                </div>
                <div>
                  <label className="block mb-1 text-gray-700">السعر (ر.س)</label>
                  <input
                    type="number"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.price ? 'border-red-400' : 'border-gray-300'}`}
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    min={1000}
                  />
                  {errors.price && <div className="text-red-500 text-xs mt-1">{errors.price}</div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-gray-700">الممشى (كم)</label>
                  <input
                    type="number"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.mileage ? 'border-red-400' : 'border-gray-300'}`}
                    value={form.mileage}
                    onChange={e => setForm(f => ({ ...f, mileage: e.target.value }))}
                    min={0}
                  />
                  {errors.mileage && <div className="text-red-500 text-xs mt-1">{errors.mileage}</div>}
                </div>
                <div>
                  <label className="block mb-1 text-gray-700">نوع الوقود</label>
                  <select
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.fuelType ? 'border-red-400' : 'border-gray-300'}`}
                    value={form.fuelType}
                    onChange={e => setForm(f => ({ ...f, fuelType: e.target.value }))}
                  >
                    <option value="">اختر</option>
                    {fuelTypes.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  {errors.fuelType && <div className="text-red-500 text-xs mt-1">{errors.fuelType}</div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-gray-700">ناقل الحركة</label>
                  <select
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.transmission ? 'border-red-400' : 'border-gray-300'}`}
                    value={form.transmission}
                    onChange={e => setForm(f => ({ ...f, transmission: e.target.value }))}
                  >
                    <option value="">اختر</option>
                    {transmissions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.transmission && <div className="text-red-500 text-xs mt-1">{errors.transmission}</div>}
                </div>
                <div>
                  <label className="block mb-1 text-gray-700">الحالة</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 mt-4 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors text-lg"
              >
                إضافة السيارة
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Main Component
export default function ExhibitorCars() {
  const [cars, setCars] = useState<Car[]>([])
  const [filteredCars, setFilteredCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    yearFrom: '',
    yearTo: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const carsPerPage = 8

  // بيانات تجريبية
  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true)
      try {
        const mockCars: Car[] = [
          {
            id: 1, title: 'تويوتا كامري 2022', brand: 'تويوتا', model: 'كامري', year: 2022, price: 125000, mileage: 25000, fuelType: 'بنزين', transmission: 'أوتوماتيك', status: 'معلن', addedDate: '2023-05-15', views: 1245, inquiries: 23
          },
          {
            id: 2, title: 'نيسان باترول 2021', brand: 'نيسان', model: 'باترول', year: 2021, price: 210000, mileage: 35000, fuelType: 'بنزين', transmission: 'أوتوماتيك', status: 'محجوز', addedDate: '2023-06-20', views: 1890, inquiries: 45
          },
          {
            id: 3, title: 'هيونداي اكسنت 2023', brand: 'هيونداي', model: 'اكسنت', year: 2023, price: 85000, mileage: 5000, fuelType: 'بنزين', transmission: 'أوتوماتيك', status: 'مباع', addedDate: '2023-04-10', views: 980, inquiries: 18
          },
          {
            id: 4, title: 'شفروليه كمارو 2020', brand: 'شفروليه', model: 'كامارو', year: 2020, price: 180000, mileage: 40000, fuelType: 'بنزين', transmission: 'أوتوماتيك', status: 'معلن', addedDate: '2023-07-05', views: 1560, inquiries: 32
          },
          {
            id: 5, title: 'مرسيدس E200 2021', brand: 'مرسيدس', model: 'E200', year: 2021, price: 250000, mileage: 28000, fuelType: 'بنزين', transmission: 'أوتوماتيك', status: 'معلن', addedDate: '2023-06-15', views: 2100, inquiries: 56
          },
          {
            id: 6, title: 'بي ام دبليو X5 2022', brand: 'بي ام دبليو', model: 'X5', year: 2022, price: 320000, mileage: 15000, fuelType: 'بنزين', transmission: 'أوتوماتيك', status: 'محجوز', addedDate: '2023-05-28', views: 2450, inquiries: 67
          },
          {
            id: 7, title: 'لكزس LX570 2020', brand: 'لكزس', model: 'LX570', year: 2020, price: 380000, mileage: 45000, fuelType: 'بنزين', transmission: 'أوتوماتيك', status: 'معلن', addedDate: '2023-07-10', views: 1780, inquiries: 42
          },
          {
            id: 8, title: 'فورد رابتر 2023', brand: 'فورد', model: 'رابتر', year: 2023, price: 290000, mileage: 8000, fuelType: 'بنزين', transmission: 'أوتوماتيك', status: 'معلن', addedDate: '2023-06-01', views: 1950, inquiries: 51
          }
        ]
        setCars(mockCars)
        setFilteredCars(mockCars)
      } catch (error) {
        console.error('Error fetching cars:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCars()
  }, [])

  useEffect(() => {
    let results = cars.filter(car => {
      const matchesSearch = car.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilters = (
        (filters.status === '' || car.status === filters.status) &&
        (filters.brand === '' || car.brand === filters.brand) &&
        (filters.minPrice === '' || car.price >= Number(filters.minPrice)) &&
        (filters.maxPrice === '' || car.price <= Number(filters.maxPrice)) &&
        (filters.yearFrom === '' || car.year >= Number(filters.yearFrom)) &&
        (filters.yearTo === '' || car.year <= Number(filters.yearTo))
      )
      return matchesSearch && matchesFilters
    })
    setFilteredCars(results)
    setCurrentPage(1)
  }, [searchTerm, filters, cars])

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters({
      ...filters,
      [name]: value
    })
  }

  const resetFilters = () => {
    setFilters({
      status: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      yearFrom: '',
      yearTo: ''
    })
    setSearchTerm('')
  }

  const indexOfLastCar = currentPage * carsPerPage
  const indexOfFirstCar = indexOfLastCar - carsPerPage
  const currentCars = filteredCars.slice(indexOfFirstCar, indexOfLastCar)
  const totalPages = Math.ceil(filteredCars.length / carsPerPage)
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)
  const brands = [...new Set(cars.map(car => car.brand))]

  const handleAddCar = (car: Omit<Car, 'id' | 'addedDate' | 'views' | 'inquiries'>) => {
    setCars(prev => [
      {
        ...car,
        id: prev.length ? Math.max(...prev.map(c => c.id)) + 1 : 1,
        addedDate: new Date().toISOString().slice(0, 10),
        views: 0,
        inquiries: 0
      } as Car,
      ...prev
    ])
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <CarModal open={showModal} onClose={() => setShowModal(false)} onSubmit={handleAddCar} />
      <div className="max-w-7xl mx-auto">
        {/* العنوان والبحث */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-bold text-gray-900 mb-2"
              >
                سيارات المعرض
              </motion.h1>
              <p className="text-gray-600">إدارة السيارات المضافة إلى معرضك</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              onClick={() => setShowModal(true)}
              aria-label="إضافة سيارة جديدة"
            >
              <FiPlus className="ml-2" />
              <span>إضافة سيارة جديدة</span>
            </motion.button>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <motion.div
              className="relative flex-grow"
              whileHover={{ scale: 1.005 }}
            >
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="ابحث عن سيارة (ماركة، موديل، سنة...)"
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiFilter className="ml-2" />
              <span>الفلاتر</span>
            </motion.button>
          </div>
        </div>
        {/* لوحة الفلاتر */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-xl shadow-md mb-8 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">حالة السيارة</label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">الكل</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">العلامة التجارية</label>
                  <select
                    name="brand"
                    value={filters.brand}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">الكل</option>
                    {brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-gray-700 mb-2">السعر من</label>
                    <input
                      type="number"
                      name="minPrice"
                      placeholder="أدنى سعر"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={filters.minPrice}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-gray-700 mb-2">السعر إلى</label>
                    <input
                      type="number"
                      name="maxPrice"
                      placeholder="أعلى سعر"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-gray-700 mb-2">سنة الصنع من</label>
                    <input
                      type="number"
                      name="yearFrom"
                      placeholder="أقدم سنة"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={filters.yearFrom}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-gray-700 mb-2">سنة الصنع إلى</label>
                    <input
                      type="number"
                      name="yearTo"
                      placeholder="أحدث سنة"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={filters.yearTo}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetFilters}
                  className="px-6 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  إعادة تعيين
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFilters(false)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  تطبيق الفلاتر
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500"
          >
            <h3 className="text-gray-500 mb-2">إجمالي السيارات</h3>
            <p className="text-3xl font-bold">{cars.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500"
          >
            <h3 className="text-gray-500 mb-2">السيارات المعلنة</h3>
            <p className="text-3xl font-bold">{cars.filter(car => car.status === 'معلن').length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500"
          >
            <h3 className="text-gray-500 mb-2">السيارات المحجوزة</h3>
            <p className="text-3xl font-bold">{cars.filter(car => car.status === 'محجوز').length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500"
          >
            <h3 className="text-gray-500 mb-2">السيارات المباعة</h3>
            <p className="text-3xl font-bold">{cars.filter(car => car.status === 'مباع').length}</p>
          </motion.div>
        </div>
        {/* نتائج البحث */}
        <div className="mb-6 flex justify-between items-center">
          <div className="text-gray-600">
            <span className="font-medium">{filteredCars.length}</span> سيارة متاحة
          </div>
          <div className="flex items-center">
            <span className="text-gray-600 mr-2">ترتيب حسب:</span>
            <select className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option>الأحدث إضافة</option>
              <option>الأقدم إضافة</option>
              <option>الأعلى سعراً</option>
              <option>الأقل سعراً</option>
            </select>
          </div>
        </div>
        {/* حالة التحميل */}
        {loading && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السيارة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعر</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المشاهدات</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاستفسارات</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </td>
                    <td className="px-6 py-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </td>
                    <td className="px-6 py-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </td>
                    <td className="px-6 py-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </td>
                    <td className="px-6 py-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </td>
                    <td className="px-6 py-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* عندما لا توجد نتائج */}
        {!loading && filteredCars.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-md p-12 text-center"
          >
            <div className="text-gray-400 mb-4">
              <FiSearch size={48} className="mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">لا توجد سيارات متطابقة</h3>
            <p className="text-gray-500 mb-6">لم نتمكن من العثور على أي سيارات تطابق بحثك. حاول تعديل الفلاتر.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetFilters}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              عرض جميع السيارات
            </motion.button>
          </motion.div>
        )}
        {/* جدول السيارات */}
        {!loading && filteredCars.length > 0 && (
          <>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السيارة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعر</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المشاهدات</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاستفسارات</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentCars.map((car, index) => (
                    <motion.tr
                      key={car.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <FaCar className="text-indigo-600" />
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-gray-900">{car.title}</div>
                            <div className="text-sm text-gray-500">{car.year} • {car.mileage.toLocaleString()} كم</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-indigo-600">{car.price.toLocaleString()} ر.س</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          car.status === 'معلن' ? 'bg-green-100 text-green-800' :
                            car.status === 'محجوز' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {car.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiEye className="ml-1" />
                          {car.views.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {car.inquiries.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <button className="text-indigo-600 hover:text-indigo-900" aria-label="تعديل" type="button">
                            <FiEdit size={18} />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900" aria-label="عرض التفاصيل" type="button">
                            <FiEye size={18} />
                          </button>
                          <button className="text-red-600 hover:text-red-900" aria-label="حذف" type="button">
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  عرض <span className="font-medium">{indexOfFirstCar + 1}</span> إلى <span className="font-medium">
                    {Math.min(indexOfLastCar, filteredCars.length)}
                  </span> من <span className="font-medium">{filteredCars.length}</span> سيارة
                </div>
                <nav className="flex items-center gap-1">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        currentPage === number
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}