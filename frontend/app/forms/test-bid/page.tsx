// ✅ المسار: Frontend-local/app/forms/test-bid/page.tsx
// ✅ نموذج بسيط لتقديم مزايدة على سيارة عبر /api/submit-bid

'use client';

import { useState } from 'react';

export default function TestBidForm() {
  const [itemId, setItemId] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

  const submitBid = async () => {
    try {
      const res = await fetch('/api/submit-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: parseInt(itemId),
          bid_amount: parseFloat(amount),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('✅ مزايدتك تم تسجيلها بنجاح!');
      } else {
        setStatus(`❌ فشل: ${data.error || 'خطأ غير معروف'}`);
      }
    } catch (err) {
      setStatus('❌ فشل في الاتصال بالسيرفر.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">📤 تقديم مزايدة تجريبية</h2>

      <div className="mb-3">
        <label className="block mb-1">🆔 رقم السيارة (item_id)</label>
        <input
          type="number"
          className="w-full p-2 border rounded"
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="block mb-1">💰 قيمة المزايدة</label>
        <input
          type="number"
          step="0.01"
          className="w-full p-2 border rounded"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <button
        onClick={submitBid}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        إرسال المزايدة
      </button>

      {status && (
        <div className="mt-4 p-2 bg-gray-100 border rounded text-sm">
          {status}
        </div>
      )}
    </div>
  );
}
