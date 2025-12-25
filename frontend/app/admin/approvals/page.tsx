"use client";

import { useEffect } from "react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import LoadingLink from "@/components/LoadingLink";
import { useAuth } from "@/hooks/useAuth";
import ModeratorAuctionApproval from "@/components/moderator/AuctionApproval";
import { ArrowLeft } from "lucide-react";

export default function AdminApprovalsPage() {
    const { isAdmin, isLoading, isLoggedIn } = useAuth();
    const router = useLoadingRouter();
  

    // Simplified auth check - let ProtectedRoute handle the main logic
    useEffect(() => {
        if (!isLoading && (!isLoggedIn || !isAdmin)) {
            // This will be handled by ProtectedRoute
            return;
        }
    }, [isLoading, isLoggedIn, isAdmin]);



    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8">
                    <LoadingLink
                        href="/admin"
                        className="inline-flex items-center space-x-2 rtl:space-x-reverse text-blue-600 hover:text-blue-800 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>العودة إلى لوحة التحكم</span>
                    </LoadingLink>
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
