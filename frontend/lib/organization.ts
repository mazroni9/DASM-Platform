export const ORGANIZATION_TYPE_VALUES = [
  "showroom",
  "workshop",
  "platform",
  "investment_fund",
] as const;
export type OrganizationTypeValue = (typeof ORGANIZATION_TYPE_VALUES)[number];

export const organizationTypeOptions: {
  label: string;
  value: OrganizationTypeValue;
}[] = [
  { label: "معرض", value: "showroom" },
  { label: "ورشة", value: "workshop" },
  { label: "المنصة", value: "platform" },
  { label: "صندوق استثماري", value: "investment_fund" },
];

export const ORGANIZATION_STATUS_VALUES = [
  "active",
  "inactive",
  "pending",
] as const;
export type OrganizationStatusValue =
  (typeof ORGANIZATION_STATUS_VALUES)[number];

export const organizationStatusOptions: {
  label: string;
  value: OrganizationStatusValue;
}[] = [
  { label: "نشط", value: "active" },
  { label: "غير نشط", value: "inactive" },
  { label: "معلق", value: "pending" },
];
