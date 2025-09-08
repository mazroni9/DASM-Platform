"use client";

import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VenuesDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== UserRole.ADMIN)) {
      router.replace("/auth/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">لوحة المعارض</h1>
            <div className="text-sm text-gray-500">
              إدارة المعارض في النظام
            </div>
          </div>

          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              لوحة المعارض
            </h2>
            <p className="text-gray-500 mb-4">
              هذه الصفحة ستكون متاحة قريباً لإدارة المعارض في النظام
            </p>
            <div className="text-sm text-gray-400">
              قيد التطوير...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
