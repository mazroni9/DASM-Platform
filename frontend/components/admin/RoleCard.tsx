"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCog, Users, ShieldCheck, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

type Role = {
  id?: number;
  name: string;
  display_name: string;
  description: string;
  userCount: number;
  permissionCount: number;
  permissions: string[];
};

interface RoleCardProps {
  type: Role;
  onDelete?: () => void;
}

export function RoleCard({ role, onDelete }: RoleCardProps) {
  return (
    <Card className="flex flex-col" dir="rtl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <UserCog className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-primary">
            {role.display_name}
          </h3>
          <span className="text-sm px-2 py-1 rounded-md border border-muted-foreground/30 bg-muted/50 text-muted-foreground">
            {role.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {role.id && (
            <Link href={`/admin/roles/${role.id}/edit`}>
              <Button variant="ghost" size="icon">
                <Pencil className="w-4 h-4" />
              </Button>
            </Link>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-600"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>{role.userCount} مستخدم</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            <span>{role.permissionCount} صلاحية</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <h4 className="text-sm font-semibold">الصلاحيات المخصصة:</h4>
        <div className="flex flex-wrap gap-2">
          {role.permissions.slice(0, 10).map((permission, index) => (
            <Badge
              key={index}
              className="bg-secondary text-white"
              variant="secondary"
            >
              {permission}
            </Badge>
          ))}
          {role.permissions.length > 10 && (
            <Badge variant="outline">
              +{role.permissions.length - 10} المزيد
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
