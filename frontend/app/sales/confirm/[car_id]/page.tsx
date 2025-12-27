"use client";

import api from "@/lib/axios";
import { useState, useEffect } from "react";
import { CheckCircle, Car, SaudiRiyal, Settings, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";

type PageProps = { params: { car_id: string } };

export default function ConfirmSalePage({ params }: PageProps) {
  const router = useLoadingRouter();
  const { car_id } = params;

  const roundToNearest5or0 = (number: number): number => Math.round(number / 5) * 5;

  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [lastBid, setLastBid] = useState(0);
  const [item, setItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    auction_id: null as number | null,
    user_id: null as number | null,
  });
  const [isChecked, setIsChecked] = useState(false);

  const handleConfirmSale = async () => {
    if (item?.active_auction) {
      try {
        const response = await api.post("/api/auctions/confirm-sale", {
          auction_id: item.active_auction.id,
          final_price: item.active_auction.current_bid,
        });

        if (response.data.status === "success") {
          toast.success("تم تأكيد البيع بنجاح!");
          router.push(`/dashboard/carDetails/${car_id}`);
        }
      } catch (error) {
        console.error("Error confirming sale:", error);
        toast.error("حدث خطأ في تأكيد البيع. يرجى المحاولة مرة أخرى.");
      }
    }
  };

  useEffect(() => {
    async function fetchCarData() {
      try {
        const response = await api.get(`/api/auctions/calculate-settlement/${car_id}`);
        if (response.data.data) {
          const responseData = response.data.data.data || response.data.data;
          setCar(responseData.car);
          setLastBid(roundToNearest5or0(responseData.auction_price || 0));
          setItem(responseData);
          setFormData((prev) => ({
            ...prev,
            auction_id: responseData.auction_id,
            user_id: null,
          }));
        }
      } catch (error) {
        console.error("Error fetching car data:", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    }

    fetchCarData();
  }, [car_id]);

  // Loading
  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center px-4">
        <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 px-4 py-3 rounded-xl shadow-2xl">
          <Loader2 className="w-5 h-5 animate-spin text-fuchsia-400" />
          <span className="text-sm text-slate-300">جاري تحميل تفاصيل الصفقة...</span>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center px-4" dir="rtl">
        <div className="bg-rose-500/10 border border-rose-400/30 text-rose-200 px-5 py-4 rounded-xl shadow-2xl">
          خطأ في تحميل بيانات السيارة. يرجى المحاولة مرة أخرى.
        </div>
      </div>
    );
  }

  // Not found
  if (!item) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center px-4" dir="rtl">
        <div className="bg-slate-900/60 border border-slate-800 text-slate-200 px-5 py-4 rounded-xl shadow-2xl">
          لم يتم العثور على بيانات السيارة.
        </div>
      </div>
    );
  }

  // Financials
  const finalSalePrice = item.auction_price;
  const platformFee = item.platform_fee;
  const myfatoorahFee = item.myfatoorah_fee;
  const netAmount = item.net_amount;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 text-slate-100 px-4 py-2 rounded-xl mb-3">
            <Settings className="w-4 h-4 text-fuchsia-300" />
            <span className="text-sm text-slate-200">مراجعة الصفقة</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold">مراجعة وتأكيد البيع</h1>
          <p className="text-slate-400 mt-2">يرجى مراجعة جميع التفاصيل قبل إتمام بيع سيارتك</p>
        </div>

        {/* Deal Summary */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            {/* Car image & title */}
            <div className="flex-shrink-0">
              <img
                src={car?.images?.[0] || "/placeholder-car.jpg"}
                alt={`${car?.make ?? ""} ${car?.model ?? ""}`}
                className="w-52 h-36 object-cover rounded-xl border border-slate-800"
              />
              <h5 className="text-lg font-bold text-slate-100 mt-3">
                {car?.make} {car?.model} {car?.year}
              </h5>
            </div>

            {/* Price boxes */}
            <div className="flex-grow w-full text-center lg:text-right">
              <h2 className="text-xl md:text-2xl font-bold text-slate-100 mb-2">
                {car?.make} {car?.model} {car?.year}
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">سعر البيع النهائي</p>
                  <div className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 flex items-center gap-1 justify-center sm:justify-start">
                    {finalSalePrice?.toLocaleString?.() ?? finalSalePrice}
                    <SaudiRiyal className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">المبلغ الصافي لك</p>
                  <div className="text-3xl font-extrabold text-fuchsia-300 flex items-center gap-1 justify-center sm:justify-start">
                    {netAmount?.toLocaleString?.() ?? netAmount}
                    <SaudiRiyal className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur p-6 mb-8">
          <h3 className="text-xl md:text-2xl font-bold text-slate-100 mb-6">التفصيل المالي</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 px-4 rounded-xl bg-slate-950/50 border border-slate-800">
              <span className="text-slate-300">سعر البيع النهائي</span>
              <span className="font-bold text-slate-100 flex items-center gap-1">
                {finalSalePrice?.toLocaleString?.() ?? finalSalePrice}
                <SaudiRiyal className="w-4 h-4" />
              </span>
            </div>

            <div className="text-sm text-rose-300/90 mt-4">الخصومات</div>

            <div className="flex justify-between items-center py-3 px-4 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="text-slate-400">رسوم المنصة</span>
              <span className="text-rose-300 font-semibold flex items-center gap-1">
                - {platformFee?.toLocaleString?.() ?? platformFee}
                <SaudiRiyal className="w-4 h-4" />
              </span>
            </div>

            <div className="flex justify-between items-center py-3 px-4 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="text-slate-400">رسوم بوابة الدفع</span>
              <span className="text-rose-300 font-semibold flex items-center gap-1">
                - {myfatoorahFee?.toLocaleString?.() ?? myfatoorahFee}
                <SaudiRiyal className="w-4 h-4" />
              </span>
            </div>

            <div className="flex justify-between items-center py-4 px-4 rounded-xl bg-gradient-to-r from-violet-600/15 to-fuchsia-600/15 border border-fuchsia-500/30 mt-2">
              <span className="text-slate-200 font-bold">المبلغ الصافي المستحق لك</span>
              <span className="text-2xl font-extrabold text-fuchsia-300 flex items-center gap-1">
                {netAmount?.toLocaleString?.() ?? netAmount}
                <SaudiRiyal className="w-5 h-5" />
              </span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur p-6 mb-8">
          <h3 className="text-xl md:text-2xl font-bold text-slate-100 mb-6">ما يحدث بعد ذلك</h3>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="grid place-items-center w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30">
                <Settings className="text-violet-300 w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-100 mb-1">الخطوة الأولى: نقل الملكية</h4>
                <p className="text-slate-400">
                  سيتم معالجة نقل الملكية إلكترونياً من خلال نظام "تام". يضمن ذلك نقل ملكية آمن وقانوني للمشتري.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="grid place-items-center w-10 h-10 rounded-xl bg-fuchsia-600/20 border border-fuchsia-500/30">
                <Car className="text-fuchsia-300 w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-100 mb-1">الخطوة الثانية: تسليم السيارة</h4>
                <p className="text-slate-400">
                  يرجى تسليم سيارتك إلى معرض الشريك المخصص لدينا. سيقوم فريقنا بفحص المركبة والتعامل مع عملية التسليم مع المشتري.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="grid place-items-center w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30">
                <SaudiRiyal className="text-amber-300 w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-100 mb-1">الخطوة الثالثة: استلام الدفعة</h4>
                <p className="text-slate-400">
                  المبلغ الصافي البالغ {netAmount?.toLocaleString?.() ?? netAmount} سيتم تحويله إلى حسابك خلال 24-48 ساعة بعد
                  تأكيد معرضنا استلام السيارة.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Final Confirmation */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur p-6">
          <h3 className="text-xl md:text-2xl font-bold text-slate-100 mb-6">التأكيد النهائي</h3>

          <div className="space-y-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                id="agreement"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-slate-600 bg-slate-900 text-fuchsia-600 focus:ring-fuchsia-500/60 focus:ring-2"
              />
              <span className="text-slate-300 text-base leading-relaxed">
                لقد راجعت جميع التفاصيل المالية وأوافق على الشروط والأحكام لإتمام هذا البيع. أتفهم تفصيل الخصومات وأؤكد
                المبلغ الصافي المستحق لي.
              </span>
            </label>

            <button
              onClick={handleConfirmSale}
              disabled={!isChecked}
              className={`w-full py-4 px-6 rounded-xl text-lg font-bold transition-all duration-200 flex items-center justify-center gap-3 ${
                isChecked
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
              }`}
            >
              <CheckCircle className="w-6 h-6" />
              تأكيد البيع النهائي واستلام الدفعة
            </button>

            <p className="text-xs text-slate-500 text-center">
              بالضغط على زر التأكيد، أنت توافق على الشروط والأحكام وسياسة الخصوصية.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
