'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch, FiFilter, FiPlus, FiX, FiChevronLeft, FiChevronRight, FiEye, FiClock, FiUser
} from 'react-icons/fi'
import { FaGavel, FaCar } from 'react-icons/fa'

interface Auction {
  id: number
  title: string
  car: string
  image: string
  startPrice: number
  currentBid: number
  endTime: string // ISO
  status: 'جاري' | 'منتهي' | 'قادم'
  bids: number
  watchers: number
  owner: string
}

const carsList = [
  'تويوتا كامري', 'نيسان باترول', 'هيونداي اكسنت', 'شفروليه كمارو', 'مرسيدس E200', 'بي ام دبليو X5', 'لكزس LX570', 'فورد رابتر'
]

const statuses = ['جاري', 'منتهي', 'قادم']

// عداد تنازلي حي
function Countdown({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const end = new Date(endTime)
      const diff = end.getTime() - now.getTime()
      if (diff <= 0) {
        setTimeLeft('انتهى المزاد')
        return
      }
      const h = Math.floor(diff / 1000 / 60 / 60)
      const m = Math.floor((diff / 1000 / 60) % 60)
      const s = Math.floor((diff / 1000) % 60)
      setTimeLeft(`${h}س ${m}د ${s}ث`)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [endTime])

  return <span className="font-mono text-sm">{timeLeft}</span>
}

