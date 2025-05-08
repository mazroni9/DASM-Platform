'use client';

import { BackToDashboard } from "@/components/dashboard/BackToDashboard";
import { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Check, AlertCircle } from 'lucide-react';

// بيانات التحويلات (مؤقتة للاختبار)
const mockTransfers = [
  { 
    id: 1, 
    type: 'deposit', 
    amount: 5000, 
    status: 'completed',
    method: 'bank_transfer',
    accountInfo: '**** **** 8354',
    date: '2024-10-27',
    reference: 'DEP78901234'
  },
  { 
    id: 2, 
    type: 'withdrawal', 
    amount: 10000, 
    status: 'completed',
    method: 'bank_transfer',
    accountInfo: '**** **** 8354',
    date: '2024-10-20',
    reference: 'WTH45678901'
  },
  { 
    id: 3, 
    type: 'deposit', 
    amount: 2000, 
    status: 'pending',
    method: 'bank_transfer',
    accountInfo: '**** **** 8354',
    date: '2024-10-19',
    reference: 'DEP12345678'
  },
  { 
    id: 4, 
    type: 'withdrawal', 
    amount: 3000, 
    status: 'failed',
    method: 'bank_transfer',
    accountInfo: '**** **** 8354',
    date: '2024-10-15',
    reference: 'WTH23456789'
  }
];

export default function MyTransfersPage() {
  const [transfers] = useState(mockTransfers);
  const [activeTab, setActiveTab] = useState('deposit'); // deposit or withdrawal

  // الحصول على معلومات الحالة
  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { 
          label: 'مكتمل', 
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: <Check className="w-4 h-4" />
        };
      case 'pending':
        return { 
          label: 'قيد المعالجة', 
          color: 'text-amber-600 bg-amber-50 border-amber-200',
          icon: null
        };
      case 'failed':
        return { 
          label: 'فشلت العملية', 
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: <AlertCircle className="w-4 h-4" />
        };
      default:
        return { 
          label: status, 
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: null
        };
    }
  };

  // معلومات طريقة الدفع
  const getMethodInfo = (method) => {
    switch (method) {
      case 'bank_transfer':
        return 'تحويل بنكي';
      case 'card':
        return 'بطاقة ائتمانية';
      case 'wallet':
        return 'محفظة إلكترونية';
      default:
        return method;
    }
  };

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen" dir="rtl">
      
      {/* زر العودة */}
      <BackToDashboard />

      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">تحويلاتي</h1>

      {/* قسم إجراء تحويل جديد */}
      <section className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8">
        <div className="flex border-b border-gray-200 mb-6">
          <button 
            onClick={() => setActiveTab('deposit')}
            className={`pb-3 px-4 font-medium ${
              activeTab === 'deposit' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ArrowDownLeft className="inline-block ml-2 w-4 h-4" />
            إيداع
          </button>
          <button 
            onClick={() => setActiveTab('withdrawal')}
            className={`pb-3 px-4 font-medium ${
              activeTab === 'withdrawal' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ArrowUpRight className="inline-block ml-2 w-4 h-4" />
            سحب
          </button>
        </div>

        {activeTab === 'deposit' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">إيداع مبلغ إلى رصيدك</h2>
            <p className="text-gray-600">قم بإيداع المبلغ الذي تريده إلى رصيدك في الموقع</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                <div className="relative">
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="أدخل المبلغ" 
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">ريال</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الإيداع</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="card">بطاقة ائتمانية</option>
                  <option value="wallet">محفظة إلكترونية</option>
                </select>
              </div>
            </div>
            
            <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium transition">متابعة الإيداع</button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">سحب مبلغ من رصيدك</h2>
            <p className="text-gray-600">قم بسحب المبلغ الذي تريده من رصيدك في الموقع</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                <div className="relative">
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="أدخل المبلغ" 
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">ريال</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حساب الاستلام</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="bank_account_1">حساب بنكي (**** 8354)</option>
                  <option value="add_new">إضافة حساب جديد</option>
                </select>
              </div>
            </div>
            
            <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium transition">متابعة السحب</button>
          </div>
        )}
      </section>

      {/* سجل التحويلات */}
      <section className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-6 text-gray-700 border-b pb-2">سجل التحويلات</h2>

        {transfers.length === 0 ? (
          <p className="text-center text-gray-500 py-4">لا توجد تحويلات في سجلك بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-gray-500 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-4 py-3">التاريخ</th>
                  <th scope="col" className="px-4 py-3">النوع</th>
                  <th scope="col" className="px-4 py-3">المبلغ</th>
                  <th scope="col" className="px-4 py-3">الطريقة</th>
                  <th scope="col" className="px-4 py-3">رقم المرجع</th>
                  <th scope="col" className="px-4 py-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transfers.map((transfer) => {
                  const statusInfo = getStatusInfo(transfer.status);
                  return (
                    <tr key={transfer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">{transfer.date}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {transfer.type === 'deposit' ? (
                          <span className="inline-flex items-center">
                            <ArrowDownLeft className="text-green-500 w-4 h-4 ml-1" />
                            إيداع
                          </span>
                        ) : (
                          <span className="inline-flex items-center">
                            <ArrowUpRight className="text-blue-500 w-4 h-4 ml-1" />
                            سحب
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap font-medium">
                        {transfer.amount.toLocaleString()} ريال
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getMethodInfo(transfer.method)}
                        <div className="text-xs text-gray-500">{transfer.accountInfo}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap font-mono">
                        {transfer.reference}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
