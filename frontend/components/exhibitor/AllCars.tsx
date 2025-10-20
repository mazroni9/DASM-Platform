'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch, FiFilter, FiEdit, FiTrash2, FiEye, FiChevronLeft, FiChevronRight, FiPlus, FiX,
  FiDollarSign, FiCalendar
} from 'react-icons/fi'
import { FaCar } from 'react-icons/fa'

/**
 * ===== API base & helpers =====
 * اضبط NEXT_PUBLIC_API_URL على "جذر" سيرفر Laravel (بدون /api)
 * أمثلة صحيحة:
 *  NEXT_PUBLIC_API_URL=https://dasm-development-branch.onrender.com
 *  NEXT_PUBLIC_API_URL=https://dasm.com.sa/public
 */
const IS_PROD = process.env.NODE_ENV === 'production'
const RAW_ROOT = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '')

const getSameOrigin = () =>
  (typeof window !== 'undefined' ? window.location.origin : '')

function resolveApiRoot() {
  if (RAW_ROOT) return { root: RAW_ROOT, source: 'env' as const }
  if (!IS_PROD) return { root: getSameOrigin(), source: 'dev-fallback' as const }
  throw new Error(
    [
      'Production misconfigured: NEXT_PUBLIC_API_URL is missing.',
      'Set it to your Laravel host ROOT (WITHOUT /api).',
      'Example: https://dasm-development-branch.onrender.com OR https://dasm.com.sa/public'
    ].join(' ')
  )
}

const { root: API_ROOT, source: API_SOURCE } = resolveApiRoot()

const buildApiUrl = (path: string) => {
  const clean = path.replace(/^\//, '')
  // نضيف /api هنا — لذلك NEXT_PUBLIC_API_URL يجب أن يكون بدون /api
  return `${API_ROOT}/api/${clean}`
}

const authHeaders = () => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    return token ? { Authorization: `Bearer ${token.replace(/^"(.+)"$/, '$1')}` } : {}
  } catch {
    return {}
  }
}

async function apiFetch(path: string, init?: RequestInit) {
  const url = buildApiUrl(path)

  let res: Response
  try {
    res = await fetch(url, {
      cache: 'no-store',
      ...init,
      headers: {
        Accept: 'application/json',
        ...authHeaders(),
        ...(init?.headers || {}),
      },
    })
  } catch (err: any) {
    const hint =
      API_SOURCE === 'dev-fallback'
        ? 'تستخدم نفس الدومين محليًا (dev-fallback).'
        : 'تحقق من NEXT_PUBLIC_API_URL أو CORS على Laravel.'
    throw new Error(`تعذر الاتصال بالخادم: ${url}\n${hint}\nالتفاصيل: ${err?.message || err}`)
  }

  if (res.status === 401) throw new Error('غير مصرح: يرجى تسجيل الدخول (رمز مفقود أو منتهي).')

  if (res.status === 404) {
    const body = await res.text().catch(() => '')
    const isNext404 = /The page could not be found/i.test(body)
    const advice = isNext404
      ? `الطلب وصل إلى Next.js بدل Laravel.
- يجب ضبط NEXT_PUBLIC_API_URL ليشير إلى جذر Laravel (بدون /api).
  مثال: https://dasm-development-branch.onrender.com أو https://dasm.com.sa/public
- لاحظ أن الكود يضيف /api تلقائيًا.`
      : 'تحقق من مسار Laravel (route) أو البارامترات.'
    throw new Error(`تعذر جلب البيانات (404) من: ${url}\n${advice}\n${body}`)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`فشل الطلب (${res.status}). ${body}`)
  }

  return res
}

/** ===== Types (Laravel) ===== */
type CarFromApi = {
  id: number
  dealer_id: number | null
  make: string
  model: string
  year: number
  vin: string
  odometer: number
  condition: string
  evaluation_price: string
  auction_status: string
  created_at: string
  updated_at: string
  color: string | null
  engine: string | null
  transmission: string | null
  description: string | null
  user_id: number
  images: string[] | null
  plate: string | null
  min_price: string | null
  max_price: string | null
  province: string | null
  city: string | null
  registration_card_image: string | null
  market_category: string | null
  auctions: any[]
}

type CarsApiResponse = {
  status: 'success'
  data: {
    current_page: number
    data: CarFromApi[]
    first_page_url: string
    from: number
    last_page: number
    last_page_url: string
    links: { url: string | null; label: string; page: number | null; active: boolean }[]
    next_page_url: string | null
    path: string
    per_page: number
    prev_page_url: string | null
    to: number
    total: number
  }
}

