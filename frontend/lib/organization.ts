export const ORGANIZATION_TYPE_VALUES = ["معرض", "ورشة", "منصة", "صندوق استثماري"] as const;
export type OrganizationTypeValue = (typeof ORGANIZATION_TYPE_VALUES)[number];

export const organizationTypeOptions: { label: string; value: OrganizationTypeValue }[] =
  ORGANIZATION_TYPE_VALUES.map((value) => ({ label: value, value }));

export const ORGANIZATION_STATUS_VALUES = ["active", "inactive", "pending"] as const;
export type OrganizationStatusValue = (typeof ORGANIZATION_STATUS_VALUES)[number];

export const organizationStatusOptions: { label: string; value: OrganizationStatusValue }[] = [
  { label: "نشط", value: "active" },
  { label: "غير نشط", value: "inactive" },
  { label: "معلق", value: "pending" },
];

export type OrganizationOwner = {
  id: string;
  name: string;
};

export const organizationOwnerOptions: OrganizationOwner[] = [
  { id: "owner-ahmed", name: "أحمد محمد السعيد" },
  { id: "owner-sarah", name: "سارة عبدالله" },
  { id: "owner-mohammed", name: "محمد العتيبي" },
  { id: "owner-fahad", name: "فهد الدوسري" },
  { id: "owner-noura", name: "نورة الشمري" },
  { id: "owner-khaled", name: "خالد بن سعود" },
  { id: "owner-laila", name: "ليلى المطيري" },
];

export const getOrganizationOwnerName = (ownerId?: string) => {
  if (!ownerId) return "";
  return organizationOwnerOptions.find((owner) => owner.id === ownerId)?.name ?? "";
};

