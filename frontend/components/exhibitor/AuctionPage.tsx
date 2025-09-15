'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch, FiFilter, FiPlus, FiX, FiChevronLeft, FiChevronRight, FiEye, FiClock, FiUser, FiRefreshCw
} from 'react-icons/fi'
import { FaGavel, FaCar } from 'react-icons/fa'

/** ========= الإعدادات ========= **/
const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
const API_BASE = `${API_ROOT}/api` // نضمن /api مرة واحدة فقط
const TOKEN_KEY = 'token' // ← اسم مفتاح التوكن في localStorage

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(TOKEN_KEY)
  if (!raw) return null
  // في حال اتخزن التوكن كنص مقتبس
  return raw.replace(/^"(.+)"$/, '$1')
}

function authHeaders() {
  const token = getToken()
  const h: Record<string, string> = { Accept: 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

// جلب JSON مع رسائل أخطاء واضحة (401/HTML/…)
async function fetchJSON<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init?.headers || {}), ...authHeaders() },
  })

  const text = await res.text()
  let data: any
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    const snippet = text?.slice(0, 200) || ''
    throw new Error(`HTTP ${res.status} @ ${url}\nالرد ليس JSON:\n${snippet}`)
  }

  if (!res.ok) {
    // Laravel بيبعت "Unauthenticated." في 401
    if (res.status === 401) {
      throw new Error('غير مصرح: يرجى تسجيل الدخول مرة أخرى (401).')
    }
    const msg = data?.message || data?.error || `HTTP ${res.status}`
    throw new Error(msg)
  }
  return data as T
}

function arStatusLabel(s: string) {
  switch (s) {
    case 'live': return 'جاري'
    case 'scheduled': return 'قادم'
    case 'ended': return 'منتهي'
    case 'canceled': return 'ملغي'
    case 'failed': return 'فاشل'
    case 'completed': return 'مكتمل'
    default: return s
  }
}

function statusChipColor(s: string) {
  return s === 'live' ? 'bg-green-600 text-white'
    : s === 'scheduled' ? 'bg-yellow-500 text-white'
    : s === 'ended' ? 'bg-red-600 text-white'
    : 'bg-gray-500 text-white'
}

type AuctionStatusApi = 'scheduled' | 'live' | 'ended' | 'canceled' | 'failed' | 'completed'

interface CarApi {
  id: number
  make: string
  model: string
  year: number
  images?: string[] | null
  evaluation_price?: number | null
}

interface BidApi {
  id: number
  bid_amount: number
  created_at: string
  user_id: number
}

interface AuctionApi {
  id: number
  car_id: number
  car: CarApi
  starting_bid: number
  current_bid: number
  reserve_price?: number | null
  min_price?: number | null
  max_price?: number | null
  start_time: string
  end_time: string
  extended_until?: string | null
  status: AuctionStatusApi
  bids?: BidApi[]
  broadcasts?: any[]
}

interface Paged<T> {
  current_page: number
  data: T[]
  per_page: number
  total: number
  last_page: number
}

interface UiAuction {
  id: number
  carLabel: string
  image: string
  startPrice: number
  currentBid: number
  endTimeIso: string
  statusApi: AuctionStatusApi
  statusAr: string
  bidsCount: number
  watchers: number
  owner?: string
}

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop'

/** ========= عدّاد تنازلي ========= **/
function Countdown({ endIso }: { endIso: string }) {
  const [t, setT] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime()
      const end = new Date(endIso).getTime()
      const diff = end - now
      if (diff <= 0) { setT('انتهى'); return }
      const h = Math.floor(diff / 1000 / 60 / 60)
      const m = Math.floor((diff / 1000 / 60) % 60)
      const s = Math.floor((diff / 1000) % 60)
      setT(`${h}س ${m}د ${s}ث`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [endIso])

  return <span className="font-mono text-sm">{t}</span>
}

