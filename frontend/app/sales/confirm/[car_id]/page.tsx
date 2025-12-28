"use client";

import api from "@/lib/axios";
import { useState, useEffect, use } from "react";
import {
  CheckCircle,
  XCircle,
  Wallet,
  FileText,
  ArrowRight,
  Loader2,
  Car,
  User,
  Shield,
  Sparkles,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type PageProps = { params: Promise<{ car_id: string }> };

// Currency formatter using Intl.NumberFormat
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function ConfirmSalePage({ params }: PageProps) {
  const router = useLoadingRouter();
  const { car_id } = use(params);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    async function fetchSettlement() {
      try {
        const response = await api.get(
          `/api/auctions/calculate-settlement/${car_id}`
        );
        if (response.data?.status === "success") {
          const responseData = response.data.data?.data || response.data.data;
          setData(responseData);
        } else {
          setError(response.data?.message || "خطأ في تحميل البيانات");
        }
      } catch (err: any) {
        console.error("Error fetching settlement:", err);
        setError(err?.response?.data?.message || "حدث خطأ غير متوقع");
      } finally {
        setLoading(false);
      }
    }

    fetchSettlement();
  }, [car_id]);

  const handleConfirmSale = async () => {
    if (!data?.active_auction?.id || !isChecked) return;

    setSubmitting(true);
    try {
      const response = await api.post("/api/auctions/confirm-sale", {
        auction_id: data.active_auction.id,
        final_price: data.auction_price,
      });

      if (response.data?.status === "success") {
        toast.success("تم تأكيد البيع بنجاح!");
        router.push(`/dashboard/carDetails/${car_id}`);
      } else {
        toast.error(response.data?.message || "خطأ في تأكيد البيع");
      }
    } catch (err: any) {
      console.error("Error confirming sale:", err);
      toast.error(err?.response?.data?.message || "حدث خطأ في تأكيد البيع");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Loading State
  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-background text-foreground grid place-items-center px-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 bg-card border border-border px-8 py-6 rounded-2xl shadow-2xl"
        >
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <span className="text-foreground/70">
            جاري تحميل تفاصيل الصفقة...
          </span>
        </motion.div>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-background text-foreground grid place-items-center px-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 bg-destructive/10 border border-destructive/30 px-8 py-6 rounded-2xl max-w-md text-center"
        >
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-destructive">
            {error || "لم يتم العثور على البيانات"}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-2 px-4 py-2 bg-card border border-border rounded-lg text-foreground/70 hover:bg-muted transition-colors"
          >
            العودة
          </button>
        </motion.div>
      </div>
    );
  }

  // Extract data
  const car = data.car;
  const seller = data.seller;
  const buyer = data.buyer;
  const isPartner = seller?.is_partner ?? false;
  const auctionPrice = data.auction_price ?? 0;
  const platformFee = data.platform_fee ?? 0;
  const platformFeeVat = data.platform_fee_vat ?? 0;
  const totalDeduction = data.total_deduction ?? 0;
  const netAmount = data.net_amount ?? 0;

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-background text-foreground py-8 px-4"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={() => router.back()}
            className="p-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-foreground/60" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              تأكيد البيع
            </h1>
            <p className="text-foreground/60 text-sm mt-1">
              مراجعة التفاصيل المالية قبل إتمام الصفقة
            </p>
          </div>
        </motion.div>

        {/* Split Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Car & Buyer Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Car Card */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
              <div className="aspect-video relative">
                <img
                  src={car?.images?.[0] || "/placeholder-car.jpg"}
                  alt={`${car?.make ?? ""} ${car?.model ?? ""}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      "https://via.placeholder.com/600x400?text=No+Image";
                  }}
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute bottom-4 right-4 left-4">
                  <h2 className="text-xl font-bold text-white">
                    {car?.make} {car?.model} {car?.year}
                  </h2>
                  {car?.plate_number && (
                    <p className="text-white/80 text-sm mt-1">
                      رقم اللوحة: {car.plate_number}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Buyer Info */}
            {buyer && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/20 border border-primary/30 rounded-lg">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    معلومات المشتري
                  </h3>
                </div>
                <div className="bg-muted border border-border rounded-xl p-4">
                  <p className="text-foreground font-medium">{buyer.name}</p>
                  <p className="text-foreground/60 text-sm mt-1">
                    رقم المشتري: #{buyer.id}
                  </p>
                </div>
              </div>
            )}

            {/* Trust Note - Escrow Explanation */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg mt-0.5">
                  <Shield className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-1">
                    ضمان الدفع الآمن
                  </h4>
                  <p className="text-amber-700 dark:text-amber-300/80 text-sm leading-relaxed">
                    يتم الاحتفاظ بمبلغ البيع في حساب الضمان (Escrow) حتى اكتمال
                    عملية نقل الملكية وتسليم السيارة. سيتم تحويل المبلغ إلى
                    حسابك خلال 24-48 ساعة عمل.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Financial Receipt Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Receipt Card */}
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Receipt Header */}
              <div className="bg-primary/10 border-b border-border p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      كشف الحساب المالي
                    </h3>
                    <p className="text-foreground/60 text-xs">
                      Financial Statement
                    </p>
                  </div>
                </div>
              </div>

              {/* Receipt Body */}
              <div className="p-6 space-y-4">
                {/* Winning Bid */}
                <div className="flex justify-between items-center py-3 px-4 bg-muted border border-border rounded-xl">
                  <span className="text-foreground/70 font-medium">
                    سعر الفوز (Winning Bid)
                  </span>
                  <span className="text-2xl font-bold text-foreground">
                    {formatCurrency(auctionPrice)}{" "}
                    <span className="text-sm text-foreground/60">ر.س</span>
                  </span>
                </div>

                {/* Dashed Separator */}
                <div className="border-t-2 border-dashed border-border my-4" />

                {/* Deductions Section - Only for Individual Sellers */}
                {!isPartner && (
                  <>
                    <p className="text-sm text-destructive font-medium px-1">
                      الخصومات:
                    </p>

                    {/* Platform Commission */}
                    <div className="flex justify-between items-center py-2.5 px-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                      <span className="text-foreground/60">عمولة المنصة</span>
                      <span className="text-destructive font-semibold">
                        - {formatCurrency(platformFee)} ر.س
                      </span>
                    </div>

                    {/* VAT on Commission */}
                    <div className="flex justify-between items-center py-2.5 px-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                      <span className="text-foreground/60">
                        ضريبة القيمة المضافة (15%)
                      </span>
                      <span className="text-destructive font-semibold">
                        - {formatCurrency(platformFeeVat)} ر.س
                      </span>
                    </div>

                    {/* Total Deduction */}
                    <div className="flex justify-between items-center py-2 px-4 text-sm">
                      <span className="text-foreground/50">
                        إجمالي الخصومات
                      </span>
                      <span className="text-destructive/80">
                        - {formatCurrency(totalDeduction)} ر.س
                      </span>
                    </div>

                    {/* Dashed Separator */}
                    <div className="border-t-2 border-dashed border-border my-4" />
                  </>
                )}

                {/* Partner Privilege Box */}
                {isPartner && (
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 my-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-primary">
                          امتياز الشريك
                        </p>
                        <p className="text-primary/80 text-sm">
                          لا يتم خصم أي عمولة من حسابك
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Net Payout - Prominent Section */}
                <div className="bg-emerald-500/10 border-2 border-emerald-500/40 rounded-xl p-5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-6 h-6 text-emerald-500" />
                      <span className="text-foreground font-bold text-lg">
                        صافي المستحقات
                      </span>
                    </div>
                    <span className="text-3xl font-extrabold text-emerald-500">
                      {formatCurrency(netAmount)}{" "}
                      <span className="text-base text-emerald-600 dark:text-emerald-400">
                        ر.س
                      </span>
                    </span>
                  </div>
                </div>

                {/* Timeline Note */}
                <div className="flex items-center gap-2 text-foreground/50 text-sm mt-4 px-1">
                  <Clock className="w-4 h-4" />
                  <span>سيتم التحويل خلال 24-48 ساعة عمل</span>
                </div>
              </div>
            </div>

            {/* Agreement & Actions */}
            <div className="bg-card border border-border rounded-2xl p-6">
              {/* Checkbox Agreement */}
              <label className="flex items-start gap-3 cursor-pointer mb-6">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-border bg-background text-primary focus:ring-primary/60 focus:ring-2"
                />
                <span className="text-foreground/70 text-sm leading-relaxed">
                  لقد راجعت جميع التفاصيل المالية وأوافق على{" "}
                  <a href="/terms" className="text-primary hover:underline">
                    الشروط والأحكام
                  </a>{" "}
                  لإتمام هذا البيع. أتفهم أن المبلغ سيُحتجز في حساب الضمان حتى
                  اكتمال الإجراءات.
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Confirm Sale Button */}
                <button
                  onClick={handleConfirmSale}
                  disabled={!isChecked || submitting}
                  className={cn(
                    "flex-1 py-4 px-6 rounded-xl text-lg font-bold transition-all duration-200 flex items-center justify-center gap-3",
                    isChecked && !submitting
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl"
                      : "bg-muted text-foreground/50 cursor-not-allowed border border-border"
                  )}
                >
                  {submitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <CheckCircle className="w-6 h-6" />
                  )}
                  {submitting ? "جاري التأكيد..." : "تأكيد البيع"}
                </button>

                {/* Cancel Button */}
                <button
                  onClick={handleCancel}
                  disabled={submitting}
                  className="px-6 py-4 bg-secondary border border-border rounded-xl text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
