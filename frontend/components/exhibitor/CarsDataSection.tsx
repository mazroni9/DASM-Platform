'use client'

import { useState } from "react"
import { FaCar, FaSearch, FaCheckCircle, FaTimesCircle, FaChartPie } from "react-icons/fa"

const cars = [
  { id: 1, model: "تويوتا كامري", year: 2022, status: "متاحة", price: 95000 },
  { id: 2, model: "هيونداي سوناتا", year: 2021, status: "مباعة", price: 87000 },
  { id: 3, model: "كيا سيراتو", year: 2020, status: "متاحة", price: 65000 },
  { id: 4, model: "هوندا أكورد", year: 2022, status: "محجوزة", price: 99000 },
  { id: 5, model: "تويوتا يارس", year: 2019, status: "مباعة", price: 42000 },
]

function PieChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  let startAngle = 0
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      {data.map((d, i) => {
        const angle = (d.value / total) * 360
        const x1 = 60 + 54 * Math.cos((Math.PI / 180) * (startAngle - 90))
        const y1 = 60 + 54 * Math.sin((Math.PI / 180) * (startAngle - 90))
        const x2 = 60 + 54 * Math.cos((Math.PI / 180) * (startAngle + angle - 90))
        const y2 = 60 + 54 * Math.sin((Math.PI / 180) * (startAngle + angle - 90))
        const largeArc = angle > 180 ? 1 : 0
        const pathData = `
          M 60 60
          L ${x1} ${y1}
          A 54 54 0 ${largeArc} 1 ${x2} ${y2}
          Z
        `
        const color = d.color
        startAngle += angle
        return <path key={i} d={pathData} fill={color} />
      })}
    </svg>
  )
}

export function CarsDataSection() {
  const [search, setSearch] = useState("")
  const filtered = cars.filter(car =>
    car.model.includes(search) || car.year.toString().includes(search) || car.status.includes(search)
  )

  // Pie chart data
  const statusData = [
    { label: "متاحة", value: cars.filter(c => c.status === "متاحة").length, color: "#34d399" },
    { label: "مباعة", value: cars.filter(c => c.status === "مباعة").length, color: "#f87171" },
    { label: "محجوزة", value: cars.filter(c => c.status === "محجوزة").length, color: "#fbbf24" },
  ]

  return (
    <div className="relative bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 mb-8 border border-gray-100 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400 animate-pulse rounded-t-2xl"></div>
      <h2 className="text-2xl font-extrabold text-gray-800 mb-8 flex items-center gap-2">
        <FaCar className="text-blue-400" /> وحدة بيانات السيارات
      </h2>
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-1">
          <div className="relative mb-4">
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="بحث عن سيارة أو سنة أو حالة..."
              className="w-full border border-gray-200 rounded-xl py-2 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="py-2">الموديل</th>
                <th className="py-2">السنة</th>
                <th className="py-2">الحالة</th>
                <th className="py-2">السعر</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(car => (
                <tr key={car.id} className="text-gray-700 text-center hover:bg-blue-50 transition">
                  <td className="py-2">{car.model}</td>
                  <td className="py-2">{car.year}</td>
                  <td className="py-2">
                    {car.status === "متاحة" && <span className="inline-flex items-center gap-1 text-green-600 font-bold"><FaCheckCircle /> متاحة</span>}
                    {car.status === "مباعة" && <span className="inline-flex items-center gap-1 text-red-500 font-bold"><FaTimesCircle /> مباعة</span>}
                    {car.status === "محجوزة" && <span className="inline-flex items-center gap-1 text-yellow-500 font-bold"><FaChartPie /> محجوزة</span>}
                  </td>
                  <td className="py-2 font-bold text-blue-600">{car.price.toLocaleString()} ريال</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pie Chart */}
        <div className="flex flex-col items-center justify-center gap-4">
          <PieChart data={statusData} />
          <div className="flex gap-4 mt-2">
            {statusData.map((d, i) => (
              <span key={i} className="flex items-center gap-1 text-xs font-bold" style={{ color: d.color }}>
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: d.color }}></span>
                {d.label} ({d.value})
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-green-200 to-yellow-400 rounded-b-2xl opacity-60"></div>
    </div>
  )
}