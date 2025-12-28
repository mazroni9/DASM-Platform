"use client";

import api from "@/lib/axios";
import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle } from "lucide-react";

// Checkout Components
import {
  ProgressSteps,
  CarItemCard,
  FeesBreakdown,
  WhatHappensNext,
  OrderSummary,
  PayServiceFeesButton,
  QuickSummary,
  BuyerProtection,
  BankTransferStep,
  PaymentGatewaySelector,
  MoyasarWidget,
  type Gateway,
} from "@/components/checkout";

interface CarData {
  make: string;
  model: string;
  year: number;
  images?: string[];
  plate_number?: string;
}

interface ServiceFees {
  commission: number;
  commission_vat: number;
  admin_fee: number;
  subtotal: number;
  gateway_fee: number;
  gateway_vat: number;
  total: number;
}

interface BankTransfer {
  amount: number;
  iban: string;
  bank_name: string;
  account_name?: string;
}

interface AuctionData {
  id: number;
  settlement_id: number; // Settlement ID for ClickPay payment
  auction: {
    id: number;
    car: CarData;
    current_bid: number;
  };
  car_price: number;
  service_fees: ServiceFees;
  bank_transfer: BankTransfer;
  verification_code: string;
  // Payment Status (for smart state restoration)
  service_fees_payment_status?: "PENDING" | "PAID" | "FAILED";
  escrow_payment_status?: "PENDING" | "PAID" | "FAILED";
  // Legacy fields
  auction_price?: number;
  platformFee?: number;
}

