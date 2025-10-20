'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch, FiFilter, FiPlus, FiX, FiChevronLeft, FiChevronRight, FiEye, FiClock, FiUser, FiRefreshCw
} from 'react-icons/fi'
import { FaGavel, FaCar } from 'react-icons/fa'
import api from '@/lib/axios'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

/** ========= الإعدادات (بدون تعديل على المنطق) ========= **/
const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
const API_BASE = `${API_ROOT}/api`
const TOKEN_KEY = 'token'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(TOKEN_KEY)
  if (!raw) return null
  return raw.replace(/^"(.+)"$/, '$1')
}

function authHeaders() {
  const token = getToken()
  const h: Record<string, string> = { Accept: 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

// جلب JSON مع رسائل أخطاء واضحة (كما هي)
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
    if (res.status === 401) throw new Error('غير مصرح: يرجى تسجيل الدخول مرة أخرى (401).')
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

// ألوان الشارة — تحسين بصري فقط
function statusChipColor(s: string) {
  return s === 'live' ? 'bg-emerald-600 text-white'
    : s === 'scheduled' ? 'bg-amber-500 text-white'
    : s === 'ended' ? 'bg-rose-600 text-white'
    : 'bg-slate-600 text-white'
}

type AuctionStatusApi = 'scheduled' | 'live' | 'ended' | 'canceled' | 'failed' | 'completed'

interface CarApi {
  id: number
  make: string
  model: string
  year: number
  images?: string[] | null
  evaluation_price?: number | null
  min_price?: number | null
  max_price?: number | null
  user_id?: number | null
  owner_id?: number | null
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

/** شكل الجلسة طبقًا لمسار الباك الجديد (بدون تغيير) **/
interface AuctionSession {
  id: number
  name: string
  session_date: string
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  type: 'live' | 'instant' | 'silent'
  auctions_count?: number
  created_at?: string
  updated_at?: string
}

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop'

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

/** ========= Utilities ========= **/
function extractArray<T = any>(js: any, key: string): T[] | null {
  if (Array.isArray(js?.[key])) return js[key]
  if (Array.isArray(js?.data?.[key])) return js.data[key]
  if (Array.isArray(js?.data?.data)) return js.data.data
  if (Array.isArray(js?.data)) return js.data
  if (Array.isArray(js)) return js
  return null
}

// محاولة إحضار user_id من عدة مسارات شائعة
async function readMyUserId(): Promise<number | null> {
  const candidates = [
    `${API_BASE}/me`,
    `${API_BASE}/auth/me`,
    `${API_BASE}/user`,
    `${API_BASE}/profile`,
  ]
  for (const url of candidates) {
    try {
      const js: any = await fetchJSON(url)
      const id = js?.data?.id ?? js?.id ?? js?.user?.id ?? null
      if (typeof id === 'number') return id
      if (typeof id === 'string' && /^\d+$/.test(id)) return Number(id)
    } catch { /* skip */ }
  }
  return null
}

/** ========= جلب سيارات المستخدم فقط ========= **/
async function fetchMyCarsOnly(): Promise<CarApi[]> {
  const myId = await readMyUserId().catch(() => null)

  const urls: string[] = []
  if (myId != null) {
    urls.push(`${API_BASE}/cars?user_id=${myId}&sort_by=created_at&sort_dir=desc`)
    urls.push(`${API_BASE}/cars?owner_id=${myId}&sort_by=created_at&sort_dir=desc`)
  }
  urls.push(`${API_BASE}/my-cars?sort_by=created_at&sort_dir=desc`)
  urls.push(`${API_BASE}/cars?mine=1&sort_by=created_at&sort_dir=desc`)
  urls.push(`${API_BASE}/cars?user_id=me&sort_by=created_at&sort_dir=desc`)

  for (const url of urls) {
    try {
      const js: any = await fetchJSON(url)
      const arr = extractArray<CarApi>(js, 'cars') ?? extractArray<CarApi>(js, 'data') ?? null
      if (arr && arr.length) {
        if (myId != null) {
          return arr.filter(c =>
            (c.user_id != null && c.user_id === myId) ||
            (c.owner_id != null && c.owner_id === myId) ||
            (c.user_id == null && c.owner_id == null)
          )
        }
        return arr
      }
    } catch { /* try next */ }
  }
  return []
}

/** ========= جلب الجلسات من المسار العام الجديد ========= **/
async function fetchPublicSessions(): Promise<AuctionSession[]> {
  try {
    const js: any = await fetchJSON(`${API_BASE}/sessions/active-scheduled?with_counts=1`)
    const arr = extractArray<AuctionSession>(js, 'data') ?? extractArray<AuctionSession>(js, 'sessions') ?? js
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function sessionLabel(s: AuctionSession) {
  const dateTxt = s.session_date
    ? ` — ${format(new Date(s.session_date), 'dd MMMM yyyy', { locale: ar })}`
    : ''
  return `${s.name}${dateTxt}`
}

/** ========= مودال إنشاء مزاد فوري الآن (تحسينات شكل فقط) ========= **/
function StartLiveModal({
  open, onClose, onCreated
}: {
  open: boolean
  onClose: () => void
  onCreated: (created: UiAuction) => void
}) {
  const [cars, setCars] = useState<CarApi[]>([])
  const [loadingCars, setLoadingCars] = useState(false)

  const [sessions, setSessions] = useState<AuctionSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [sessionsError, setSessionsError] = useState<string | null>(null)

  const [form, setForm] = useState({
    car_id: '',
    car_price: '',
    starting_bid: '',
    min_price: '',
    max_price: '',
    session_id: ''
  })
  const [errors, setErrors] = useState<{ [k: string]: string }>({})
  const firstInputRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (open) {
      setErrors({})
      setSessionsError(null)
      setForm({ car_id: '', car_price: '', starting_bid: '', min_price: '', max_price: '', session_id: '' })
      setTimeout(() => firstInputRef.current?.focus(), 100)

      const run = async () => {
        try {
          const token = getToken()
          if (!token) throw new Error('غير مصرح: لا يوجد توكن. سجّل الدخول أولاً.')
          setLoadingCars(true)
          setLoadingSessions(true)

          const [mine, sess] = await Promise.all([
            fetchMyCarsOnly(),
            fetchPublicSessions(),
          ])

          setCars(Array.isArray(mine) ? mine : [])
          setSessions(Array.isArray(sess) ? sess : [])

          if (Array.isArray(mine) && mine.length === 0) {
            setErrors(prev => ({ ...prev, carsEmpty: 'لا توجد سيارات مرتبطة بحسابك.' }))
          }

          if (!sess || sess.length === 0) {
            setSessionsError('لا توجد جلسات متاحة (active / scheduled).')
          }
        } catch (e: any) {
          setCars([])
          setSessions([])
          setSessionsError(e?.message || 'تعذر جلب الجلسات.')
          setErrors(prev => ({ ...prev, global: e?.message || 'حدث خطأ غير متوقع' }))
        } finally {
          setLoadingCars(false)
          setLoadingSessions(false)
        }
      }
      run()
    }
  }, [open])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.car_id) e.car_id = 'السيارة مطلوبة'
    if (!form.session_id) e.session_id = 'الجلسة مطلوبة'
    if (!form.starting_bid || Number(form.starting_bid) < 1000) e.starting_bid = 'سعر البدء غير صحيح'
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

      const payload: any = {
        car_id: Number(form.car_id),
        starting_bid: Number(form.starting_bid),
        min_price: Number(form.min_price),
        max_price: Number(form.max_price),
        session_id: Number(form.session_id),
      }

      const res = await api.post('/api/auction', payload)
      const js = res.data as { status?: string; message?: string; data: AuctionApi }

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
      setErrors({ global: err?.response?.data?.message || err.message || 'حدث خطأ غير متوقع' })
    }
  }

  const backdropRef = useRef<HTMLDivElement>(null)
  const closeOnBackdrop = (e: React.MouseEvent) => { if (e.target === backdropRef.current) onClose() }

  // عند اختيار السيارة: نملأ car_price / min/max تلقائيًا
  const onSelectCar = (val: string) => {
    const idNum = Number(val)
    const selected = cars.find(c => c.id === idNum)
    setForm(f => ({
      ...f,
      car_id: val,
      car_price: selected?.evaluation_price != null ? String(selected.evaluation_price) : '',
      min_price: selected?.min_price != null ? String(selected.min_price) : f.min_price,
      max_price: selected?.max_price != null ? String(selected.max_price) : f.max_price,
    }))
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={backdropRef}
          onMouseDown={closeOnBackdrop}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          aria-modal="true" role="dialog"
        >
          <motion.div
            initial={{ scale: .95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: .95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="bg-slate-900/95 text-slate-100 w-full max-w-xl rounded-2xl shadow-2xl p-6 relative border border-slate-800"
            onMouseDown={e => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute left-4 top-4 text-slate-400 hover:text-slate-200" aria-label="إغلاق">
              <FiX size={22} />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center">بدء حراج مباشر الآن</h2>

            {errors.global && <div className="mb-3 p-3 rounded-lg bg-rose-900/30 border border-rose-700 text-rose-200 text-sm whitespace-pre-wrap">{errors.global}</div>}

            <form onSubmit={submit} className="space-y-4">
              {/* السيارة */}
              <div>
                <label className="block mb-1 text-slate-300">السيارة</label>
                <select
                  ref={firstInputRef}
                  className={`w-full px-4 py-2 rounded-lg outline-none bg-slate-900/70 text-slate-100 placeholder-slate-500 border focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 ${errors.car_id ? 'border-rose-600' : 'border-slate-700'}`}
                  value={form.car_id}
                  onChange={e => onSelectCar(e.target.value)}
                >
                  <option value="">
                    {loadingCars ? '...جاري تحميل سياراتك' : (cars.length ? 'اختر سيارة من سيارات حسابك' : 'لا توجد سيارات مرتبطة بحسابك')}
                  </option>
                  {cars.map(c => (
                    <option key={c.id} value={c.id}>{`${c.make} ${c.model} ${c.year}`}</option>
                  ))}
                </select>
                {errors.car_id && <div className="text-rose-400 text-xs mt-1">{errors.car_id}</div>}
                {errors.carsEmpty && !loadingCars && <div className="text-slate-400 text-xs mt-1">{errors.carsEmpty}</div>}
              </div>

              {/* الجلسة */}
              <div>
                <label className="block mb-1 text-slate-300">الجلسة</label>
                <select
                  className={`w-full px-4 py-2 rounded-lg outline-none bg-slate-900/70 text-slate-100 placeholder-slate-500 border focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 ${errors.session_id ? 'border-rose-600' : 'border-slate-700'}`}
                  value={form.session_id}
                  onChange={e => setForm(f => ({ ...f, session_id: e.target.value }))}
                >
                  <option value="">
                    {loadingSessions
                      ? '...جاري تحميل الجلسات'
                      : sessions.length
                        ? `اختر جلسة (${sessions.length})`
                        : (sessionsError ? 'تعذر جلب الجلسات' : 'لا توجد جلسات')}
                  </option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{sessionLabel(s)}</option>
                  ))}
                </select>
                {sessionsError && !loadingSessions && <div className="text-rose-400 text-xs mt-1">{sessionsError}</div>}
                {errors.session_id && <div className="text-rose-400 text-xs mt-1">{errors.session_id}</div>}
              </div>

              {/* سعر السيارة (عرض فقط) */}
              <div>
                <label className="block mb-1 text-slate-300">سعر السيارة (تقييم)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 rounded-lg outline-none bg-slate-900/60 text-slate-200 border border-slate-700"
                  value={form.car_price}
                  readOnly
                  placeholder="يُملأ تلقائيًا من تقييم السيارة"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-slate-300">سعر البدء (ر.س)</label>
                  <input
                    type="number"
                    className={`w-full px-4 py-2 rounded-lg outline-none bg-slate-900/70 text-slate-100 placeholder-slate-500 border focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 ${errors.starting_bid ? 'border-rose-600' : 'border-slate-700'}`}
                    value={form.starting_bid}
                    onChange={e => setForm(f => ({ ...f, starting_bid: e.target.value }))}
                    min={1000}
                  />
                  {errors.starting_bid && <div className="text-rose-400 text-xs mt-1">{errors.starting_bid}</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-slate-300">حد أدنى موصى به</label>
                <input
                    type="number"
                    className={`w-full px-4 py-2 rounded-lg outline-none bg-slate-900/70 text-slate-100 placeholder-slate-500 border focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 ${errors.minmax ? 'border-rose-600' : 'border-slate-700'}`}
                    value={form.min_price}
                    onChange={e => setForm(f => ({ ...f, min_price: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-300">حد أقصى موصى به</label>
                  <input
                    type="number"
                    className={`w-full px-4 py-2 rounded-lg outline-none bg-slate-900/70 text-slate-100 placeholder-slate-500 border focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 ${errors.minmax ? 'border-rose-600' : 'border-slate-700'}`}
                    value={form.max_price}
                    onChange={e => setForm(f => ({ ...f, max_price: e.target.value }))}
                  />
                </div>
              </div>
              {errors.minmax && <div className="text-rose-400 text-xs mt-1">{errors.minmax}</div>}

              <button
                type="submit"
                className="w-full py-3 mt-2 rounded-lg font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 transition-colors text-lg"
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

/** ========= الصفحة الرئيسية (تحسينات شكل فقط) ========= **/
export default function DealerAuctionsPage() {
  const [list, setList] = useState<UiAuction[]>([])
  const [loading, setLoading] = useState(true)
  const [bgLoading, setBgLoading] = useState(false) // تحميل صامت أثناء الـ polling
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
  const inflightRef = useRef<AbortController | null>(null)

  const fetchAuctions = async (opts?: { page?: number; status?: string; silent?: boolean }) => {
    const p = opts?.page ?? page
    const s = opts?.status ?? statusFilter
    const silent = opts?.silent ?? false

    if (!silent) setLoading(true); else setBgLoading(true)
    setError(null)

    try {
      const token = getToken()
      if (!token) throw new Error('غير مصرح: لا يوجد توكن. سجّل الدخول أولاً.')

      // أوقف أي طلب سابق لتفادي سباقات الردود
      if (inflightRef.current) inflightRef.current.abort()
      const ac = new AbortController()
      inflightRef.current = ac

      const qs = new URLSearchParams()
      qs.set('sort_by', 'created_at')
      qs.set('sort_dir', 'desc')
      qs.set('per_page', String(perPage))
      if (s) qs.set('status', String(s))
      qs.set('page', String(p))

      const js = await fetchJSON<{ status: string; data: Paged<AuctionApi> }>(
        `${API_BASE}/my-auctions?${qs.toString()}`,
        { signal: ac.signal }
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
      setPage(prev => (prev !== pg.current_page ? pg.current_page : prev))
      setPerPage(prev => (prev !== pg.per_page ? pg.per_page : prev))
      setTotal(prev => (prev !== pg.total ? pg.total : prev))
      setLastPage(prev => (prev !== pg.last_page ? pg.last_page : prev))
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        // تجاهل الخطأ لأننا ألغينا الطلب السابق عمدًا
      } else {
        setError(e.message || 'حدث خطأ')
        setList([])
      }
    } finally {
      if (!silent) setLoading(false); else setBgLoading(false)
      inflightRef.current = null
    }
  }

  // أول تحميل
  useEffect(() => { fetchAuctions({ page: 1, silent: false }) /* eslint-disable-next-line */ }, [])

  // إعادة الجلب عند تغيير الفلاتر/الصفحة
  useEffect(() => { fetchAuctions({ page, status: statusFilter, silent: false }) /* eslint-disable-next-line */ }, [statusFilter, page])

  // هل لدينا مزادات لايف؟
  const hasLive = useMemo(() => list.some(a => a.statusApi === 'live'), [list])

  // Polling للمزادات النشطة فقط (بدون فليكر)
  useEffect(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (!hasLive) return

    pollRef.current = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      fetchAuctions({ page, status: statusFilter, silent: true })
    }, 5000)

    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }
  }, [hasLive, page, statusFilter]) // مش مرتبط بـ list مباشرة لتقليل resets

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
    setList(prev => [created, ...prev])
    setPage(1)
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <StartLiveModal open={showModal} onClose={() => setShowModal(false)} onCreated={onCreated} />
      <div className="max-w-7xl mx-auto">
        {/* العنوان */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-extrabold mb-2 flex items-center gap-2"
            >
              <FaGavel className="text-violet-400" />
              حراج المعرض
            </motion.h1>
            <p className="text-slate-400">إدارة مزاداتك الحيّة والفورية من مكان واحد.</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center px-5 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-200 hover:bg-slate-900 transition-colors"
              onClick={() => fetchAuctions({ page, status: statusFilter, silent: false })}
              aria-label="تحديث"
              title="تحديث"
            >
              <FiRefreshCw className={`ml-2 ${bgLoading ? 'animate-spin' : ''}`} />
              {bgLoading ? 'جارٍ التحديث...' : 'تحديث'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center px-6 py-3 rounded-xl text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg"
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
              <FiSearch className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="ابحث باسم السيارة..."
              className="w-full pr-10 pl-4 py-3 rounded-lg outline-none bg-slate-900/70 text-slate-100 placeholder-slate-500 border border-slate-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center px-6 py-3 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-200 hover:bg-slate-900 transition-colors"
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
              className="bg-slate-900/70 text-slate-100 p-6 rounded-xl shadow-xl border border-slate-800 mb-6 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-300 mb-2">حالة المزاد</label>
                  <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value as any); setPage(1) }}
                    className="w-full px-4 py-2 rounded-lg outline-none bg-slate-900/70 text-slate-100 border border-slate-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20"
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
                  className="px-6 py-2 rounded-lg text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
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
            className="bg-slate-900/70 p-6 rounded-xl shadow-xl border border-slate-800"
          >
            <h3 className="text-slate-400 mb-2">إجمالي (صفحة حالية)</h3>
            <p className="text-3xl font-bold text-slate-100">{filtered.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-slate-900/70 p-6 rounded-xl shadow-xl border border-slate-800"
          >
            <h3 className="text-slate-400 mb-2">جارية</h3>
            <p className="text-3xl font-bold text-emerald-400">{liveCount}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-slate-900/70 p-6 rounded-xl shadow-xl border border-slate-800"
          >
            <h3 className="text-slate-400 mb-2">منتهية</h3>
            <p className="text-3xl font-bold text-rose-400">{endedCount}</p>
          </motion.div>
        </div>

        {/* رسائل الحالة */}
        {error && (
          <div className="mb-6 p-4 bg-rose-900/30 border border-rose-700 text-rose-200 rounded-lg whitespace-pre-wrap">{error}</div>
        )}

        {/* التحميل (فقط للجلب الرئيسي غير الصامت) */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl shadow-xl p-8 animate-pulse h-64" />
            ))}
          </div>
        )}

        {/* لا توجد نتائج */}
        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/70 border border-slate-800 rounded-xl shadow-xl p-12 text-center">
            <div className="text-slate-500 mb-4"><FaGavel size={48} className="mx-auto" /></div>
            <h3 className="text-xl font-medium text-slate-100 mb-2">لا توجد مزادات</h3>
            <p className="text-slate-400 mb-6">أضف مزادًا جديدًا أو غيّر الفلاتر.</p>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setStatusFilter(''); setSearchTerm(''); fetchAuctions({ page: 1, status: '', silent: false }) }}
              className="px-6 py-2 rounded-lg text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
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
                  className={`relative group rounded-2xl overflow-hidden shadow-2xl border
                    ${auction.statusApi === 'ended'
                      ? 'border-rose-700/40'
                      : auction.statusApi === 'live'
                      ? 'border-emerald-700/40'
                      : 'border-amber-700/40'} bg-slate-900/70`}
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
                      <FaCar className="text-violet-400" />
                      <span className="text-lg font-bold text-slate-100">{auction.carLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 mb-3">
                      <FiUser />
                      <span className="text-sm">معرضك</span>
                    </div>
                    <div className="flex items-center gap-4 mb-2 text-slate-200">
                      <div className="flex items-center gap-1">
                        <FiClock className="text-violet-400" />
                        {auction.statusApi === 'live'
                          ? <Countdown endIso={auction.endTimeIso} />
                          : <span className="font-mono text-sm">{auction.statusApi === 'scheduled' ? 'قريبًا' : 'انتهى'}</span>
                        }
                      </div>
                      <div className="flex items-center gap-1">
                        <FaGavel className="text-amber-400" />
                        <span className="font-mono text-sm">{auction.bidsCount} مزايدة</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiEye className="text-sky-400" />
                        <span className="font-mono text-sm">{auction.watchers} متابع</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 mt-3">
                      <div>
                        <span className="text-xs text-slate-400">سعر البدء</span>
                        <div className="font-bold text-violet-300">{auction.startPrice.toLocaleString()} ر.س</div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">أعلى مزايدة</span>
                        <div className="font-bold text-emerald-400">{auction.currentBid.toLocaleString()} ر.س</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ترقيم الصفحات من الباك-إند */}
            {lastPage > 1 && (
              <div className="mt-8 flex justify-between items-center">
                <div className="text-sm text-slate-400">
                  صفحة <span className="font-medium text-slate-200">{page}</span> من <span className="font-medium text-slate-200">{lastPage}</span> — إجمالي <span className="font-medium text-slate-200">{total}</span>
                </div>
                <nav className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          page === n
                            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                            : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  <button
                    onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                    disabled={page === lastPage}
                    className="p-2 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
