"use client";

import { useEffect } from "react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import ModeratorBroadcastManagement from "@/components/moderator/BroadcastManagement";
import { FileText, Car, BarChart3 } from "lucide-react";

export default function ModeratorDashboardPage() {
    const { isModerator, isLoading, isLoggedIn } = useAuth();
    const router = useLoadingRouter();
  

    // Simplified auth check - let ProtectedRoute handle the main logic
    useEffect(() => {
        if (!isLoading && (!isLoggedIn || !isModerator)) {
            // This will be handled by ProtectedRoute
            return;
        }
    }, [isLoading, isLoggedIn, isModerator]);

    if (isLoading || !isLoggedIn || !isModerator) {
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        لوحة تحكم المشرف
                    </h1>

                    {/* Quick Navigation */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <Link
                            href="/moderator/auctions"
                            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300"
                        >
                            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                <div className="bg-blue-100 p-3 rounded-lg">
                                    <FileText className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        موافقة المزادات
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        مراجعة والموافقة على المزادات المعلقة
                                    </p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/moderator/cars"
                            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 hover:border-green-300"
                        >
                            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                <div className="bg-green-100 p-3 rounded-lg">
                                    <Car className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        إدارة السيارات
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        مراقبة وإدارة السيارات في النظام
                                    </p>
                                </div>
                            </div>
                        </Link>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                <div className="bg-purple-100 p-3 rounded-lg">
                                    <BarChart3 className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        الإحصائيات
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        قريباً - إحصائيات المزادات والأداء
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Broadcast Management Section */}
                <ModeratorBroadcastManagement />
            </div>
        </div>
    );
}
