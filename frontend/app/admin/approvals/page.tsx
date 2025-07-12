"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import ModeratorAuctionApproval from "@/components/moderator/AuctionApproval";
import { ArrowLeft } from "lucide-react";

export default function AdminApprovalsPage() {
    const { isAdmin, isLoading, isLoggedIn } = useAuth();
    const router = useRouter();

    // Simplified auth check - let ProtectedRoute handle the main logic
    useEffect(() => {
        if (!isLoading && (!isLoggedIn || !isAdmin)) {
            // This will be handled by ProtectedRoute
            return;
        }
    }, [isLoading, isLoggedIn, isAdmin]);

    if (isLoading || !isLoggedIn || !isAdmin) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/admin"
                        className="inline-flex items-center space-x-2 rtl:space-x-reverse text-blue-600 hover:text-blue-800 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>العودة إلى لوحة التحكم</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">
                        موافقة المزادات
                    </h1>
                    <p className="text-gray-600 mt-2">
                        مراجعة والموافقة على المزادات المعلقة في النظام
                    </p>
                </div>

                {/* Auction Approval Component */}
                <ModeratorAuctionApproval />
            </div>
        </div>
    );
}