type ShowCarApiResponse = {
  status: 'success'
  data: {
    car: CarFromApi
    active_auction?: any
    total_bids?: number
  }
}

type UiCar = {
  id: number
  title: string
  brand: string
  model: string
  year: number
  price: number
  mileage: number
  transmission: string
  status: 'معلن' | 'محجوز' | 'مباع' | 'ملغي' | 'غير معروف'
  addedDate: string
  views: number
  inquiries: number
}

/** ===== Helpers & Mappers ===== */
const mapStatusToArabic = (s?: string): UiCar['status'] => {
  switch ((s || '').toLowerCase()) {
    case 'available':
    case 'active':
      return 'معلن'
    case 'scheduled':
    case 'reserved':
      return 'محجوز'
    case 'sold':
      return 'مباع'
    case 'cancelled':
    case 'canceled':
      return 'ملغي'
    default:
      return 'غير معروف'
  }
}

const mapTransmissionLabel = (t?: string) => {
  const v = (t || '').toLowerCase()
  if (v === 'automatic') return 'أوتوماتيك'
  if (v === 'manual') return 'عادي'
  if (v === 'cvt') return 'CVT'
  return ''
}

const statuses = ['معلن', 'محجوز', 'مباع'] as const

const transmissionOptions = [
  { value: 'automatic', label: 'أوتوماتيك' },
  { value: 'manual', label: 'عادي' },
  { value: 'cvt', label: 'CVT' },
]

const conditionOptions = [
  { value: 'excellent', label: 'ممتازة' },
  { value: 'good', label: 'جيدة' },
  { value: 'fair', label: 'متوسطة' },
  { value: 'poor', label: 'ضعيفة' },
]

const toNumberSafe = (v?: string | number | null) => {
  if (v === null || v === undefined) return 0
  if (typeof v === 'number') return isFinite(v) ? v : 0
  const cleaned = v.replace(/\s/g, '').replace(/,/g, '')
  const n = Number(cleaned)
  return isFinite(n) ? n : 0
}

