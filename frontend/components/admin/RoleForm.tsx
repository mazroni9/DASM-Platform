"use client";

import type { CheckedState } from "@radix-ui/react-checkbox";
import { useEffect, useState } from 'react';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight } from "lucide-react";
import { useRouter } from 'next/navigation';
import { permissionsByModule } from "@/lib/permissions";

const roleSchema = z.object({
  name: z.string().min(1, "اسم الدور مطلوب"),
  slug: z.string().min(1, "المعرّف مطلوب"),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleFormProps {
  mode: 'create' | 'edit';
  initialData?: RoleFormValues;
}

export function RoleForm({ mode, initialData }: RoleFormProps) {
  const router = useRouter();
  const [openModules, setOpenModules] = useState<string[]>([]);
  const closeModule = (moduleName: string) =>
    setOpenModules((prev) => prev.filter((module) => module !== moduleName));
  const openModule = (moduleName: string) =>
    setOpenModules((prev) =>
      prev.includes(moduleName) ? prev : [...prev, moduleName]
    );
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: initialData || { permissions: [] },
  });

  useEffect(() => {
    setOpenModules([]);
  }, [mode, initialData?.slug]);

  const selectedPermissions = watch('permissions') || [];

  const handleModuleSelectAll = (moduleName: string, modulePermissions: string[], checked: CheckedState) => {
    const isChecked = checked === true;
    const currentPermissions = new Set(selectedPermissions);
    if (isChecked) {
      modulePermissions.forEach(p => currentPermissions.add(p));
      closeModule(moduleName);
    } else {
      modulePermissions.forEach(p => currentPermissions.delete(p));
      openModule(moduleName);
    }
    setValue('permissions', Array.from(currentPermissions));
  };

  const onSubmit = (data: RoleFormValues) => {
    console.log(data);
    // Here you would typically handle API submission
    router.push('/admin/roles');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {mode === 'create' ? 'إنشاء دور جديد' : `تعديل الدور: ${initialData?.name}`}
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
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">اسم الدور</label>
            <Input id="name" {...register('name')} placeholder="مثال: مدير المعرض" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-foreground mb-1">(سلاغ) المعرف</label>
            <Input id="slug" {...register('slug')} placeholder="مثال: showroom_manager" />
            {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">الوصف</label>
            <Textarea id="description" {...register('description')} placeholder="وصف مختصر لهذا الدور..." />
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
                {permissionsByModule.map((module) => {
                    const allModulePermissionsSelected = module.permissions.every(p => selectedPermissions.includes(p));
                    const someModulePermissionsSelected = module.permissions.some(p => selectedPermissions.includes(p));
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
                                        onCheckedChange={(checked) => handleModuleSelectAll(module.module, module.permissions, checked)}
                                    />
                                    <span className="font-semibold">{module.module}</span>
                                    <span className="text-xs text-muted-foreground">
                                        (من {module.permissions.length} محددة {selectedPermissions.filter(p => module.permissions.includes(p)).length})
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                                    {module.permissions.map((permission) => (
                                         <Controller
                                            key={permission}
                                            name="permissions"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={permission}
                                                        checked={field.value?.includes(permission)}
                                                        onCheckedChange={(checked) => {
                                                            const newValue = checked
                                                                ? [...(field.value || []), permission]
                                                                : (field.value || []).filter((p: string) => p !== permission);
                                                            field.onChange(newValue);

                                                            // After updating the form state, check if the module should be closed or opened.
                                                            const allSelected = module.permissions.every(p => newValue.includes(p));
                                                            if (allSelected) {
                                                                closeModule(module.module);
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor={permission} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        {permission}
                                                    </label>
                                                </div>
                                            )}
                                        />
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )
                })}
            </Accordion>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>إلغاء</Button>
        <Button type="submit">
          {mode === 'create' ? 'إنشاء الدور' : 'تحديث الدور'}
        </Button>
      </div>
    </form>
  );
}
