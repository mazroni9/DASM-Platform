"use client";

interface CarItemCardProps {
  car: {
    make: string;
    model: string;
    year: number;
    images?: string[];
    plate_number?: string;
  };
  auctionPrice: number;
  auctionNumber: string;
}

export default function CarItemCard({
  car,
  auctionPrice,
  auctionNumber,
}: CarItemCardProps) {
  const carImage = car?.images?.[0] || "/placeholder-car.jpg";
  const plateNumber = car?.plate_number || "غير محدد";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-6 shadow-sm">
      {/* Car Image */}
      <div className="w-full sm:w-48 h-32 bg-slate-100 rounded-xl overflow-hidden shrink-0">
        <img
          src={carImage}
          alt={`${car?.make} ${car?.model}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Car Details */}
      <div className="flex-grow flex flex-col justify-center">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              {car?.make} {car?.model} {car?.year}
            </h3>
            <p className="text-sm text-slate-500">رقم اللوحة: {plateNumber}</p>
          </div>
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
            تمت الترسية
          </span>
        </div>

        <div className="h-px bg-slate-100 my-3" />

        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-slate-400 block text-xs">
              سعر المزاد الفائز
            </span>
            <span className="font-bold text-slate-800 text-lg">
              {auctionPrice.toLocaleString()} <small>ر.س</small>
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">رقم المزاد</span>
            <span className="font-medium text-slate-800">#{auctionNumber}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
