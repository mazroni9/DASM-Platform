'use client'

import { useState } from "react"
import { FaWallet, FaArrowDown, FaArrowUp, FaMoneyCheckAlt, FaFileExport, FaCheckCircle } from "react-icons/fa"

// البيانات التجريبية محذوفة. يجب جلب بيانات الملخص والمعاملات من مصدر خارجي أو props.
const summary: Array<{ label: string, value: number, icon: JSX.Element, color: string }> = []
const transactions: Array<{ date: string, type: string, amount: number, status: string, note: string }> = []

function formatDate(dateString: string) {
  const options = { year: "numeric", month: "short", day: "numeric" }
  return new Date(dateString).toLocaleDateString('ar-SA', options)
}

// رسم بياني بسيط
function MiniBarChart({ data }: { data: typeof transactions }) {
  if (data.length === 0) return null
  const max = Math.max(...data.map(d => Math.abs(d.amount)))
  return (
    <div className="flex items-end gap-2 h-16 mt-4">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center">
          <div
            className={`w-4 rounded-t ${d.amount > 0 ? "bg-green-400" : "bg-red-400"} transition-all`}
            style={{ height: `${max ? (Math.abs(d.amount) / max * 60) : 0}px` }}
            title={d.amount}
          ></div>
          <span className="text-[10px] text-gray-400 mt-1">{formatDate(d.date).split('/')[1]}</span>
        </div>
      ))}
    </div>
  )
}

export function FinancialDashboard() {
  const [exported, setExported] = useState(false)

  return (
    <div className="relative bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 mb-8 border border-gray-100 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-blue-400 to-yellow-400 animate-pulse rounded-t-2xl"></div>
      <h2 className="text-2xl font-extrabold text-gray-800 mb-8 flex items-center gap-2">
        <FaWallet className="text-green-400" /> لوحة العمليات المالية
      </h2>
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {summary.map((item, idx) => (
          <div key={idx} className={`flex flex-col items-center p-4 rounded-xl shadow-md border border-gray-100 ${item.color}`}>
            {item.icon}
            <span className="mt-2 text-lg font-bold text-gray-700">{item.label}</span>
            <span className="mt-1 text-2xl font-extrabold text-gray-800">{item.value.toLocaleString()} ريال</span>
          </div>
        ))}
      </div>
      <MiniBarChart data={transactions} />
      <div className="bg-white/90 rounded-xl shadow-md border border-gray-100 p-4 mt-8">
        <div className="flex items-center gap-2 mb-3">
          <FaMoneyCheckAlt className="text-blue-400" />
          <span className="font-bold text-gray-700">آخر العمليات المالية</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b">
              <th className="py-2">التاريخ</th>
              <th className="py-2">النوع</th>
              <th className="py-2">المبلغ</th>
              <th className="py-2">الحالة</th>
              <th className="py-2">ملاحظة</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((item, idx) => (
              <tr key={idx} className="text-gray-700 text-center hover:bg-blue-50 transition">
                <td className="py-2">{formatDate(item.date)}</td>
                <td className="py-2">{item.type}</td>
                <td className={`py-2 font-bold ${item.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                  {item.amount > 0 ? "+" : ""}{item.amount.toLocaleString()} ريال
                </td>
                <td className="py-2">
                  {item.status === "تم" ? <FaCheckCircle className="inline text-green-500" /> : item.status}
                </td>
                <td className="py-2">{item.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end mt-4">
          <button
            onClick={() => { setExported(true); setTimeout(() => setExported(false), 2000); }}
            className="bg-gradient-to-l from-green-500 to-blue-400 hover:from-green-600 hover:to-blue-500 text-white font-bold py-2 px-6 rounded-xl shadow-md transition-all duration-200 active:scale-95 text-sm flex items-center gap-2"
          >
            <FaFileExport className={exported ? "animate-bounce" : ""} /> {exported ? "تم التصدير!" : "تصدير العمليات"}
          </button>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-blue-200 to-yellow-400 rounded-b-2xl opacity-60"></div>
    </div>
  )
}