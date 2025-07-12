"use client";

import { useState, useEffect } from "react";
import {
    Car,
    Clock,
    DollarSign,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Loader2,
    Filter,
    Search,
    Eye,
    Calendar,
    User,
    Settings,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";

interface PendingAuction {
    id: number;
    car: {
        id: number;
        make: string;
        model: string;
        year: number;
        vin: string;
        plate_number: string;
        condition: string;
        transmission: string;
        category: string;
        odometer: number;
        images?: string[];
        dealer?: {
            user: {
                first_name: string;
                last_name: string;
            };
        };
        user?: {
            first_name: string;
            last_name: string;
        };
    };
    starting_bid: number;
    min_price: number;
    max_price: number;
    reserve_price: number;
    status: string;
    created_at: string;
}

export default function ModeratorAuctionApproval() {
    const [pendingAuctions, setPendingAuctions] = useState<PendingAuction[]>(
        []
    );
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAuction, setSelectedAuction] =
        useState<PendingAuction | null>(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // Approval form state
    const [approvalData, setApprovalData] = useState({
        opening_price: "",
        auction_type: "silent_instant",
        approved_for_live: false,
    });

    // Rejection form state
    const [rejectionReason, setRejectionReason] = useState("");

    useEffect(() => {
        fetchPendingAuctions();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const delayedSearch = setTimeout(() => {
                fetchPendingAuctions();
            }, 500);
            return () => clearTimeout(delayedSearch);
        } else {
            fetchPendingAuctions();
        }
    }, [searchTerm]);

    const fetchPendingAuctions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchTerm) params.append("search", searchTerm);

            const response = await api.get(
                `/api/moderator/auctions/pending?${params}`
            );
            if (response.data.status === "success") {
                setPendingAuctions(
                    response.data.data.data || response.data.data
                );
            }
        } catch (error) {
            console.error("Error fetching pending auctions:", error);
            toast.error("فشل في تحميل المزادات المعلقة");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (auction: PendingAuction) => {
        setSelectedAuction(auction);
        setApprovalData({
            opening_price: auction.starting_bid.toString(),
            auction_type: "silent_instant",
            approved_for_live: false,
        });
        setShowApprovalModal(true);
    };

    const handleReject = async (auction: PendingAuction) => {
        setSelectedAuction(auction);
        setRejectionReason("");
        setShowRejectionModal(true);
    };

    const submitApproval = async () => {
        if (!selectedAuction) return;

        try {
            setProcessingId(selectedAuction.id);
            const response = await api.post(
                `/api/moderator/auctions/${selectedAuction.id}/approve`,
                approvalData
            );

            if (response.data.status === "success") {
                toast.success("تم قبول المزاد بنجاح");
                setShowApprovalModal(false);
                fetchPendingAuctions();
            }
        } catch (error: any) {
            console.error("Error approving auction:", error);
            toast.error(error.response?.data?.message || "فشل في قبول المزاد");
        } finally {
            setProcessingId(null);
        }
    };

    const submitRejection = async () => {
        if (!selectedAuction || !rejectionReason.trim()) {
            toast.error("يرجى إدخال سبب الرفض");
            return;
        }

        try {
            setProcessingId(selectedAuction.id);
            const response = await api.post(
                `/api/moderator/auctions/${selectedAuction.id}/reject`,
                {
                    rejection_reason: rejectionReason,
                }
            );

            if (response.data.status === "success") {
                toast.success("تم رفض المزاد");
                setShowRejectionModal(false);
                fetchPendingAuctions();
            }
        } catch (error: any) {
            console.error("Error rejecting auction:", error);
            toast.error(error.response?.data?.message || "فشل في رفض المزاد");
        } finally {
            setProcessingId(null);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("ar-SA", {
            style: "currency",
            currency: "SAR",
        }).format(price);
    };

    const getOwnerName = (auction: PendingAuction) => {
        if (auction.car.dealer?.user) {
            return `${auction.car.dealer.user.first_name} ${auction.car.dealer.user.last_name}`;
        }
        if (auction.car.user) {
            return `${auction.car.user.first_name} ${auction.car.user.last_name}`;
        }
        return "غير محدد";
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="mr-2 text-gray-600">جاري التحميل...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="البحث بالماركة، الموديل، أو رقم اللوحة..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending Auctions Count */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 ml-2" />
                    <span className="text-yellow-800">
                        {pendingAuctions.length} مزاد في انتظار الموافقة
                    </span>
                </div>
            </div>

            {/* Auctions Grid */}
            {pendingAuctions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        لا توجد مزادات معلقة
                    </h3>
                    <p className="text-gray-500">
                        جميع المزادات تم مراجعتها والموافقة عليها
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingAuctions.map((auction) => (
                        <div
                            key={auction.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Car Image */}
                            <div className="h-48 bg-gray-200 relative">
                                {auction.car.images && auction.car.images[0] ? (
                                    <img
                                        src={auction.car.images[0]}
                                        alt={`${auction.car.make} ${auction.car.model}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <Car className="h-12 w-12 text-gray-400" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                    معلق
                                </div>
                            </div>

                            {/* Car Details */}
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {auction.car.make} {auction.car.model}{" "}
                                    {auction.car.year}
                                </h3>

                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center">
                                        <User className="h-4 w-4 ml-2" />
                                        <span>
                                            المالك: {getOwnerName(auction)}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <Car className="h-4 w-4 ml-2" />
                                        <span>
                                            لوحة:{" "}
                                            {auction.car.plate_number ||
                                                "غير محدد"}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 ml-2" />
                                        <span>
                                            {new Date(
                                                auction.created_at
                                            ).toLocaleDateString("ar-SA")}
                                        </span>
                                    </div>
                                </div>

                                {/* Price Information */}
                                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                    <div className="grid grid-cols-1 gap-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">
                                                سعر البداية:
                                            </span>
                                            <span className="font-medium">
                                                {formatPrice(
                                                    auction.starting_bid
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">
                                                السعر الأدنى:
                                            </span>
                                            <span className="font-medium">
                                                {formatPrice(auction.min_price)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">
                                                السعر الأعلى:
                                            </span>
                                            <span className="font-medium">
                                                {formatPrice(auction.max_price)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApprove(auction)}
                                        disabled={processingId === auction.id}
                                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        {processingId === auction.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="h-4 w-4" />
                                        )}
                                        موافقة
                                    </button>
                                    <button
                                        onClick={() => handleReject(auction)}
                                        disabled={processingId === auction.id}
                                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        رفض
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Approval Modal */}
            {showApprovalModal && selectedAuction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                موافقة على المزاد
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {selectedAuction.car.make}{" "}
                                {selectedAuction.car.model}{" "}
                                {selectedAuction.car.year}
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        سعر الافتتاح
                                    </label>
                                    <input
                                        type="number"
                                        value={approvalData.opening_price}
                                        onChange={(e) =>
                                            setApprovalData({
                                                ...approvalData,
                                                opening_price: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="سعر الافتتاح"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        نوع المزاد
                                    </label>
                                    <select
                                        value={approvalData.auction_type}
                                        onChange={(e) =>
                                            setApprovalData({
                                                ...approvalData,
                                                auction_type: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="silent_instant">
                                            مزاد صامت فوري
                                        </option>
                                        <option value="live_instant">
                                            مزاد فوري مباشر
                                        </option>
                                        <option value="live">مزاد مباشر</option>
                                    </select>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="approved_for_live"
                                        checked={approvalData.approved_for_live}
                                        onChange={(e) =>
                                            setApprovalData({
                                                ...approvalData,
                                                approved_for_live:
                                                    e.target.checked,
                                            })
                                        }
                                        className="ml-2"
                                    />
                                    <label
                                        htmlFor="approved_for_live"
                                        className="text-sm text-gray-700"
                                    >
                                        موافق للمزاد المباشر
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={submitApproval}
                                    disabled={
                                        processingId === selectedAuction.id
                                    }
                                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg"
                                >
                                    {processingId === selectedAuction.id
                                        ? "جاري المعالجة..."
                                        : "موافقة"}
                                </button>
                                <button
                                    onClick={() => setShowApprovalModal(false)}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {showRejectionModal && selectedAuction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                رفض المزاد
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {selectedAuction.car.make}{" "}
                                {selectedAuction.car.model}{" "}
                                {selectedAuction.car.year}
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    سبب الرفض
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) =>
                                        setRejectionReason(e.target.value)
                                    }
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="اكتب سبب رفض المزاد..."
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={submitRejection}
                                    disabled={
                                        processingId === selectedAuction.id ||
                                        !rejectionReason.trim()
                                    }
                                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg"
                                >
                                    {processingId === selectedAuction.id
                                        ? "جاري المعالجة..."
                                        : "رفض"}
                                </button>
                                <button
                                    onClick={() => setShowRejectionModal(false)}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
