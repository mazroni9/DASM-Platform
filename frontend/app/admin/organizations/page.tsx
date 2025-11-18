"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OrganizationCard, type OrganizationCardData } from "@/components/admin/OrganizationCard";
import { Plus } from "lucide-react";
import { OrganizationDialog, type OrganizationFormValues } from "@/components/admin/OrganizationDialog";
import { getOrganizationOwnerName } from "@/lib/organization";

const organizations = [
  {
    id: "org-maz",
    name: "معرض MAZ للسيارات",
    ownerId: "owner-mohammed",
    description: "أكبر معارض السيارات الفاخرة في المنطقة الوسطى.",
    members: 12,
    groups: 3,
    createdAt: "٢٨/٠٨/٢٠٢٣",
    status: "active" as const,
    type: "معرض",
  },
  {
    id: "org-rajhi",
    name: "معرض الراجحي للسيارات",
    ownerId: "owner-khaled",
    description: "معرض متخصص في السيارات الاقتصادية والمعتمدة.",
    members: 8,
    groups: 3,
    createdAt: "٠٣/٠٧/٢٠٢٣",
    status: "active" as const,
    type: "معرض",
  },
  {
    id: "org-workshop",
    name: "ورشة السلامة المتقدمة",
    ownerId: "owner-fahad",
    description: "ورشة صيانة وخدمات ما بعد البيع مع اعتمادات دولية.",
    members: 5,
    groups: 2,
    createdAt: "٢٠/٠٧/٢٠٢٣",
    status: "inactive" as const,
    type: "ورشة",
  },
  {
    id: "org-platform",
    name: "DASM-e Platform",
    ownerId: "owner-sarah",
    description: "المنصة المركزية لإدارة المزادات الرقمية.",
    members: 25,
    groups: 2,
    createdAt: "١٧/٠٥/٢٠٢٣",
    status: "pending" as const,
    type: "منصة",
  },
  {
    id: "org-fund",
    name: "صندوق المستثمرين الأول",
    ownerId: "owner-noura",
    description: "صندوق استثماري يركز على فرص المركبات المميزة.",
    members: 15,
    groups: 1,
    createdAt: "٢٠/٠٨/٢٠٢٣",
    status: "active" as const,
    type: "صندوق استثماري",
  },
] satisfies Omit<OrganizationCardData, "ownerName">[];

export default function OrganizationsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [dialogInitialData, setDialogInitialData] = useState<Partial<OrganizationFormValues>>();

  const decoratedOrganizations: OrganizationCardData[] = organizations.map((org) => ({
    ...org,
    ownerName: getOrganizationOwnerName(org.ownerId) || "غير محدد",
  }));

  const handleCreateClick = () => {
    setDialogMode("create");
    setDialogInitialData(undefined);
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
    setDialogOpen(true);
  };

  const handleDialogSubmit = async (values: OrganizationFormValues) => {
    console.log("Organization payload:", values);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة المنظمات</h1>
        <Button onClick={handleCreateClick}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة منظمة
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {decoratedOrganizations.map((org) => (
          <OrganizationCard key={org.id} organization={org} onEdit={handleEditOrganization} />
        ))}
      </div>

      <OrganizationDialog
        mode={dialogMode}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={dialogInitialData}
        onSubmit={handleDialogSubmit}
      />
    </div>
  );
}
