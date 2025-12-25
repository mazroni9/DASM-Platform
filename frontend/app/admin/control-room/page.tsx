"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";

const CAR_TYPES = [
  { value: "luxury", label: "سيارة فارهة" },
  { value: "classic", label: "كلاسيكية" },
  { value: "caravan", label: "كرافان" },
  { value: "truck", label: "شاحنة" },
  { value: "company", label: "سيارة شركة" },
  { value: "government", label: "حكومية" },
  { value: "individual", label: "فردية" },
];

type Car = {
  id: number;
  owner_name: string;
  model: string;
  status: string;
  images: string[];
  reports: string[];
  market?: string;
  type?: string;
  selected?: boolean;
};

export default function ControlRoomPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCars, setSelectedCars] = useState<number[]>([]);
  const [carTypes, setCarTypes] = useState<{ [id: number]: string }>({});

  useEffect(() => {
    fetchPendingCars();
  }, []);

  const fetchPendingCars = async () => {
    setLoading(true);
    const res = await api.get("/api/admin/cars/pending");
    setCars(res.data);
    setLoading(false);
  };

  const handleApprove = async (carId: number) => {
    const type = carTypes[carId] || "luxury";
    await api.post("/api/admin/cars/approve", { id: carId, type, market: "instant" });
    fetchPendingCars();
  };

  const handleMoveToLiveMarket = async () => {
    if (selectedCars.length === 0) return;
    await api.post("/api/admin/cars/move-to-live-market", { carIds: selectedCars });
    fetchPendingCars();
    setSelectedCars([]);
  };

  const handleSelectCar = (carId: number, checked: boolean) => {
    setSelectedCars((prev) =>
      checked ? [...prev, carId] : prev.filter((id) => id !== carId)
    );
  };

  const handleTypeChange = (carId: number, value: string) => {
    setCarTypes((prev) => ({ ...prev, [carId]: value }));
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">غرفة معالجة السيارات الجديدة</h1>
      {loading && <div>جاري التحميل...</div>}
      <Button
        disabled={selectedCars.length === 0}
        onClick={handleMoveToLiveMarket}
        className="mb-4"
      >
        عرض السيارات المحددة في الحراج المباشر (Live Market)
      </Button>
      <table className="w-full border text-sm">
        <thead>
          <tr>
            <th>اختيار</th>
            <th>المالك</th>
            <th>الموديل</th>
            <th>الصور</th>
            <th>التقارير</th>
            <th>التصنيف</th>
            <th>الإجراءات</th>
            <th>السوق الحالي</th>
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => (
            <tr key={car.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedCars.includes(car.id)}
                  onChange={(e) => handleSelectCar(car.id, e.target.checked)}
                  title={`اختيار السيارة ${car.model}`}
                  aria-label={`اختيار السيارة ${car.model}`}
                />
              </td>
              <td>{car.owner_name}</td>
              <td>{car.model}</td>
              <td>
                {car.images?.map((img, i) => (
                  <img key={i} src={img} alt="car" className="w-16 h-16 inline-block" />
                ))}
              </td>
              <td>
                {car.reports?.map((rep, i) => (
                  <a key={i} href={rep} target="_blank" rel="noopener noreferrer">تقرير {i + 1}</a>
                ))}
              </td>
              <td>
                <select
                  value={carTypes[car.id] || ""}
                  onChange={(e) => handleTypeChange(car.id, e.target.value)}
                  title="اختر تصنيف السيارة"
                  aria-label="اختر تصنيف السيارة"
                >
                  <option value="">اختر التصنيف</option>
                  {CAR_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </td>
              <td>
                <Button
                  color="success"
                  onClick={() => handleApprove(car.id)}
                  disabled={!carTypes[car.id]}
                >
                  اعتماد (للمزاد الفوري)
                </Button>
                {/* أزرار رفض/تعديل/حذف يمكن إضافتها هنا */}
              </td>
              <td>
                {car.market === "instant" && "المزاد الفوري"}
                {car.market === "live-market" && "الحراج المباشر"}
                {!car.market && "بانتظار التصنيف"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}