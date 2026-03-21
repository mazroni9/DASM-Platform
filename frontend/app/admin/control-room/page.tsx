"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import LoadingLink from "@/components/LoadingLink";
import { useAuth } from "@/hooks/useAuth";
import { Car, ClipboardList, UserCog } from "lucide-react";

const CAR_TYPES = [
  { value: "luxury", label: "سيارة فارهة" },
  { value: "classic", label: "كلاسيكية" },
  { value: "caravan", label: "كرافان" },
  { value: "truck", label: "شاحنة" },
  { value: "company", label: "سيارة شركة" },
  { value: "government", label: "حكومية" },
  { value: "individual", label: "فردية" },
];

type CarRow = {
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
  const { isAdmin, isModerator, isProgrammer, isSuperAdmin } = useAuth();
  const isStaff = isAdmin || isModerator || isProgrammer;

  const [cars, setCars] = useState<CarRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCars, setSelectedCars] = useState<number[]>([]);
  const [carTypes, setCarTypes] = useState<{ [id: number]: string }>({});

  useEffect(() => {
    if (!isStaff) return;
    fetchPendingCars();
  }, [isStaff]);

  const fetchPendingCars = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/cars/pending");
      setCars(res.data);
    } catch {
      setCars([]);
    } finally {
      setLoading(false);
    }
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
    <div className="container mx-auto p-4 md:p-6 space-y-8 rtl">
      <section>
        <h2 className="text-lg font-bold mb-3">العمليات التشغيلية — الموافقات</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LoadingLink
            href="/admin/control-room/approval-requests"
            className="flex items-start gap-3 p-5 rounded-2xl border border-border bg-card hover:bg-muted/30 transition"
          >
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold">طابور الموافقات</p>
              <p className="text-sm text-foreground/60 mt-1">
                حسابات تجارية (تاجر / مالك معرض / مستثمر) وطلبات صلاحيات مجلس السوق، مع سجل
                التدقيق.
              </p>
            </div>
          </LoadingLink>
          {isSuperAdmin ? (
            <LoadingLink
              href="/admin/control-room/approval-group"
              className="flex items-start gap-3 p-5 rounded-2xl border border-primary/25 bg-primary/5 hover:bg-primary/10 transition"
            >
              <div className="p-2 rounded-xl bg-primary/15 text-primary">
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold">مجموعة الموافقات التشغيلية</p>
                <p className="text-sm text-foreground/60 mt-1">
                  إدارة الأعضاء والقدرات (مدير النظام الرئيسي فقط).
                </p>
              </div>
            </LoadingLink>
          ) : (
            <div className="flex items-start gap-3 p-5 rounded-2xl border border-dashed border-border bg-muted/20 text-foreground/50">
              <UserCog className="w-6 h-6 shrink-0 mt-0.5" />
              <p className="text-sm">
                إدارة مجموعة الموافقات متاحة لمدير النظام الرئيسي فقط.
              </p>
            </div>
          )}
        </div>
      </section>

      {isStaff ? (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Car className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">معالجة السيارات الجديدة</h2>
          </div>
          {loading && <div className="text-sm text-foreground/60">جاري التحميل...</div>}
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
                      onClick={() => handleApprove(car.id)}
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
      ) : null}
    </div>
  );
}
