"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "success" | "failed" | "cancelled"
  >("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const respStatus =
      searchParams.get("status") || searchParams.get("respStatus");
    const respMessage =
      searchParams.get("message") || searchParams.get("respMessage");
    const auctionId = searchParams.get("auction_id");

    if (respStatus === "success" || respStatus === "A") {
      setStatus("success");
      setMessage("تم الدفع بنجاح! جاري تحويلك لإتمام عملية الشراء...");

      // Redirect to purchase confirmation after a short delay
      if (auctionId) {
        setTimeout(() => {
          router.push(
            `/auctions/purchase-confirmation/${auctionId}?step=3&paid=true`
          );
        }, 2000);
      }
    } else if (respStatus === "cancelled" || respStatus === "C") {
      setStatus("cancelled");
      setMessage(respMessage || "تم إلغاء عملية الدفع");
    } else if (respStatus === "failed" || respStatus === "error") {
      setStatus("failed");
      setMessage(respMessage || "فشلت عملية الدفع. يرجى المحاولة مرة أخرى.");
    } else {
      // Check for error state
      const errorMsg = searchParams.get("error");
      if (errorMsg) {
        setStatus("failed");
        setMessage(errorMsg);
      } else {
        setStatus("loading");
        setMessage("جاري معالجة الدفع...");
      }
    }
  }, [searchParams, router]);

  return (
    <div
      className="min-h-screen bg-slate-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center">
        {/* Loading State */}
        {status === "loading" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">
              جاري المعالجة
            </h1>
            <p className="text-slate-500">{message}</p>
          </>
        )}

        {/* Success State */}
        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-green-700 mb-2">
              تمت العملية بنجاح!
            </h1>
            <p className="text-slate-600 mb-6">{message}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري التحويل...
            </div>
          </>
        )}

        {/* Failed State */}
        {status === "failed" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-red-700 mb-2">فشل الدفع</h1>
            <p className="text-slate-600 mb-6">{message}</p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition"
            >
              العودة للوحة التحكم
            </Link>
          </>
        )}

        {/* Cancelled State */}
        {status === "cancelled" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-amber-700 mb-2">
              تم إلغاء الدفع
            </h1>
            <p className="text-slate-600 mb-6">{message}</p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition"
            >
              العودة للوحة التحكم
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
