"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Shield,
  Gavel,
  Wallet,
  Building,
  Radio,
  Users,
  BarChart3,
  Loader2,
  Car,
  UserCog,
  Handshake,
  LayoutGrid,
  Building2,
  Video,
  Youtube,
  FileText,
  Activity,
  DollarSign,
  CreditCard,
  Key,
} from "lucide-react";
import { useEffect, useState } from "react";
import { roleService, GroupedPermissions } from "@/services/roleService";
import { toast } from "react-hot-toast";

// Map module names to Arabic translations
const moduleTranslations: Record<string, string> = {
  permissions: "الصلاحيات",
  users: "المستخدمين",
  staff: "الموظفين",
  exhibitors: "العارضين",
  roles: "الأدوار",
  groups: "المجموعات",
  organizations: "المنظمات",
  cars: "السيارات",
  auctions: "المزادات",
  sessions: "الجلسات",
  live_streams: "البث المباشر",
  youtube_channels: "قنوات يوتيوب",
  auction_logs: "سجلات المزادات",
  activity_logs: "سجلات النشاط",
  commissions: "العمولات",
  subscription_plans: "خطط الاشتراك",
  // Legacy modules (in case they still exist in database)
  wallet: "المحفظة",
  showrooms: "المعارض",
  control_room: "غرفة التحكم",
  system: "النظام",
};

// Map module names to icons
const moduleIcons: Record<string, any> = {
  permissions: Key,
  users: Users,
  staff: UserCog,
  exhibitors: Handshake,
  roles: Shield,
  groups: LayoutGrid,
  organizations: Building2,
  cars: Car,
  auctions: Gavel,
  sessions: Radio,
  live_streams: Video,
  youtube_channels: Youtube,
  auction_logs: FileText,
  activity_logs: Activity,
  commissions: DollarSign,
  subscription_plans: CreditCard,
};

export default function PermissionsPage() {
  const [groupedPermissions, setGroupedPermissions] =
    useState<GroupedPermissions>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        const data = await roleService.getPermissionsTree();
        setGroupedPermissions(data);
      } catch (error) {
        console.error("Error fetching permissions:", error);
        toast.error("حدث خطأ أثناء تحميل الصلاحيات");
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">شجرة الصلاحيات</h1>
      </div>
      <div className="bg-card border rounded-lg p-4">
        <Accordion type="multiple" className="w-full">
          {Object.entries(groupedPermissions).map(
            ([moduleName, permissions]) => {
              const Icon = moduleIcons[moduleName] || Shield;
              return (
                <AccordionItem key={moduleName} value={moduleName}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="font-semibold">
                        {moduleTranslations[moduleName] || moduleName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({permissions.length} صلاحية)
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="divide-y divide-border">
                      {permissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex justify-between items-center p-3 hover:bg-muted/50"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {permission.display_name || permission.name}
                            </span>
                            <span className="text-sm text-muted-foreground font-mono">
                              {permission.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            }
          )}
        </Accordion>
      </div>
    </div>
  );
}
