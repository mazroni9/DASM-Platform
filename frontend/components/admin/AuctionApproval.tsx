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
    auction_type: string;
    status: string;
    created_at: string;
}

export default function AdminAuctionApproval() {
    const [pendingAuctions, setPendingAuctions] = useState<PendingAuction[]>(
        []
    );
    const [filteredAuctions, setFilteredAuctions] = useState<PendingAuction[]>(
        []
    );
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
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
        category: "",
    });

    // Rejection form state
    const [rejectionReason, setRejectionReason] = useState("");

    useEffect(() => {
        fetchPendingAuctions();
    }, []);

    useEffect(() => {
        filterAuctions();
    }, [pendingAuctions, statusFilter, searchTerm]);

    const fetchPendingAuctions = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/admin/auctions/pending");
            if (response.data.status === "success") {
                setPendingAuctions(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching pending auctions:", error);
            toast.error("حدث خطأ أثناء جلب المزادات المعلقة");
        } finally {
            setLoading(false);
        }
    };

    const filterAuctions = () => {
        let filtered = pendingAuctions;

        if (statusFilter !== "all") {
            filtered = filtered.filter(
                (auction) => auction.status === statusFilter
            );
        }

        if (searchTerm) {
            filtered = filtered.filter(
                (auction) =>
                    auction.car.make
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    auction.car.model
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    auction.car.vin
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
            );
        }

        setFilteredAuctions(filtered);
    };

    const handleApprove = async (auction: PendingAuction) => {
        setSelectedAuction(auction);
        setApprovalData({
            opening_price: auction.starting_bid.toString(),
            auction_type: "silent_instant",
            approved_for_live: false,
            category: auction.car.category || "",
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

        // Validate category is selected
        if (!approvalData.category) {
            toast.error("يرجى اختيار تصنيف السيارة");
            return;
        }

        try {
            setProcessingId(selectedAuction.id);
            const response = await api.post(
                `/api/admin/auctions/${selectedAuction.id}/approve`,
                approvalData
            );

            if (response.data.status === "success") {
                toast.success("تم الموافقة على المزاد بنجاح");
                setShowApprovalModal(false);
                setSelectedAuction(null);
                fetchPendingAuctions();
            }
        } catch (error: any) {
            console.error("Error approving auction:", error);
            toast.error(
                error.response?.data?.message ||
                    "حدث خطأ أثناء الموافقة على المزاد"
            );
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
                `/api/admin/auctions/${selectedAuction.id}/reject`,
                {
                    reason: rejectionReason,
                }
            );

            if (response.data.status === "success") {
                toast.success("تم رفض المزاد");
                setShowRejectionModal(false);
                setSelectedAuction(null);
                fetchPendingAuctions();
            }
        } catch (error: any) {
            console.error("Error rejecting auction:", error);
            toast.error(
                error.response?.data?.message || "حدث خطأ أثناء رفض المزاد"
            );
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

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat("ar-SA", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(dateString));
    };

    const getOwnerName = (auction: PendingAuction) => {
        if (auction.car.dealer?.user) {
            const user = auction.car.dealer.user;
            return `${user.first_name} ${user.last_name}`;
        } else if (auction.car.user) {
            const user = auction.car.user;
            return `${user.first_name} ${user.last_name}`;
        }
        return "غير محدد";
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <AlertTriangle className="h-6 w-6 text-yellow-500 ml-2" />
                        المزادات المعلقة للموافقة
                    </h2>
                    <div className="text-sm text-gray-500">
                        المجموع: {filteredAuctions.length}
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            البحث
                        </label>
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="ابحث بالماركة أو الموديل أو رقم التسجيل..."
                                className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            الحالة
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">جميع الحالات</option>
                            <option value="pending_approval">
                                في انتظار الموافقة
                            </option>
                            <option value="approved">موافق عليه</option>
                            <option value="rejected">مرفوض</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                        >
                            <Filter className="h-4 w-4 ml-2" />
                            تحديث
                        </button>
                    </div>
                </div>
            </div>

            {/* Auctions List */}
            {filteredAuctions.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        لا توجد مزادات معلقة
                    </h3>
                    <p className="text-gray-500">
                        لا توجد مزادات تحتاج إلى موافقة حالياً
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredAuctions.map((auction) => (
                        <div
                            key={auction.id}
                            className="bg-white rounded-lg shadow-md border-r-4 border-r-yellow-400 p-6"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Car Details */}
                                <div className="lg:col-span-2">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                                <Car className="h-5 w-5 text-blue-500 ml-2" />
                                                {auction.car.make}{" "}
                                                {auction.car.model}{" "}
                                                {auction.car.year}
                                            </h3>
                                            <p className="text-gray-600">
                                                رقم التسجيل: {auction.car.vin}
                                            </p>
                                            {auction.car.plate_number && (
                                                <p className="text-gray-600">
                                                    رقم اللوحة:{" "}
                                                    {auction.car.plate_number}
                                                </p>
                                            )}
                                        </div>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            <Clock className="h-3 w-3 ml-1" />
                                            في انتظار الموافقة
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">
                                                الحالة:
                                            </span>{" "}
                                            <span className="font-medium">
                                                {auction.car.condition}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">
                                                ناقل الحركة:
                                            </span>{" "}
                                            <span className="font-medium">
                                                {auction.car.transmission}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">
                                                العداد:
                                            </span>{" "}
                                            <span className="font-medium">
                                                {auction.car.odometer?.toLocaleString()}{" "}
                                                كم
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">
                                                التصنيف:
                                            </span>{" "}
                                            <span className="font-medium">
                                                {auction.car.category ||
                                                    "غير محدد"}
                                            </span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-500">
                                                المالك:
                                            </span>{" "}
                                            <span className="font-medium">
                                                {getOwnerName(auction)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Auction Info & Actions */}
                                <div className="border-r pr-6">
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center">
                                            <DollarSign className="h-4 w-4 text-green-500 ml-2" />
                                            <div>
                                                <div className="text-sm text-gray-500">
                                                    سعر البداية المقترح
                                                </div>
                                                <div className="font-semibold text-green-600">
                                                    {formatPrice(
                                                        auction.starting_bid
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 text-blue-500 ml-2" />
                                            <div>
                                                <div className="text-sm text-gray-500">
                                                    تاريخ الطلب
                                                </div>
                                                <div className="text-sm">
                                                    {formatDate(
                                                        auction.created_at
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                handleApprove(auction)
                                            }
                                            disabled={
                                                processingId === auction.id
                                            }
                                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            موافقة
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleReject(auction)
                                            }
                                            disabled={
                                                processingId === auction.id
                                            }
                                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            رفض
                                        </button>
                                    </div>
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        تصنيف السيارة
                                    </label>
                                    <select
                                        value={approvalData.category}
                                        onChange={(e) =>
                                            setApprovalData({
                                                ...approvalData,
                                                category: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">
                                            -- اختر تصنيف السيارة --
                                        </option>
                                        <option value="luxury">فاخرة</option>
                                        <option value="truck">شاحنة</option>
                                        <option value="bus">حافلة</option>
                                        <option value="caravan">كارافان</option>
                                        <option value="government">
                                            حكومية
                                        </option>
                                        <option value="company">شركة</option>
                                        <option value="auction">مزاد</option>
                                        <option value="classic">
                                            كلاسيكية
                                        </option>
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
                                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                                >
                                    {processingId === selectedAuction.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle className="h-4 w-4" />
                                    )}
                                    موافقة
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={4}
                                    placeholder="يرجى إدخال سبب رفض المزاد..."
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={submitRejection}
                                    disabled={
                                        processingId === selectedAuction.id
                                    }
                                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                                >
                                    {processingId === selectedAuction.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <XCircle className="h-4 w-4" />
                                    )}
                                    رفض المزاد
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
