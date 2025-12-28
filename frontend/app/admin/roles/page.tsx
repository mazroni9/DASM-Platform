"use client";

"use client";

import { Button } from "@/components/ui/button";
import { RoleCard } from "@/components/admin/RoleCard";
import { Plus, Loader2 } from "lucide-react";
import LoadingLink from "@/components/LoadingLink";
import { useEffect, useState } from "react";
import { roleService, Role } from "@/services/roleService";
import toast from "react-hot-toast";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await roleService.getRoles();
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("حدث خطأ أثناء تحميل الأدوار");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الدور؟")) return;
    try {
      await roleService.deleteRole(id);
      toast.success("تم حذف الدور بنجاح");
      fetchRoles(); // Refresh list
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error("حدث خطأ أثناء حذف الدور");
    }
  };

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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {roles.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              لا توجد أدوار حالياً.
            </div>
          ) : (
            roles.map((role) => (
              // We need to map the API Role to the props expected by RoleCard
              // Assuming RoleCard expects { name, description, userCount, permissionCount, permissions }
              // If RoleCard is strictly typed, we might need to update it or map the data here.
              // Let's check RoleCard first or just pass what we have and fix RoleCard if needed.
              // For now, I'll map it to match the previous static data structure as close as possible
              <RoleCard
                key={role.id}
                role={{
                  id: role.id,
                  name: role.name,
                  display_name: role.display_name || role.name,
                  description: role.description || "",
                  userCount: role.users_count || 0,
                  permissionCount: role.permissions_count || 0,
                  permissions:
                    role.permissions?.map((p) => p.display_name || p.name) ||
                    [],
                }}
                onDelete={() => handleDelete(role.id!)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
