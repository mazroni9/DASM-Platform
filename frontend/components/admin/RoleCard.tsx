"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCog, Users, ShieldCheck, Pencil, Trash2 } from "lucide-react";

type Role = {
    name: string;
    description: string;
    userCount: number;
    permissionCount: number;
    permissions: string[];
};

interface RoleCardProps {
    role: Role;
}

export function RoleCard({ role }: RoleCardProps) {
    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-lg">
                        <UserCog className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-bold">{role.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                    </Button>
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
                    {role.permissions.map((permission) => (
                        <Badge key={permission} className="bg-secondary text-white" variant="secondary">{permission}</Badge>
                    ))}
                </div>
            </CardFooter>
        </Card>
    );
}
