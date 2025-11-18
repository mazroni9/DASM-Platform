"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Shield, Gavel, Wallet, Building, Radio, Users, BarChart3 } from "lucide-react";

const permissionModules = [
    {
        name: "المزادات",
        icon: Gavel,
        permissionCount: 5,
        permissions: [
            { name: "عرض المزادات", key: "auctions.view", usedIn: 8 },
            { name: "إنشاء مزاد", key: "auctions.create", usedIn: 4 },
            { name: "بدء مزاد مباشر", key: "auctions.start_live", usedIn: 2 },
            { name: "إغلاق مزاد", key: "auctions.force_close", usedIn: 4 },
            { name: "تعديل بعد الإغلاق", key: "auctions.edit_after_close", usedIn: 2 },
        ],
    },
    {
        name: "المحفظة",
        icon: Wallet,
        permissionCount: 4,
        permissions: [
            { name: "عرض الرصيد", key: "wallet.view_balance", usedIn: 8 },
            { name: "تعديل الرصيد", key: "wallet.edit_balance", usedIn: 2 },
            { name: "إشعار السحب", key: "wallet.approve_withdrawal", usedIn: 2 },
            { name: "قفل حساب", key: "wallet.lock_account", usedIn: 1 },
        ],
    },
    {
        name: "المعارض",
        icon: Building,
        permissionCount: 4,
        permissions: [
            { name: "عرض المعارض", key: "showrooms.view", usedIn: 8 },
            // ... add more permissions based on design if needed
        ],
    },
    {
        name: "غرفة التحكم",
        icon: Radio,
        permissionCount: 3,
        permissions: [
            // ... add permissions
        ],
    },
    {
        name: "المستخدمين",
        icon: Users,
        permissionCount: 5,
        permissions: [
            { name: "عرض المستخدمين", key: "users.view", usedIn: 8 },
            { name: "إنشاء مستخدم", key: "users.create", usedIn: 1 },
            { name: "تعديل مستخدم", key: "users.edit", usedIn: 3 },
            { name: "حذف مستخدم", key: "users.delete", usedIn: 1 },
            { name: "تفعيل KYC", key: "users.approve_kyc", usedIn: 2 },
        ],
    },
    {
        name: "التقارير",
        icon: BarChart3,
        permissionCount: 3,
        permissions: [
            { name: "عرض التقارير المالية", key: "reports.view_financial", usedIn: 8 },
            { name: "تصدير التقارير", key: "reports.export", usedIn: 4 },
            { name: "عرض تقارير المزادات", key: "reports.view_auctions", usedIn: 2 },
        ],
    },
];

export default function PermissionsPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">شجرة الصلاحيات</h1>
            </div>
            <div className="bg-card border rounded-lg p-4">
                <Accordion type="multiple" className="w-full">
                    {permissionModules.map((module) => {
                        const Icon = module.icon;
                        return (
                            <AccordionItem key={module.name} value={module.name}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-3">
                                        <Icon className="w-5 h-5 text-primary" />
                                        <span className="font-semibold">{module.name}</span>
                                        <span className="text-xs text-muted-foreground">({module.permissionCount} صلاحية)</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="divide-y divide-border">
                                        {module.permissions.map((permission) => (
                                            <div key={permission.key} className="flex justify-between items-center p-3 hover:bg-muted/50">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{permission.name}</span>
                                                    <span className="text-sm text-muted-foreground font-mono">{permission.key}</span>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    مستخدم في {permission.usedIn} دور
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </div>
        </div>
    );
}
