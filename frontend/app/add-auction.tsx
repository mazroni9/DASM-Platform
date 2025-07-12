"use client";

import { useState, useRef, FormEvent, ChangeEvent } from "react";
import { Upload, FileX, Car, CheckCircle2, AlertCircle } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

/*
        $auction->car_id = $car->car_id;
        $auction->starting_bid = $car->starting_bid;
        $auction->current_bid = $car->starting_bid;
        $auction->reserve_price = $car->reserve_price ?? 0;
        $auction->start_time = $car->start_time;
        $auction->end_time = $car->end_time;
        $auction->description = $car->description;
  */

interface AuctionData {
    car_id: number;
    minimum_bid: number; // User enters minimum price
    maximum_bid: number; // User enters maximum price
    start_time: string;
    end_time: string;
    description: string;
}

export default function AuctionDataEntryForm() {
    const [formData, setFormData] = useState<AuctionData>({
        car_id: 0,
        minimum_bid: 0,
        maximum_bid: 0,
        start_time: "",
        end_time: "",
        description: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);

    // التعامل مع تغيير قيم حقول النموذج
    const handleInputChange = (
        e: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // تقديم النموذج
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            // التحقق من البيانات المدخلة
            const requiredFields = [
                "car_id",
                "minimum_bid",
                "maximum_bid",
                "start_time",
                "end_time",
            ];
            for (const field of requiredFields) {
                if (!formData[field as keyof AuctionData]) {
                    throw new Error(`حقل ${field.replace("_", " ")} مطلوب`);
                }
            }

            // Validate that maximum_bid is greater than minimum_bid
            if (formData.maximum_bid <= formData.minimum_bid) {
                throw new Error("يجب أن يكون أعلى سعر أكبر من أقل سعر");
            }

            // إرسال بيانات المزاد
            try {
                const response = await api.post("/api/auctions", formData, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (response.data.status === "success") {
                    toast.success("تم إرسال المزاد للموافقة بنجاح");
                    // تم الحفظ بنجاح
                    setSubmitResult({
                        success: true,
                        message: "تم إرسال المزاد للموافقة من المشرف",
                    });
                    // إعادة تعيين النموذج
                    setFormData({
                        car_id: 0,
                        minimum_bid: 0,
                        maximum_bid: 0,
                        start_time: "",
                        end_time: "",
                        description: "",
                    });
                } else {
                    toast.error("فشل في إنشاء المزاد");
                }
            } catch (error) {
                console.error("Error in creating auction:", error);
                toast.error("فشل في إنشاء المزاد");
            }
        } catch (error: any) {
            console.error("خطأ في حفظ البيانات:", error);
            setSubmitResult({
                success: false,
                message: error.message || "حدث خطأ أثناء حفظ البيانات",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto mb-10">
            <div className="border-b pb-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    إنشاء مزاد جديد
                </h1>
                <p className="text-gray-600 mt-1">
                    يرجى تعبئة جميع البيانات المطلوبة لإنشاء مزادك - سيتم
                    مراجعته من قبل المشرف
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* بيانات المزاد */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label
                            htmlFor="car_id"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            رقم السيارة
                        </label>
                        <input
                            type="number"
                            id="car_id"
                            name="car_id"
                            value={formData.car_id}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="minimum_bid"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            أقل سعر مقبول (ريال)
                        </label>
                        <input
                            type="number"
                            id="minimum_bid"
                            name="minimum_bid"
                            value={formData.minimum_bid}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="maximum_bid"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            أعلى سعر متوقع (ريال)
                        </label>
                        <input
                            type="number"
                            id="maximum_bid"
                            name="maximum_bid"
                            value={formData.maximum_bid}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="start_time"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            تاريخ بداية المزاد
                        </label>
                        <input
                            type="datetime-local"
                            id="start_time"
                            name="start_time"
                            value={formData.start_time}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="end_time"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            تاريخ نهاية المزاد
                        </label>
                        <input
                            type="datetime-local"
                            id="end_time"
                            name="end_time"
                            value={formData.end_time}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            وصف المزاد (اختياري)
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="أدخل أي تفاصيل إضافية عن المزاد..."
                        />
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-yellow-500 ml-2 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-medium text-yellow-800">
                                ملاحظة مهمة
                            </h3>
                            <p className="text-sm text-yellow-700 mt-1">
                                سيتم مراجعة مزادك من قبل المشرف الذي سيحدد سعر
                                الافتتاح. لا يمكن أن يكون سعر الافتتاح أقل من
                                90% من أقل سعر مقبول.
                            </p>
                        </div>
                    </div>
                </div>

                {/* رسائل النظام */}
                {submitResult && (
                    <div
                        className={`p-4 rounded-md ${
                            submitResult.success
                                ? "bg-green-50 border border-green-200"
                                : "bg-red-50 border border-red-200"
                        }`}
                    >
                        <div className="flex items-start">
                            {submitResult.success ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 ml-2" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-red-500 ml-2" />
                            )}
                            <p
                                className={
                                    submitResult.success
                                        ? "text-green-700"
                                        : "text-red-700"
                                }
                            >
                                {submitResult.message}
                            </p>
                        </div>
                    </div>
                )}

                {/* أزرار التحكم */}
                <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => {
                            setFormData({
                                car_id: 0,
                                minimum_bid: 0,
                                maximum_bid: 0,
                                start_time: "",
                                end_time: "",
                                description: "",
                            });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        مسح النموذج
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            isSubmitting
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {isSubmitting ? "جاري الإرسال..." : "إرسال للموافقة"}
                        <Car className="mr-2 h-5 w-5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
