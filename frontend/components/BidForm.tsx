"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface BidFormProps {
    auction_id: number;
    bid_amount: number;
    onSuccess?: () => void;
}

export default function BidForm({ auction_id, bid_amount, onSuccess }: BidFormProps) {
    const [bidAmount, setBidAmount] = useState<number | string>(bid_amount);
    const [customAmount, setCustomAmount] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [showAutoBid, setShowAutoBid] = useState(false);
    const [isAutoBidEnabled, setIsAutoBidEnabled] = useState(false);
    const [autoBidIncrement, setAutoBidIncrement] = useState(200);
    const [autoBidMaximum, setAutoBidMaximum] = useState(bid_amount);

    const { isLoggedIn, token, user } = useAuthStore();

    useEffect(() => {
        if (isLoggedIn && token && auction_id) {
            //checkAutoBidStatus();
        }
    }, [isLoggedIn, token, auction_id]);

    const checkAutoBidStatus = async () => {
        try {
            const response = await api.get(`/api/auctions/auto-bid/status/${auction_id}`);
            if (response.data.active) {
                setIsAutoBidEnabled(true);
                setAutoBidIncrement(response.data.increment || 200);
                setAutoBidMaximum(response.data.maximum || bid_amount + 5000);
            }
        } catch (err) {
            console.error("Error checking auto bid status:", err);
        }
    };

        const roundToNearest5or0 = (number) => {
  return Math.round(number / 5) * 5;
};
    const quickBidOptions = [
        { label: roundToNearest5or0(100), value:100},
        { label: roundToNearest5or0(200), value:200},
        { label: roundToNearest5or0(300), value:300},
        { label: roundToNearest5or0(400), value:400},
        { label: roundToNearest5or0(500), value:500},
        { label: roundToNearest5or0(1000), value:1000},

    ];


    

    const selectQuickBid = (increment: number) => {
        const newBid = bid_amount + increment;
        setBidAmount(newBid);
        setCustomAmount(newBid.toString());
    };

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "") {
            setCustomAmount("");
            setBidAmount("");
            return;
        }
        const cleanValue = value.replace(/[^0-9]/g, "");
        if (cleanValue) {
            const numValue = parseInt(cleanValue);
            setCustomAmount(formatCurrency (numValue));
            setBidAmount(numValue);
        }
    };

    const handleAutoBidIncrementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value)) {
            setAutoBidIncrement(Math.max(200, value));
        }
    };

    const handleAutoBidMaximumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value)) {
            setAutoBidMaximum(value);
        }
    };

    const toggleAutoBid = () => {
        if (!isLoggedIn) {
            toast.error("يرجى تسجيل الدخول أولاً للمزايدة");
            return;
        }

        if (!isAutoBidEnabled) {
            if (autoBidIncrement < 200) {
                setError("يجب أن تكون الزيادة التلقائية 200 ريال على الأقل");
                return;
            }

            if (autoBidMaximum <= bid_amount) {
                setError("يجب أن يكون الحد الأقصى أكبر من السعر الحالي");
                return;
            }

            saveAutoBidSettings();
        } else {
            deleteAutoBidSettings();
        }
    };

    const saveAutoBidSettings = async () => {
        setIsSubmitting(true);
        try {
            const response = await api.post("/api/auctions/auto-bid", {
                auction_id,
                user_id: user?.id,
                increment: autoBidIncrement,
                maximum: autoBidMaximum,
            });

            if (response.data.status === "success") {
                setIsAutoBidEnabled(true);
                setSuccess("تم تفعيل المزايدة التلقائية بنجاح");
                toast.success("تم تفعيل المزايدة التلقائية بنجاح");
            } else {
                throw new Error(response.data.message || "فشل في تفعيل المزايدة التلقائية");
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                    "تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت وحاول مرة أخرى."
            );
            setIsAutoBidEnabled(false);
            toast.error("فشل تفعيل المزايدة التلقائية");
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteAutoBidSettings = async () => {
        setIsSubmitting(true);
        try {
            const response = await api.delete(`/api/auctions/auto-bid/${auction_id}`);
            if (response.data.status === "success") {
                setIsAutoBidEnabled(false);
                setSuccess("تم إلغاء تفعيل المزايدة التلقائية");
                toast.success("تم إلغاء تفعيل المزايدة التلقائية");
            } else {
                throw new Error(response.data.message || "فشل في إلغاء المزايدة التلقائية");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "حدث خطأ في الاتصال بالخادم");
            toast.error("فشل إلغاء المزايدة التلقائية");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isLoggedIn) {
            toast.error("يرجى تسجيل الدخول أولاً للمزايدة");
            return;
        }

        const numericBid =
            typeof bidAmount === "string"
                ? parseInt(bidAmount.replace(/,/g, ""))
                : bidAmount;

        if (!numericBid || isNaN(numericBid)) {
            setError("الرجاء إدخال مبلغ صحيح");
            return;
        }

        if (numericBid <= bid_amount) {
            setError(`يجب أن يكون المبلغ أكبر من ${formatCurrency (bid_amount)} `);
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            const response = await api.post("/api/auctions/bid", {
                auction_id,
                user_id: user?.id,
                bid_amount: numericBid,
            });

            if (response.data.status === "success") {
                setSuccess("تم تقديم العرض بنجاح!");
                toast.success("تم تقديم العرض بنجاح!");
                setBidAmount(bid_amount);
                setCustomAmount("");
                setTimeout(()=>{
                     window.location.reload();
                },1500);
                if (onSuccess) onSuccess();
            } else {
                throw new Error(response.data.message || "حدث خطأ أثناء تقديم العرض");
            }
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message ||
                "حدث خطأ في الاتصال بالخادم - يرجى المحاولة مرة أخرى لاحقًا";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
<div className="bg-white rounded shadow-sm border border-gray-200">
    <div className="p-4">
        <h3 className="text-center font-semibold mb-3">قدم عرضك</h3>

        <form onSubmit={handleSubmit}>
            {/* أزرار المزايدة السريعة */}
            <div className="flex justify-between mb-3 gap-1">
                {quickBidOptions.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => selectQuickBid(option.value)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs py-1 px-2 rounded-md flex-1 border border-gray-300">
                        {option.label}
                    </button>
                ))}
            </div>

            {/* مربع إدخال المبلغ وزر التأكيد */}
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="col-span-1">
                    <input
                        type="text"
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                        placeholder={`أدخل مبلغ أعلى من ${formatCurrency (
                            bid_amount
                        )} `}
                        className="w-full border border-gray-300 p-2.5 rounded text-center text-gray-600 h-full"
                    />
                </div>

                <button
                    type="submit"
                    disabled={
                        isSubmitting ||
                        !bidAmount ||
                        Number(bidAmount) <= bid_amount
                    }
                    className={`h-full py-2.5 rounded text-white font-medium ${
                        isSubmitting ||
                        !bidAmount ||
                        Number(bidAmount) <= bid_amount
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600"
                    }`}
                >
                    تأكيد
                </button>
            </div>

            {/* رسائل الخطأ والنجاح */}
            {error && (
                <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-600 rounded text-sm flex items-center justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 text-green-600 rounded text-sm">
                    {success}
                </div>
            )}

            {/* زر عرض إعدادات المزايدة التلقائية 
            <div className="mt-4 mb-2">
                <button
                    type="button"
                    onClick={() => setShowAutoBid(!showAutoBid)}
                    className="w-full text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-sm py-2 rounded-md flex items-center justify-center"
                >
                    <span>
                        {showAutoBid ? "إخفاء" : "عرض"} إعدادات المزايدة التلقائية
                    </span>
                    <svg
                        className={`w-4 h-4 mr-1 transition-transform duration-200 ${
                            showAutoBid ? "transform rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>
            </div>
*/}
            {/* إعدادات المزايدة التلقائية 
            {showAutoBid && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mt-1 mb-2">
                    {!isAutoBidEnabled ? (
                        <>
                            <h4 className="text-blue-900 font-semibold text-sm mb-3">
                                إعدادات المزايدة التلقائية
                            </h4>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-blue-900 mb-1">
                                            مقدار الزيادة التلقائية (ريال)
                                        </label>
                                        <input
                                            type="number"
                                            min="200"
                                            step="50"
                                            value={autoBidIncrement}
                                            onChange={
                                                handleAutoBidIncrementChange
                                            }
                                            className="w-full p-2 text-sm border border-blue-200 rounded"
                                            disabled={isAutoBidEnabled}
                                        />
                                        <p className="text-xs text-blue-700 mt-1">
                                            الحد الأدنى 200 ريال
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-blue-900 mb-1">
                                            الحد الأقصى للمزايدة (ريال)
                                        </label>
                                        <input
                                            type="number"
                                            min={bid_amount + 1}
                                            step="1000"
                                            value={autoBidMaximum}
                                            onChange={
                                                handleAutoBidMaximumChange
                                            }
                                            className="w-full p-2 text-sm border border-blue-200 rounded"
                                            disabled={isAutoBidEnabled}
                                        />
                                        <p className="text-xs text-blue-700 mt-1">
                                            يجب أن يكون أكبر من السعر الحالي
                                        </p>
                                    </div>
                                </div>

                                <div className="text-xs text-blue-800 leading-relaxed">
                                    <p>
                                        سيقوم النظام بالمزايدة تلقائياً لصالحك
                                        عند وصول سعر المزاد إلى سعر معين
                                        بزيادة {formatCurrency (autoBidIncrement)}{" "}
                                        ريال لكل مزايدة، حتى الوصول للحد الأقصى{" "}
                                        {formatCurrency (autoBidMaximum)} ريال.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={toggleAutoBid}
                                    className="w-full py-2 rounded text-white mt-2 bg-blue-500 hover:bg-blue-600"
                                >
                                    تفعيل المزايدة التلقائية
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="h-3 w-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                <span className="text-sm font-medium text-blue-900">
                                    المزايدة التلقائية تعمل حالياً
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={toggleAutoBid}
                                className="text-sm text-white bg-red-500 hover:bg-red-600 py-1.5 px-3 rounded"
                            >
                                إيقاف
                            </button>
                        </div>
                    )}
                </div>
            )}
            */}
        </form>
    </div>
</div>

    );
}
