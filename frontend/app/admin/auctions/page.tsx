"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Car,
    Clock,
    DollarSign,
    Eye,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Loader2,
    Filter,
    CircleCheck,
    ArrowRightLeft,
    Play
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { Button } from "@mui/material";

interface Auction {
    id: number;
    car: {
        make: string;
        model: string;
        year: number;
    };
    starting_bid: number;
    current_bid: number;
    reserve_price: number;
    status: string;
    start_time: string;
    end_time: string;
    control_room_approved: boolean;
    created_at: string;
}

export default function AdminAuctionsPage() {
    const router = useRouter();
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        fetchAuctions();
    }, []);

    const fetchAuctions = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/admin/auctions");
            if (response.data.status === "success") {
                setAuctions(response.data.data.data || response.data.data);
            }
        } catch (error) {
            console.error("Error fetching auctions:", error);
            toast.error("فشل في تحميل المزادات");
        } finally {
            setLoading(false);
        }
    };

    const updateAuctionStatus = async (auctionId: number, status: string) => {
        try {
            const response = await api.put(
                `/api/admin/auctions/${auctionId}/status`,
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

    const updateAuctionType = async (auctionId: number, auction_type: string,approved_for_live:boolean) => {
        try {
            const response = await api.put(
                `/api/admin/auctions/${auctionId}/auction-type`,
                {
                    auction_type,
                    approved_for_live
                }
            );

            if (response.data.status === "success") {
                toast.success(response.data.message);
                fetchAuctions(); // Refresh the list
            }
        } catch (error) {
            console.error("Error updating auction status:", error);
            toast.error(error.response.data.message);
        }
    };

    const approveAuction = async (auctionId: number) => {
        try {
            const response = await api.post(
                `/api/admin/auctions/${auctionId}/approve`
            );
            if (response.data.status === "success") {
                toast.success("تم الموافقة على المزاد");
                fetchAuctions();
            }
        } catch (error) {
            console.error("Error approving auction:", error);
            toast.error("فشل في الموافقة على المزاد");
        }
    };

    const rejectAuction = async (auctionId: number) => {
        try {
            const response = await api.post(
                `/api/admin/auctions/${auctionId}/reject`
            );
            if (response.data.status === "success") {
                toast.success("تم رفض المزاد");
                fetchAuctions();
            }
        } catch (error) {
            console.error("Error rejecting auction:", error);
            toast.error("فشل في رفض المزاد");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "text-green-600 bg-green-100";
            case "scheduled":
                return "text-blue-600 bg-blue-100";
            case "ended":
                return "text-gray-600 bg-gray-100";
            case "cancelled":
                return "text-red-600 bg-red-100";
            case "completed":
                return "text-green-600 bg-gray-100";
            default:
                return "text-yellow-600 bg-yellow-100";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "active":
                return "نشط";
            case "scheduled":
                return "مجدول";
            case "ended":
                return "منتهي";
            case "cancelled":
                return "ملغي";
            case "completed":
                return "مكتمل";
            default:
                return status;
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "غير متوفر";
        const date = new Date(dateString);
        return date.toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const filteredAuctions = auctions.filter((auction) => {
        if (filter === "all") return true;
        return auction.status === filter;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="mr-2">جاري تحميل المزادات...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">
                    إدارة المزادات
                </h1>
            </div>

            {/* Filter Controls */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center gap-4">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                        فلترة حسب الحالة:
                    </span>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    >
                        <option value="all">جميع المزادات</option>
                        <option value="scheduled">مجدولة</option>
                        <option value="active">نشطة</option>
                        <option value="ended">منتهية</option>
                        <option value="cancelled">ملغية</option>
                        <option value="completed">مكتملة</option>
                    </select>
                </div>
            </div>

            {/* Auctions Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    السيارة
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    السعر الحالي
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    الحالة
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    وقت البداية
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    وقت النهاية
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    نوع الحراج
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
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Car className="w-5 h-5 text-gray-400 ml-3" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {auction.car?.make}{" "}
                                                    {auction.car?.model}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {auction.car?.year}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <DollarSign className="w-4 h-4 text-green-500 ml-1" />
                                            <span className="text-sm font-medium text-gray-900">
                                                {auction.current_bid?.toLocaleString() ||
                                                    0}{" "}
                                                ريال
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                auction.status
                                            )}`}
                                        >
                                            {getStatusText(auction.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <Clock className="w-4 h-4 text-gray-400 ml-1" />
                                            {formatDate(auction.start_time)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <Clock className="w-4 h-4 text-gray-400 ml-1" />
                                            {formatDate(auction.end_time)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center">
                                            {auction.auction_type}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/carDetails/${auction.id}`
                                                    )
                                                }
                                                className="text-blue-600 hover:text-blue-900"
                                                title="عرض"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            {auction.status === "live" && auction.auction_type === "live" && !auction.approved_for_live &&(
                                                <button
                                                    onClick={() =>
                                                        updateAuctionType(
                                                            auction.id,
                                                            "live",
                                                            true
                                                        )
                                                    }
                                                    className="text-green-600 hover:text-yellow-900"
                                                    title="الموافقة على البث الأن"
                                                >
                                                    <Play  className="h-4 w-4" />
                                                </button>
                                            )}
                                            {auction.status == "scheduled" && auction.auction_type == "silent_instant" &&(
                                                <button
                                                    onClick={() =>
                                                        updateAuctionType(
                                                            auction.id,
                                                            "live",
                                                            false
                                                        )
                                                    }
                                                    className="text-green-600 hover:text-yellow-900"
                                                    title="إلى الحراج المباشر"
                                                >
                                                    <ArrowRightLeft className="h-4 w-4" />
                                                </button>
                                            )}
                                            {auction.status == "live" && auction.auction_type == "silent_instant" &&(
                                                <button
                                                    onClick={() =>
                                                        updateAuctionType(
                                                            auction.id,
                                                            "live",
                                                            false
                                                        )
                                                    }
                                                    className="text-green-600 hover:text-yellow-900"
                                                    title="إلى الحراج المباشر"
                                                >
                                                    <ArrowRightLeft className="h-4 w-4" />
                                                </button>
                                            )}
                                            {auction.status === "scheduled" && auction.auction_type === "live"  &&(
                                                <button
                                                    onClick={() =>
                                                        updateAuctionType(
                                                            auction.id,
                                                            "silent_instant",
                                                            false
                                                        )
                                                    }
                                                    className="text-green-600 hover:text-yellow-900"
                                                    title="الى الحراج الصامت"
                                                >
                                                    <ArrowRightLeft className="h-4 w-4" />
                                                </button>
                                            )}
                                            {auction.status === "live" && auction.auction_type === "live" &&(
                                                <button
                                                    onClick={() =>
                                                        updateAuctionType(
                                                            auction.id,
                                                            "silent_instant",
                                                            false
                                                        )
                                                    }
                                                    className="text-green-600 hover:text-yellow-900"
                                                    title="الى الحراج الصامت"
                                                >
                                                    <ArrowRightLeft className="h-4 w-4" />
                                                </button>
                                            )}
                                            {auction.status === "scheduled" && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            approveAuction(
                                                                auction.id
                                                            )
                                                        }
                                                        className="text-green-600 hover:text-green-900"
                                                        title="موافقة"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            rejectAuction(
                                                                auction.id
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-900"
                                                        title="رفض"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                            {auction.status === "live" && (
                                                <>
                                                <button
                                                    onClick={() =>
                                                        updateAuctionStatus(
                                                            auction.id,
                                                            "completed",
                                                            false
                                                        )
                                                    }
                                                    className="text-green-600 hover:text-yellow-900"
                                                    title="انهاء المزاد"
                                                >
                                                    <CircleCheck className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        updateAuctionStatus(
                                                            auction.id,
                                                            "ended",
                                                            false
                                                        )
                                                    }
                                                    className="text-yellow-600 hover:text-yellow-900"
                                                    title="إلغاء المزاد"
                                                >
                                                    <AlertTriangle className="h-4 w-4" />
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

                {filteredAuctions.length === 0 && (
                    <div className="text-center py-8">
                        <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">لا توجد مزادات متاحة</p>
                    </div>
                )}
            </div>
        </div>
    );
}
