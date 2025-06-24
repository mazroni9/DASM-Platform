"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Eye, CheckCircle, XCircle, Clock } from "lucide-react";

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
    const router = useRouter();
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        // Redirect if not logged in or not a moderator
        if (!isLoading && (!isLoggedIn || !isModerator)) {
            router.push("/auth/login");
        }
    }, [isLoading, isLoggedIn, isModerator, router]);

    useEffect(() => {
        if (isModerator) {
            fetchAuctions();
        }
    }, [isModerator]);

    const fetchAuctions = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/moderator/auctions");
            if (response.data.status === "success") {
                setAuctions(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching auctions:", error);
            toast.error("حدث خطأ أثناء جلب المزادات");
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

    const getStatusColor = (status: string) => {
        switch (status) {
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

    if (isLoading || loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!isModerator) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">إدارة المزادات</h1>

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
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                    auction.status
                                                )}`}
                                            >
                                                {getStatusText(auction.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {auction.current_bid
                                                ? `${auction.current_bid.toLocaleString()} ر.س`
                                                : "لا توجد مزايدات"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {auction.bid_count || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2 space-x-reverse">
                                                <button
                                                    onClick={() =>
                                                        router.push(
                                                            `/auctions/${auction.id}`
                                                        )
                                                    }
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="عرض"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>

                                                {auction.status ===
                                                    "pending" && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                updateAuctionStatus(
                                                                    auction.id,
                                                                    "active"
                                                                )
                                                            }
                                                            className="text-green-600 hover:text-green-900"
                                                            title="موافقة"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                updateAuctionStatus(
                                                                    auction.id,
                                                                    "rejected"
                                                                )
                                                            }
                                                            className="text-red-600 hover:text-red-900"
                                                            title="رفض"
                                                        >
                                                            <XCircle className="h-4 w-4" />
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
    );
}