// مودال إضافة مزاد جديد
function AuctionModal({ open, onClose, onSubmit }: {
  open: boolean,
  onClose: () => void,
  onSubmit: (auction: Omit<Auction, 'id' | 'currentBid' | 'bids' | 'watchers' | 'status'>) => void
}) {
  const [form, setForm] = useState({
    title: '',
    car: '',
    image: '',
    startPrice: '',
    endTime: '',
    owner: ''
  })
  const [errors, setErrors] = useState<{ [k: string]: string }>({})
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 100)
      setForm({
        title: '',
        car: '',
        image: '',
        startPrice: '',
        endTime: '',
        owner: ''
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
    if (!form.title.trim()) newErrors.title = 'اسم المزاد مطلوب'
    if (!form.car) newErrors.car = 'السيارة مطلوبة'
    if (!form.image.trim()) newErrors.image = 'رابط الصورة مطلوب'
    if (!form.startPrice || isNaN(Number(form.startPrice)) || Number(form.startPrice) < 1000) newErrors.startPrice = 'سعر البدء غير صحيح'
    if (!form.endTime) newErrors.endTime = 'تاريخ الانتهاء مطلوب'
    if (!form.owner.trim()) newErrors.owner = 'اسم المالك مطلوب'
    return newErrors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length === 0) {
      onSubmit({
        ...form,
        startPrice: Number(form.startPrice),
        endTime: new Date(form.endTime).toISOString()
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
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">إضافة مزاد جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-gray-700">اسم المزاد</label>
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
              <div>
                <label className="block mb-1 text-gray-700">السيارة</label>
                <select
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.car ? 'border-red-400' : 'border-gray-300'}`}
                  value={form.car}
                  onChange={e => setForm(f => ({ ...f, car: e.target.value }))}
                >
                  <option value="">اختر</option>
                  {carsList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.car && <div className="text-red-500 text-xs mt-1">{errors.car}</div>}
              </div>
              <div>
                <label className="block mb-1 text-gray-700">رابط صورة السيارة</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.image ? 'border-red-400' : 'border-gray-300'}`}
                  value={form.image}
                  onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                  placeholder="https://..."
                />
                {errors.image && <div className="text-red-500 text-xs mt-1">{errors.image}</div>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-gray-700">سعر البدء (ر.س)</label>
                  <input
                    type="number"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.startPrice ? 'border-red-400' : 'border-gray-300'}`}
                    value={form.startPrice}
                    onChange={e => setForm(f => ({ ...f, startPrice: e.target.value }))}
                    min={1000}
                  />
                  {errors.startPrice && <div className="text-red-500 text-xs mt-1">{errors.startPrice}</div>}
                </div>
                <div>
                  <label className="block mb-1 text-gray-700">تاريخ ووقت الانتهاء</label>
                  <input
                    type="datetime-local"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.endTime ? 'border-red-400' : 'border-gray-300'}`}
                    value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  />
                  {errors.endTime && <div className="text-red-500 text-xs mt-1">{errors.endTime}</div>}
                </div>
              </div>
              <div>
                <label className="block mb-1 text-gray-700">اسم المالك</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.owner ? 'border-red-400' : 'border-gray-300'}`}
                  value={form.owner}
                  onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                />
                {errors.owner && <div className="text-red-500 text-xs mt-1">{errors.owner}</div>}
              </div>
              <button
                type="submit"
                className="w-full py-3 mt-4 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors text-lg"
              >
                إضافة المزاد
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function AuctionPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [filteredAuctions, setFilteredAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    car: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const auctionsPerPage = 6

  // جلب المزادات من مصدر خارجي (API/DB) - بدون بيانات تجريبية
  useEffect(() => {
    const fetchAuctions = async () => {
      setLoading(true)
      try {
        // const response = await fetch('/api/auctions');
        // const data = await response.json();
        // setAuctions(data);
        // setFilteredAuctions(data);
        setAuctions([])
        setFilteredAuctions([])
      } catch (err) {
        setAuctions([])
        setFilteredAuctions([])
      }
      setLoading(false)
    }
    fetchAuctions()
  }, [])

  // بحث وفلاتر
  useEffect(() => {
    let results = auctions.filter(auction => {
      const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.car.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.owner.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilters = (
        (filters.status === '' || auction.status === filters.status) &&
        (filters.car === '' || auction.car === filters.car)
      )
      return matchesSearch && matchesFilters
    })
    setFilteredAuctions(results)
    setCurrentPage(1)
  }, [searchTerm, filters, auctions])

  // Pagination
  const indexOfLast = currentPage * auctionsPerPage
  const indexOfFirst = indexOfLast - auctionsPerPage
  const currentAuctions = filteredAuctions.slice(indexOfFirst, indexOfLast)
  const totalPages = Math.ceil(filteredAuctions.length / auctionsPerPage)
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)
  const cars = [...new Set(auctions.map(a => a.car))]

  // إضافة مزاد جديد
  const handleAddAuction = (auction: Omit<Auction, 'id' | 'currentBid' | 'bids' | 'watchers' | 'status'>) => {
    setAuctions(prev => [
      {
        ...auction,
        id: prev.length ? Math.max(...prev.map(a => a.id)) + 1 : 1,
        currentBid: auction.startPrice,
        bids: 0,
        watchers: 0,
        status: 'جاري'
      } as Auction,
      ...prev
    ])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <AuctionModal open={showModal} onClose={() => setShowModal(false)} onSubmit={handleAddAuction} />
      <div className="max-w-7xl mx-auto">
        {/* العنوان */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-extrabold text-indigo-800 mb-2 flex items-center gap-2"
            >
              <FaGavel className="text-indigo-600" />
              المزادات
            </motion.h1>
            <p className="text-gray-600">تابع أحدث المزادات، شارك أو أضف مزاد جديد!</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-bold text-lg"
            onClick={() => setShowModal(true)}
            aria-label="إضافة مزاد جديد"
          >
            <FiPlus className="ml-2" />
            <span>إضافة مزاد جديد</span>
          </motion.button>
        </div>
        {/* بحث وفلاتر */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <motion.div className="relative flex-grow" whileHover={{ scale: 1.01 }}>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ابحث عن مزاد أو سيارة أو مالك..."
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">حالة المزاد</label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">الكل</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">السيارة</label>
                  <select
                    name="car"
                    value={filters.car}
                    onChange={e => setFilters(f => ({ ...f, car: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">الكل</option>
                    {cars.map(car => (
                      <option key={car} value={car}>{car}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilters({ status: '', car: '' })}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500"
          >
            <h3 className="text-gray-500 mb-2">إجمالي المزادات</h3>
            <p className="text-3xl font-bold">{auctions.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500"
          >
            <h3 className="text-gray-500 mb-2">المزادات الجارية</h3>
            <p className="text-3xl font-bold">{auctions.filter(a => a.status === 'جاري').length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500"
          >
            <h3 className="text-gray-500 mb-2">المزادات المنتهية</h3>
            <p className="text-3xl font-bold">{auctions.filter(a => a.status === 'منتهي').length}</p>
          </motion.div>
        </div>
        {/* حالة التحميل */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md p-8 animate-pulse h-72" />
            ))}
          </div>
        )}
        {/* لا توجد نتائج */}
        {!loading && filteredAuctions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-md p-12 text-center"
          >
            <div className="text-gray-400 mb-4">
              <FaGavel size={48} className="mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">لا توجد مزادات متطابقة</h3>
            <p className="text-gray-500 mb-6">لم نتمكن من العثور على أي مزادات تطابق بحثك أو فلاترك.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setFilters({ status: '', car: '' }); setSearchTerm('') }}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              عرض جميع المزادات
            </motion.button>
          </motion.div>
        )}
        {/* شبكة المزادات */}
        {!loading && filteredAuctions.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentAuctions.map((auction, idx) => (
                <motion.div
                  key={auction.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  className={`relative group bg-white rounded-2xl shadow-xl overflow-hidden border-2 ${
                    auction.status === 'منتهي'
                      ? 'border-red-200'
                      : auction.status === 'جاري'
                      ? 'border-green-200'
                      : 'border-yellow-200'
                  }`}
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={auction.image}
                      alt={auction.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow ${
                      auction.status === 'منتهي'
                        ? 'bg-red-600 text-white'
                        : auction.status === 'جاري'
                        ? 'bg-green-600 text-white'
                        : 'bg-yellow-500 text-white'
                    }`}>
                      {auction.status}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <FaCar className="text-indigo-400" />
                      <span className="text-lg font-bold text-indigo-800">{auction.car}</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-900 mb-2">{auction.title}</h2>
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <FiUser />
                      <span className="text-sm">{auction.owner}</span>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-1 text-gray-700">
                        <FiClock className="text-indigo-500" />
                        {auction.status === 'جاري'
                          ? <Countdown endTime={auction.endTime} />
                          : <span className="font-mono text-sm">انتهى</span>
                        }
                      </div>
                      <div className="flex items-center gap-1 text-gray-700">
                        <FaGavel className="text-yellow-500" />
                        <span className="font-mono text-sm">{auction.bids} مزايدة</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-700">
                        <FiEye className="text-blue-400" />
                        <span className="font-mono text-sm">{auction.watchers} متابع</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <div>
                        <span className="text-xs text-gray-500">سعر البدء</span>
                        <div className="font-bold text-indigo-700">{auction.startPrice.toLocaleString()} ر.س</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">أعلى مزايدة</span>
                        <div className="font-bold text-green-600">{auction.currentBid.toLocaleString()} ر.س</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  عرض <span className="font-medium">{indexOfFirst + 1}</span> إلى <span className="font-medium">
                    {Math.min(indexOfLast, filteredAuctions.length)}
                  </span> من <span className="font-medium">{filteredAuctions.length}</span> مزاد
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