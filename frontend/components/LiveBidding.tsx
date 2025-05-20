/**
 * 🧩 مكون المزايدات المباشرة
 * 📁 المسار: components/LiveBidding.tsx
 *
 * ✅ الوظيفة:
 * - عرض آخر المزايدات بشكل متزامن
 * - تمييز المزايدات من الموقع والإنترنت بألوان مختلفة
 * - عرض معلومات المزايدة (المبلغ، الوقت، المصدر)
 */

"use client";

import React, { useEffect, useState } from "react";
import { formatMoney } from "@/lib/utils";
import { User, Clock, Users } from "lucide-react";

interface Bid {
    id: string;
    amount: number;
    timestamp: string;
    bidder_name: string;
    source: "online" | "onsite";
    is_winning: boolean;
}

interface LiveBiddingProps {
    itemId: number;
    currentPrice: number;
}

export default function LiveBidding({
    itemId,
    currentPrice,
}: LiveBiddingProps) {
    const [bids, setBids] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(true);

    // بيانات تجريبية للعرض - سيتم استبدالها بالبيانات الفعلية من API
    useEffect(() => {
        // محاكاة جلب البيانات من الخادم
        const mockBids: Bid[] = [
            {
                id: "1",
                amount: currentPrice,
                timestamp: new Date(Date.now() - 60000).toISOString(),
                bidder_name: "محمد س.",
                source: "onsite",
                is_winning: false,
            },
            {
                id: "2",
                amount: currentPrice - 5000,
                timestamp: new Date(Date.now() - 90000).toISOString(),
                bidder_name: "أحمد م.",
                source: "online",
                is_winning: false,
            },
            {
                id: "3",
                amount: currentPrice - 7000,
                timestamp: new Date(Date.now() - 120000).toISOString(),
                bidder_name: "خالد ع.",
                source: "onsite",
                is_winning: false,
            },
            {
                id: "4",
                amount: currentPrice - 10000,
                timestamp: new Date(Date.now() - 180000).toISOString(),
                bidder_name: "فهد س.",
                source: "online",
                is_winning: false,
            },
        ];

        setBids(mockBids);
        setLoading(false);

        // في المستقبل، سنستخدم WebSockets للاتصال المباشر
        // const ws = new WebSocket(`wss://api.example.com/bids/${itemId}`);
        // ws.onmessage = (event) => {
        //   const newBid = JSON.parse(event.data);
        //   setBids(prevBids => [newBid, ...prevBids.slice(0, 9)]);
        // };
        // return () => ws.close();
    }, [itemId, currentPrice]);

    // تنسيق التاريخ ليظهر كم مضى من الوقت
    const formatTimeAgo = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor(
            (now.getTime() - date.getTime()) / 1000
        );

        if (diffInSeconds < 60) {
            return `منذ ${diffInSeconds} ثانية`;
        } else if (diffInSeconds < 3600) {
            return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
        } else {
            return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">المزايدات المباشرة</h3>
                    <div className="flex items-center space-x-2 space-x-reverse rtl:space-x-reverse">
                        <div className="flex items-center">
                            <div className="h-3 w-3 bg-green-400 rounded-full mr-1.5 animate-pulse"></div>
                            <span className="text-sm">مباشر</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-2">
                <div className="flex mb-2 text-xs text-gray-500 justify-between px-2">
                    <div className="flex rtl:space-x-reverse space-x-2">
                        <div className="bg-green-100 text-green-700 rounded-full px-2 py-0.5 flex items-center">
                            <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                            <span>في الموقع</span>
                        </div>
                        <div className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 flex items-center">
                            <div className="h-2 w-2 bg-blue-500 rounded-full mr-1"></div>
                            <span>عبر الإنترنت</span>
                        </div>
                    </div>
                    <div>
                        <span>آخر 10 مزايدات</span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center p-6">
                        <div className="animate-spin h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto p-1">
                        {bids.map((bid) => (
                            <div
                                key={bid.id}
                                className={`flex items-center justify-between rounded-lg p-2.5 ${
                                    bid.source === "online"
                                        ? "bg-blue-50 border-l-4 border-blue-400"
                                        : "bg-green-50 border-l-4 border-green-400"
                                } ${
                                    bid.is_winning
                                        ? "ring-2 ring-yellow-400"
                                        : ""
                                }`}
                            >
                                <div className="flex items-center">
                                    <div
                                        className={`
                    rounded-full p-1.5 flex-shrink-0 mr-2
                    ${
                        bid.source === "online"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-green-100 text-green-600"
                    }
                  `}
                                    >
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {bid.bidder_name}
                                        </p>
                                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                            <Clock size={12} className="mr-1" />
                                            <span>
                                                {formatTimeAgo(bid.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div
                                        className={`text-lg font-bold ${
                                            bid.is_winning
                                                ? "text-yellow-600"
                                                : "text-gray-800"
                                        }`}
                                    >
                                        {formatMoney(bid.amount)} ريال
                                    </div>
                                    {bid.is_winning && (
                                        <div className="text-xs text-yellow-600 font-medium">
                                            المزايدة الفائزة
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-3 p-2 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center text-gray-500 text-sm">
                            <Users size={16} className="mr-1.5" />
                            <span>
                                المزايدون النشطون:{" "}
                                <span className="font-medium">18</span>
                            </span>
                        </div>
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                            عرض جميع المزايدات
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
