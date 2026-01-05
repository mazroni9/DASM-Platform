"use client";

import { Button } from "@/components/ui/button";
import { UserGroupCard } from "@/components/admin/UserGroupCard";
import { Plus } from "lucide-react";
import LoadingLink from "@/components/LoadingLink";

const userGroups = [
    {
        name: "التجار المميزون",
        description: "مجموعة التجار ذوي الأولوية والامتيازات الخاصة",
        memberCount: 43,
        permissionCount: 4,
        organizationCount: 2,
        tags: ["premium_traders", "premium", "traders", "vip"],
        linkedOrganizations: ["معرضي MAZ للسيارات", "عرضي الراحجي للسيارات"],
    },
    {
        name: "فريق غرفة التحكم",
        description: "جميع أعضاء فريق غرفة التحكم والبث المباشر",
        memberCount: 18,
        permissionCount: 5,
        organizationCount: 1,
        tags: ["control_room_team", "live", "control-room", "staff"],
        linkedOrganizations: ["DASM-e Platform"],
    },
    {
        name: "مدراء المعارض",
        description: "جميع مدراء المعارض المسجلة في المنصة",
        memberCount: 67,
        permissionCount: 5,
        organizationCount: 3,
        tags: ["showroom_managers", "showroom", "managers"],
        linkedOrganizations: ["معرضي MAZ للسيارات", "عرضي الراحجي للسيارات", "ورشة السلامة المتقدمة"],
    },
];

export default function UserGroupsPage() {
    return (
        <div className="space-y-6 p-2">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">إدارة القروبات</h1>
                <LoadingLink href="/admin/groups/create">
                    <Button>
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة قروب
                    </Button>
                </LoadingLink>
            </div>

            <div className="flex flex-col gap-6">
                {userGroups.map((group) => (
                    <UserGroupCard key={group.name} group={group} />
                ))}
            </div>
        </div>
    );
}
