"use client";

import { GroupForm } from "@/components/admin/GroupForm";

// Placeholder data fetcher; replace with real API integration.
const getGroupById = async (id: string) => {
  console.log(`Fetching data for group ${id}...`);
  return {
    name: "التجار المميزون",
    slug: "premium_traders",
    description: "مجموعة تضم التجار ذوي الأولوية مع صلاحيات إضافية.",
    color: "#3B82F6",
    organizations: ["org-maz", "org-dasm"],
    permissions: ["عرض المزادات", "إنشاء مزاد", "عرض لوحة التحكم", "إدارة المخزون"],
  };
};

export default async function EditGroupPage({ params }: { params: { id: string } }) {
  const groupData = await getGroupById(params.id);

  return <GroupForm mode="edit" initialData={groupData} />;
}

