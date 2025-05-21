'use client';

export default function RequestReportPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">طلب تقرير فني للطائرة</h2>
        <form className="space-y-4">
          <input type="text" placeholder="اسمك الكامل" className="w-full p-3 border rounded-lg" />
          <input type="email" placeholder="بريدك الإلكتروني" className="w-full p-3 border rounded-lg" />
          <input type="text" placeholder="موديل الطائرة المطلوبة" className="w-full p-3 border rounded-lg" />
          <textarea placeholder="ملاحظات إضافية (اختياري)" className="w-full p-3 border rounded-lg"></textarea>
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold">
            إرسال الطلب
          </button>
        </form>
      </div>
    </div>
  );
}
