"use client";

import type { CheckedState } from "@radix-ui/react-checkbox";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { permissionsByModule } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const colorOptions = [
  { label: "أزرق", value: "#3B82F6" },
  { label: "أخضر", value: "#22C55E" },
  { label: "أحمر", value: "#EF4444" },
  { label: "بنفسجي", value: "#A855F7" },
  { label: "برتقالي", value: "#FB923C" },
  { label: "رمادي", value: "#94A3B8" },
];

const organizationOptions = [
  { id: "org-maz", name: "معرض MAZ للسيارات", type: "معرض" },
  { id: "org-rajhi", name: "معرض الراجحي للسيارات", type: "معرض" },
  { id: "org-workshop", name: "ورشة السلامة المتقدمة", type: "ورشة" },
  { id: "org-dasm", name: "DASM-e Platform", type: "منصة" },
  { id: "org-investors", name: "صندوق المستثمرين الأول", type: "صندوق" },
  { id: "org-mazd", name: "مزادات DASM المميزة", type: "مزاد" },
];

const totalPermissions = permissionsByModule.reduce(
  (total, module) => total + module.permissions.length,
  0
);

const groupSchema = z.object({
  name: z.string().min(1, "اسم القروب مطلوب"),
  slug: z.string().min(1, "المعرّف مطلوب"),
  description: z.string().optional(),
  color: z.string().min(1, "اللون مطلوب"),
  organizations: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
});

export type GroupFormValues = z.infer<typeof groupSchema>;

interface GroupFormProps {
  mode: "create" | "edit";
  initialData?: Partial<GroupFormValues>;
}

