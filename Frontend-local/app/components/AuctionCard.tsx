/**
 * ✅ مكون البطاقة: AuctionCard
 * 📁 المسار: Frontend-local/app/components/AuctionCard.tsx
 *
 * ✅ الوظيفة:
 * - يعرض معلومات السيارة (العنوان، الصورة، السعر الحالي، نتيجة المزايدة إن وجدت)
 * - يحتوي على زر "💰 قدم مزايدتك"
 * - عند الضغط يظهر نموذج مزايدة مباشرة مربوط بـ /api/submit-bid
 */

'use client';

import { useState } from 'react';

interface AuctionCardProps {
  id: number;
  title: string;
  image: string;
  current_price: number;
  auction_result?: string;
}

export function AuctionCard({ id, title, image, current_price, auction_result }: AuctionCardProps) {
  const [showBid, setShowBid] = useState(false);
  const [bid, setBid] = useState('');
  const [status, setStatus] = useState('');

  const submitBid = async () => {
    try {
      const res = await fetch('/api/submit-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: id,
          bid_amount: parseFloat(bid),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('✅ تمت المزايدة بنجاح');
        setBid('');
        setShowBid(false);
      } else {
        setStatus(`❌ خطأ: ${data.error}`);
      }
    } catch (err) {
      setStatus('❌ فشل الاتصال بالخادم');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <img
        src={`/auctionsPIC/main-instantPIC/${image}`}
        alt={title}
        className="w-full h-48 object-cover rounded-md mb-3"
      />
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-gray-600 mb-2">💰 السعر الحالي: {current_price} ريال</p>
      {auction_result && <p className="text-sm text-green-600">📦 النتيجة: {auction_result}</p>}

      <button
        onClick={() => setShowBid(!showBid)}
        className="mt-2 text-blue-600 underline text-sm"
      >
        💰 قدم مزايدتك
      </button>

      {showBid && (
        <div className="mt-3">
          <input
            type="number"
            value={bid}
            onChange={(e) => setBid(e.target.value)}
            placeholder="أدخل مزايدتك"
            className="w-full p-2 border rounded mb-2"
          />
          <button
            onClick={submitBid}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            إرسال
          </button>
          {status && <p className="text-xs mt-2 text-green-700">{status}</p>}
        </div>
      )}
    </div>
  );
}
