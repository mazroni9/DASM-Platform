"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ORGANIZATION_STATUS_VALUES,
  ORGANIZATION_TYPE_VALUES,
  getOrganizationOwnerName,
  organizationOwnerOptions,
  organizationStatusOptions,
  organizationTypeOptions,
  type OrganizationStatusValue,
  type OrganizationTypeValue,
} from "@/lib/organization";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const organizationSchema = z.object({
  name: z.string().min(1, "اسم المنظمة مطلوب"),
  description: z.string().optional(),
  type: z.enum(ORGANIZATION_TYPE_VALUES),
  owner: z.string().min(1, "يجب اختيار مالك"),
  status: z.enum(ORGANIZATION_STATUS_VALUES),
});

export type OrganizationFormValues = z.infer<typeof organizationSchema>;

interface OrganizationDialogProps {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<OrganizationFormValues>;
  onSubmit?: (values: OrganizationFormValues) => Promise<void> | void;
}

export function OrganizationDialog({
  mode,
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: OrganizationDialogProps) {
  const [ownerSearch, setOwnerSearch] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      description: "",
      type: organizationTypeOptions[0].value,
      owner: "",
      status: organizationStatusOptions[0].value,
      ...initialData,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initialData?.name ?? "",
        description: initialData?.description ?? "",
        type: (initialData?.type as OrganizationTypeValue) ?? organizationTypeOptions[0].value,
        owner: initialData?.owner ?? "",
        status: (initialData?.status as OrganizationStatusValue) ?? organizationStatusOptions[0].value,
      });
      setOwnerSearch("");
    } else {
      setOwnerSearch("");
    }
  }, [open, initialData, reset]);

  const selectedOwnerId = watch("owner");
  const selectedOwnerName = getOrganizationOwnerName(selectedOwnerId);
  const selectedType = watch("type") as OrganizationTypeValue;
  const selectedStatus = watch("status") as OrganizationStatusValue;

  const filteredOwners = useMemo(() => {
    if (!ownerSearch.trim()) return organizationOwnerOptions;
    return organizationOwnerOptions.filter((owner) =>
      owner.name.toLowerCase().includes(ownerSearch.trim().toLowerCase())
    );
  }, [ownerSearch]);

  const dialogTitle = mode === "create" ? "إنشاء منظمة جديدة" : "تعديل المنظمة";
  const submitLabel = mode === "create" ? "إنشاء المنظمة" : "حفظ التعديلات";

  const handleFormSubmit = async (values: OrganizationFormValues) => {
    await onSubmit?.(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{dialogTitle}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            أدخل بيانات المنظمة الأساسية لتتمكن من إدارتها وربطها بالقروبات لاحقًا.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <Card className="border border-border">
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <label htmlFor="organization-name" className="text-sm font-medium text-foreground">
                  اسم المنظمة
                </label>
                <Input
                  id="organization-name"
                  placeholder="مثال: معرض MAZ للسيارات"
                  {...register("name")}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="organization-description" className="text-sm font-medium text-foreground">
                  وصف مختصر
                </label>
                <Textarea
                  id="organization-description"
                  rows={3}
                  placeholder="أضف وصفًا موجزًا يساعد الفريق على فهم طبيعة هذه المنظمة."
                  {...register("description")}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">نوع المنظمة</label>
                  <Select
                    value={selectedType}
                    onValueChange={(value) =>
                      setValue("type", value as OrganizationTypeValue, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع المنظمة" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationTypeOptions.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">الحالة</label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) =>
                      setValue("status", value as OrganizationStatusValue, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر حالة المنظمة" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationStatusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">المالك</label>
                <Select
                  value={selectedOwnerId}
                  onValueChange={(value) => {
                    setValue("owner", value, { shouldValidate: true });
                    setOwnerSearch("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder="اختر المالك"
                      aria-label={selectedOwnerName || "اختر المالك"}
                    />
                  </SelectTrigger>
                  <SelectContent className="p-0">
                    <div className="sticky top-0 z-10 border-b border-border bg-card p-2">
                      <Input
                        autoFocus
                        placeholder="ابحث باسم المالك..."
                        value={ownerSearch}
                        onChange={(event) => setOwnerSearch(event.target.value)}
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredOwners.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                          لا توجد نتائج مطابقة لبحثك.
                        </p>
                      ) : (
                        filteredOwners.map((owner) => (
                          <SelectItem key={owner.id} value={owner.id}>
                            {owner.name}
                          </SelectItem>
                        ))
                      )}
                    </div>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {selectedOwnerName ? `تم اختيار: ${selectedOwnerName}` : "لم يتم اختيار مالك بعد."}
                </p>
                {errors.owner && <p className="text-xs text-red-500">{errors.owner.message}</p>}
              </div>
            </CardContent>
          </Card>
          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

