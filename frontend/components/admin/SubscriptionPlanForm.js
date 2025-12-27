"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { subscriptionPlanService } from "@/services/subscription-plan-service";

export default function SubscriptionPlanForm({ id, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    userType: "",
    price: "",
    durationMonths: "",
    isActive: true,
    orderIndex: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const userTypes = {
    user: 'مستخدم',
    dealer: 'تاجر'
  };

  const durationOptions = [
    { value: 1, label: 'شهر واحد' },
    { value: 2, label: 'شهرين' },
    { value: 3, label: '3 أشهر' },
    { value: 4, label: '4 أشهر' },
    { value: 5, label: '5 أشهر' },
    { value: 6, label: '6 أشهر' },
    { value: 7, label: '7 أشهر' },
    { value: 8, label: '8 أشهر' },
    { value: 9, label: '9 أشهر' },
    { value: 10, label: '10 أشهر' },
    { value: 11, label: '11 شهراً' },
    { value: 12, label: '12 شهراً' },
  ];

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const d = await subscriptionPlanService.get(id);
        setForm({
          name: d.name || "",
          description: d.description || "",
          userType: d.userType || "",
          price: d.price ?? "",
          durationMonths: d.durationMonths ?? "",
          isActive: !!d.isActive,
          orderIndex: d.orderIndex ?? "",
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
    if (!form.name) e.name = "اسم الخطة مطلوب";
    if (!form.userType) e.userType = "نوع المستخدم مطلوب";
    if (form.price === "" || isNaN(Number(form.price))) e.price = "السعر رقم مطلوب";
    if (Number(form.price) < 0) e.price = "السعر لا يمكن أن يكون سالباً";
    if (!form.durationMonths || isNaN(Number(form.durationMonths))) e.durationMonths = "مدة الاشتراك مطلوبة";
    if (Number(form.durationMonths) < 1 || Number(form.durationMonths) > 12) e.durationMonths = "مدة الاشتراك يجب أن تكون بين 1 و 12 شهراً";
    if (form.orderIndex !== "" && (isNaN(Number(form.orderIndex)) || Number(form.orderIndex) < 0)) e.orderIndex = "ترتيب العرض يجب أن يكون رقماً صحيحاً غير سالب";
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
        description: form.description || null,
        userType: form.userType,
        price: Number(form.price),
        durationMonths: Number(form.durationMonths),
        isActive: !!form.isActive,
        orderIndex: form.orderIndex === "" ? 0 : Number(form.orderIndex),
      };
      if (id) await subscriptionPlanService.update(id, payload);
      else await subscriptionPlanService.create(payload);
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
        <Label htmlFor="name">اسم الخطة</Label>
        <Input id="name" name="name" value={form.name} onChange={onChange} placeholder="مثال: باقة المزايد الأساسية" />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
      </div>
      
      <div>
        <Label htmlFor="description">الوصف</Label>
        <Textarea 
          id="description" 
          name="description" 
          value={form.description} 
          onChange={onChange} 
          placeholder="وصف الخطة (اختياري)"
          rows={3}
        />
        {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="userType">نوع المستخدم</Label>
          <select
            id="userType"
            name="userType"
            value={form.userType}
            onChange={onChange}
            className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">اختر نوع المستخدم</option>
            {Object.entries(userTypes).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          {errors.userType && <p className="text-red-600 text-sm mt-1">{errors.userType}</p>}
        </div>
        
        <div>
          <Label htmlFor="durationMonths">مدة الاشتراك</Label>
          <select
            id="durationMonths"
            name="durationMonths"
            value={form.durationMonths}
            onChange={onChange}
            className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">اختر المدة</option>
            {durationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.durationMonths && <p className="text-red-600 text-sm mt-1">{errors.durationMonths}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="price">السعر</Label>
          <Input id="price" name="price" value={form.price} onChange={onChange} type="number" step="0.01" placeholder="0.00" />
          {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price}</p>}
        </div>
        
        <div>
          <Label htmlFor="orderIndex">ترتيب العرض</Label>
          <Input 
            id="orderIndex" 
            name="orderIndex" 
            value={form.orderIndex} 
            onChange={onChange} 
            type="number" 
            placeholder="0 (اختياري)" 
          />
          {errors.orderIndex && <p className="text-red-600 text-sm mt-1">{errors.orderIndex}</p>}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={form.isActive} onCheckedChange={(v) => onToggle(!!v, "isActive")} />
          <span>مفعلة</span>
        </label>
      </div>

      {errors.general && <p className="text-red-600 text-sm mt-1">{Array.isArray(errors.general) ? errors.general[0] : errors.general}</p>}
      
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "جارٍ الحفظ..." : id ? "تحديث" : "حفظ"}
        </Button>
      </div>
    </form>
  );
}
