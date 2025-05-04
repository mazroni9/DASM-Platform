'use client';

import { BackToDashboard } from "@/components/dashboard/BackToDashboard";
import { useState } from 'react';

// بيانات عمليات المحفظة (مؤقتة للاختبار)
const mockTransactions = [
  { id: 1, type: 'deposit', amount: 5000, balance: 5000, description: 'إيداع بنكي', date: '2024-10-27' },
  { id: 2, type: 'purchase', amount: -1500, balance: 3500, description: 'شراء: طابعة HP M404dn', date: '2024-10-26' },
  { id: 3, type: 'sale', amount: 7820, balance: 11320, description: 'تحويل مبلغ بيع: سيرفر Dell', date: '2024-10-25' },
  { id: 4, type: 'commission', amount: -680, balance: 10640, description: 'عمولة بيع: سيرفر Dell', date: '2024-10-25' },
  { id: 5, type: 'withdrawal', amount: -10000, balance: 640, description: 'سحب إلى حساب بنكي', date: '2024-10-20' },
];

export default function MyWalletPage() {
  const [transactions] = useState(mockTransactions);
  const currentBalance = transactions.length > 0 ? transactions[0].balance : 0;

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen" dir="rtl">
      
      {/* زر العودة */}
      <BackToDashboard />

      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">محفظتي</h1>

      {/* رصيد المحفظة */}
      <section className="bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-lg shadow-lg p-8 mb-10 text-center">
        <h2 className="text-lg font-semibold mb-2">الرصيد الحالي</h2>
        <p className="text-4xl font-bold">{currentBalance.toLocaleString()} ريال</p>
        <div className="mt-6 flex justify-center gap-4">
          <button className="bg-white text-sky-600 hover:bg-gray-100 font-bold py-2 px-6 rounded-full transition">إيداع</button>
          <button className="bg-white text-sky-600 hover:bg-gray-100 font-bold py-2 px-6 rounded-full transition">سحب</button>
        </div>
      </section>

      {/* سجل المعاملات */}
      <section className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">تاريخ المعاملات</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right text-gray-600">
            <thead className="text-xs text-gray-500 uppercase bg-gray-100">
              <tr>
                <th scope="col" className="px-4 py-3">التاريخ</th>
                <th scope="col" className="px-4 py-3">النوع</th>
                <th scope="col" className="px-4 py-3">المبلغ</th>
                <th scope="col" className="px-4 py-3">الرصيد</th>
                <th scope="col" className="px-4 py-3">الوصف</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">{t.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {t.type === 'deposit' ? 'إيداع' :
                     t.type === 'purchase' ? 'شراء' :
                     t.type === 'sale' ? 'تحويل مبيعات' :
                     t.type === 'commission' ? 'عمولة' :
                     t.type === 'withdrawal' ? 'سحب' : t.type}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {t.amount > 0 ? `+${t.amount.toLocaleString()}` : `${t.amount.toLocaleString()}`} ريال
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{t.balance.toLocaleString()} ريال</td>
                  <td className="px-4 py-3">{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
