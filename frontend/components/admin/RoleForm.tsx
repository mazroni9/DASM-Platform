"use client";

import type { CheckedState } from "@radix-ui/react-checkbox";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { roleService, GroupedPermissions } from "@/services/roleService";
import { toast } from "react-hot-toast";

const roleSchema = z.object({
  name: z.string().min(1, "اسم الدور مطلوب"),
  display_name: z.string().min(1, "الاسم المعروض مطلوب"),
  description: z.string().optional(),
  permissions: z.array(z.number()).optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleFormProps {
  mode: "create" | "edit";
  roleId?: string; // Add roleId for edit mode
}

export function RoleForm({ mode, roleId }: RoleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [groupedPermissions, setGroupedPermissions] =
    useState<GroupedPermissions>({});
  const [openModules, setOpenModules] = useState<string[]>([]);

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
    reset,
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { permissions: [] },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch permissions tree
        const permissionsData = await roleService.getPermissionsTree();
        setGroupedPermissions(permissionsData);

        // If edit mode, fetch role details
        if (mode === "edit" && roleId) {
          const roleData = await roleService.getRole(roleId);
          reset({
            name: roleData.name,
            display_name: roleData.display_name || roleData.name,
            description: roleData.description || "",
            permissions: roleData.permissions?.map((p) => p.id) || [],
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("حدث خطأ أثناء تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mode, roleId, reset]);

  const selectedPermissions = watch("permissions") || [];

  const handleModuleSelectAll = (
    moduleName: string,
    modulePermissionIds: number[],
    checked: CheckedState
  ) => {
    const isChecked = checked === true;
    const currentPermissions = new Set(selectedPermissions);
    if (isChecked) {
      modulePermissionIds.forEach((p) => currentPermissions.add(p));
      closeModule(moduleName);
    } else {
      modulePermissionIds.forEach((p) => currentPermissions.delete(p));
      openModule(moduleName);
    }
    setValue("permissions", Array.from(currentPermissions));
  };

  const onSubmit = async (data: RoleFormValues) => {
    try {
      setSubmitting(true);
      const payload = {
        name: data.name,
        display_name: data.display_name,
        description: data.description,
        permission_ids: data.permissions || [],
      };

      if (mode === "create") {
        await roleService.createRole(payload);
        toast.success("تم إنشاء الدور بنجاح");
      } else if (mode === "edit" && roleId) {
        await roleService.updateRole(roleId, payload);
        toast.success("تم تحديث الدور بنجاح");
      }
      router.push("/admin/roles");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("حدث خطأ أثناء حفظ البيانات");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {mode === "create" ? "إنشاء دور جديد" : "تعديل الدور"}
        </h1>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الدور</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground mb-1"
            >
              اسم الدور (بالإنجليزية)
            </label>
            <Input
              id="name"
              {...register("name")}
              placeholder="مثال: gallery_manager"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="display_name"
              className="block text-sm font-medium text-foreground mb-1"
            >
              الاسم المعروض (بالعربية)
            </label>
            <Input
              id="display_name"
              {...register("display_name")}
              placeholder="مثال: مدير المعرض"
            />
            {errors.display_name && (
              <p className="text-red-500 text-xs mt-1">
                {errors.display_name.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-foreground mb-1"
            >
              الوصف
            </label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="وصف مختصر لهذا الدور..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الصلاحيات</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion
            type="multiple"
            className="w-full"
            value={openModules}
            onValueChange={setOpenModules}
          >
            {Object.entries(groupedPermissions).map(
              ([moduleName, permissions]) => {
                const permissionIds = permissions.map((p) => p.id);
                const allModulePermissionsSelected = permissionIds.every((p) =>
                  selectedPermissions.includes(p)
                );
                const someModulePermissionsSelected = permissionIds.some((p) =>
                  selectedPermissions.includes(p)
                );
                const moduleCheckboxState: CheckedState =
                  allModulePermissionsSelected
                    ? true
                    : someModulePermissionsSelected
                    ? "indeterminate"
                    : false;

                return (
                  <AccordionItem key={moduleName} value={moduleName}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={moduleCheckboxState}
                          onCheckedChange={(checked) =>
                            handleModuleSelectAll(
                              moduleName,
                              permissionIds,
                              checked
                            )
                          }
                          onClick={(e) => e.stopPropagation()} // Prevent accordion toggle when clicking checkbox
                        />
                        <span className="font-semibold">{moduleName}</span>
                        <span className="text-xs text-muted-foreground">
                          (من {permissions.length} محددة{" "}
                          {
                            selectedPermissions.filter((p) =>
                              permissionIds.includes(p)
                            ).length
                          }
                          )
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                        {permissions.map((permission) => (
                          <Controller
                            key={permission.id}
                            name="permissions"
                            control={control}
                            render={({ field }) => (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`perm-${permission.id}`}
                                  checked={field.value?.includes(permission.id)}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...(field.value || []), permission.id]
                                      : (field.value || []).filter(
                                          (p: number) => p !== permission.id
                                        );
                                    field.onChange(newValue);

                                    // After updating the form state, check if the module should be closed or opened.
                                    const allSelected = permissionIds.every(
                                      (p) => newValue.includes(p)
                                    );
                                    if (allSelected) {
                                      closeModule(moduleName);
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`perm-${permission.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {permission.display_name || permission.name}
                                </label>
                              </div>
                            )}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              }
            )}
          </Accordion>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          إلغاء
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {mode === "create" ? "إنشاء الدور" : "تحديث الدور"}
        </Button>
      </div>
    </form>
  );
}
