'use client'

import { useState } from "react"
import { FaShieldAlt, FaCarCrash, FaBatteryFull, FaSprayCan, FaInfoCircle, FaCheckCircle } from "react-icons/fa"

const services = [
  {
    name: "تأمين شامل",
    icon: <FaShieldAlt className="text-blue-500 text-3xl group-hover:scale-110 transition-transform" />,
    desc: "تأمين شامل للسيارة ضد الحوادث والسرقة.",
    details: "يشمل التأمين جميع الأضرار الناتجة عن الحوادث أو السرقة أو الكوارث الطبيعية.",
  },
  {
    name: "حماية طلاء",
    icon: <FaSprayCan className="text-green-500 text-3xl group-hover:scale-110 transition-transform" />,
    desc: "حماية طلاء السيارة من الخدوش والعوامل الجوية.",
    details: "طبقة حماية شفافة تدوم حتى 3 سنوات مع ضمان ضد الاصفرار.",
  },
  {
    name: "شحن بطارية",
    icon: <FaBatteryFull className="text-yellow-500 text-3xl group-hover:scale-110 transition-transform" />,
    desc: "خدمة شحن وفحص بطارية السيارة.",
    details: "فحص شامل للبطارية وضمان شحنها بكفاءة عالية.",
  },
  {
    name: "تأمين ضد الغير",
    icon: <FaCarCrash className="text-red-500 text-3xl group-hover:scale-110 transition-transform" />,
    desc: "تأمين ضد الأضرار للطرف الثالث.",
    details: "يغطي الأضرار للطرف الثالث في حال وقوع حادث.",
  },
]

function ServiceModal({ service, onClose }) {
  if (!service) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-red-500 text-2xl transition"
          aria-label="إغلاق"
        >
          ×
        </button>
        <div className="flex flex-col items-center gap-3 mb-6">
          {service.icon}
          <h2 className="text-xl font-extrabold text-gray-800">{service.name}</h2>
        </div>
        <p className="text-gray-700 text-center mb-4">{service.details}</p>
        <button
          onClick={() => { onClose(); alert("تم طلب الخدمة بنجاح!"); }}
          className="bg-gradient-to-l from-blue-500 to-green-400 hover:from-blue-600 hover:to-green-500 text-white font-bold py-2 px-8 rounded-xl shadow-md transition-all duration-200 active:scale-95 flex items-center gap-2"
        >
          <FaCheckCircle /> طلب الخدمة
        </button>
      </div>
    </div>
  )
}

export function ExtraServices() {
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)

  return (
    <div className="relative bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 mb-8 border border-gray-100 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400 animate-pulse rounded-t-2xl"></div>
      <h2 className="text-2xl font-extrabold text-gray-800 mb-8 flex items-center gap-2">
        <FaInfoCircle className="text-blue-400" /> خدمات إضافية للمعرض
      </h2>
      <div className="grid md:grid-cols-2 gap-8">
        {services.map((service, idx) => (
          <div
            key={idx}
            className="group relative bg-gradient-to-tr from-blue-50 to-white rounded-xl p-6 shadow-md border border-blue-100 hover:shadow-xl transition-all duration-200 flex flex-col items-center cursor-pointer"
            onClick={() => setSelected(service)}
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered(null)}
          >
            {service.icon}
            <span className="mt-4 text-lg font-bold text-gray-700">{service.name}</span>
            <span className="mt-2 text-gray-500 text-sm text-center">{service.desc}</span>
            {hovered === idx && (
              <span className="absolute bottom-20 bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-lg z-50 whitespace-nowrap">
                اضغط لمزيد من التفاصيل
              </span>
            )}
            <button
              className="mt-4 bg-gradient-to-l from-blue-500 to-green-400 hover:from-blue-600 hover:to-green-500 text-white font-bold py-1 px-6 rounded-xl shadow-md transition-all duration-200 active:scale-95 text-sm"
              onClick={e => { e.stopPropagation(); setSelected(service); }}
            >
              طلب الخدمة
            </button>
          </div>
        ))}
      </div>
      {selected && <ServiceModal service={selected} onClose={() => setSelected(null)} />}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-green-200 to-yellow-400 rounded-b-2xl opacity-60"></div>
    </div>
  )
}