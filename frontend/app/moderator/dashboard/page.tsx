"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ModeratorBroadcastManagement from "@/components/moderator/BroadcastManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ModeratorDashboardPage() {
    const { isModerator, isLoading, isLoggedIn } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("broadcast");

    useEffect(() => {
        // Redirect if not logged in or not a moderator
        if (!isLoading && (!isLoggedIn || !isModerator)) {
            router.push("/auth/login");
        }
    }, [isLoading, isLoggedIn, isModerator, router]);

    if (isLoading) {
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
            <h1 className="text-3xl font-bold mb-8">لوحة تحكم المشرف</h1>

            <Tabs defaultValue="broadcast" className="w-full">
                <TabsList className="mb-8">
                    <TabsTrigger value="broadcast">
                        إدارة البث المباشر
                    </TabsTrigger>
                    <TabsTrigger value="stats">إحصائيات</TabsTrigger>
                </TabsList>

                <TabsContent value="broadcast" className="mt-6">
                    <ModeratorBroadcastManagement />
                </TabsContent>

                <TabsContent value="stats" className="mt-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h2 className="text-2xl font-semibold mb-6">
                            إحصائيات المزادات
                        </h2>
                        <p className="text-gray-500">
                            سيتم إضافة إحصائيات المزادات هنا في تحديث لاحق.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
