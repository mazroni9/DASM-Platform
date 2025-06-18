"use client";

import React from "react";
import { Play, Pause, Square, SkipForward } from "lucide-react";

interface AuctionControlsProps {
    auctionStatus: "active" | "paused" | "ended";
    onNextCar: () => void;
    onEndAuction: () => void;
    onTogglePause: () => void;
}

export default function AuctionControls({
    auctionStatus,
    onNextCar,
    onEndAuction,
    onTogglePause,
}: AuctionControlsProps) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
                التحكم في المزاد
            </h2>

            <div className="space-y-3">
                <button
                    onClick={onTogglePause}
                    disabled={auctionStatus === "ended"}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                        auctionStatus === "active"
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            : auctionStatus === "paused"
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 cursor-not-allowed"
                    }`}
                >
                    {auctionStatus === "active" ? (
                        <>
                            <Pause className="h-4 w-4 mr-2" />
                            إيقاف مؤقت
                        </>
                    ) : auctionStatus === "paused" ? (
                        <>
                            <Play className="h-4 w-4 mr-2" />
                            استئناف
                        </>
                    ) : (
                        <>
                            <Square className="h-4 w-4 mr-2" />
                            منتهي
                        </>
                    )}
                </button>

                <button
                    onClick={onNextCar}
                    disabled={auctionStatus === "ended"}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                        auctionStatus !== "ended"
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : "bg-gray-100 text-gray-500 cursor-not-allowed"
                    }`}
                >
                    <SkipForward className="h-4 w-4 mr-2" />
                    السيارة التالية
                </button>

                <button
                    onClick={onEndAuction}
                    disabled={auctionStatus === "ended"}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                        auctionStatus !== "ended"
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-gray-100 text-gray-500 cursor-not-allowed"
                    }`}
                >
                    <Square className="h-4 w-4 mr-2" />
                    إنهاء المزاد
                </button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">حالة المزاد:</span>
                    <span
                        className={`font-medium ${
                            auctionStatus === "active"
                                ? "text-green-600"
                                : auctionStatus === "paused"
                                ? "text-yellow-600"
                                : "text-red-600"
                        }`}
                    >
                        {auctionStatus === "active"
                            ? "نشط"
                            : auctionStatus === "paused"
                            ? "متوقف"
                            : "منتهي"}
                    </span>
                </div>
            </div>
        </div>
    );
}