/** ===== Small UI primitives ===== */
const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800 ${className}`}>
    {children}
  </div>
)

const PrimaryBtn = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`px-5 py-3 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-50 ${props.className || ''}`}
  />
)

const SubtleBtn = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`px-5 py-3 rounded-xl bg-slate-900/60 text-slate-200 border border-slate-700 hover:bg-slate-800/60 transition-colors ${props.className || ''}`}
  />
)

/** ===== UI Modals ===== */
function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        className="w-full max-w-3xl relative"
        initial={{ scale: 0.97, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Panel className="p-6">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 text-slate-400 hover:text-slate-200"
            aria-label="إغلاق"
          >
            <FiX size={22} />
          </button>
          {children}
        </Panel>
      </motion.div>
    </motion.div>
  )
}

function ViewCarModal({ open, onClose, car }: { open: boolean; onClose: () => void; car: CarFromApi | null }) {
  return (
    <AnimatePresence>
      {open && (
        <Backdrop onClose={onClose}>
          <h2 className="text-2xl font-bold text-slate-100 mb-4">تفاصيل السيارة</h2>
          {!car ? (
            <div className="text-slate-400">جاري التحميل...</div>
          ) : (
            <div className="space-y-4 text-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <Info label="الماركة" value={car.make} />
                <Info label="الموديل" value={car.model} />
                <Info label="سنة الصنع" value={String(car.year)} />
                <Info label="VIN" value={car.vin} />
                <Info label="الممشى (كم)" value={String(car.odometer ?? '')} />
                <Info label="الحالة" value={mapStatusToArabic(car.auction_status)} />
                <Info label="القير" value={mapTransmissionLabel(car.transmission ?? '')} />
                <Info label="المحرك" value={car.engine ?? ''} />
                <Info label="السعر التقييمي" value={`${car.evaluation_price ?? '0'} ر.س`} />
                <Info label="اللون" value={car.color ?? ''} />
                <Info label="اللوحة" value={car.plate ?? ''} />
                <Info label="المنطقة" value={car.province ?? ''} />
                <Info label="المدينة" value={car.city ?? ''} />
                <Info label="فئة السوق" value={car.market_category ?? ''} />
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">الوصف</p>
                <p className="bg-slate-800/60 rounded-lg p-3 whitespace-pre-wrap text-slate-200">{car.description || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">الصور</p>
                {Array.isArray(car.images) && car.images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {car.images.map((src, i) => (
                      <img key={`img-${i}-${src}`} src={src} alt={`image-${i}`} className="w-full h-24 object-cover rounded-lg border border-slate-800" />
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400">لا توجد صور</div>
                )}
              </div>
            </div>
          )}
        </Backdrop>
      )}
    </AnimatePresence>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-medium text-slate-100">{value || '—'}</p>
    </div>
  )
}

type EditFormState = {
  make: string
  model: string
  year: string
  odometer: string
  evaluation_price: string
  color: string
  engine: string
  transmission: string
  description: string
  province: string
  city: string
  plate: string
  min_price: string
  max_price: string
  condition: string
  market_category: string
}

function EditCarModal({
  open, onClose, car, onSaved
}: {
  open: boolean
  onClose: () => void
  car: CarFromApi | null
  onSaved: (updated: CarFromApi) => void
}) {
  const [form, setForm] = useState<EditFormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && car) {
      setForm({
        make: car.make || '',
        model: car.model || '',
        year: String(car.year || ''),
        odometer: String(car.odometer ?? ''),
        evaluation_price: car.evaluation_price ?? '',
        color: car.color ?? '',
        engine: car.engine ?? '',
        transmission: (car.transmission || '').toLowerCase(),
        description: car.description ?? '',
        province: car.province ?? '',
        city: car.city ?? '',
        plate: car.plate ?? '',
        min_price: car.min_price ?? '',
        max_price: car.max_price ?? '',
        condition: (car.condition || '').toLowerCase(),
        market_category: car.market_category ?? '',
      })
      setError(null)
    }
  }, [open, car])

  const updateField = (name: keyof EditFormState, value: string) => {
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev))
  }

  const submit = async () => {
    if (!car || !form) return
    setSaving(true)
    setError(null)
    try {
      const payload: any = {}
      ;(
        [
          'make','model','year','odometer','evaluation_price','color',
          'engine','transmission','description','province','city',
          'plate','min_price','max_price','condition','market_category'
        ] as (keyof EditFormState)[]
      ).forEach((k) => {
        const v = form[k]
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          if (['year','odometer'].includes(k)) payload[k] = Number(v)
          else if (['evaluation_price','min_price','max_price'].includes(k)) payload[k] = toNumberSafe(v)
          else payload[k] = v
        }
      })

      const res = await apiFetch(`cars/${car.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const j = await res.json().catch(() => ({}))
      onSaved((j.data || j) as CarFromApi)
      onClose()
    } catch (e: any) {
      setError(e?.message || 'حدث خطأ غير متوقع.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <Backdrop onClose={onClose}>
          <h2 className="text-2xl font-bold text-slate-100 mb-4">تعديل السيارة</h2>
          {!form ? (
            <div className="text-slate-400">جارى التحميل...</div>
          ) : (
            <>
              {error && (
                <div className="mb-3 bg-rose-500/10 border border-rose-700 text-rose-300 rounded-xl p-3 whitespace-pre-wrap">{error}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="الماركة">
                  <input className="input" value={form.make} onChange={(e)=>updateField('make', e.target.value)} />
                </Field>
                <Field label="الموديل">
                  <input className="input" value={form.model} onChange={(e)=>updateField('model', e.target.value)} />
                </Field>
                <Field label="سنة الصنع">
                  <input type="number" className="input" value={form.year} onChange={(e)=>updateField('year', e.target.value)} />
                </Field>
                <Field label="الممشى (كم)">
                  <input type="number" className="input" value={form.odometer} onChange={(e)=>updateField('odometer', e.target.value)} />
                </Field>
                <Field label="السعر التقييمي (ر.س)">
                  <input type="text" className="input" value={form.evaluation_price} onChange={(e)=>updateField('evaluation_price', e.target.value)} />
                </Field>
                <Field label="اللون">
                  <input className="input" value={form.color} onChange={(e)=>updateField('color', e.target.value)} />
                </Field>
                <Field label="المحرك">
                  <input className="input" value={form.engine} onChange={(e)=>updateField('engine', e.target.value)} />
                </Field>
                <Field label="القير">
                  <select className="input" value={form.transmission} onChange={(e)=>updateField('transmission', e.target.value)}>
                    <option value="">اختر</option>
                    {transmissionOptions.map(o => <option key={`tr-${o.value}`} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="الحالة الفنية">
                  <select className="input" value={form.condition} onChange={(e)=>updateField('condition', e.target.value)}>
                    <option value="">اختر</option>
                    {conditionOptions.map(o => <option key={`cond-${o.value}`} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="المنطقة">
                  <input className="input" value={form.province} onChange={(e)=>updateField('province', e.target.value)} />
                </Field>
                <Field label="المدينة">
                  <input className="input" value={form.city} onChange={(e)=>updateField('city', e.target.value)} />
                </Field>
                <Field label="رقم اللوحة">
                  <input className="input" value={form.plate} onChange={(e)=>updateField('plate', e.target.value)} />
                </Field>
                <Field label="أقل سعر (ر.س)">
                  <input type="text" className="input" value={form.min_price} onChange={(e)=>updateField('min_price', e.target.value)} />
                </Field>
                <Field label="أعلى سعر (ر.س)">
                  <input type="text" className="input" value={form.max_price} onChange={(e)=>updateField('max_price', e.target.value)} />
                </Field>
                <div className="md:col-span-2">
                  <label className="block text-slate-300 mb-1">الوصف</label>
                  <textarea className="input h-24" value={form.description} onChange={(e)=>updateField('description', e.target.value)} />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <SubtleBtn onClick={onClose}>إلغاء</SubtleBtn>
                <PrimaryBtn onClick={submit} disabled={saving}>
                  {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
                </PrimaryBtn>
              </div>
            </>
          )}
        </Backdrop>
      )}
    </AnimatePresence>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-slate-300 mb-1">{label}</label>
      {children}
      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.6rem 0.8rem;
          border: 1px solid rgb(51 65 85 / 1);
          border-radius: 0.75rem;
          outline: none;
          background: rgba(15, 23, 42, .7);
          color: #e5e7eb;
        }
        .input::placeholder { color: #94a3b8; }
        .input:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 4px rgba(124, 58, 237, .2);
        }
        select.input option { color: #0f172a; }
      `}</style>
    </div>
  )
}

function DeleteConfirmModal({
  open, onClose, onConfirm, loading, error
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading: boolean
  error: string | null
}) {
  return (
    <AnimatePresence>
      {open && (
        <Backdrop onClose={onClose}>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">حذف السيارة</h2>
          <p className="text-slate-300">هل أنت متأكد من حذف هذه السيارة؟ هذا الإجراء لا يمكن التراجع عنه.</p>
          {error && <div className="mt-3 bg-rose-500/10 border border-rose-700 text-rose-300 rounded-xl p-3 whitespace-pre-wrap">{error}</div>}
          <div className="mt-6 flex justify-end gap-3">
            <SubtleBtn onClick={onClose}>إلغاء</SubtleBtn>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'جارٍ الحذف...' : 'تأكيد الحذف'}
            </button>
          </div>
        </Backdrop>
      )}
    </AnimatePresence>
  )
}

/** ===== Filter Panel ===== */
type Filters = { status: string; brand: string; minPrice: string; maxPrice: string; yearFrom: string; yearTo: string }

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 bg-violet-500/15 text-violet-300 px-3 py-1 rounded-full text-xs border border-violet-600/30">
      {label}
      <button onClick={onClear} className="hover:text-violet-200" aria-label="إزالة">
        <FiX size={14} />
      </button>
    </span>
  )
}

function FilterPanel({
  open, onClose, filters, setFilters, brands, onApply, onReset
}: {
  open: boolean
  onClose: () => void
  filters: Filters
  setFilters: React.Dispatch<React.SetStateAction<Filters>>
  brands: string[]
  onApply: () => void
  onReset: () => void
}) {
  const activeChips = useMemo(() => {
    const chips: { key: keyof Filters; label: string }[] = []
    if (filters.status) chips.push({ key: 'status', label: `الحالة: ${filters.status}` })
    if (filters.brand) chips.push({ key: 'brand', label: `العلامة: ${filters.brand}` })
    if (filters.minPrice) chips.push({ key: 'minPrice', label: `≥ ${Number(filters.minPrice).toLocaleString()} ر.س` })
    if (filters.maxPrice) chips.push({ key: 'maxPrice', label: `≤ ${Number(filters.maxPrice).toLocaleString()} ر.س` })
    if (filters.yearFrom) chips.push({ key: 'yearFrom', label: `من سنة ${filters.yearFrom}` })
    if (filters.yearTo) chips.push({ key: 'yearTo', label: `إلى سنة ${filters.yearTo}` })
    return chips
  }, [filters])

  const handle = (name: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const body = (
    <>
      {activeChips.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {activeChips.map((c, i) => (
            <FilterChip key={`chip-${c.key}-${i}`} label={c.label} onClear={() => handle(c.key, '')} />
          ))}
          <button
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-slate-200 underline decoration-dotted"
          >
            مسح الكل
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div>
          <p className="block text-slate-300 mb-2">حالة الإعلان</p>
          <div className="flex flex-wrap gap-2">
            {(['', ...statuses] as string[]).map((s) => {
              const selected = filters.status === s || (s === '' && !filters.status)
              return (
                <button
                  key={`status-${s || 'all'}`}
                  onClick={() => handle('status', s)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition ${
                    selected
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-slate-900/60 text-slate-200 border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  {s || 'الكل'}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-slate-300 mb-2">العلامة التجارية</label>
          <select
            value={filters.brand}
            onChange={(e) => handle('brand', e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-slate-900/70 text-slate-100 border border-slate-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20"
          >
            <option value="">الكل</option>
            {brands.map((b) => (
              <option key={`brand-${b}`} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-300 mb-2">السعر من</label>
          <div className="relative">
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500"><FiDollarSign /></span>
            <input
              type="number"
              className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-900/70 text-slate-100 border border-slate-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20"
              placeholder="أدنى سعر"
              value={filters.minPrice}
              onChange={(e) => handle('minPrice', e.target.value)}
              min={0}
            />
          </div>
        </div>
        <div>
          <label className="block text-slate-300 mb-2">السعر إلى</label>
          <div className="relative">
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500"><FiDollarSign /></span>
            <input
              type="number"
              className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-900/70 text-slate-100 border border-slate-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20"
              placeholder="أعلى سعر"
              value={filters.maxPrice}
              onChange={(e) => handle('maxPrice', e.target.value)}
              min={0}
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 mb-2">سنة الصنع من</label>
          <div className="relative">
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500"><FiCalendar /></span>
            <input
              type="number"
              className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-900/70 text-slate-100 border border-slate-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20"
              placeholder="أقدم سنة"
              value={filters.yearFrom}
              onChange={(e) => handle('yearFrom', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-slate-300 mb-2">سنة الصنع إلى</label>
          <div className="relative">
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500"><FiCalendar /></span>
            <input
              type="number"
              className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-900/70 text-slate-100 border border-slate-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20"
              placeholder="أحدث سنة"
              value={filters.yearTo}
              onChange={(e) => handle('yearTo', e.target.value)}
            />
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <motion.div
              className="absolute inset-y-0 right-0 w-full max-w-md p-3"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <Panel className="p-6 h-full overflow-y-auto rounded-l-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-100">الفلاتر</h3>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><FiX size={22} /></button>
                </div>

                {body}

                <div className="sticky bottom-0 bg-slate-900/80 backdrop-blur pt-4 border-t border-slate-800 mt-6">
                  <div className="flex gap-3">
                    <SubtleBtn onClick={onReset} className="flex-1">إعادة تعيين</SubtleBtn>
                    <PrimaryBtn onClick={onApply} className="flex-1">تطبيق</PrimaryBtn>
                  </div>
                </div>
              </Panel>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Floating Card */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          >
            <Panel className="p-6 mb-8 hidden md:block">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-100">الفلاتر المتقدمة</h3>
                <div className="flex items-center gap-2">
                  {activeChips.slice(0, 4).map((c, i) => (
                    <FilterChip key={`chip-head-${c.key}-${i}`} label={c.label} onClear={() => handle(c.key, '')} />
                  ))}
                  {activeChips.length > 4 && <span className="text-xs text-slate-400">+{activeChips.length - 4}</span>}
                </div>
              </div>

              {body}

              <div className="mt-6 flex justify-end gap-3">
                <SubtleBtn onClick={onReset}>إعادة تعيين</SubtleBtn>
                <PrimaryBtn onClick={onApply}>تطبيق الفلاتر</PrimaryBtn>
              </div>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/** ===== Main Component ===== */
export default function ExhibitorCars() {
  const router = useRouter()

  const [cars, setCars] = useState<UiCar[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [perPage, setPerPage] = useState(10)

  const [sortKey, setSortKey] = useState<'latest' | 'oldest' | 'price_desc' | 'price_asc'>('latest')

  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    status: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    yearFrom: '',
    yearTo: ''
  })

  const [viewOpen, setViewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedCarData, setSelectedCarData] = useState<CarFromApi | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchCars = async (page = 1) => {
    try {
      setLoading(true)
      setErrorMsg(null)

      const params = new URLSearchParams()
      params.set('page', String(page))

      if (sortKey === 'latest') {
        params.set('sort_by', 'created_at'); params.set('sort_dir', 'desc')
      } else if (sortKey === 'oldest') {
        params.set('sort_by', 'created_at'); params.set('sort_dir', 'asc')
      } else if (sortKey === 'price_desc') {
        params.set('sort_by', 'evaluation_price'); params.set('sort_dir', 'desc')
      } else if (sortKey === 'price_asc') {
        params.set('sort_by', 'evaluation_price'); params.set('sort_dir', 'asc')
      }

      if (filters.status) {
        const backendStatus =
          filters.status === 'معلن' ? 'available' :
          filters.status === 'محجوز' ? 'scheduled' :
          filters.status === 'مباع' ? 'sold' : ''
        if (backendStatus) params.set('auction_status', backendStatus)
      }
      if (filters.brand) params.set('make', filters.brand)

      const res = await apiFetch(`cars?${params.toString()}`)
      const json: CarsApiResponse = await res.json()

      const mapped: UiCar[] = (json.data.data || []).map((c) => ([
        c.id,
        `${c.make ?? ''} ${c.model ?? ''}`.trim(),
        c.make ?? '',
        c.model ?? '',
        c.year ?? 0,
        toNumberSafe(c.evaluation_price),
        c.odometer ?? 0,
        mapTransmissionLabel(c.transmission ?? ''),
        mapStatusToArabic(c.auction_status),
        c.created_at?.slice(0, 10) ?? '',
        0,
        0
      ])).map(([id, title, brand, model, year, price, mileage, transmission, status, addedDate, views, inquiries]) => ({
        id: id as number,
        title: title as string,
        brand: brand as string,
        model: model as string,
        year: year as number,
        price: price as number,
        mileage: mileage as number,
        transmission: transmission as string,
        status: status as UiCar['status'],
        addedDate: addedDate as string,
        views: views as number,
        inquiries: inquiries as number
      }))

      setCars(mapped)
      setCurrentPage(json.data.current_page)
      setLastPage(json.data.last_page)
      setTotal(json.data.total)
      setPerPage(json.data.per_page)
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ غير متوقع أثناء جلب البيانات.')
      setCars([])
      setCurrentPage(1)
      setLastPage(1)
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCars(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortKey, currentPage])

  const filteredCars = useMemo(() => {
    let results = [...cars]
    const term = searchTerm.trim().toLowerCase()
    if (term) {
      results = results.filter((c) =>
        c.title.toLowerCase().includes(term) ||
        c.brand.toLowerCase().includes(term) ||
        c.model.toLowerCase().includes(term) ||
        String(c.year).includes(term)
      )
    }
    if (filters.yearFrom) results = results.filter((c) => c.year >= Number(filters.yearFrom))
    if (filters.yearTo) results = results.filter((c) => c.year <= Number(filters.yearTo))
    if (filters.minPrice) results = results.filter((c) => c.price >= Number(filters.minPrice))
    if (filters.maxPrice) results = results.filter((c) => c.price <= Number(filters.maxPrice))
    return results
  }, [cars, filters, searchTerm])

  const brands = useMemo(
    () => Array.from(new Set(cars.map((c) => c.brand).filter(Boolean))).sort(),
    [cars]
  )

  const activeFilterCount = useMemo(() => {
    const countFilters = Object.values(filters).filter(Boolean).length
    const countSearch = searchTerm.trim() ? 1 : 0
    return countFilters + countSearch
  }, [filters, searchTerm])

  const resetFilters = () => {
    setFilters({ status: '', brand: '', minPrice: '', maxPrice: '', yearFrom: '', yearTo: '' })
    setSearchTerm('')
  }

  const goToAddCar = () => router.push('/exhibitor/add-car')

  /** ===== Actions ===== */
  const openView = async (id: number) => {
    setSelectedId(id); setViewOpen(true); setSelectedCarData(null); setActionError(null)
    try {
      const res = await apiFetch(`cars/${id}`)
      const j: ShowCarApiResponse = await res.json()
      setSelectedCarData(j.data.car)
    } catch (e: any) {
      setActionError(e?.message || 'تعذر تحميل تفاصيل السيارة.')
    }
  }

  const openEdit = async (id: number) => {
    setSelectedId(id); setEditOpen(true); setSelectedCarData(null); setActionError(null)
    try {
      const res = await apiFetch(`cars/${id}`)
      const j: ShowCarApiResponse = await res.json()
      setSelectedCarData(j.data.car)
    } catch (e: any) {
      setActionError(e?.message || 'تعذر تحميل بيانات التعديل.')
    }
  }

  const openDelete = (id: number) => { setSelectedId(id); setDeleteOpen(true); setActionError(null) }

  const handleSaved = (updated: CarFromApi) => {
    setCars((prev) =>
      prev.map((c) =>
        c.id === updated.id
          ? {
              ...c,
              title: `${updated.make ?? ''} ${updated.model ?? ''}`.trim(),
              brand: updated.make ?? '',
              model: updated.model ?? '',
              year: updated.year ?? 0,
              price: toNumberSafe(updated.evaluation_price),
              mileage: updated.odometer ?? 0,
              transmission: mapTransmissionLabel(updated.transmission ?? ''),
              status: mapStatusToArabic(updated.auction_status),
              addedDate: updated.created_at?.slice(0, 10) ?? ''
            }
          : c
      )
    )
  }

  const confirmDelete = async () => {
    if (!selectedId) return
    setActionLoading(true); setActionError(null)
    try {
      await apiFetch(`cars/${selectedId}`, { method: 'DELETE' })
      setCars((prev) => prev.filter((c) => c.id !== selectedId))
      setDeleteOpen(false)
    } catch (e: any) {
      setActionError(e?.message || 'حدث خطأ أثناء الحذف.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      {/* Modals */}
      <ViewCarModal open={viewOpen} onClose={()=>setViewOpen(false)} car={selectedCarData} />
      <EditCarModal open={editOpen} onClose={()=>setEditOpen(false)} car={selectedCarData} onSaved={handleSaved} />
      <DeleteConfirmModal open={deleteOpen} onClose={()=>setDeleteOpen(false)} onConfirm={confirmDelete} loading={actionLoading} error={actionError} />

      <div className="max-w-7xl mx-auto">
        {/* Header + Search */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="text-3xl font-bold text-slate-100 mb-2">
                سيارات المعرض
              </motion.h1>
              <p className="text-slate-400">إدارة السيارات المضافة إلى معرضك</p>
            </div>
            <PrimaryBtn onClick={goToAddCar} aria-label="إضافة سيارة جديدة" className="inline-flex items-center gap-2">
              <FiPlus className="ml-2" />
              <span>إضافة سيارة جديدة</span>
            </PrimaryBtn>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <motion.div className="relative flex-grow" whileHover={{ scale: 1.005 }}>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FiSearch className="text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="ابحث عن سيارة (ماركة أو موديل أو سنة)"
                className="w-full pr-10 pl-4 py-3 rounded-xl bg-slate-900/70 text-slate-100 placeholder-slate-500 border border-slate-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setCurrentPage(1); fetchCars(1) } }}
              />
            </motion.div>

            <SubtleBtn onClick={() => { setCurrentPage(1); fetchCars(1) }}>
              تحديث
            </SubtleBtn>

            <button
              onClick={() => setShowFilters(true)}
              className="relative inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-900/60 text-slate-200 border border-slate-700 hover:bg-slate-800/60 transition-colors"
            >
              <FiFilter className="ml-2" />
              <span>الفلاتر</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -left-2 bg-violet-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="mb-6 bg-rose-500/10 border border-rose-700 text-rose-300 rounded-xl p-4 whitespace-pre-wrap">
            {errorMsg}
          </div>
        )}

        {/* Filters Panel */}
        <FilterPanel
          open={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          setFilters={setFilters}
          brands={brands}
          onApply={() => { setShowFilters(false); setCurrentPage(1); fetchCars(1) }}
          onReset={() => { resetFilters(); setCurrentPage(1); fetchCars(1) }}
        />

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="إجمالي الصفحة الحالية" color="indigo" value={filteredCars.length} />
          <StatCard title="معلن" color="green" value={filteredCars.filter(c => c.status === 'معلن').length} />
          <StatCard title="محجوز" color="yellow" value={filteredCars.filter(c => c.status === 'محجوز').length} />
          <StatCard title="مباع" color="red" value={filteredCars.filter(c => c.status === 'مباع').length} />
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex justify-between items-center">
          <div className="text-slate-400"><span className="font-medium text-slate-200">{total}</span> إجمالي السيارات</div>
          <div className="flex items-center">
            <span className="text-slate-400 mr-2">ترتيب حسب:</span>
            <select
              className="px-3 py-2 rounded-xl bg-slate-900/70 text-slate-100 border border-slate-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20"
              value={sortKey}
              onChange={(e) => { setSortKey(e.target.value as any); setCurrentPage(1) }}
            >
              <option value="latest">الأحدث إضافة</option>
              <option value="oldest">الأقدم إضافة</option>
              <option value="price_desc">الأعلى سعراً</option>
              <option value="price_asc">الأقل سعراً</option>
            </select>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && <SkeletonTable />}

        {/* No results */}
        {!loading && filteredCars.length === 0 && (
          <Panel className="p-12 text-center">
            <div className="text-slate-500 mb-4"><FiSearch size={48} className="mx-auto" /></div>
            <h3 className="text-xl font-medium text-slate-100 mb-2">لا توجد سيارات متطابقة</h3>
            <p className="text-slate-400 mb-6">عدّل الفلاتر أو أعد البحث.</p>
            <PrimaryBtn onClick={() => { resetFilters(); setCurrentPage(1); fetchCars(1) }}>
              عرض جميع السيارات
            </PrimaryBtn>
          </Panel>
        )}

        {/* Table */}
        {!loading && filteredCars.length > 0 && (
          <>
            <Panel className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-900/60">
                    <tr>
                      <Th>السيارة</Th>
                      <Th>السعر</Th>
                      <Th>الحالة</Th>
                      <Th>المشاهدات</Th>
                      <Th>الاستفسارات</Th>
                      <Th>الإجراءات</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredCars.map((car, index) => (
                      <motion.tr key={`car-${car.id}`} initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                        className="hover:bg-slate-800/40">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-violet-500/15 rounded-full flex items-center justify-center border border-violet-600/30">
                              <FaCar className="text-violet-400" />
                            </div>
                            <div className="mr-4">
                              <div className="text-sm font-semibold text-slate-100">{car.title}</div>
                              <div className="text-sm text-slate-400">{car.year} • {Number.isFinite(car.mileage) ? car.mileage.toLocaleString() : 0} كم</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-violet-300">{Number.isFinite(car.price) ? car.price.toLocaleString() : 0} ر.س</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            car.status === 'معلن' ? 'bg-green-500/15 text-green-300 border border-green-600/30' :
                            car.status === 'محجوز' ? 'bg-amber-500/15 text-amber-200 border border-amber-600/30' :
                            car.status === 'مباع' ? 'bg-rose-500/15 text-rose-300 border border-rose-600/30' :
                            'bg-slate-700/30 text-slate-300 border border-slate-600/30'
                          }`}>
                            {car.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1"><FiEye className="text-slate-500" />{(car.views ?? 0).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {(car.inquiries ?? 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex justify-end gap-3">
                            <button className="text-violet-300 hover:text-violet-200" aria-label="تعديل" type="button"
                                    onClick={() => openEdit(car.id)}>
                              <FiEdit size={18} />
                            </button>
                            <button className="text-slate-300 hover:text-slate-100" aria-label="عرض التفاصيل" type="button"
                                    onClick={() => openView(car.id)}>
                              <FiEye size={18} />
                            </button>
                            <button className="text-rose-400 hover:text-rose-300" aria-label="حذف" type="button"
                                    onClick={() => openDelete(car.id)}>
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            {/* Pagination */}
            {lastPage > 1 && (
              <div className="mt-8 flex justify-between items-center">
                <div className="text-sm text-slate-400">
                  صفحة <span className="font-medium text-slate-200">{currentPage}</span> من <span className="font-medium text-slate-200">{lastPage}</span> — إجمالي <span className="font-medium text-slate-200">{total}</span>
                </div>
                <nav className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800/60 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft />
                  </button>
                  {Array.from({ length: lastPage }, (_, i) => i + 1).map(number => (
                    <button
                      key={`page-${number}`}
                      onClick={() => setCurrentPage(number)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        currentPage === number
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'border-slate-700 text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                    disabled={currentPage === lastPage}
                    className="p-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800/60 disabled:opacity-50 disabled:cursor-not-allowed"
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

/** ===== Small UI helpers ===== */
function StatCard({ title, value, color }: { title: string; value: number | string; color: 'indigo'|'green'|'yellow'|'red' }) {
  const ringMap: Record<'indigo'|'green'|'yellow'|'red', string> = {
    indigo: 'from-violet-600 to-indigo-600',
    green: 'from-emerald-600 to-green-600',
    yellow: 'from-amber-500 to-yellow-600',
    red: 'from-rose-600 to-red-600',
  }
  return (
    <Panel className="p-6 relative overflow-hidden">
      <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full bg-gradient-to-br opacity-20 ${ringMap[color]}`} />
      <h3 className="text-slate-400 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-slate-100">{value}</p>
    </Panel>
  )
}

function SkeletonTable() {
  return (
    <Panel className="overflow-hidden">
      <table className="min-w-full divide-y divide-slate-800">
        <thead className="bg-slate-900/60">
          <tr>
            <Th>السيارة</Th><Th>السعر</Th><Th>الحالة</Th><Th>المشاهدات</Th><Th>الاستفسارات</Th><Th>الإجراءات</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {[...Array(5)].map((_, i) => (
            <tr key={`skrow-${i}`}>
              {Array.from({length:6}).map((_,j)=>(
                <td key={`skcell-${i}-${j}`} className="px-6 py-4">
                  <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">{children}</th>
  )
}
