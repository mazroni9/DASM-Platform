"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";


export default function WalletCallbackPage() {
    const router = useLoadingRouter();
    
    const searchParams = useSearchParams();
    const paymentId = searchParams.get("paymentId");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("جاري التحقق من حالة الدفع...");

    useEffect(() => {
        if (!paymentId) {
            setStatus("error");
            setMessage("معرف الدفع غير موجود. لا يمكن المتابعة.");
            return;
        }

        const handleCallback = async () => {
            try {
                const response = await api.post("/api/wallet/callback", {
                    paymentId: paymentId,
                });

                if (response.data.status === "success") {
                    setStatus("success");
                    setMessage(response.data.message || "تم تحديث رصيد المحفظة بنجاح!");
                    setTimeout(() => {
                        router.push("/dashboard/my-wallet"); // Redirect to wallet page after success
                    }, 3000);
                } else {
                    setStatus("error");
                    setMessage(response.data.message || "فشل في معالجة الدفع.");
                }
            } catch (error: any) {
                setStatus("error");
                setMessage(
                    error.response?.data?.message ||
                        "حدث خطأ غير متوقع أثناء معالجة الدفع."
                );
            }
        };

        handleCallback();
    }, [paymentId, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
                {status === "loading" && (
                    <>
                        <Loader2 className="w-16 h-16 mx-auto text-blue-500 animate-spin" />
                        <h2 className="text-2xl font-semibold text-gray-700">جاري المعالجة</h2>
                        <p className="text-gray-500">{message}</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
                        <h2 className="text-2xl font-semibold text-green-700">نجاح</h2>
                        <p className="text-gray-500">{message}</p>
                        <p className="text-sm text-gray-400">سيتم إعادة توجيهك قريباً...</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
                        <h2 className="text-2xl font-semibold text-red-700">خطأ</h2>
                        <p className="text-gray-500">{message}</p>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="mt-4 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                            العودة إلى لوحة التحكم
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
