"use client";

import { Button } from "@/components/ui/button";
import { RoleCard } from "@/components/admin/RoleCard";
import { Plus } from "lucide-react";
import LoadingLink from "@/components/LoadingLink";

const roles = [
    {
        name: "مدير عام المنصة",
        description: "صلاحيات كاملة على كامل النظام",
        userCount: 2,
        permissionCount: 24,
        permissions: ["عرض الصلاحيات", "إنشاء مزاد", "إغلاق مزاد", "تعديل الرصيد", "إشعارات السحب", "قفل حساب", "عرض التحكم"],
    },
    {
        name: "مدير غرفة التحكم",
        description: "إدارة كاملة لغرفة التحكم والمزادات المباشرة",
        userCount: 5,
        permissionCount: 10,
        permissions: ["عرض الصلاحيات", "إنشاء مزاد", "بدء مزاد مباشر", "إغلاق مزاد", "تعديل الرصيد", "تفعيل", "عرض المستخدمين"],
    },
    {
        name: "مشغل غرفة التحكم",
        description: "تشغيل البث المباشر ومتابعة المزادات",
        userCount: 12,
        permissionCount: 4,
        permissions: ["عرض الصلاحيات", "بدء مزاد مباشر", "عرض كل البث", "عرض تقارير المزادات"],
    },
    {
        name: "مالك معرض",
        description: "إدارة المعرض والمزادات",
        userCount: 45,
        permissionCount: 7,
        permissions: ["عرض الصلاحيات", "إنشاء مزاد", "عرض لوحة التحكم", "إدارة المديرين", "دعوة تجار", "عرض الماليات", "عرض المستخدمين"],
    },
];

export default function RolesPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">إدارة الأدوار</h1>
                <LoadingLink href="/admin/roles/create">
                    <Button>
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة دور
                    </Button>
                </LoadingLink>
            </div>

            <div className="flex flex-col gap-6">
                {roles.map((role) => (
                    <RoleCard key={role.name} role={role} />
                ))}
            </div>
        </div>
    );
}
