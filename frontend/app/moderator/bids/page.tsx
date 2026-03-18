"use client";

import { useEffect, useState } from "react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import toast from "react-hot-toast";

import { Eye, Trash2, User, Clock, DollarSign } from "lucide-react";

interface Bid {
    id: number;
    amount: number;
    created_at: string;
    auction: {
        id: number;
        title: string;
        car: {
            make: string;
            model: string;
            year: number;
        };
    };
    user: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    };
}

export default function ModeratorBidsPage() {
    const { isModerator, isLoading, isLoggedIn } = useAuth();
    const router = useLoadingRouter();
    
    const [bids, setBids] = useState<Bid[]>([]);
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
            fetchBids();
        }
    }, [isModerator]);

    const fetchBids = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/moderator/bids");
            if (response.data.status === "success") {
                setBids(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching bids:", error);
            toast.error("حدث خطأ أثناء جلب المزايدات");
        } finally {
            setLoading(false);
        }
    };

    const deleteBid = async (bidId: number) => {
        if (!confirm("هل أنت متأكد من حذف هذه المزايدة؟")) {
            return;
        }

        try {
            const response = await api.delete(`/api/moderator/bids/${bidId}`);

            if (response.data.status === "success") {
                toast.success("تم حذف المزايدة بنجاح");
                fetchBids(); // Refresh the list
            }
        } catch (error) {
            console.error("Error deleting bid:", error);
            toast.error("حدث خطأ أثناء حذف المزايدة");
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatCurrency = (amount: number) => {
        return `${amount.toLocaleString()} ر.س`;
    };



    if (!isModerator) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">إدارة المزايدات</h1>

                <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="bg-blue-100 px-4 py-2 rounded-lg">
                        <span className="text-blue-800 font-medium">
                            إجمالي المزايدات: {bids.length}
                        </span>
                    </div>
                </div>
            </div>

            {bids.length === 0 ? (
                <div className="text-center py-12">
                    <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                        لا توجد مزايدات للعرض
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        المزايد
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        المزاد
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        السيارة
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        المبلغ
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        التاريخ
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        الإجراءات
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bids.map((bid) => (
                                    <tr
                                        key={bid.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-gray-600" />
                                                    </div>
                                                </div>
                                                <div className="mr-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {bid.user.first_name}{" "}
                                                        {bid.user.last_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {bid.user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {bid.auction.title}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    ID: {bid.auction.id}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {bid.auction.car.make}{" "}
                                                {bid.auction.car.model}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {bid.auction.car.year}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-lg font-bold text-green-600">
                                                {formatCurrency(bid.amount)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Clock className="h-4 w-4 ml-1" />
                                                {formatDate(bid.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2 space-x-reverse">
                                                <button
                                                    onClick={() =>
                                                        router.push(
                                                            `/auctions/${bid.auction.id}`
                                                        )
                                                    }
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="عرض المزاد"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        deleteBid(bid.id)
                                                    }
                                                    className="text-red-600 hover:text-red-900"
                                                    title="حذف المزايدة"
                                                >
                                                    <Trash2 className="h-4 w-4" />
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
    );
}
