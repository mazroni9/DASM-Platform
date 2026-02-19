"use client";

import ModeratorBroadcastManagement from "@/components/moderator/BroadcastManagement";
import { Video, Radio } from "lucide-react";

export default function ModeratorDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المشرف</h1>
          <p className="text-gray-600 mt-2">
            إدارة البث المباشر وإضافة المزايدات الخارجية وربط السيارة الحالية أثناء البث.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-lg border border-gray-200 flex items-start gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <Video className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">إدارة البث</h3>
              <p className="text-sm text-gray-600">بدء/إيقاف البث ومتابعة حالة البث الحالي.</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Radio className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">السيارة الحالية</h3>
              <p className="text-sm text-gray-600">تغيير السيارة المعروضة أثناء البث من المزادات النشطة.</p>
            </div>
          </div>
        </div>

        <ModeratorBroadcastManagement />
      </div>
    </div>
  );
}

