"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { CheckCircle, XCircle, Clock, Car, DollarSign } from "lucide-react";

interface PendingAuction {
    id: number;
    car_id: number;
    minimum_bid: number;
    maximum_bid: number;
    start_time: string;
    end_time: string;
    description: string;
    created_at: string;
    car: {
        id: number;
        make: string;
        model: string;
        year: number;
        vin: string;
        images?: string[];
        dealer?: {
            user: {
                first_name: string;
                last_name: string;
                email: string;
            };
        };
        user?: {
            first_name: string;
            last_name: string;
            email: string;
        };
    };
}

interface ApprovalFormData {
    opening_price: number;
    approve_for_live: boolean;
    notes: string;
}

export default function AdminAuctionApproval() {
    const [pendingAuctions, setPendingAuctions] = useState<PendingAuction[]>(
        []
    );
    const [loading, setLoading] = useState(true);
    const [approvalForm, setApprovalForm] = useState<ApprovalFormData>({
        opening_price: 0,
        approve_for_live: false,
        notes: "",
    });
    const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(
        null
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchPendingAuctions();
    }, []);

    const fetchPendingAuctions = async () => {
        try {
            const response = await api.get("/api/admin/auctions/pending");
            if (response.data.status === "success") {
                setPendingAuctions(response.data.data.data);
            }
        } catch (error) {
            console.error("Error fetching pending auctions:", error);
            toast.error("فشل في تحميل المزادات المعلقة");
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (auctionId: number) => {
        if (!approvalForm.opening_price) {
            toast.error("يرجى إدخال سعر الافتتاح");
            return;
        }

        const auction = pendingAuctions.find((a) => a.id === auctionId);
        if (!auction) return;

        const minimumAllowed = auction.minimum_bid * 0.9;
        if (approvalForm.opening_price < minimumAllowed) {
            toast.error(
                `سعر الافتتاح لا يمكن أن يكون أقل من ${minimumAllowed.toFixed(
                    2
                )} ريال`
            );
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.post(
                `/api/admin/auctions/${auctionId}/approve`,
                approvalForm
            );
            if (response.data.status === "success") {
                toast.success("تم الموافقة على المزاد بنجاح");
                setSelectedAuctionId(null);
                setApprovalForm({
                    opening_price: 0,
                    approve_for_live: false,
                    notes: "",
                });
                fetchPendingAuctions();
            }
        } catch (error: any) {
            console.error("Error approving auction:", error);
            toast.error(
                error.response?.data?.message || "فشل في الموافقة على المزاد"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRejection = async (auctionId: number, reason: string) => {
        if (!reason.trim()) {
            toast.error("يرجى إدخال سبب الرفض");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.post(
                `/api/admin/auctions/${auctionId}/reject`,
                { reason }
            );
            if (response.data.status === "success") {
                toast.success("تم رفض المزاد");
                fetchPendingAuctions();
            }
        } catch (error: any) {
            console.error("Error rejecting auction:", error);
            toast.error(error.response?.data?.message || "فشل في رفض المزاد");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getOwnerName = (auction: PendingAuction) => {
        const owner = auction.car.dealer?.user || auction.car.user;
        return owner ? `${owner.first_name} ${owner.last_name}` : "غير محدد";
    };

    const getOwnerEmail = (auction: PendingAuction) => {
        const owner = auction.car.dealer?.user || auction.car.user;
        return owner?.email || "غير محدد";
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    موافقة المزادات - المدير
                </h1>
                <p className="text-gray-600 mt-2">
                    مراجعة والموافقة على المزادات المعلقة وتحديد سعر الافتتاح
                </p>
            </div>

            {pendingAuctions.length === 0 ? (
                <div className="text-center py-12">
                    <Clock className="mx-auto h-16 w-16 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                        لا توجد مزادات معلقة
                    </h3>
                    <p className="mt-2 text-gray-500">
                        جميع المزادات تمت مراجعتها
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {pendingAuctions.map((auction) => (
                        <div
                            key={auction.id}
                            className="bg-white rounded-lg shadow-md border p-6"
                        >
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <div className="flex items-center mb-4">
                                        <Car className="h-6 w-6 text-blue-600 ml-2" />
                                        <h3 className="text-xl font-semibold">
                                            {auction.car.make}{" "}
                                            {auction.car.model}{" "}
                                            {auction.car.year}
                                        </h3>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p>
                                            <strong>رقم المزاد:</strong> #
                                            {auction.id}
                                        </p>
                                        <p>
                                            <strong>VIN:</strong>{" "}
                                            {auction.car.vin}
                                        </p>
                                        <p>
                                            <strong>المالك:</strong>{" "}
                                            {getOwnerName(auction)}
                                        </p>
                                        <p>
                                            <strong>البريد الإلكتروني:</strong>{" "}
                                            {getOwnerEmail(auction)}
                                        </p>
                                        <p>
                                            <strong>النطاق السعري:</strong>{" "}
                                            {auction.minimum_bid} -{" "}
                                            {auction.maximum_bid} ريال
                                        </p>
                                        <p>
                                            <strong>تاريخ البداية:</strong>{" "}
                                            {new Date(
                                                auction.start_time
                                            ).toLocaleDateString("ar-SA")}
                                        </p>
                                        <p>
                                            <strong>تاريخ النهاية:</strong>{" "}
                                            {new Date(
                                                auction.end_time
                                            ).toLocaleDateString("ar-SA")}
                                        </p>
                                        <p>
                                            <strong>تاريخ الإنشاء:</strong>{" "}
                                            {new Date(
                                                auction.created_at
                                            ).toLocaleDateString("ar-SA")}
                                        </p>
                                        {auction.description && (
                                            <p>
                                                <strong>الوصف:</strong>{" "}
                                                {auction.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    {selectedAuctionId === auction.id ? (
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-lg">
                                                تحديد سعر الافتتاح
                                            </h4>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    سعر الافتتاح (ريال)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={
                                                        approvalForm.opening_price
                                                    }
                                                    onChange={(e) =>
                                                        setApprovalForm({
                                                            ...approvalForm,
                                                            opening_price:
                                                                parseFloat(
                                                                    e.target
                                                                        .value
                                                                ) || 0,
                                                        })
                                                    }
                                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder={`الحد الأدنى: ${(
                                                        auction.minimum_bid *
                                                        0.9
                                                    ).toFixed(2)}`}
                                                    min={
                                                        auction.minimum_bid *
                                                        0.9
                                                    }
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    الحد الأدنى المسموح:{" "}
                                                    {(
                                                        auction.minimum_bid *
                                                        0.9
                                                    ).toFixed(2)}{" "}
                                                    ريال (90% من أقل سعر)
                                                </p>
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`live-${auction.id}`}
                                                    checked={
                                                        approvalForm.approve_for_live
                                                    }
                                                    onChange={(e) =>
                                                        setApprovalForm({
                                                            ...approvalForm,
                                                            approve_for_live:
                                                                e.target
                                                                    .checked,
                                                        })
                                                    }
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label
                                                    htmlFor={`live-${auction.id}`}
                                                    className="mr-2 text-sm text-gray-700"
                                                >
                                                    موافق للمزاد المباشر
                                                </label>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    ملاحظات إدارية (اختياري)
                                                </label>
                                                <textarea
                                                    value={approvalForm.notes}
                                                    onChange={(e) =>
                                                        setApprovalForm({
                                                            ...approvalForm,
                                                            notes: e.target
                                                                .value,
                                                        })
                                                    }
                                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    rows={3}
                                                />
                                            </div>

                                            <div className="flex space-x-3 rtl:space-x-reverse">
                                                <button
                                                    onClick={() =>
                                                        handleApproval(
                                                            auction.id
                                                        )
                                                    }
                                                    disabled={isSubmitting}
                                                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                                                >
                                                    <CheckCircle className="h-5 w-5 ml-2" />
                                                    {isSubmitting
                                                        ? "جاري الموافقة..."
                                                        : "موافقة المدير"}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setSelectedAuctionId(
                                                            null
                                                        )
                                                    }
                                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                                >
                                                    إلغاء
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center text-yellow-600 mb-4">
                                                <Clock className="h-5 w-5 ml-2" />
                                                <span className="font-medium">
                                                    في انتظار موافقة المدير
                                                </span>
                                            </div>

                                            <div className="flex space-x-3 rtl:space-x-reverse">
                                                <button
                                                    onClick={() => {
                                                        setSelectedAuctionId(
                                                            auction.id
                                                        );
                                                        setApprovalForm({
                                                            opening_price:
                                                                auction.minimum_bid,
                                                            approve_for_live:
                                                                true, // Admin can approve for live by default
                                                            notes: "",
                                                        });
                                                    }}
                                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center"
                                                >
                                                    <DollarSign className="h-5 w-5 ml-2" />
                                                    تحديد سعر الافتتاح
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt(
                                                            "يرجى إدخال سبب الرفض:"
                                                        );
                                                        if (reason) {
                                                            handleRejection(
                                                                auction.id,
                                                                reason
                                                            );
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center"
                                                >
                                                    <XCircle className="h-5 w-5 ml-2" />
                                                    رفض
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
