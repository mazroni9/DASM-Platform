"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  OrganizationCard,
  type OrganizationCardData,
} from "@/components/admin/OrganizationCard";
import { Plus } from "lucide-react";
import {
  OrganizationDialog,
  type OrganizationFormValues,
} from "@/components/admin/OrganizationDialog";
import { ManageOrganizationMembersDialog } from "@/components/admin/ManageOrganizationMembersDialog";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { withPermission } from "@/components/auth/PermissionGuard";
import { usePermission } from "@/hooks/usePermission";

function OrganizationsPage() {
  const { can } = usePermission();
  const [organizations, setOrganizations] = useState<OrganizationCardData[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [dialogInitialData, setDialogInitialData] =
    useState<Partial<OrganizationFormValues>>();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  // Member management dialog state
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedOrgForMembers, setSelectedOrgForMembers] =
    useState<OrganizationCardData | null>(null);

  const fetchOrganizations = async () => {
    try {
      const response = await api.get("api/admin/organizations");
      const data = response.data.data || response.data;

      const mappedData: OrganizationCardData[] = data.map((org: any) => ({
        id: org.id.toString(),
        name: org.name,
        ownerId: org.owner_id?.toString() || "",
        ownerName: org.owner
          ? `${org.owner.first_name} ${org.owner.last_name}`
          : "غير محدد",
        description: org.description,
        members: org.members_count || 0,
        groups: 0,
        createdAt: new Date(org.created_at).toLocaleDateString("ar-SA"),
        status: org.status,
        type: org.type,
      }));

      setOrganizations(mappedData);
    } catch (error) {
      console.error("Failed to fetch organizations", error);
      toast.error("فشل في جلب المنظمات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreateClick = () => {
    setDialogMode("create");
    setDialogInitialData(undefined);
    setSelectedOrgId(null);
    setDialogOpen(true);
  };

  const handleEditOrganization = (organization: OrganizationCardData) => {
    setDialogMode("edit");
    setDialogInitialData({
      name: organization.name,
      type: organization.type,
      owner: organization.ownerId,
      status: organization.status,
      description: organization.description ?? "",
    });
    setSelectedOrgId(organization.id);
    setDialogOpen(true);
  };

  const handleDeleteOrganization = async (
    organization: OrganizationCardData
  ) => {
    if (confirm("هل أنت متأكد من حذف هذه المنظمة؟")) {
      try {
        await api.delete(`api/admin/organizations/${organization.id}`);
        toast.success("تم حذف المنظمة بنجاح");
        fetchOrganizations();
      } catch (error) {
        console.error("Failed to delete organization", error);
        toast.error("فشل في حذف المنظمة");
      }
    }
  };

  const handleManageMembers = (organization: OrganizationCardData) => {
    setSelectedOrgForMembers(organization);
    setMemberDialogOpen(true);
  };

  const handleDialogSubmit = async (values: OrganizationFormValues) => {
    try {
      const payload = {
        ...values,
        owner_id: values.owner, // Map owner to owner_id for API
      };

      if (dialogMode === "create") {
        await api.post("api/admin/organizations", payload);
        toast.success("تم إنشاء المنظمة بنجاح");
      } else {
        await api.put(`api/admin/organizations/${selectedOrgId}`, payload);
        toast.success("تم تحديث المنظمة بنجاح");
      }
      fetchOrganizations();
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save organization", error);
      toast.error("فشل في حفظ المنظمة");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة المنظمات</h1>
        {can("organizations.create") && (
          <Button onClick={handleCreateClick}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة منظمة
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10">جاري التحميل...</div>
      ) : (
        <div className="flex flex-col gap-4">
          {organizations.length > 0 ? (
            organizations.map((org) => (
              <OrganizationCard
                key={org.id}
                organization={org}
                onEdit={
                  can("organizations.update")
                    ? handleEditOrganization
                    : undefined
                }
                onDelete={
                  can("organizations.delete")
                    ? handleDeleteOrganization
                    : undefined
                }
                onManageMembers={
                  can("organizations.update") ? handleManageMembers : undefined
                }
              />
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              لا توجد منظمات حالياً
            </div>
          )}
        </div>
      )}

      <OrganizationDialog
        mode={dialogMode}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={dialogInitialData}
        onSubmit={handleDialogSubmit}
      />

      <ManageOrganizationMembersDialog
        open={memberDialogOpen}
        onOpenChange={(open) => {
          setMemberDialogOpen(open);
          if (!open) {
            setSelectedOrgForMembers(null);
            fetchOrganizations(); // Refresh to update member counts
          }
        }}
        organizationId={selectedOrgForMembers?.id || null}
        organizationName={selectedOrgForMembers?.name || ""}
      />
    </div>
  );
}

export default withPermission(OrganizationsPage, "organizations.view");
