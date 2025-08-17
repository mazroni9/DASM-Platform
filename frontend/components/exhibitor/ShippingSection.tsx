'use client'

import { useState } from "react"
import {
  FaTruck, FaMapMarkerAlt, FaUser, FaCheckCircle, FaClock, FaMoneyCheckAlt, FaBoxOpen, FaTimes, FaBarcode
} from "react-icons/fa"

const shippingSteps = [
  { label: "تم استلام الطلب", icon: <FaBoxOpen /> },
  { label: "جاري الشحن", icon: <FaTruck /> },
  { label: "في الطريق", icon: <FaClock /> },
  { label: "تم التسليم", icon: <FaCheckCircle /> },
]

// بيانات تجريبية لطلبات الشحن
const shippingOrders = [
  {
    id: 1,
    recipient: "محمد العتيبي",
    address: "الرياض، حي العليا، شارع الملك فهد",
    trackingNumber: "TRK123456789",
    shippingStatus: 2,
    paymentStatus: "محجوز",
    createdAt: "2025-08-10",
    items: [
      { name: "تويوتا كامري 2022", qty: 1 },
    ]
  },
  {
    id: 2,
    recipient: "سارة المطيري",
    address: "جدة، حي الشاطئ، شارع الأمير سلطان",
    trackingNumber: "TRK987654321",
    shippingStatus: 1,
    paymentStatus: "محجوز",
    createdAt: "2025-08-09",
    items: [
      { name: "هيونداي سوناتا 2021", qty: 1 },
    ]
  },
  {
    id: 3,
    recipient: "خالد الزهراني",
    address: "الدمام، حي الفيصلية، شارع الخليج",
    trackingNumber: "TRK555888333",
    shippingStatus: 3,
    paymentStatus: "تم التسليم",
    createdAt: "2025-08-07",
    items: [
      { name: "كيا سيراتو 2020", qty: 1 },
    ]
  },
]

// هنا الحل النهائي: صرّح عن نوع الكائن options
function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" } // القيم literal وليست string متغيرة
  return new Date(dateString).toLocaleDateString('ar-SA', options)
}

function ShippingProgress({ shippingStatus }) {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex items-center justify-between w-full max-w-md mx-auto">
        {shippingSteps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center flex-1">
            <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2
              ${idx <= shippingStatus ? "bg-green-500 border-green-500 text-white shadow-lg" : "bg-gray-200 border-gray-300 text-gray-400"}
              transition-all duration-300`}>
              {step.icon}
            </div>
            <span className={`mt-2 text-xs font-bold ${idx <= shippingStatus ? "text-green-600" : "text-gray-400"}`}>
              {step.label}
            </span>
            {idx < shippingSteps.length - 1 && (
              <div className={`h-2 w-10 md:w-16 rounded-full my-1
                ${idx < shippingStatus ? "bg-green-400" : "bg-gray-200"}
                transition-all duration-300`}></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ShippingDetailsModal({ order, onClose }) {
  if (!order) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-red-500 text-2xl transition"
          aria-label="إغلاق"
        >
          <FaTimes />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <FaTruck className="text-blue-500 text-2xl" />
          <h2 className="text-2xl font-extrabold text-gray-800">تفاصيل الشحنة</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <FaUser className="text-blue-400" />
              <span className="font-bold text-gray-700">المستلم:</span>
              <span className="text-gray-600">{order.recipient}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-green-400" />
              <span className="font-bold text-gray-700">العنوان:</span>
              <span className="text-gray-600">{order.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaMoneyCheckAlt className="text-yellow-500" />
              <span className="font-bold text-gray-700">حالة الدفع:</span>
              <span className={`font-bold ${order.paymentStatus === "محجوز" ? "text-yellow-600" : "text-green-600"}`}>
                {order.paymentStatus}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaBarcode className="text-blue-400" />
              <span className="font-bold text-gray-700">رقم التتبع:</span>
              <span className="text-gray-600">{order.trackingNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaClock className="text-gray-400" />
              <span className="font-bold text-gray-700">تاريخ الطلب:</span>
              <span className="text-gray-600">{formatDate(order.createdAt)}</span>
            </div>
          </div>
          <div>
            <ShippingProgress shippingStatus={order.shippingStatus} />
            <div className="mt-6">
              <span className="font-bold text-gray-700">العناصر المشحونة:</span>
              <ul className="list-disc pr-6 mt-2 text-gray-600 text-sm">
                {order.items.map((item, idx) => (
                  <li key={idx}>{item.name} <span className="text-gray-400">x{item.qty}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={() => window.open(`https://track.example.com/${order.trackingNumber}`, "_blank")}
            className="bg-gradient-to-l from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white font-bold py-2 px-6 rounded-xl shadow-md transition-all duration-200 active:scale-95 text-sm"
          >
            تتبع الشحنة
          </button>
        </div>
      </div>
    </div>
  )
}

export function ShippingSection() {
  const [selectedOrder, setSelectedOrder] = useState(null)

  return (
    <div className="relative bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 mb-8 border border-gray-100 overflow-hidden">
      {/* شريط زخرفي علوي */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400 animate-pulse rounded-t-2xl"></div>
      <div className="flex items-center gap-3 mb-6">
        <FaTruck className="text-blue-500 text-2xl" />
        <h2 className="text-2xl font-extrabold text-gray-800">طلبات الشحن</h2>
      </div>
      {/* قائمة الطلبات */}
      <div className="grid md:grid-cols-2 gap-6">
        {shippingOrders.map(order => (
          <div
            key={order.id}
            className={`cursor-pointer group bg-gradient-to-tr from-blue-50 to-white rounded-xl p-6 shadow-md border border-blue-100 hover:shadow-xl transition-all duration-200 flex flex-col gap-3 relative`}
            onClick={() => setSelectedOrder(order)}
            tabIndex={0}
            aria-label={`تفاصيل شحنة ${order.trackingNumber}`}
          >
            <div className="flex items-center gap-2">
              <FaUser className="text-blue-400" />
              <span className="font-bold text-gray-700">المستلم:</span>
              <span className="text-gray-600">{order.recipient}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-green-400" />
              <span className="font-bold text-gray-700">العنوان:</span>
              <span className="text-gray-600 truncate max-w-[120px]">{order.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaBarcode className="text-blue-400" />
              <span className="font-bold text-gray-700">رقم التتبع:</span>
              <span className="text-gray-600">{order.trackingNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaMoneyCheckAlt className="text-yellow-500" />
              <span className="font-bold text-gray-700">الدفع:</span>
              <span className={`font-bold ${order.paymentStatus === "محجوز" ? "text-yellow-600" : "text-green-600"}`}>
                {order.paymentStatus}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaClock className="text-gray-400" />
              <span className="font-bold text-gray-700">الحالة:</span>
              <span className={`font-bold ${order.shippingStatus === 3 ? "text-green-600" : "text-blue-600"}`}>
                {shippingSteps[order.shippingStatus].label}
              </span>
            </div>
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold shadow
                ${order.shippingStatus === 3 ? "bg-green-500 text-white" : "bg-blue-100 text-blue-600"}`}>
                {order.shippingStatus === 3 ? "تم التسليم" : "قيد الشحن"}
              </span>
            </div>
            <div className="mt-2">
              <ShippingProgress shippingStatus={order.shippingStatus} />
            </div>
            <div className="flex justify-end mt-2">
              <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Popup Modal */}
      {selectedOrder && (
        <ShippingDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
      {/* زخرفة سفلية */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-green-200 to-yellow-400 rounded-b-2xl opacity-60"></div>
    </div>
  )
}