export default function ConfirmPurchasePage({
  params,
}: {
  params: Promise<{ auction_id: string }>;
}) {
  const { auction_id } = use(params);
  const [car, setCar] = useState<CarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [item, setItem] = useState<AuctionData | null>(null);

  // Step Management: 1 = Review, 2 = Pay Service Fees, 3 = Bank Transfer
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [serviceFeePaid, setServiceFeePaid] = useState(false);

  // Payment Gateway Selection
  const [selectedGateway, setSelectedGateway] = useState<Gateway>("moyasar");

  // Handle return from ClickPay payment
  const searchParams = useSearchParams();

  useEffect(() => {
    const step = searchParams.get("step");
    const paid = searchParams.get("paid");
    const status = searchParams.get("status");

    // If returning from successful payment, go to step 3
    if (step === "3" && paid === "true") {
      setCurrentStep(3);
      setServiceFeePaid(true);
    } else if (status === "cancelled" || status === "failed") {
      // Stay on step 2 for retry
      setCurrentStep(2);
    }
  }, [searchParams]);

  // Fetch auction data and initialize step based on payment status
  useEffect(() => {
    async function fetchAuctionData() {
      try {
        const response = await api.get(
          `/api/auctions/purchase-confirmation/${auction_id}`
        );
        if (response.data.data) {
          const auctionData = response.data.data.data || response.data.data;
          setCar(auctionData.auction.car);
          setItem(auctionData);

          // Smart State Restoration: Initialize step based on payment status
          const serviceFeesStatus = auctionData.service_fees_payment_status;
          if (serviceFeesStatus === "PAID") {
            // Phase 1 already paid, jump to Phase 2 (Bank Transfer)
            setCurrentStep(3);
            setServiceFeePaid(true);
          } else {
            // Default to Step 1 (Review)
            setCurrentStep(1);
          }
        }
      } catch (err) {
        console.error("Error fetching auction data:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchAuctionData();
  }, [auction_id]);

  // Handle confirm and go to payment
  const handleConfirmToPayment = () => {
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle back to review
  const handleBackToReview = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle service fee payment success - move to bank transfer step
  const handleServiceFeeSuccess = () => {
    setServiceFeePaid(true);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-xl text-slate-600">جاري تحميل البيانات...</div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-xl text-red-600">
          خطأ في تحميل بيانات السيارة. يرجى المحاولة مرة أخرى.
        </div>
      </div>
    );
  }

  // Handle case where item is not loaded
  if (!item || !car) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-xl text-gray-600">
          لم يتم العثور على بيانات السيارة.
        </div>
      </div>
    );
  }

  // Extract data from API response
  const carPrice = Number(item.car_price || item.auction_price || 0);
  const serviceFees = item.service_fees || {
    commission: item.platformFee || 350,
    commission_vat: (item.platformFee || 350) * 0.15,
    admin_fee: 600,
    subtotal: 0,
    gateway_fee: 0,
    gateway_vat: 0,
    total: 0,
  };

  // Calculate totals if not provided
  if (!serviceFees.total) {
    serviceFees.subtotal =
      serviceFees.commission +
      serviceFees.commission_vat +
      serviceFees.admin_fee;
    serviceFees.gateway_fee = serviceFees.subtotal * 0.022 + 1;
    serviceFees.gateway_vat = serviceFees.gateway_fee * 0.15;
    serviceFees.total =
      serviceFees.subtotal + serviceFees.gateway_fee + serviceFees.gateway_vat;
  }

  const verificationCode =
    item.verification_code || `DASM-${Math.floor(1000 + Math.random() * 9000)}`;
  const auctionNumber = String(item.auction?.id || "");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
      {/* Progress Steps */}
      <ProgressSteps currentStep={currentStep} />

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        {/* ===== STEP 1: REVIEW ===== */}
        <div
          className={`transition-opacity duration-300 ${
            currentStep === 1 ? "block opacity-100" : "hidden opacity-0"
          }`}
        >
          <h1 className="text-2xl font-bold text-slate-800 mb-6">
            تأكيد تفاصيل الشراء
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Details (span 8) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Car Item Card */}
              <CarItemCard
                car={car}
                auctionPrice={carPrice}
                auctionNumber={auctionNumber}
              />

              {/* Fees Breakdown - New DASM Structure */}
              <FeesBreakdown
                carPrice={carPrice}
                serviceFees={{
                  commission: serviceFees.commission,
                  commissionVat: serviceFees.commission_vat,
                  adminFee: serviceFees.admin_fee,
                  gatewayFee: serviceFees.gateway_fee,
                  gatewayFeeVat: serviceFees.gateway_vat,
                  total: serviceFees.total,
                }}
              />

              {/* What Happens Next */}
              <WhatHappensNext />
            </div>

            {/* Right Column: Summary Sticky (span 4) */}
            <div className="lg:col-span-4">
              <OrderSummary
                subtotal={carPrice}
                totalFees={serviceFees.total}
                totalAmount={carPrice + serviceFees.total}
                termsAccepted={termsAccepted}
                onTermsChange={setTermsAccepted}
                onConfirm={handleConfirmToPayment}
              />
            </div>
          </div>
        </div>

        {/* ===== STEP 2: PAY SERVICE FEES ===== */}
        <div
          className={`transition-opacity duration-300 ${
            currentStep === 2 ? "block opacity-100" : "hidden opacity-0"
          }`}
        >
          {/* Back Button */}
          <button
            onClick={handleBackToReview}
            className="text-slate-500 hover:text-blue-900 mb-6 flex items-center gap-2 text-sm font-semibold transition"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للمراجعة
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Payment Gateway Selection Area (span 7) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Gateway Selector */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <PaymentGatewaySelector
                  selectedGateway={selectedGateway}
                  onGatewayChange={setSelectedGateway}
                />
              </div>

              {/* Conditional Payment Form */}
              {selectedGateway === "moyasar" ? (
                <MoyasarWidget
                  totalAmount={serviceFees.total}
                  auctionId={item.auction.id}
                  settlementId={item.settlement_id}
                  description={`رسوم خدمة المزاد #${item.auction.id}`}
                />
              ) : (
                <PayServiceFeesButton
                  settlementId={item.settlement_id}
                  totalAmount={serviceFees.total}
                />
              )}
            </div>

            {/* Small Summary Sidebar (span 5) */}
            <div className="lg:col-span-5 space-y-6">
              <QuickSummary
                car={car}
                auctionPrice={carPrice}
                totalFees={serviceFees.total}
                totalAmount={serviceFees.total}
              />

              {/* What's Next After Payment */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-bold text-blue-800 text-sm mb-2">
                  بعد دفع رسوم الخدمة
                </h4>
                <p className="text-sm text-blue-700">
                  ستنتقل للخطوة الأخيرة: تحويل سعر السيارة (
                  {carPrice.toLocaleString()} ر.س) عبر حوالة بنكية.
                </p>
              </div>

              {/* Buyer Protection */}
              <BuyerProtection />
            </div>
          </div>
        </div>

        {/* ===== STEP 3: BANK TRANSFER ===== */}
        <div
          className={`transition-opacity duration-300 ${
            currentStep === 3 ? "block opacity-100" : "hidden opacity-0"
          }`}
        >
          {/* Success Banner */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-bold text-green-800">
                تم دفع رسوم الخدمة بنجاح!
              </p>
              <p className="text-sm text-green-700">
                الخطوة الأخيرة: قم بتحويل سعر السيارة إلى حساب المنصة
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Bank Transfer Details (span 8) */}
            <div className="lg:col-span-8">
              <BankTransferStep
                carPrice={carPrice}
                verificationCode={verificationCode}
              />
            </div>

            {/* Summary Sidebar (span 4) */}
            <div className="lg:col-span-4 space-y-6">
              <QuickSummary
                car={car}
                auctionPrice={carPrice}
                totalFees={serviceFees.total}
                totalAmount={carPrice}
              />

              {/* Timeline */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h4 className="font-bold text-slate-800 text-sm mb-3">
                  ملخص المدفوعات
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">رسوم الخدمة</span>
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      مدفوع
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">سعر السيارة</span>
                    <span className="text-amber-600 font-medium">
                      في الانتظار
                    </span>
                  </div>
                </div>
              </div>

              <BuyerProtection />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-slate-400">
            © 2025 المزادات الرقمية. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
}
