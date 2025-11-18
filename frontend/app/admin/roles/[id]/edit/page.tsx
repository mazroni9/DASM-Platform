"use client";

import { RoleForm } from "@/components/admin/RoleForm";

// In a real application, you would fetch this data based on the `params.id`
const getRoleById = async (id: string) => {
  console.log(`Fetching data for role ${id}...`);
  // Dummy data for demonstration
  return {
    name: "مدير المعرض",
    slug: "showroom_manager",
    description: "صلاحيات كاملة لإدارة المعرض والمخزون والتقارير.",
    permissions: ["عرض المزادات", "إنشاء مزاد", "عرض لوحة التحكم", "إدارة المخزون"],
  };
};


export default async function EditRolePage({ params }: { params: { id: string } }) {
    const roleData = await getRoleById(params.id);

    return <RoleForm mode="edit" initialData={roleData} />;
}