/** ========= مودال إنشاء مزاد فوري الآن ========= **/
function StartLiveModal({
  open, onClose, onCreated
}: {
  open: boolean
  onClose: () => void
  onCreated: (created: UiAuction) => void
}) {
  const [cars, setCars] = useState<CarApi[]>([])
  const [loadingCars, setLoadingCars] = useState(false)
  const [form, setForm] = useState({
    car_id: '',
    starting_bid: '',
    reserve_price: '',
    min_price: '',
    max_price: ''
  })
  const [errors, setErrors] = useState<{ [k: string]: string }>({})
  const firstInputRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (open) {
      setErrors({})
      setForm({ car_id: '', starting_bid: '', reserve_price: '', min_price: '', max_price: '' })
      setTimeout(() => firstInputRef.current?.focus(), 100)
      // جلب سيارات المعرض المتاحة فقط
      const run = async () => {
        try {
          const token = getToken()
          if (!token) throw new Error('غير مصرح: لا يوجد توكن. سجّل الدخول أولاً.')
          setLoadingCars(true)
          const js = await fetchJSON<{ status: string; data: Paged<CarApi> }>(
            `${API_BASE}/cars?auction_status=available&sort_by=created_at&sort_dir=desc`
          )
          setCars(Array.isArray(js?.data?.data) ? js.data.data : [])
        } catch (e: any) {
          setCars([])
          setErrors(prev => ({ ...prev, global: e.message }))
        } finally {
          setLoadingCars(false)
        }
      }
      run()
    }
  }, [open])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.car_id) e.car_id = 'السيارة مطلوبة'
    if (!form.starting_bid || Number(form.starting_bid) < 1000) e.starting_bid = 'سعر البدء غير صحيح'
    if (form.reserve_price && Number(form.reserve_price) < 0) e.reserve_price = 'قيمة غير صحيحة'
    if (!form.min_price || !form.max_price) e.minmax = 'أدخل حد أدنى وأقصى موصى به'
    if (form.min_price && form.max_price && Number(form.min_price) > Number(form.max_price)) e.minmax = 'الحد الأدنى يجب أن يكون ≤ الحد الأعلى'
    return e
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return

    try {
      const token = getToken()
      if (!token) throw new Error('غير مصرح: لا يوجد توكن. سجّل الدخول أولاً.')

      const payload = {
        car_id: Number(form.car_id),
        starting_bid: Number(form.starting_bid),
        reserve_price: form.reserve_price ? Number(form.reserve_price) : 0,
        min_price: Number(form.min_price),
        max_price: Number(form.max_price)
      }
      const js = await fetchJSON<{ status: string; message: string; data: AuctionApi }>(
        `${API_BASE}/auction`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )

      const a: AuctionApi = js.data
      const car = cars.find(c => c.id === a.car_id)
      const ui: UiAuction = {
        id: a.id,
        carLabel: car ? `${car.make} ${car.model} ${car.year}` : `#${a.car_id}`,
        image: (car?.images && car.images[0]) || PLACEHOLDER_IMG,
        startPrice: a.starting_bid,
        currentBid: a.current_bid,
        endTimeIso: a.extended_until || a.end_time,
        statusApi: a.status,
        statusAr: arStatusLabel(a.status),
        bidsCount: a.bids?.length || 0,
        watchers: Array.isArray(a.broadcasts) ? a.broadcasts.length : 0
      }
      onCreated(ui)
      onClose()
    } catch (err: any) {
      setErrors({ global: err.message || 'حدث خطأ غير متوقع' })
    }
  }

  const backdropRef = useRef<HTMLDivElement>(null)
  const closeOnBackdrop = (e: React.MouseEvent) => { if (e.target === backdropRef.current) onClose() }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={backdropRef}
          onMouseDown={closeOnBackdrop}
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          aria-modal="true" role="dialog"
        >
          <motion.div
            initial={{ scale: .95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: .95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 relative"
            onMouseDown={e => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute left-4 top-4 text-gray-400 hover:text-gray-700">
              <FiX size={22} />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 text-center">بدء حراج مباشر الآن</h2>

            {errors.global && <div className="mb-3 p-3 rounded bg-red-50 text-red-700 text-sm whitespace-pre-wrap">{errors.global}</div>}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block mb-1 text-gray-700">السيارة</label>
                <select
                  ref={firstInputRef}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.car_id ? 'border-red-400' : 'border-gray-300'}`}
                  value={form.car_id}
                  onChange={e => setForm(f => ({ ...f, car_id: e.target.value }))}
                >
                  <option value="">{loadingCars ? '...جاري التحميل' : 'اختر سيارة متاحة'}</option>
                  {cars.map(c => (
                    <option key={c.id} value={c.id}>{`${c.make} ${c.model} ${c.year}`}</option>
                  ))}
                </select>
                {errors.car_id && <div className="text-red-500 text-xs mt-1">{errors.car_id}</div>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-gray-700">سعر البدء (ر.س)</label>
                  <input
                    type="number"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.starting_bid ? 'border-red-400' : 'border-gray-300'}`}
                    value={form.starting_bid}
                    onChange={e => setForm(f => ({ ...f, starting_bid: e.target.value }))}
                    min={1000}
                  />
                  {errors.starting_bid && <div className="text-red-500 text-xs mt-1">{errors.starting_bid}</div>}
                </div>
                <div>
                  <label className="block mb-1 text-gray-700">حد البيع (اختياري)</label>
                  <input
                    type="number"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.reserve_price ? 'border-red-400' : 'border-gray-300'}`}
                    value={form.reserve_price}
                    onChange={e => setForm(f => ({ ...f, reserve_price: e.target.value }))}
                    min={0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-gray-700">حد أدنى موصى به</label>
                  <input
                    type="number"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.minmax ? 'border-red-400' : 'border-gray-300'}`}
                    value={form.min_price}
                    onChange={e => setForm(f => ({ ...f, min_price: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-700">حد أقصى موصى به</label>
                  <input
                    type="number"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.minmax ? 'border-red-400' : 'border-gray-300'}`}
                    value={form.max_price}
                    onChange={e => setForm(f => ({ ...f, max_price: e.target.value }))}
                  />
                </div>
              </div>
              {errors.minmax && <div className="text-red-500 text-xs mt-1">{errors.minmax}</div>}

              <button
                type="submit"
                className="w-full py-3 mt-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors text-lg"
              >
                بدء الحراج الآن
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** ========= الصفحة الرئيسية ========= **/
export default function DealerAuctionsPage() {
  const [list, setList] = useState<UiAuction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'live' | 'scheduled' | 'ended'>('')
  const [showFilters, setShowFilters] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Pagination (من الباك-إند)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [lastPage, setLastPage] = useState(1)

  // تحديث تلقائي للمزادات النشطة
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchAuctions = async (opts?: { page?: number; status?: string }) => {
    const p = opts?.page ?? page
    const s = opts?.status ?? statusFilter
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      if (!token) throw new Error('غير مصرح: لا يوجد توكن. سجّل الدخول أولاً.')

      const qs = new URLSearchParams()
      qs.set('sort_by', 'created_at')
      qs.set('sort_dir', 'desc')
      qs.set('per_page', String(perPage))
      if (s) qs.set('status', String(s))
      qs.set('page', String(p))

      const js = await fetchJSON<{ status: string; data: Paged<AuctionApi> }>(
        `${API_BASE}/my-auctions?${qs.toString()}`
      )

      const pg: Paged<AuctionApi> = js.data
      const rows = Array.isArray(pg?.data) ? pg.data : []
      const transformed: UiAuction[] = rows.map(a => {
        const carLabel = a.car ? `${a.car.make} ${a.car.model} ${a.car.year}` : `#${a.car_id}`
        const image = (a.car?.images && a.car.images[0]) || PLACEHOLDER_IMG
        const endIso = (a.extended_until && a.extended_until !== 'null') ? a.extended_until! : a.end_time
        return {
          id: a.id,
          carLabel,
          image,
          startPrice: a.starting_bid,
          currentBid: a.current_bid,
          endTimeIso: endIso,
          statusApi: a.status,
          statusAr: arStatusLabel(a.status),
          bidsCount: a.bids?.length || 0,
          watchers: Array.isArray(a.broadcasts) ? a.broadcasts.length : 0
        }
      })

      setList(transformed)
      setPage(pg.current_page)
      setPerPage(pg.per_page)
      setTotal(pg.total)
      setLastPage(pg.last_page)
    } catch (e: any) {
      setError(e.message || 'حدث خطأ')
      setList([])
    } finally {
      setLoading(false)
    }
  }

  // أول تحميل
  useEffect(() => { fetchAuctions({ page: 1 }) /* eslint-disable-next-line */ }, [])

  // إعادة الجلب عند تغيير الفلاتر/الصفحة
  useEffect(() => { fetchAuctions({ page, status: statusFilter }) /* eslint-disable-next-line */ }, [statusFilter, page])

  // Polling للمزادات النشطة فقط
  useEffect(() => {
    if (pollRef.current) { clearInterval(pollRef.current) }
    const hasLive = list.some(a => a.statusApi === 'live')
    if (hasLive) {
      pollRef.current = setInterval(() => {
        fetchAuctions({ page, status: statusFilter })
      }, 5000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [list, page, statusFilter])

  // بحث محلي باسم السيارة/الحالة
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const base = list
    if (!q) return base
    return base.filter(a =>
      a.carLabel.toLowerCase().includes(q)
      || a.statusAr.includes(searchTerm)
    )
  }, [list, searchTerm])

  const liveCount = filtered.filter(a => a.statusApi === 'live').length
  const endedCount = filtered.filter(a => a.statusApi === 'ended').length

  const onCreated = (created: UiAuction) => {
    // بعد إنشاء مزاد فوري: ضيفه في أعلى القائمة وارجع للصفحة 1
    setList(prev => [created, ...prev])
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <StartLiveModal open={showModal} onClose={() => setShowModal(false)} onCreated={onCreated} />
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
              حراج المعرض
            </motion.h1>
            <p className="text-gray-600">إدارة مزاداتك الحيّة والفورية من مكان واحد.</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center px-5 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              onClick={() => fetchAuctions({ page })}
              aria-label="تحديث"
              title="تحديث"
            >
              <FiRefreshCw className="ml-2" />
              تحديث
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-bold text-lg"
              onClick={() => setShowModal(true)}
              aria-label="بدء حراج مباشر"
            >
              <FiPlus className="ml-2" />
              <span>بدء حراج مباشر</span>
            </motion.button>
          </div>
        </div>

        {/* شريط البحث والفلاتر */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <motion.div className="relative flex-grow" whileHover={{ scale: 1.01 }}>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ابحث باسم السيارة..."
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
              transition={{ duration: 0.25 }}
              className="bg-white p-6 rounded-xl shadow-md mb-6 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">حالة المزاد</label>
                  <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value as any); setPage(1) }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">الكل</option>
                    <option value="live">جاري</option>
                    <option value="scheduled">قادم</option>
                    <option value="ended">منتهي</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setStatusFilter(''); setShowFilters(false); setPage(1) }}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  تطبيق
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500"
          >
            <h3 className="text-gray-500 mb-2">إجمالي (صفحة حالية)</h3>
            <p className="text-3xl font-bold">{filtered.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500"
          >
            <h3 className="text-gray-500 mb-2">جارية</h3>
            <p className="text-3xl font-bold">{liveCount}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500"
          >
            <h3 className="text-gray-500 mb-2">منتهية</h3>
            <p className="text-3xl font-bold">{endedCount}</p>
          </motion.div>
        </div>

        {/* رسائل الحالة */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg whitespace-pre-wrap">{error}</div>
        )}

        {/* التحميل */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md p-8 animate-pulse h-64" />
            ))}
          </div>
        )}

        {/* لا توجد نتائج */}
        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-gray-400 mb-4"><FaGavel size={48} className="mx-auto" /></div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">لا توجد مزادات</h3>
            <p className="text-gray-500 mb-6">أضف مزادًا جديدًا أو غيّر الفلاتر.</p>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setStatusFilter(''); setSearchTerm(''); fetchAuctions({ page: 1, status: '' }) }}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              عرض الكل
            </motion.button>
          </motion.div>
        )}

        {/* شبكة المزادات */}
        {!loading && filtered.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((auction, idx) => (
                <motion.div
                  key={auction.id}
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  className={`relative group bg-white rounded-2xl shadow-xl overflow-hidden border-2 ${
                    auction.statusApi === 'ended'
                      ? 'border-red-200'
                      : auction.statusApi === 'live'
                      ? 'border-green-200'
                      : 'border-yellow-200'
                  }`}
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={auction.image}
                      alt={auction.carLabel}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow ${statusChipColor(auction.statusApi)}`}>
                      {auction.statusAr}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <FaCar className="text-indigo-400" />
                      <span className="text-lg font-bold text-indigo-800">{auction.carLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 mb-3">
                      <FiUser />
                      <span className="text-sm">معرضك</span>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-1 text-gray-700">
                        <FiClock className="text-indigo-500" />
                        {auction.statusApi === 'live'
                          ? <Countdown endIso={auction.endTimeIso} />
                          : <span className="font-mono text-sm">{auction.statusApi === 'scheduled' ? 'قريبًا' : 'انتهى'}</span>
                        }
                      </div>
                      <div className="flex items-center gap-1 text-gray-700">
                        <FaGavel className="text-yellow-500" />
                        <span className="font-mono text-sm">{auction.bidsCount} مزايدة</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-700">
                        <FiEye className="text-blue-400" />
                        <span className="font-mono text-sm">{auction.watchers} متابع</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 mt-3">
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

            {/* ترقيم الصفحات من الباك-إند */}
            {lastPage > 1 && (
              <div className="mt-8 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  صفحة <span className="font-medium">{page}</span> من <span className="font-medium">{lastPage}</span> — إجمالي <span className="font-medium">{total}</span>
                </div>
                <nav className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft />
                  </button>
                  {Array.from({ length: lastPage }, (_, i) => i + 1)
                    .slice(Math.max(0, page - 3), Math.min(lastPage, page + 2))
                    .map(n => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          page === n ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  <button
                    onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                    disabled={page === lastPage}
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
