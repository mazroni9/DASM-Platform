"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Car } from "lucide-react";
import toast from "react-hot-toast";

const CAR_TYPES = [
  { value: "luxury", label: "سيارة فارهة" },
  { value: "classic", label: "كلاسيكية" },
  { value: "caravan", label: "كرافان" },
  { value: "truck", label: "شاحنة" },
  { value: "company", label: "سيارة شركة" },
  { value: "government", label: "حكومية" },
  { value: "individual", label: "فردية" },
] as const;

export type LiveMarketStagingCarRow = {
  id: number;
  owner_name: string;
  model: string;
  status: string;
  images: string[];
  reports: string[];
  market?: string;
  type?: string;
};

export default function LiveMarketStagingPanel() {
  const { isAdmin, isModerator, isProgrammer } = useAuth();
  const isStaff = isAdmin || isModerator || isProgrammer;

  const [cars, setCars] = useState<LiveMarketStagingCarRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCars, setSelectedCars] = useState<number[]>([]);
  const [carTypes, setCarTypes] = useState<{ [id: number]: string }>({});

  const fetchPendingCars = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/live-market-staging/pending-cars");
      const payload = res.data?.data;
      const list = Array.isArray(payload) ? payload : [];
      setCars(list);
    } catch (e: unknown) {
      console.error(e);
      setCars([]);
      toast.error("تعذر تحميل قائمة السيارات في الانتظار");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isStaff) return;
    void fetchPendingCars();
  }, [isStaff]);

  useEffect(() => {
    if (!cars.length) return;
    setCarTypes((prev) => {
      const next = { ...prev };
      for (const c of cars) {
        if (c.type && !next[c.id]) {
          next[c.id] = c.type;
        }
      }
      return next;
    });
  }, [cars]);

  const handleApprove = async (carId: number) => {
    const type = carTypes[carId] || "luxury";
    try {
      await api.post("/api/admin/live-market-staging/approve-to-instant", {
        id: carId,
        type,
        market: "instant",
      });
      toast.success("تم اعتماد السيارة للمزاد الفوري");
      await fetchPendingCars();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "فشل الاعتماد");
    }
  };

  const handleMoveToLiveMarket = async () => {
    if (selectedCars.length === 0) return;
    try {
      await api.post("/api/admin/live-market-staging/move-selected-to-live", {
        car_ids: selectedCars,
      });
      toast.success("تم نقل السيارات المحددة إلى الحراج المباشر");
      await fetchPendingCars();
      setSelectedCars([]);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "فشل النقل إلى الحراج المباشر");
    }
  };

  const handleSelectCar = (carId: number, checked: boolean) => {
    setSelectedCars((prev) =>
      checked ? [...prev, carId] : prev.filter((id) => id !== carId)
    );
  };

  const handleTypeChange = (carId: number, value: string) => {
    setCarTypes((prev) => ({ ...prev, [carId]: value }));
  };

  if (!isStaff) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Car className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">معالجة السيارات الجديدة</h2>
      </div>
      {loading && <div className="text-sm text-foreground/60">جاري التحميل...</div>}
      <Button
        disabled={selectedCars.length === 0}
        onClick={() => void handleMoveToLiveMarket()}
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
                  <a key={i} href={rep} target="_blank" rel="noopener noreferrer">
                    تقرير {i + 1}
                  </a>
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
                  {CAR_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <Button
                  color="success"
                  onClick={() => void handleApprove(car.id)}
                  disabled={!carTypes[car.id]}
                >
                  اعتماد (للمزاد الفوري)
                </Button>
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
    </section>
  );
}
