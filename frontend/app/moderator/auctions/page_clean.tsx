"use client";

import { useEffect, useState } from "react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Eye, CheckCircle, XCircle, Clock, Filter } from "lucide-react";


interface Auction {
    id: number;
    title: string;
    status: string;
    start_time: string;
    end_time: string;
    starting_bid: number;
    current_bid: number;
    bid_count: number;
    car: {
        id: number;
        make: string;
        model: string;
        year: number;
    };
}

export default function ModeratorAuctionsPage() {
    const { isModerator, isLoading, isLoggedIn } = useAuth();
    const router = useLoadingRouter();
    
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [selectedAuctions, setSelectedAuctions] = useState<number[]>([]);
    const [activeTab, setActiveTab] = useState<"all" | "approvals">("all");

    // Additional state for approvals tab
    const [pendingAuctions, setPendingAuctions] = useState<Auction[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAuction, setSelectedAuction] = useState<Auction | null>(
        null
    );
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
        // Redirect if not logged in or not a moderator
        if (!isLoading && (!isLoggedIn || !isModerator)) {
            router.push("/auth/login");
        }
    }, [isLoading, isLoggedIn, isModerator, router]);

    useEffect(() => {
        if (isModerator) {
            if (activeTab === "all") {
                fetchAuctions();
            } else if (activeTab === "approvals") {
                fetchPendingAuctions();
            }
        }
    }, [isModerator, activeTab]);

    const fetchAuctions = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/moderator/auctions");
            if (response.data.status === "success") {
                setAuctions(response.data.data.data);
            }
        } catch (error) {
            console.error("Error fetching auctions:", error);
            toast.error("حدث خطأ أثناء جلب المزادات");
        } finally {
            setLoading(false);
        }
    };

    // Fetch pending auctions for approvals tab
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

    const updateAuctionStatus = async (auctionId: number, status: string) => {
        try {
            const response = await api.patch(
                `/api/moderator/auctions/${auctionId}/status`,
                {
                    status,
                }
            );

            if (response.data.status === "success") {
                toast.success("تم تحديث حالة المزاد بنجاح");
                fetchAuctions(); // Refresh the list
            }
        } catch (error) {
            console.error("Error updating auction status:", error);
            toast.error("حدث خطأ أثناء تحديث حالة المزاد");
        }
    };

    const handleSelectAuction = (auctionId: number) => {
        setSelectedAuctions((prev) => {
            if (prev.includes(auctionId)) {
                return prev.filter((id) => id !== auctionId);
            } else {
                return [...prev, auctionId];
            }
        });
    };

    const handleSelectAll = () => {
        const currentList =
            activeTab === "all" ? filteredAuctions : pendingAuctions;
        if (selectedAuctions.length === currentList.length) {
            setSelectedAuctions([]);
        } else {
            setSelectedAuctions(currentList.map((auction) => auction.id));
        }
    };

    const handleBulkAction = async (action: string) => {
        if (selectedAuctions.length === 0) {
            toast.error("يرجى اختيار مزاد واحد على الأقل");
            return;
        }

        try {
            const promises = selectedAuctions.map((auctionId) => {
                switch (action) {
                    case "approve":
                        return api.patch(
                            `/api/moderator/auctions/${auctionId}/approve`
                        );
                    case "reject":
                        return api.patch(
                            `/api/moderator/auctions/${auctionId}/reject`
                        );
                    default:
                        return Promise.resolve();
                }
            });

            await Promise.all(promises);
            toast.success(
                `تم ${
                    action === "approve" ? "موافقة" : "رفض"
                } المزادات المختارة بنجاح`
            );
            setSelectedAuctions([]);
            if (activeTab === "all") {
                fetchAuctions();
            } else {
                fetchPendingAuctions();
            }
        } catch (error) {
            console.error("Error performing bulk action:", error);
            toast.error("حدث خطأ أثناء تنفيذ العملية");
        }
    };

    // Handle approval modal
    const handleApprove = async (auction: Auction) => {
        setSelectedAuction(auction);
        setApprovalData({
            opening_price: auction.starting_bid.toString(),
            auction_type: "silent_instant",
            approved_for_live: false,
        });
        setShowApprovalModal(true);
    };

    // Handle rejection modal
    const handleReject = async (auction: Auction) => {
        setSelectedAuction(auction);
        setRejectionReason("");
        setShowRejectionModal(true);
    };

    // Submit approval
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
                if (activeTab === "approvals") {
                    fetchPendingAuctions();
                } else {
                    fetchAuctions();
                }
            }
        } catch (error: any) {
            console.error("Error approving auction:", error);
            toast.error(error.response?.data?.message || "فشل في قبول المزاد");
        } finally {
            setProcessingId(null);
        }
    };

    // Submit rejection
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
                    reason: rejectionReason,
                }
            );

            if (response.data.status === "success") {
                toast.success("تم رفض المزاد بنجاح");
                setShowRejectionModal(false);
                if (activeTab === "approvals") {
                    fetchPendingAuctions();
                } else {
                    fetchAuctions();
                }
            }
        } catch (error: any) {
            console.error("Error rejecting auction:", error);
            toast.error(error.response?.data?.message || "فشل في رفض المزاد");
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending_approval":
                return "text-yellow-600 bg-yellow-100";
            case "active":
                return "text-green-600 bg-green-100";
            case "pending":
                return "text-yellow-600 bg-yellow-100";
            case "rejected":
                return "text-red-600 bg-red-100";
            case "completed":
                return "text-blue-600 bg-blue-100";
            default:
                return "text-gray-600 bg-gray-100";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "pending_approval":
                return "في انتظار الموافقة";
            case "active":
                return "نشط";
            case "pending":
                return "في الانتظار";
            case "rejected":
                return "مرفوض";
            case "completed":
                return "مكتمل";
            default:
                return status;
        }
    };

    const filteredAuctions = auctions.filter((auction) => {
        if (filter === "all") return true;
        return auction.status === filter;
    });



    if (!isModerator) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">إدارة المزادات</h1>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 space-x-reverse">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === "all"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            جميع المزادات
                        </button>
                        <button
                            onClick={() => setActiveTab("approvals")}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === "approvals"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            الموافقات المعلقة
                        </button>
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === "all" ? (
                // All Auctions Tab
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            {selectedAuctions.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">
                                        تم اختيار {selectedAuctions.length} مزاد
                                    </span>
                                    <button
                                        onClick={() =>
                                            handleBulkAction("approve")
                                        }
                                        className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                                    >
                                        موافقة الكل
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleBulkAction("reject")
                                        }
                                        className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                                    >
                                        رفض الكل
                                    </button>
                                </div>
                            )}

                            {/* Filter buttons */}
                            <div className="flex space-x-2 space-x-reverse">
                                <button
                                    onClick={() => setFilter("all")}
                                    className={`px-4 py-2 rounded-md ${
                                        filter === "all"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                                >
                                    الكل
                                </button>
                                <button
                                    onClick={() =>
                                        setFilter("pending_approval")
                                    }
                                    className={`px-4 py-2 rounded-md ${
                                        filter === "pending_approval"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                                >
                                    في انتظار الموافقة
                                </button>
                                <button
                                    onClick={() => setFilter("pending")}
                                    className={`px-4 py-2 rounded-md ${
                                        filter === "pending"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                                >
                                    في الانتظار
                                </button>
                                <button
                                    onClick={() => setFilter("active")}
                                    className={`px-4 py-2 rounded-md ${
                                        filter === "active"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                                >
                                    نشط
                                </button>
                            </div>
                        </div>
                    </div>

                    {filteredAuctions.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">
                                لا توجد مزادات للعرض
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        selectedAuctions.length ===
                                                            filteredAuctions.length &&
                                                        filteredAuctions.length >
                                                            0
                                                    }
                                                    onChange={handleSelectAll}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                المزاد
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                السيارة
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                الحالة
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                المزايدة الحالية
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                عدد المزايدات
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                الإجراءات
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredAuctions.map((auction) => (
                                            <tr
                                                key={auction.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAuctions.includes(
                                                            auction.id
                                                        )}
                                                        onChange={() =>
                                                            handleSelectAuction(
                                                                auction.id
                                                            )
                                                        }
                                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {auction.title}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            ID: {auction.id}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {auction.car.make}{" "}
                                                        {auction.car.model}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {auction.car.year}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                            auction.status
                                                        )}`}
                                                    >
                                                        {getStatusText(
                                                            auction.status
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {auction.current_bid?.toLocaleString() ||
                                                        0}{" "}
                                                    ريال
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {auction.bid_count || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex space-x-2 space-x-reverse">
                                                        <button
                                                            onClick={() =>
                                                                window.open(
                                                                    `/auctions/${auction.id}`,
                                                                    "_blank"
                                                                )
                                                            }
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        {auction.status ===
                                                            "pending_approval" && (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        updateAuctionStatus(
                                                                            auction.id,
                                                                            "active"
                                                                        )
                                                                    }
                                                                    className="text-green-600 hover:text-green-900"
                                                                >
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        updateAuctionStatus(
                                                                            auction.id,
                                                                            "rejected"
                                                                        )
                                                                    }
                                                                    className="text-red-600 hover:text-red-900"
                                                                >
                                                                    <XCircle className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // Approvals Tab
                <div>
                    <div className="mb-6">
                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                placeholder="البحث في المزادات المعلقة..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={fetchPendingAuctions}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                            >
                                بحث
                            </button>
                        </div>
                    </div>

                    {pendingAuctions.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">
                                لا توجد مزادات معلقة للعرض
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                السيارة
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                السعر المطلوب
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                تاريخ الطلب
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                الإجراءات
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {pendingAuctions.map((auction) => (
                                            <tr
                                                key={auction.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {auction.car.make}{" "}
                                                        {auction.car.model}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {auction.car.year}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {auction.starting_bid?.toLocaleString()}{" "}
                                                    ريال
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(
                                                        auction.start_time
                                                    ).toLocaleDateString(
                                                        "ar-SA"
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex space-x-2 space-x-reverse">
                                                        <button
                                                            onClick={() =>
                                                                handleApprove(
                                                                    auction
                                                                )
                                                            }
                                                            disabled={
                                                                processingId ===
                                                                auction.id
                                                            }
                                                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleReject(
                                                                    auction
                                                                )
                                                            }
                                                            disabled={
                                                                processingId ===
                                                                auction.id
                                                            }
                                                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Approval Modal */}
            {showApprovalModal && selectedAuction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            موافقة على المزاد
                        </h3>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="silent_instant">
                                        صامت فوري
                                    </option>
                                    <option value="live">مباشر</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex space-x-3 space-x-reverse">
                            <button
                                onClick={submitApproval}
                                disabled={processingId === selectedAuction.id}
                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                                موافقة
                            </button>
                            <button
                                onClick={() => setShowApprovalModal(false)}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {showRejectionModal && selectedAuction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            رفض المزاد
                        </h3>
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="اكتب سبب رفض المزاد..."
                            />
                        </div>
                        <div className="mt-6 flex space-x-3 space-x-reverse">
                            <button
                                onClick={submitRejection}
                                disabled={processingId === selectedAuction.id}
                                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                                رفض
                            </button>
                            <button
                                onClick={() => setShowRejectionModal(false)}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
