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
import api from '@/lib/axios';

import React, { useEffect, useState } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
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
    data: [];
}

export default function LiveBidding({data}: LiveBiddingProps) {
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

         // Fetch user profile data
  useEffect(() => {
        function fetchBids() {
          try {
    const mockBids = [];
            if(data.bids.length > 0){
                    data.bids.filter((bid,index)=>{
                    mockBids.push(
                        {
                            id: index,
                            amount: bid.bid_amount,
                            timestamp: new Date(new Date(bid.created_at).getTime()).toISOString(),
                            bidder_name: bid.bidder_name,
                            source: "onsite",
                            is_winning: false,
                        }
                    );
                });
            }
            
               setBids(mockBids.sort((a,b)=> b.id - a.id).slice(0,10));
          } catch (error) {
               console.error('فشل تحميل بيانات  ', error);
              setBids([]); // مصفوفة فارغة في حالة الفشل
              setError("تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.");
              setLoading(false);
          } finally {
              setLoading(false);
          }
      }
      fetchBids();
  }, [data]);

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
                <div>
                          
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
                                        {formatCurrency (bid.amount)} 
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
                                المزيادات:{" "}
                                <span className="font-medium">{bids.length}</span>
                            </span>
                        </div>

                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}
