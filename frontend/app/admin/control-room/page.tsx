"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

type Car = {
  id: number;
  make?: string;
  model?: string;
  year?: number;
  auction_status?: string;
  evaluation_price?: number | null;
  images?: string[];
  user?: {
    first_name?: string;
    last_name?: string;
    name?: string;
  };
};

export default function ControlRoomPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCars, setSelectedCars] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingCars();
  }, []);

  const fetchPendingCars = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/cars", {
        params: {
          auction_status: "pending",
          per_page: 100,
        },
      });

      const payload = res?.data?.data;
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

      setCars(list);
    } catch (error: any) {
      console.error("Error fetching pending cars:", error);
      toast.error(error?.response?.data?.message || "فشل في تحميل السيارات المعلقة");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (car: Car) => {
    setProcessing(true);
    try {
      await api.put("/api/admin/cars/bulk/approve-reject", {
        ids: [car.id],
        action: true,
        price: Number(car.evaluation_price || 0),
      });
      toast.success("تم اعتماد السيارة بنجاح");
      await fetchPendingCars();
      setSelectedCars((prev) => prev.filter((id) => id !== car.id));
    } catch (error: any) {
      console.error("Error approving car:", error);
      toast.error(error?.response?.data?.message || "فشل في اعتماد السيارة");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (carId: number) => {
    setProcessing(true);
    try {
      await api.put("/api/admin/cars/bulk/approve-reject", {
        ids: [carId],
        action: false,
      });
      toast.success("تم رفض السيارة");
      await fetchPendingCars();
      setSelectedCars((prev) => prev.filter((id) => id !== carId));
    } catch (error: any) {
      console.error("Error rejecting car:", error);
      toast.error(error?.response?.data?.message || "فشل في رفض السيارة");
    } finally {
      setProcessing(false);
    }
  };

  const handleMoveToLiveMarket = async () => {
    if (selectedCars.length === 0) return;

    setProcessing(true);
    try {
      await api.put("/api/admin/auctions/bulk/move-to-status", {
        ids: selectedCars,
        status: "live",
      });
      toast.success("تم نقل السيارات المحددة إلى المزاد المباشر");
      await fetchPendingCars();
      setSelectedCars([]);
    } catch (error: any) {
      console.error("Error moving cars to live market:", error);
      toast.error(error?.response?.data?.message || "فشل في نقل السيارات");
    } finally {
      setProcessing(false);
    }
  };

  const handleSelectCar = (carId: number, checked: boolean) => {
    setSelectedCars((prev) =>
      checked ? [...prev, carId] : prev.filter((id) => id !== carId),
    );
  };

  const ownerName = (car: Car) =>
    car.user?.name || `${car.user?.first_name || ""} ${car.user?.last_name || ""}`.trim() || "غير محدد";

  return (
    <div className="container mx-auto p-6 space-y-4" dir="rtl">
      <h1 className="text-2xl font-bold">غرفة معالجة السيارات الجديدة</h1>

      <div className="flex items-center gap-3">
        <Button
          disabled={selectedCars.length === 0 || processing}
          onClick={handleMoveToLiveMarket}
        >
          نقل المحدد إلى المزاد المباشر
        </Button>

        <Button variant="outline" disabled={processing} onClick={fetchPendingCars}>
          تحديث القائمة
        </Button>
      </div>

      {loading ? <div>جاري التحميل...</div> : null}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="p-3 text-right">اختيار</th>
              <th className="p-3 text-right">المالك</th>
              <th className="p-3 text-right">السيارة</th>
              <th className="p-3 text-right">الحالة</th>
              <th className="p-3 text-right">السعر التقييمي</th>
              <th className="p-3 text-right">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {cars.map((car) => (
              <tr key={car.id} className="border-t">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedCars.includes(car.id)}
                    onChange={(e) => handleSelectCar(car.id, e.target.checked)}
                    title={`اختيار السيارة ${car.id}`}
                    aria-label={`اختيار السيارة ${car.id}`}
                  />
                </td>
                <td className="p-3">{ownerName(car)}</td>
                <td className="p-3">{`${car.make || ""} ${car.model || ""} ${car.year || ""}`.trim()}</td>
                <td className="p-3">{car.auction_status || "pending"}</td>
                <td className="p-3">{Number(car.evaluation_price || 0).toLocaleString("ar-SA")}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Button size="sm" disabled={processing} onClick={() => handleApprove(car)}>
                      اعتماد
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={processing}
                      onClick={() => handleReject(car.id)}
                    >
                      رفض
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {!loading && cars.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={6}>
                  لا توجد سيارات معلقة حالياً.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
