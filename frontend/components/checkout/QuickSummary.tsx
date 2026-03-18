"use client";

interface QuickSummaryProps {
  car: {
    make: string;
    model: string;
    year: number;
    images?: string[];
    plate_number?: string;
  };
  auctionPrice: number;
  totalFees: number;
  totalAmount: number;
}

export default function QuickSummary({
  car,
  auctionPrice,
  totalFees,
  totalAmount,
}: QuickSummaryProps) {
  const carImage = car?.images?.[0] || "/placeholder-car.jpg";
  const plateNumber = car?.plate_number || "غير محدد";

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
      {/* Decorative Circle */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />

      <h3 className="font-bold text-lg mb-4 relative z-10">ملخص سريع</h3>

      {/* Car Info */}
      <div className="flex gap-4 items-center mb-6 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
        <img
          src={carImage}
          alt={`${car?.make} ${car?.model}`}
          className="w-16 h-12 object-cover rounded-lg"
        />
        <div>
          <p className="text-sm font-bold">
            {car?.make} {car?.model} {car?.year}
          </p>
          <p className="text-xs text-slate-300">اللوحة: {plateNumber}</p>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 border-t border-white/10 pt-4 text-sm">
        <div className="flex justify-between text-slate-300">
          <span>قيمة المزاد</span>
          <span>{auctionPrice.toLocaleString()} ر.س</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>الرسوم والضرائب</span>
          <span>{totalFees.toLocaleString()} ر.س</span>
        </div>
      </div>

      {/* Total */}
      <div className="border-t border-white/20 mt-6 pt-4">
        <div className="flex justify-between items-end">
          <span className="text-slate-300 text-sm">الإجمالي للدفع</span>
          <span className="font-bold text-2xl">
            {totalAmount.toLocaleString()} <small>ر.س</small>
          </span>
        </div>
      </div>
    </div>
  );
}
