"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { commissionTierService } from "@/services/commission-tier-service";

export default function CommissionTierForm({ id, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    minPrice: "",
    maxPrice: "",
    commissionAmount: "",
    isProgressive: false,
    isActive: true,
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const d = await commissionTierService.get(id);
        setForm({
          name: d.name || "",
          minPrice: d.minPrice ?? "",
          maxPrice: d.maxPrice ?? "",
          commissionAmount: d.commissionAmount ?? "",
          isProgressive: !!d.isProgressive,
          isActive: !!d.isActive,
        });
      } catch (e) {
        // noop
      }
    };
    load();
  }, [id]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onToggle = (el, key) => {
    setForm((p) => ({ ...p, [key]: el }));
  };

  const validate = () => {
    const e = {};
    if (!form.name) e.name = "اسم الفئة مطلوب";
    if (form.minPrice === "" || isNaN(Number(form.minPrice)))
      e.minPrice = "أقل سعر رقم مطلوب";
    if (form.maxPrice !== "" && Number(form.maxPrice) < Number(form.minPrice))
      e.maxPrice = "أعلى سعر يجب أن يكون أكبر من أقل سعر";
    if (form.commissionAmount === "" || isNaN(Number(form.commissionAmount)))
      e.commissionAmount = "مبلغ العمولة رقم مطلوب";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        minPrice: Number(form.minPrice),
        maxPrice: form.maxPrice === "" ? null : Number(form.maxPrice),
        commissionAmount: Number(form.commissionAmount),
        isProgressive: !!form.isProgressive,
        isActive: !!form.isActive,
      };
      if (id) await commissionTierService.update(id, payload);
      else await commissionTierService.create(payload);
      onSuccess && onSuccess();
    } catch (err) {
      const r = err?.response?.data;
      if (r?.errors) setErrors(r.errors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">اسم الفئة</Label>
        <Input
          id="name"
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="مثال: الفئة الأولى"
        />
        {errors.name && (
          <p className="text-red-600 text-sm mt-1">{errors.name}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="minPrice">أقل سعر</Label>
          <Input
            id="minPrice"
            name="minPrice"
            value={form.minPrice}
            onChange={onChange}
            type="number"
            step="0.01"
          />
          {errors.minPrice && (
            <p className="text-red-600 text-sm mt-1">{errors.minPrice}</p>
          )}
        </div>
        <div>
          <Label htmlFor="maxPrice">أعلى سعر</Label>
          <Input
            id="maxPrice"
            name="maxPrice"
            value={form.maxPrice}
            onChange={onChange}
            type="number"
            step="0.01"
            placeholder="اتركه فارغًا لانهائي"
          />
          {errors.maxPrice && (
            <p className="text-red-600 text-sm mt-1">{errors.maxPrice}</p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="commissionAmount">مبلغ العمولة</Label>
        <Input
          id="commissionAmount"
          name="commissionAmount"
          value={form.commissionAmount}
          onChange={onChange}
          type="number"
          step="0.01"
        />
        {errors.commissionAmount && (
          <p className="text-red-600 text-sm mt-1">{errors.commissionAmount}</p>
        )}
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={form.isProgressive}
            onCheckedChange={(v) => onToggle(!!v, "isProgressive")}
          />
          <span>فئة تدريجية</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={form.isActive}
            onCheckedChange={(v) => onToggle(!!v, "isActive")}
          />
          <span>مفعلة</span>
        </label>
      </div>
      {errors.range && (
        <p className="text-red-600 text-sm mt-1">
          {Array.isArray(errors.range) ? errors.range[0] : errors.range}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "جارٍ الحفظ..." : id ? "تحديث" : "حفظ"}
        </Button>
      </div>
    </form>
  );
}
