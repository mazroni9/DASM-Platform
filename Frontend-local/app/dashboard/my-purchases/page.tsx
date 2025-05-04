'use client';

import { BackToDashboard } from "@/components/dashboard/BackToDashboard";
import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, CreditCard, Truck, CheckCircle, AlertCircle } from 'lucide-react';

// Mock data for purchases
const mockPurchases = [
  {
    id: 'p1',
    itemId: 'item123',
    itemName: 'طابعة ليزر HP M404dn',
    imageUrl: '/office-placeholder.png',
    winningBid: 1500,
    endDate: '2024-10-26',
    status: 'pending_payment',
  },
  {
    id: 'p2',
    itemId: 'server456',
    itemName: 'سيرفر Dell PowerEdge R730',
    imageUrl: '/server-placeholder.png',
    winningBid: 8500,
    endDate: '2024-10-25',
    status: 'paid_pending_delivery',
  },
  {
    id: 'p3',
    itemId: 'medical789',
    itemName: 'جهاز أشعة Siemens Mobilett',
    imageUrl: '/medical-placeholder.png',
    winningBid: 3200,
    endDate: '2024-10-24',
    status: 'delivered_pending_confirmation',
  },
  {
    id: 'p4',
    itemId: 'car001',
    itemName: 'تويوتا كامري 2023',
    imageUrl: '/car-placeholder.png',
    winningBid: 55000,
    endDate: '2024-10-23',
    status: 'completed',
  },
];

// Helper to get status text and color
const getStatusInfo = (status: string) => {
  switch (status) {
    case 'pending_payment':
      return { text: 'بانتظار الدفع', color: 'text-yellow-600', icon: <CreditCard size={16} /> };
    case 'paid_pending_delivery':
      return { text: 'تم الدفع - بانتظار التسليم', color: 'text-blue-600', icon: <ShoppingBag size={16} /> };
    case 'shipped':
      return { text: 'جاري الشحن', color: 'text-cyan-600', icon: <Truck size={16} /> };
    case 'delivered_pending_confirmation':
      return { text: 'تم التسليم - بانتظار التأكيد', color: 'text-purple-600', icon: <Truck size={16} /> };
    case 'completed':
      return { text: 'مكتملة', color: 'text-green-600', icon: <CheckCircle size={16} /> };
    case 'disputed':
      return { text: 'نزاع مفتوح', color: 'text-red-600', icon: <AlertCircle size={16} /> };
    default:
      return { text: status, color: 'text-gray-500', icon: null };
  }
};

export default function MyPurchasesPage() {
  const [purchases, setPurchases] = useState(mockPurchases);

  const handlePayNow = (purchaseId: string) => {
    alert('سيتم توجيهك لصفحة الدفع قريباً (محاكاة).');
    setPurchases(purchases.map(p => p.id === purchaseId ? { ...p, status: 'paid_pending_delivery' } : p));
  };

  const handleConfirmReceipt = (purchaseId: string) => {
    alert('تم تأكيد الاستلام بنجاح (محاكاة).');
    setPurchases(purchases.map(p => p.id === purchaseId ? { ...p, status: 'completed' } : p));
  };

  const handleOpenDispute = (purchaseId: string) => {
    alert('سيتم فتح صفحة النزاع (محاكاة).');
  };

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen" dir="rtl">
      
      {/* زر العودة إلى لوحة التحكم */}
      <BackToDashboard />

      <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">
         مشترياتي <span className="text-sm text-gray-500 align-middle">({purchases.length})</span>
      </h1>

      {purchases.length === 0 ? (
        <p className="text-center text-gray-500">لم تقم بشراء أي عناصر بعد.</p>
      ) : (
        <div className="space-y-6">
          {purchases.map((purchase) => {
            const statusInfo = getStatusInfo(purchase.status);
            return (
              <div key={purchase.id} className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200 flex flex-col sm:flex-row gap-4">
                {/* Image */}
                <div className="w-full sm:w-32 h-32 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  <img src={purchase.imageUrl} alt={purchase.itemName} className="w-full h-full object-contain p-2" onError={(e) => e.currentTarget.src='/placeholder-icon.png'} />
                </div>

                {/* Info */}
                <div className="flex-grow space-y-2">
                  <h2 className="text-lg font-semibold text-gray-800">{purchase.itemName}</h2>
                  <p className="text-sm text-gray-500">تاريخ انتهاء المزاد: {purchase.endDate}</p>
                  <p className="text-sm font-medium">سعر الفوز: <span className="text-green-600">{purchase.winningBid.toLocaleString()} ريال</span></p>
                  <div className={`text-sm font-medium inline-flex items-center gap-1 px-2 py-1 rounded ${statusInfo.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                    {statusInfo.icon}
                    <span className={statusInfo.color}>{statusInfo.text}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-start sm:items-end gap-2 pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-r sm:pr-4 sm:w-48">
                  {purchase.status === 'pending_payment' && (
                    <Link href={`/dashboard/my-transfers?purchaseId=${purchase.id}&amount=${purchase.winningBid}`}
                          className="w-full sm:w-auto text-center bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 px-4 rounded transition">
                      إتمام الدفع
                    </Link>
                  )}
                  {purchase.status === 'delivered_pending_confirmation' && (
                    <button onClick={() => handleConfirmReceipt(purchase.id)} className="w-full sm:w-auto text-center bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded transition">
                      تأكيد الاستلام
                    </button>
                  )}
                  <Link href={`/auctions/item/${purchase.itemId}`} className="w-full sm:w-auto text-center text-sky-600 hover:text-sky-800 text-sm font-medium py-2 px-4 rounded border border-sky-200 hover:bg-sky-50 transition">
                    عرض تفاصيل العنصر
                  </Link>
                  {purchase.status !== 'completed' && (
                    <button onClick={() => handleOpenDispute(purchase.id)} className="w-full sm:w-auto text-center text-red-600 hover:text-red-800 text-xs font-medium py-1 px-2 rounded hover:bg-red-50 transition">
                      فتح نزاع
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
