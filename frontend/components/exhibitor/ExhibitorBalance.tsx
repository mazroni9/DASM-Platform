'use client'

import { useState, useEffect } from 'react'
import {
  FaWallet, FaArrowDown, FaRegClock, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaArrowUp, FaMoneyCheckAlt
} from "react-icons/fa"
import { toast } from 'react-hot-toast'

// بيانات تجريبية للعمليات
const demoTransactions = [
  { id: 1, type: "إيداع", amount: 5000, date: "2025-08-01", status: "تم", note: "إيداع أرباح" },
  { id: 2, type: "عمولة", amount: -500, date: "2025-08-03", status: "تم", note: "بيع سيارة" },
  { id: 3, type: "سحب", amount: -2000, date: "2025-08-05", status: "تم", note: "تحويل بنكي" },
  { id: 4, type: "إيداع", amount: 3000, date: "2025-08-07", status: "تم", note: "إيداع أرباح" },
  { id: 5, type: "سحب", amount: -1000, date: "2025-08-09", status: "قيد التحويل", note: "تحويل بنكي" },
]

function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" }
  return new Date(dateString).toLocaleDateString('ar-SA', options)
}

export function ExhibitorBalance({
  initialBalance = 7000,
  initialPending = 1000,
  initialLastTransfer = "2025-08-09",
  minWithdrawal = 100
}) {
  // States
  const [balance, setBalance] = useState(initialBalance)
  const [pending, setPending] = useState(initialPending)
  const [lastTransfer, setLastTransfer] = useState(initialLastTransfer)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [transactions, setTransactions] = useState(demoTransactions)

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (balance < minWithdrawal) {
      setError(`الحد الأدنى لطلب التحويل هو ${minWithdrawal.toLocaleString()} ريال`)
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // محاكاة عملية السحب
      setTimeout(() => {
        setSuccess(true)
        setTransactions(prev => [
          {
            id: prev.length + 1,
            type: "سحب",
            amount: -balance,
            date: new Date().toISOString().split('T')[0],
            status: "قيد التحويل",
            note: "طلب تحويل رصيد"
          },
          ...prev
        ])
        setPending(prev => prev + balance)
        setBalance(0)
        setLastTransfer(new Date().toISOString().split('T')[0])
        toast.success('تم إرسال طلب التحويل بنجاح!', {
          position: 'bottom-center',
          duration: 4000,
          icon: <FaCheckCircle className="text-green-500" />
        })
        setIsLoading(false)
      }, 2000)
    } catch (err) {
      setError('فشل الاتصال بالخادم')
      toast.error('فشل الاتصال بالخادم', {
        position: 'bottom-center',
        duration: 4000,
        icon: <FaExclamationTriangle className="text-red-500" />
      })
      setIsLoading(false)
    }
  }

  // رسائل فورية تختفي بعد 3 ثواني
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000)
      return () => clearTimeout(timer)
    }
    if (error) {
      const timer = setTimeout(() => setError(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  return (
    <div className="relative bg-gradient-to-tr from-green-100 via-white to-green-50 rounded-2xl shadow-xl p-8 overflow-hidden mb-8 transition-all duration-300 hover:shadow-2xl">
      {/* خلفية أيقونة شفافة */}
      <div className="absolute left-6 top-6 opacity-10 text-green-400 text-[120px] pointer-events-none select-none transition-transform duration-500 hover:scale-110">
        <FaWallet />
      </div>

      {/* شريط حالة النجاح */}
      {success && (
        <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center py-2 animate-fade-down z-20">
          <FaCheckCircle className="inline mr-2" />
          تم إرسال طلب التحويل بنجاح
        </div>
      )}

      {/* شريط حالة الخطأ */}
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center py-2 animate-fade-down z-20">
          <FaExclamationTriangle className="inline mr-2" />
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between z-10 relative">
        {/* الرصيد */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FaWallet className="text-green-500 text-2xl" />
            <h2 className="text-xl font-bold text-gray-800">رصيد المعرض</h2>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold text-green-600 drop-shadow-sm animate-pulse">
              {balance.toLocaleString()}
              <span className="text-lg font-bold"> ريال</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-gray-500 text-sm">
            <FaRegClock />
            <span>آخر تحويل:</span>
            <span className="font-semibold text-gray-700">
              {formatDate(lastTransfer)}
            </span>
          </div>
          {/* تحذير إذا كان الرصيد أقل من الحد الأدنى */}
          {balance > 0 && balance < minWithdrawal && (
            <div className="mt-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-lg inline-flex items-center">
              <FaExclamationTriangle className="mr-1" />
              يجب أن يكون الرصيد {minWithdrawal.toLocaleString()} ريال على الأقل للتحويل
            </div>
          )}
        </div>

        {/* قيد التحويل وزر السحب */}
        <div className="mt-6 md:mt-0 flex flex-col items-end gap-3">
          <div className="flex items-center bg-white/80 backdrop-blur-md border border-green-100 rounded-xl px-4 py-2 shadow-sm transition-all hover:shadow-md">
            <FaArrowDown className="text-yellow-500 mr-2 animate-bounce" />
            <span className="text-gray-700 font-medium">مبلغ قيد التحويل:</span>
            <span className="ml-2 text-yellow-600 font-bold">
              {pending.toLocaleString()} ريال
            </span>
          </div>
          <button
            onClick={handleWithdraw}
            disabled={isLoading || balance < minWithdrawal}
            className={`mt-2 bg-gradient-to-l from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center
              ${(isLoading || balance < minWithdrawal) ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl'}
              ${isLoading ? 'cursor-wait' : ''}
            `}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                جاري المعالجة...
              </>
            ) : (
              'طلب تحويل الرصيد'
            )}
          </button>
          <p className="text-xs text-gray-500 text-right mt-1">
            قد تستغرق المعاملة من 1-3 أيام عمل
          </p>
        </div>
      </div>

      {/* جدول العمليات المالية */}
      <div className="mt-10 bg-white/90 rounded-xl shadow-md border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <FaMoneyCheckAlt className="text-blue-400" />
          <span className="font-bold text-gray-700">سجل عمليات المحفظة</span>
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
              <tr key={item.id} className="text-gray-700 text-center hover:bg-green-50 transition">
                <td className="py-2">{formatDate(item.date)}</td>
                <td className="py-2 flex items-center justify-center gap-2">
                  {item.type === "إيداع" && <FaArrowUp className="text-green-500" />}
                  {item.type === "سحب" && <FaArrowDown className="text-yellow-500" />}
                  {item.type === "عمولة" && <FaMoneyCheckAlt className="text-red-500" />}
                  {item.type}
                </td>
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
      </div>

      {/* شريط زخرفي سفلي */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-green-200 to-green-400 rounded-b-2xl opacity-60"></div>
    </div>
  )
}