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

/** ========= الإعدادات ========= **/
const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
const API_BASE = `${API_ROOT}/api`
const TOKEN_KEY = 'token'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(TOKEN_KEY)
  if (!raw) return null
  // إزالة علامات اقتباس محتملة من التخزين
  return raw.replace(/^"(.+)"$/, '$1')
}

function authHeaders() {
  const token = getToken()
  const h: Record<string, string> = { Accept: 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

// جلب JSON مع رسائل أخطاء واضحة
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

// ألوان الشارة (مخفّضة اللمعان)
function statusChipColor(s: string) {
  return s === 'live' ? 'bg-emerald-600/90 text-white'
    : s === 'scheduled' ? 'bg-amber-500/90 text-white'
    : s === 'ended' ? 'bg-rose-600/90 text-white'
    : 'bg-slate-600/90 text-white'
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

/** شكل الجلسة طبقًا لمسار الباك الجديد **/
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

/** ========= عدّاد تنازلي صغير/واضح ========= **/
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
  return <span className="font-mono text-xs md:text-sm">{t}</span>
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

/** ========= جلب الجلسات العامة ========= **/
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

/** ========= مودال إنشاء مزاد فوري (تصميم مضغوط) ========= **/
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

          const [mine, sess] = await Promise.all([fetchMyCarsOnly(), fetchPublicSessions()])

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
            initial={{ scale: .96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: .96, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="bg-slate-900/95 text-slate-100 w-full max-w-xl rounded-2xl shadow-2xl p-5 md:p-6 relative border border-slate-800"
            onMouseDown={e => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute left-4 top-4 text-slate-400 hover:text-slate-200" aria-label="إغلاق">
              <FiX size={20} />
            </button>
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-center">بدء حراج مباشر الآن</h2>

            {errors.global && <div className="mb-3 p-3 rounded-lg bg-rose-900/30 border border-rose-700 text-rose-200 text-sm whitespace-pre-wrap">{errors.global}</div>}

            <form onSubmit={submit} className="space-y-4">
              {/* السيارة */}
              <div>
                <label className="block mb-1 text-slate-300 text-sm">السيارة</label>
                <select
                  ref={firstInputRef}
                  className={`w-full px-3 py-2.5 rounded-lg outline-none bg-slate-900/70 text-slate-100 placeholder-slate-500 border focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 ${errors.car_id ? 'border-rose-600' : 'border-slate-700'}`}
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
                <label className="block mb-1 text-slate-300 text-sm">الجلسة</label>
                <select
                  className={`w-full px-3 py-2.5 rounded-lg outline-none bg-slate-900/70 text-slate-100 placeholder-slate-500 border focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 ${errors.session_id ? 'border-rose-600' : 'border-slate-700'}`}
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
                <label className="block mb-1 text-slate-300 text-sm">سعر السيارة (تقييم)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 rounded-lg outline-none bg-slate-900/60 text-slate-200 border border-slate-700"
                  value={form.car_price}
                  readOnly
                  placeholder="يُملأ تلقائيًا من تقييم السيارة"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-slate-300 text-sm">سعر البدء (ر.س)</label>
                  <input
                    type="number"
                    className={`w-full px-3 py-2.5 rounded-lg outline-none bg-slate-900/70 text-slate-100 placeholder-slate-500 border focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 ${errors.starting_bid ? 'border-rose-600' : 'border-slate-700'}`}
                    value={form.starting_bid}
                    onChange={e => setForm(f => ({ ...f, starting_bid: e.target.value }))}
                    min={1000}
                  />
                  {errors.starting_bid && <div className="text-rose-400 text-xs mt-1">{errors.starting_bid}</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-slate-300 text-sm">حد أدنى موصى به</label>
                  <input
                    type="number"
                    className={`w-full px-3 py-2.5 rounded-lg outline-none bg-slate-900/70 text-slate-100 placeholder-slate-500 border focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 ${errors.minmax ? 'border-rose-600' : 'border-slate-700'}`}
                    value={form.min_price}
                    onChange={e => setForm(f => ({ ...f, min_price: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-300 text-sm">حد أقصى موصى به</label>
                  <input
                    type="number"
                    className={`w-full px-3 py-2.5 rounded-lg outline-none bg-slate-900/70 text-slate-100 placeholder-slate-500 border focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 ${errors.minmax ? 'border-rose-600' : 'border-slate-700'}`}
                    value={form.max_price}
                    onChange={e => setForm(f => ({ ...f, max_price: e.target.value }))}
                  />
                </div>
              </div>
              {errors.minmax && <div className="text-rose-400 text-xs mt-1">{errors.minmax}</div>}

              <button
                type="submit"
                className="w-full py-2.5 mt-1 rounded-lg font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 transition-colors text-base"
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

/** ========= الصفحة الرئيسية (تصميم مضغوط ومتسق) ========= **/
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
      if (e?.name !== 'AbortError') {
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
  }, [hasLive, page, statusFilter])

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

  // مساعد لعرض صورة مع fallback
  const imgOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = PLACEHOLDER_IMG
  }

  // توليد أزرار صفحات مختصرة حول الصفحة الحالية
  const pageWindow = (current: number, last: number, span = 2) => {
    const from = Math.max(1, current - span)
    const to = Math.min(last, current + span)
    return Array.from({ length: to - from + 1 }, (_, i) => from + i)
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-slate-100 py-6 md:py-8 px-4 sm:px-6 lg:px-8">
      <StartLiveModal open={showModal} onClose={() => setShowModal(false)} onCreated={onCreated} />
      <div className="max-w-7xl mx-auto">
        {/* العنوان */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="text-2xl md:text-3xl font-extrabold mb-1.5 flex items-center gap-2"
            >
              <FaGavel className="text-violet-400" />
              حراج المعرض
            </motion.h1>
            <p className="text-slate-400 text-sm md:text-base">إدارة مزاداتك الحيّة والفورية من مكان واحد.</p>
          </div>
          <div className="flex gap-2 md:gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center px-4 md:px-5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-200 hover:bg-slate-900 transition-colors text-sm md:text-base"
              onClick={() => fetchAuctions({ page, status: statusFilter, silent: false })}
              aria-label="تحديث"
              title="تحديث"
            >
              <FiRefreshCw className={`ml-2 ${bgLoading ? 'animate-spin' : ''}`} />
              {bgLoading ? 'جارٍ التحديث...' : 'تحديث'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center px-5 md:px-6 py-2.5 rounded-xl text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg text-sm md:text-base"
              onClick={() => setShowModal(true)}
              aria-label="بدء حراج مباشر"
            >
              <FiPlus className="ml-2" />
              <span>بدء حراج مباشر</span>
            </motion.button>
          </div>
        </div>

        {/* شريط البحث والفلاتر */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-5 md:mb-6">
          <motion.div className="relative flex-grow" whileHover={{ scale: 1.01 }}>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <FiSearch className="text-slate-400" />
            </div>
            <input
              type="text"
              aria-label="بحث"
              placeholder="ابحث باسم السيارة..."
              className="w-full pr-10 pl-3 md:pl-4 py-2.5 rounded-lg outline-none bg-slate-900/70 text-slate-100 placeholder-slate-500 border border-slate-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 text-sm md:text-base"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center px-5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-200 hover:bg-slate-900 transition-colors text-sm md:text-base"
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
              className="bg-slate-900/70 text-slate-100 p-4 md:p-5 rounded-xl shadow-xl border border-slate-800 mb-5 md:mb-6 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1.5 text-sm">حالة المزاد</label>
                  <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value as any); setPage(1) }}
                    className="w-full px-3 py-2.5 rounded-lg outline-none bg-slate-900/70 text-slate-100 border border-slate-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 text-sm"
                  >
                    <option value="">الكل</option>
                    <option value="live">جاري</option>
                    <option value="scheduled">قادم</option>
                    <option value="ended">منتهي</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 md:mt-5 flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setStatusFilter(''); setShowFilters(false); setPage(1) }}
                  className="px-5 py-2 rounded-lg text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-sm"
                >
                  تطبيق
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* إحصائيات سريعة (أحجام أصغر) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-5 md:mb-6">
          <StatCard title="إجمالي (الصفحة الحالية)" value={filtered.length} accent="indigo" />
          <StatCard title="جارية" value={liveCount} accent="emerald" />
          <StatCard title="منتهية" value={endedCount} accent="rose" />
        </div>

        {/* رسائل الحالة */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-900/30 border border-rose-700 text-rose-200 rounded-lg whitespace-pre-wrap text-sm">{error}</div>
        )}

        {/* التحميل */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl shadow-xl p-8 animate-pulse h-60" />
            ))}
          </div>
        )}

        {/* لا توجد نتائج */}
        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/70 border border-slate-800 rounded-xl shadow-xl p-10 md:p-12 text-center">
            <div className="text-slate-500 mb-3"><FaGavel size={40} className="mx-auto" /></div>
            <h3 className="text-lg md:text-xl font-medium text-slate-100 mb-1.5">لا توجد مزادات</h3>
            <p className="text-slate-400 text-sm md:text-base mb-5">أضف مزادًا جديدًا أو غيّر الفلاتر.</p>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setStatusFilter(''); setSearchTerm(''); fetchAuctions({ page: 1, status: '', silent: false }) }}
              className="px-5 py-2.5 rounded-lg text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-sm md:text-base"
            >
              عرض الكل
            </motion.button>
          </motion.div>
        )}

        {/* شبكة المزادات */}
        {!loading && filtered.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filtered.map((auction, idx) => (
                <motion.div
                  key={auction.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                  className={`relative group rounded-2xl overflow-hidden shadow-2xl border
                    ${auction.statusApi === 'ended'
                      ? 'border-rose-700/40'
                      : auction.statusApi === 'live'
                      ? 'border-emerald-700/40'
                      : 'border-amber-700/40'} bg-slate-900/70`}
                >
                  <div className="relative h-44 md:h-48 w-full overflow-hidden">
                    <img
                      src={auction.image}
                      alt={auction.carLabel}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      onError={imgOnError}
                      loading="lazy"
                    />
                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] md:text-xs font-semibold shadow ${statusChipColor(auction.statusApi)}`}>
                      {auction.statusAr}
                    </span>
                  </div>
                  <div className="p-5 md:p-6">
                    <div className="flex items-center gap-2 mb-1.5">
                      <FaCar className="text-violet-400 shrink-0" />
                      <span className="text-base md:text-lg font-bold text-slate-100 truncate">{auction.carLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <FiUser className="shrink-0" />
                      <span className="text-xs md:text-sm">معرضك</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-2 text-slate-200">
                      <div className="flex items-center gap-1">
                        <FiClock className="text-violet-400" />
                        {auction.statusApi === 'live'
                          ? <Countdown endIso={auction.endTimeIso} />
                          : <span className="font-mono text-xs md:text-sm">{auction.statusApi === 'scheduled' ? 'قريبًا' : 'انتهى'}</span>
                        }
                      </div>
                      <div className="flex items-center gap-1">
                        <FaGavel className="text-amber-400" />
                        <span className="font-mono text-xs md:text-sm">{auction.bidsCount} مزايدة</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiEye className="text-sky-400" />
                        <span className="font-mono text-xs md:text-sm">{auction.watchers} متابع</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 mt-2">
                      <div>
                        <span className="text-[11px] md:text-xs text-slate-400">سعر البدء</span>
                        <div className="font-semibold md:font-bold text-violet-300 text-sm md:text-base">{auction.startPrice.toLocaleString()} ر.س</div>
                      </div>
                      <div>
                        <span className="text-[11px] md:text-xs text-slate-400">أعلى مزايدة</span>
                        <div className="font-semibold md:font-bold text-emerald-400 text-sm md:text-base">{auction.currentBid.toLocaleString()} ر.س</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ترقيم الصفحات */}
            {lastPage > 1 && (
              <div className="mt-7 md:mt-8 flex justify-between items-center">
                <div className="text-xs md:text-sm text-slate-400">
                  صفحة <span className="font-medium text-slate-200">{page}</span> من <span className="font-medium text-slate-200">{lastPage}</span> — إجمالي <span className="font-medium text-slate-200">{total}</span>
                </div>
                <nav className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="السابق"
                  >
                    <FiChevronLeft />
                  </button>

                  {/* نافذة صفحات قصيرة */}
                  {pageWindow(page, lastPage, 2).map(n => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base ${
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
                    aria-label="التالي"
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

/** ========= مكونات صغيرة ========= **/
function StatCard({ title, value, accent }: { title: string; value: number | string; accent: 'indigo'|'emerald'|'rose' }) {
  const ring =
    accent === 'indigo' ? 'from-violet-600 to-indigo-600' :
    accent === 'emerald' ? 'from-emerald-600 to-green-600' :
    'from-rose-600 to-red-600'
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900/70 border border-slate-800 p-4 md:p-5">
      <div className={`pointer-events-none absolute -top-10 -left-10 w-28 h-28 rounded-full bg-gradient-to-br opacity-20 ${ring}`} />
      <h3 className="text-slate-400 text-xs md:text-sm mb-1.5">{title}</h3>
      <p className="text-2xl md:text-3xl font-bold text-slate-100">{value}</p>
    </div>
  )
}
