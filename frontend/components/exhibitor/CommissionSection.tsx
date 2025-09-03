'use client'

import { useState } from "react"
import {
  FaMoneyBillWave, FaInfoCircle, FaCarSide, FaFileAlt, FaChartPie, FaTimes, FaCheckCircle
} from "react-icons/fa"

function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" }
  return new Date(dateString).toLocaleDateString('ar-SA', options)
}

// Tooltip بسيط
function Tooltip({ text }) {
  return (
    <span className="absolute bottom-full mb-2 right-0 bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-lg z-50 whitespace-nowrap">
      {text}
    </span>
  )
}

// Popup Modal لتفاصيل العملية
function CommissionModal({ item, onClose }) {
  if (!item) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-red-500 text-2xl transition"
          aria-label="إغلاق"
        >
          <FaTimes />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <FaCheckCircle className="text-green-500 text-2xl" />
          <h2 className="text-xl font-extrabold text-gray-800">تفاصيل عملية السعي</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FaCarSide className="text-blue-400" />
            <span className="font-bold text-gray-700">السيارة:</span>
            <span className="text-gray-600">{item.car}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaFileAlt className="text-green-400" />
            <span className="font-bold text-gray-700">التاريخ:</span>
            <span className="text-gray-600">{formatDate(item.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaMoneyBillWave className="text-yellow-500" />
            <span className="font-bold text-gray-700">قيمة السعي:</span>
            <span className="text-green-600 font-bold">{item.value.toLocaleString()} ريال</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Animated Gauge
function CommissionGauge({ value, max = 2000 }) {
  const percent = Math.min((value / max) * 100, 100)
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full" viewBox="0 0 120 120">
        <circle
          cx="60" cy="60" r="54"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        <circle
          cx="60" cy="60" r="54"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="12"
          strokeDasharray={339.292}
          strokeDashoffset={339.292 - (339.292 * percent / 100)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s" }}
        />
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="120" y2="120">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#facc15" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-green-600">{value.toLocaleString()}</span>
        <span className="text-sm text-gray-500">ريال</span>
      </div>
    </div>
  )
}

export function CommissionSection({
  commissionValue,
  commissionCurrency,
  commissionNote,
  recentCommissions,
  onReport
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  // القيم الافتراضية إذا لم يتم تمريرها
  const _commissionValue = commissionValue !== undefined ? commissionValue : 0
  const _commissionCurrency = commissionCurrency || "ريال"
  const _commissionNote = commissionNote || "السعي هو مبلغ يحدده المعرض مقابل عرض السيارة وخدماته (غسيل، حماية، شحن بطارية، إلخ)."
  const _recentCommissions = recentCommissions || []

  return (
    <div className="relative bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 mb-8 border border-gray-100 overflow-hidden">
      {/* شريط زخرفي علوي */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 animate-pulse rounded-t-2xl"></div>
      <div className="flex items-center gap-3 mb-6">
        <FaMoneyBillWave className="text-green-500 text-2xl" />
        <h2 className="text-2xl font-extrabold text-gray-800">خانة السعي</h2>
      </div>
      <div className="flex flex-col md:flex-row md:gap-12 gap-6 mb-8">
        {/* قيمة السعي مع Gauge و Tooltip */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-tr from-green-50 to-white rounded-xl p-6 shadow-md border border-green-100 relative">
          <span
            className="text-gray-500 text-sm mb-1 flex items-center gap-1 relative cursor-pointer"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <FaInfoCircle className="text-green-400" />
            قيمة السعي الحالية
            {showTooltip && <Tooltip text={_commissionNote} />}
          </span>
          <CommissionGauge value={_commissionValue} max={2000} />
          <p className="mt-3 text-gray-600 text-sm text-center">{_commissionNote}</p>
        </div>
        {/* العمليات الأخيرة */}
        <div className="flex-1">
          <div className="bg-white/90 rounded-xl shadow-md border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaFileAlt className="text-blue-400" />
              <span className="font-bold text-gray-700">العمليات الأخيرة</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="py-2">التاريخ</th>
                  <th className="py-2">السيارة</th>
                  <th className="py-2">قيمة السعي</th>
                </tr>
              </thead>
              <tbody>
                {_recentCommissions.map((item, idx) => (
                  <tr
                    key={idx}
                    className="text-gray-700 text-center hover:bg-green-50 transition cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="py-2">{formatDate(item.date)}</td>
                    <td className="py-2 flex items-center justify-center gap-2">
                      <FaCarSide className="text-gray-400" /> {item.car}
                    </td>
                    <td className="py-2 font-bold text-green-600">{item.value.toLocaleString()} {_commissionCurrency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end mt-4">
              <button
                onClick={onReport || (() => {})}
                className="bg-gradient-to-l from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 text-white font-bold py-2 px-6 rounded-xl shadow-md transition-all duration-200 active:scale-95 text-sm flex items-center gap-2"
              >
                <FaChartPie className="animate-pulse" /> تحميل تقرير السعي
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Popup Modal لتفاصيل العملية */}
      {selectedItem && (
        <CommissionModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
      {/* زخرفة سفلية */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-green-200 to-blue-400 rounded-b-2xl opacity-60"></div>
    </div>
  )
}