export function GroupForm({ mode, initialData }: GroupFormProps) {
  const router = useRouter();
  const [openModules, setOpenModules] = useState<string[]>([]);
  const [orgSearch, setOrgSearch] = useState("");

  const closeModule = (moduleName: string) =>
    setOpenModules((prev) => prev.filter((module) => module !== moduleName));
  const openModule = (moduleName: string) =>
    setOpenModules((prev) =>
      prev.includes(moduleName) ? prev : [...prev, moduleName]
    );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      color: colorOptions[0].value,
      organizations: [],
      permissions: [],
      description: "",
      ...initialData,
    },
  });

  useEffect(() => {
    setOpenModules([]);
  }, [mode, initialData?.slug]);

  const selectedOrganizations = watch("organizations") || [];
  const selectedPermissions = watch("permissions") || [];
  const selectedColor = watch("color");

  const filteredOrganizations = useMemo(() => {
    if (!orgSearch.trim()) return organizationOptions;
    return organizationOptions.filter((org) =>
      org.name.toLowerCase().includes(orgSearch.trim().toLowerCase())
    );
  }, [orgSearch]);

  const handleOrganizationToggle = (
    organizationId: string,
    checked: CheckedState
  ) => {
    const isChecked = checked === true;
    const current = new Set(selectedOrganizations);

    if (isChecked) {
      current.add(organizationId);
    } else {
      current.delete(organizationId);
    }

    setValue("organizations", Array.from(current));
  };

  const handleModuleSelectAll = (
    moduleName: string,
    modulePermissions: string[],
    checked: CheckedState
  ) => {
    const isChecked = checked === true;
    const currentPermissions = new Set(selectedPermissions);

    if (isChecked) {
      modulePermissions.forEach((permission) => currentPermissions.add(permission));
      closeModule(moduleName);
    } else {
      modulePermissions.forEach((permission) => currentPermissions.delete(permission));
      openModule(moduleName);
    }

    setValue("permissions", Array.from(currentPermissions));
  };

  const onSubmit = (data: GroupFormValues) => {
    console.log("Group payload:", data);
    router.push("/admin/groups");
  };

  const pageTitle = mode === "create" ? "إنشاء قروب جديد" : "تعديل القروب";
  const submitLabel = mode === "create" ? "إنشاء القروب" : "تحديث القروب";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/groups")}
            className="flex items-center"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل القروب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
                اسم القروب
              </label>
              <Input id="name" placeholder="مثال: التجار المميزون" {...register("name")} />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="slug" className="mb-1 block text-sm font-medium text-foreground">
                (سلاغ) المعرف
              </label>
              <Input id="slug" placeholder="مثال: premium_traders" {...register("slug")} />
              {errors.slug && (
                <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                الوصف
              </label>
              <Textarea
                id="description"
                placeholder="وصف مختصر للقروب..."
                rows={4}
                {...register("description")}
              />
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium text-foreground">
                اللون المميز
              </span>
              <div className="flex flex-wrap gap-3">
                {colorOptions.map((color) => {
                  const isActive = selectedColor === color.value;
                  return (
                    <button
                      type="button"
                      key={color.value}
                      onClick={() => setValue("color", color.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
                        isActive
                          ? "border-primary ring-2 ring-primary/40"
                          : "border-input hover:border-primary/60"
                      )}
                    >
                      <span
                        className="h-6 w-6 rounded-md border"
                        style={{ backgroundColor: color.value }}
                      />
                      {color.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>المنظمات المرتبطة</CardTitle>
                <p className="text-sm text-muted-foreground">
                  اختر المنظمات التي ينتمي لها هذا القروب
                </p>
              </div>
              <Badge variant="outline">
                {selectedOrganizations.length} مختارة
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="ابحث عن منظمة..."
                value={orgSearch}
                onChange={(event) => setOrgSearch(event.target.value)}
              />
              <div className="grid gap-3 lg:grid-cols-2">
                {filteredOrganizations.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    لا توجد منظمات مطابقة لبحثك.
                  </p>
                )}
                {filteredOrganizations.map((org) => {
                  const isChecked = selectedOrganizations.includes(org.id);
                  return (
                    <label
                      key={org.id}
                      htmlFor={org.id}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border p-4 transition",
                        isChecked
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <div>
                        <p className="font-semibold">{org.name}</p>
                        <p className="text-xs text-muted-foreground">{org.type}</p>
                      </div>
                      <Checkbox
                        id={org.id}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleOrganizationToggle(org.id, checked)}
                      />
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>الصلاحيات</CardTitle>
                <p className="text-sm text-muted-foreground">
                  وزّع الصلاحيات بحسب الوحدات
                </p>
              </div>
              <Badge variant="outline">
                {selectedPermissions.length} من {totalPermissions}
              </Badge>
            </CardHeader>
            <CardContent>
              <Accordion
                type="multiple"
                className="w-full"
                value={openModules}
                onValueChange={setOpenModules}
              >
                {permissionsByModule.map((module) => {
                  const allModulePermissionsSelected = module.permissions.every((permission) =>
                    selectedPermissions.includes(permission)
                  );
                  const someModulePermissionsSelected = module.permissions.some((permission) =>
                    selectedPermissions.includes(permission)
                  );
                  const moduleCheckboxState: CheckedState = allModulePermissionsSelected
                    ? true
                    : someModulePermissionsSelected
                      ? "indeterminate"
                      : false;

                  return (
                    <AccordionItem key={module.module} value={module.module}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={moduleCheckboxState}
                            onCheckedChange={(checked) =>
                              handleModuleSelectAll(module.module, module.permissions, checked)
                            }
                          />
                          <span className="font-semibold">{module.module}</span>
                          <span className="text-xs text-muted-foreground">
                            (من {module.permissions.length} محددة{" "}
                            {selectedPermissions.filter((permission) =>
                              module.permissions.includes(permission)
                            ).length}
                            )
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
                          {module.permissions.map((permission) => (
                            <Controller
                              key={permission}
                              name="permissions"
                              control={control}
                              render={({ field }) => (
                                <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2">
                                  <Checkbox
                                    id={permission}
                                    checked={field.value?.includes(permission)}
                                    onCheckedChange={(checked) => {
                                      const newValue =
                                        checked === true
                                          ? [...(field.value || []), permission]
                                          : (field.value || []).filter(
                                              (value: string) => value !== permission
                                            );
                                      field.onChange(newValue);

                                      const allSelected = module.permissions.every((modulePermission) =>
                                        newValue.includes(modulePermission)
                                      );

                                      if (allSelected) {
                                        closeModule(module.module);
                                      }
                                    }}
                                  />
                                  <span className="text-sm font-medium leading-none">
                                    {permission}
                                  </span>
                                </label>
                              )}
                            />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/groups")}>
          إلغاء
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}

