"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Calendar,
  GitFork,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import type {
  OrganizationStatusValue,
  OrganizationTypeValue,
} from "@/lib/organization";
import { cn } from "@/lib/utils";

export type OrganizationCardData = {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  description?: string;
  members: number;
  groups: number;
  createdAt: string;
  status: OrganizationStatusValue;
  type: OrganizationTypeValue;
};

interface OrganizationCardProps {
  organization: OrganizationCardData;
  onEdit?: (organization: OrganizationCardData) => void;
  onDelete?: (organization: OrganizationCardData) => void;
  onManageMembers?: (organization: OrganizationCardData) => void;
}

const statusBadgeStyles: Record<
  OrganizationStatusValue,
  { label: string; className: string }
> = {
  active: {
    label: "نشط",
    className:
      "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300 border-green-500/30",
  },
  inactive: {
    label: "غير نشط",
    className:
      "bg-neutral-500/10 text-neutral-700 dark:bg-neutral-500/20 dark:text-neutral-200 border-neutral-500/30",
  },
  pending: {
    label: "معلق",
    className:
      "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200 border-amber-500/30",
  },
};

export function OrganizationCard({
  organization,
  onEdit,
  onDelete,
  onManageMembers,
}: OrganizationCardProps) {
  const statusMeta = statusBadgeStyles[organization.status];

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-muted p-2">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-lg font-bold">
            {organization.name}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(organization)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-600"
              onClick={() => onDelete(organization)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {onManageMembers && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageMembers(organization)}
            >
              إدارة الأعضاء
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="mb-4 text-sm text-muted-foreground">
          المالك: {organization.ownerName}
        </p>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{organization.members} عضو</span>
          </div>
          <div className="flex items-center gap-2">
            <GitFork className="h-4 w-4 text-muted-foreground" />
            <span>{organization.groups} قروب</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>تم الإنشاء: {organization.createdAt}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-2">
        <Badge className={cn("border", statusMeta.className)}>
          {statusMeta.label}
        </Badge>
        <Badge variant="outline">{organization.type}</Badge>
      </CardFooter>
    </Card>
  );
}
