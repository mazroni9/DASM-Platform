"use client";

import { RoleForm } from "@/components/admin/RoleForm";




export default async function EditRolePage({ params }: { params: { id: string } }) {

    return <RoleForm mode="edit" roleId={params.id} />;
}
