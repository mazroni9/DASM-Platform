"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import VehicleForm from "@/components/shared/VehicleForm";
import api from "@/lib/axios";
import { Loader2 } from "lucide-react";

export default function DealerEditCarPage() {
  const { id } = useParams();
  const router = useRouter();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      const fetchCar = async () => {
        try {
          const res = await api.get(`api/cars/${id}`);
          if (res.data?.data?.car) {
            const carData = res.data.data.car;
            const activeAuction = res.data.data.active_auction;
            // Inject active_auction as auctions array for VehicleForm
            if (activeAuction) {
              carData.auctions = [activeAuction];
            }
            setCar(carData);
          } else if (res.data?.data) {
            // Fallback if structure is flat (unlikely based on controller, but safe)
            setCar(res.data.data);
          } else {
            setError("لم يتم العثور على السيارة");
          }
        } catch (err: any) {
          console.error(err);
          setError(
            err?.response?.data?.message ||
              "حدث خطأ أثناء تحميل بيانات السيارة",
          );
        } finally {
          setLoading(false);
        }
      };

      fetchCar();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="mr-2 text-foreground/70">جاري التحميل...</span>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-center">
        <div className="text-red-500 font-semibold">
          {error || "لم يتم العثور على السيارة"}
        </div>
        <button
          onClick={() => router.back()}
          className="text-primary hover:underline"
        >
          العودة
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <VehicleForm mode="edit" initialData={car} />
    </div>
  );
}
