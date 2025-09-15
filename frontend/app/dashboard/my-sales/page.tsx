'use client';

import { BackToDashboard } from "@/components/dashboard/BackToDashboard";
import { useState } from 'react';
import LoadingLink from "@/components/LoadingLink";
import { Package, DollarSign, Truck, CheckCircle, MessageSquare } from 'lucide-react';

// Mock data for sales
const mockSales = [
  {
    id: 's1',
    itemId: 'item123', 
    itemName: 'طابعة ليزر HP M404dn',
    imageUrl: '/office-placeholder.png',
    salePrice: 1500,
    endDate: '2024-10-26',
    status: 'paid_pending_delivery',
    buyerUsername: 'Ahmed Ali',
    commissionRate: 0.10
  },
  {
    id: 's2',
    itemId: 'server456',
    itemName: 'سيرفر Dell PowerEdge R730',
    imageUrl: '/server-placeholder.png',
    salePrice: 8500,
    endDate: '2024-10-25',
    status: 'completed',
    buyerUsername: 'Fatima Saad',
    commissionRate: 0.08
  },
  {
    id: 's3',
    itemId: 'medical789',
    itemName: 'جهاز أشعة Siemens Mobilett',
    imageUrl: '/medical-placeholder.png',
    salePrice: 3200,
    endDate: '2024-10-24',
    status: 'payment_pending',
    buyerUsername: 'Khalid Fahd',
    commissionRate: 0.12
  },
];

// Helper function
const getSellerStatusInfo = (status: string) => {
  switch (status) {
    case 'payment_pending':
      return { text: 'بانتظار دفع المشتري', color: 'text-orange-600', icon: <DollarSign size={16} /> };
    case 'paid_pending_delivery':
      return { text: 'تم الدفع - بانتظار التسليم/الشحن', color: 'text-blue-600', icon: <Package size={16} /> };
    case 'shipped':
      return { text: 'تم الشحن', color: 'text-cyan-600', icon: <Truck size={16} /> };
    case 'delivered_pending_confirmation':
      return { text: 'تم التسليم - بانتظار تأكيد المشتري', color: 'text-purple-600', icon: <Truck size={16} /> };
    case 'completed':
      return { text: 'اكتملت (تم تحويل المبلغ)', color: 'text-green-600', icon: <CheckCircle size={16} /> };
    default:
      return { text: status, color: 'text-gray-500', icon: null };
  }
};

export default function MySalesPage() {
  const [sales, setSales] = useState([]);

  const handleArrangeDelivery = (saleId: string) => {
    alert('يمكنك الآن التواصل مع المشتري (محاكاة).');
    setSales(sales.map(s => s.id === saleId ? { ...s, status: 'shipped' } : s));
  };

  const handleConfirmShipment = (saleId: string) => {
    alert('تم تأكيد الشحن (محاكاة).');
    setSales(sales.map(s => s.id === saleId ? { ...s, status: 'delivered_pending_confirmation' } : s));
  };

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen" dir="rtl">
      
      {/* زر العودة إلى لوحة التحكم */}
      <BackToDashboard />

      <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">مبيعاتي</h1>

      {sales.length === 0 ? (
        <p className="text-center text-gray-500">لم تقم ببيع أي عناصر بعد.</p>
      ) : (
        <div className="space-y-6">
          {sales.map((sale) => {
            const statusInfo = getSellerStatusInfo(sale.status);
            const netAmount = sale.salePrice * (1 - sale.commissionRate);
            return (
              <div key={sale.id} className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200 flex flex-col sm:flex-row gap-4">
                {/* Image */}
                <div className="w-full sm:w-32 h-32 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  <img src={sale.imageUrl} alt={sale.itemName} className="w-full h-full object-contain p-2" onError={(e) => e.currentTarget.src='/placeholder-icon.png'} />
                </div>

                {/* Details */}
                <div className="flex-grow space-y-2">
                  <h2 className="text-lg font-semibold text-gray-800">{sale.itemName}</h2>
                  <p className="text-sm text-gray-500">تاريخ البيع: {sale.endDate}</p>
                  <p className="text-sm text-gray-500">المشتري: {sale.buyerUsername}</p>
                  <p className="text-sm font-medium">سعر البيع: <span className="text-blue-600">{sale.salePrice.toLocaleString()} ريال</span></p>
                  <p className="text-sm font-medium">المبلغ الصافي المستحق (تقريبي): <span className="text-green-600">{netAmount.toLocaleString()} ريال</span></p>
                  <div className={`text-sm font-medium inline-flex items-center gap-1 px-2 py-1 rounded ${statusInfo.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                    {statusInfo.icon}
                    <span className={statusInfo.color}>{statusInfo.text}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-start items-stretch sm:items-end gap-2 pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-r sm:pr-4 sm:w-52">
                  {sale.status === 'paid_pending_delivery' && (
                    <button onClick={() => handleArrangeDelivery(sale.id)} className="w-full sm:w-auto text-center bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold py-2 px-4 rounded transition">
                      <MessageSquare size={16} className="inline ml-1" /> تواصل مع المشتري للتسليم
                    </button>
                  )}
                  <LoadingLink href={`/auctions/item/${sale.itemId}`} className="w-full sm:w-auto text-center text-sky-600 hover:text-sky-800 text-sm font-medium py-2 px-4 rounded border border-sky-200 hover:bg-sky-50 transition">
                    عرض تفاصيل العنصر
                  </LoadingLink>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
