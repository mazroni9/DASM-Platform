"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ShieldCheck, Building, Pencil, Trash2, GitFork } from "lucide-react";

type UserGroup = {
    name: string;
    description: string;
    memberCount: number;
    permissionCount: number;
    organizationCount: number;
    tags: string[];
    linkedOrganizations: string[];
};

interface UserGroupCardProps {
    group: UserGroup;
}

export function UserGroupCard({ group }: UserGroupCardProps) {
    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-lg">
                        <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold">{group.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                            {group.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                        </div>
                    </div>
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
                <p className="text-sm text-muted-foreground mb-4">{group.description}</p>
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{group.memberCount} عضو</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                        <span>{group.permissionCount} صلاحية</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span>{group.organizationCount} منظمة</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2">
                <h4 className="text-sm font-semibold">المنظمات المربوطة:</h4>
                <div className="flex flex-wrap gap-2">
                    {group.linkedOrganizations.map((org) => (
                        <Badge key={org} variant="secondary" className="flex items-center gap-1">
                            <GitFork className="w-3 h-3"/>
                            {org}
                        </Badge>
                    ))}
                </div>
            </CardFooter>
        </Card>
    );
}
