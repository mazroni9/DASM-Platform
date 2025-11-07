// app/auth/register/Form.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  User,
  Mail,
  Phone,
  Lock,
  Building,
  ClipboardList,
  MapPin,
  Map,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import axios, { AxiosError } from "axios";
import LoadingLink from "@/components/LoadingLink";

// ✅ Schema محدثة: أضفنا area_label اختيارية
const registerSchema = z
  .object({
    first_name: z
      .string()
      .min(2, { message: "الاسم الأول يجب أن يكون على الأقل حرفين" })
      .max(50, { message: "الاسم الأول يجب ألا يتجاوز 50 حرفًا" })
      .refine((value) => /^[\u0600-\u06FFa-zA-Z\s]+$/.test(value), {
        message: "الاسم الأول يجب أن يحتوي على أحرف فقط",
      }),
    last_name: z
      .string()
      .min(2, { message: "الاسم الأخير يجب أن يكون على الأقل حرفين" })
      .max(50, { message: "الاسم الأخير يجب ألا يتجاوز 50 حرفًا" })
      .refine((value) => /^[\u0600-\u06FFa-zA-Z\s]+$/.test(value), {
        message: "الاسم الأخير يجب أن يحتوي على أحرف فقط",
      }),
    email: z
      .string()
      .email({ message: "يرجى إدخال بريد إلكتروني صالح" })
      .refine((value) => value.includes("@") && value.includes("."), {
        message: "يرجى إدخال بريد إلكتروني صالح مع وجود @ ونقطة",
      }),
    phone: z
      .string()
      .min(10, { message: "يرجى إدخال رقم هاتف صالح (10 أرقام على الأقل)" })
      .max(15, { message: "رقم الهاتف لا يجب أن يتجاوز 15 رقم" })
      .refine((value) => /^[0-9+\s\-()]+$/.test(value), {
        message: "رقم الهاتف يجب أن يحتوي على أرقام فقط",
      }),
    password: z
      .string()
      .min(8, { message: "كلمة المرور يجب أن تكون على الأقل 8 أحرف" })
      .max(72, { message: "كلمة المرور يجب ألا تتجاوز 72 حرفًا" })
      .refine((value) => /[A-Z]/.test(value), {
        message: "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل",
      })
      .refine((value) => /[0-9]/.test(value), {
        message: "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل",
      })
      .refine((value) => /[^A-Za-z0-9]/.test(value), {
        message: "كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل",
      }),
    password_confirmation: z.string(),
    account_type: z.enum(["user", "dealer", "venue_owner", "investor"]),
    company_name: z.string().optional(),
    commercial_registry: z.string().optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    // ✅ الاتنين اختياريين: area_id (من الـDB) أو area_label (اسم دولة/منطقة عرضي)
    area_id: z.string().optional(),
    area_label: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        data.account_type === "dealer" ||
        data.account_type === "venue_owner" ||
        data.account_type === "investor"
      ) {
        return !!data.company_name && data.company_name.length >= 3;
      }
      return true;
    },
    {
      message: "اسم الشركة/المعرض مطلوب ويجب أن يكون 3 أحرف على الأقل",
      path: ["company_name"],
    }
  )
  .refine(
    (data) => {
      if (
        data.account_type === "dealer" ||
        data.account_type === "venue_owner" ||
        data.account_type === "investor"
      ) {
        return !!data.commercial_registry && data.commercial_registry.length >= 5;
      }
      return true;
    },
    {
      message: "رقم السجل التجاري مطلوب ويجب أن يكون 5 أحرف على الأقل",
      path: ["commercial_registry"],
    }
  )
  .refine(
    (data) => {
      if (data.account_type === "venue_owner") {
        return !!data.address && data.address.trim().length >= 5;
      }
      return true;
    },
    {
      message: "العنوان مطلوب ويجب أن يكون 5 أحرف على الأقل",
      path: ["address"],
    }
  )
  .refine((data) => data.password === data.password_confirmation, {
    message: "كلمات المرور غير متطابقة",
    path: ["password_confirmation"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;
type AreaOption = { id: string; name: string };
type KSARegion = { code: string; name: string };

export default function RegisterForm() {
  const router = useLoadingRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [accountType, setAccountType] = useState<
    "user" | "dealer" | "venue_owner" | "investor"
  >("user");

  // ✅ حالة قائمة المناطق من الـAPI
  const [areas, setAreas] = useState<AreaOption[]>([]);
  // القيمة المختارة بالـSelect: "db:<id>" أو "region:<code>" أو "country:<code>"
  const [areaValue, setAreaValue] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      account_type: "user",
    },
  });

  // ✅ اجلب مناطق من الـAPI (إن وُجد)
  useEffect(() => {
    const fetchAreas = async () => {
      const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";
      const url = `${base}/api/areas`;
      try {
        const res = await axios.get(url, { timeout: 15000 });
        const raw = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        const normalized: AreaOption[] = raw
          .map((a: any) => {
            const id =
              a?.id ?? a?.uuid ?? a?._id ?? a?.value ?? a?.code ?? null;
            const name =
              a?.name ??
              a?.title ??
              a?.label ??
              a?.ar_name ??
              a?.en_name ??
              null;
            if (!id || !name) return null;
            return { id: String(id), name: String(name) };
          })
          .filter(Boolean) as AreaOption[];
        setAreas(normalized);
      } catch {
        // لو فشل، نسيب القائمة فاضية (هيظهر عندنا “مناطق المملكة” و“الدول” فقط)
      }
    };
    fetchAreas();
  }, []);

  // ✅ مناطق المملكة (ثابتة) — الـ 13 منطقة الرسمية
  const ksaRegions: KSARegion[] = useMemo(
    () => [
      { code: "riyadh", name: "منطقة الرياض" },
      { code: "makkah", name: "منطقة مكة المكرمة" },
      { code: "sharqiyah", name: "المنطقة الشرقية" },
      { code: "madinah", name: "منطقة المدينة المنورة" },
      { code: "qassim", name: "منطقة القصيم" },
      { code: "hail", name: "منطقة حائل" },
      { code: "tabuk", name: "منطقة تبوك" },
      { code: "northern-borders", name: "منطقة الحدود الشمالية" },
      { code: "jazan", name: "منطقة جازان" },
      { code: "najran", name: "منطقة نجران" },
      { code: "al-baha", name: "منطقة الباحة" },
      { code: "asir", name: "منطقة عسير" },
      { code: "al-jouf", name: "منطقة الجوف" },
    ],
    []
  );

  // ✅ الدول (تحت المناطق مباشرةً وبنفس الترتيب المطلوب)
  const countryOptions = useMemo(
    () => [
      { code: "eg", name: "مصر" },
      { code: "sy", name: "سوريا" },
      { code: "ps", name: "فلسطين" },
      { code: "jo", name: "الأردن" },
      { code: "iq", name: "العراق" },
      { code: "kw", name: "الكويت" },
      { code: "bh", name: "البحرين" },
      { code: "qa", name: "قطر" },
      { code: "ae", name: "الإمارات" },
      { code: "om", name: "عُمان" },
      { code: "ye", name: "اليمن" },
    ],
    []
  );

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/register`;

    try {
      // ✨ عدم إرسال area_id لو الاختيار من “مناطق المملكة” أو “الدول”
      const payload: RegisterFormValues = { ...data };
      if (areaValue?.startsWith("country:") || areaValue?.startsWith("region:")) {
        delete payload.area_id;
      }

      const response = await axios.post(url, payload, {
        timeout: 15000,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.status === "success") {
        setSuccess("تم التسجيل بنجاح، جاري التحويل إلى صفحة التحقق من البريد الإلكتروني");
        setTimeout(() => {
          router.push("/verify-email");
        }, 1500);
      } else {
        setError(response.data.message || "حدث خطأ أثناء التسجيل");
      }
    } catch (err: unknown) {
      let errorMessage = "حدث خطأ أثناء التسجيل، يرجى المحاولة مرة أخرى";

      if (axios.isAxiosError(err)) {
        const axErr = err as AxiosError<any>;
        const resp = axErr.response;

        if (resp?.status === 422 && resp.data?.errors) {
          const errs = resp.data.errors as Record<string, string[]>;
          const errorPriority = [
            "email",
            "phone",
            "first_name",
            "last_name",
            "password",
            "company_name",
            "commercial_registry",
            "address",
            "area_id", // ✅ لو الـID غير موجود فعلاً في DB
          ];
          for (const field of errorPriority) {
            if (errs[field]?.length > 0) {
              errorMessage = errs[field][0];
              break;
            }
          }
          if (errorMessage === "حدث خطأ أثناء التسجيل، يرجى المحاولة مرة أخرى") {
            const firstField = Object.keys(errs)[0];
            if (firstField && errs[firstField].length > 0) {
              errorMessage = errs[firstField][0];
            }
          }
        } else if (resp?.data?.message) {
          errorMessage = resp.data.message;
        } else if (axErr.message) {
          errorMessage = axErr.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ عندما يختار المستخدم قيمة من القائمة:
  const handleAreaChange = (value: string) => {
    setAreaValue(value);

    if (value.startsWith("db:")) {
      const id = value.slice(3);
      const found = areas.find((a) => a.id === id);
      setValue("area_id", id);
      setValue("area_label", found?.name || undefined);
    } else if (value.startsWith("region:")) {
      const code = value.slice(7);
      const found = ksaRegions.find((r) => r.code === code);
      // لا نرسل area_id مع المناطق الثابتة
      setValue("area_id", undefined);
      setValue("area_label", found?.name || undefined);
    } else if (value.startsWith("country:")) {
      const code = value.slice(8);
      const found = countryOptions.find((c) => c.code === code);
      // لا نرسل area_id مع الدول
      setValue("area_id", undefined);
      setValue("area_label", found?.name || undefined);
    } else {
      setValue("area_id", undefined);
      setValue("area_label", undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full">
      {/* حقول خفية لضمان تسجيلها داخل RHF */}
      <input type="hidden" {...register("area_id")} />
      <input type="hidden" {...register("area_label")} />

      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* الاسم الأول */}
        <div className="space-y-2">
          <Label htmlFor="first_name" className="text-foreground font-medium">
            الاسم الأول
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-foreground/50" />
            </div>
            <Input
              id="first_name"
              {...register("first_name")}
              disabled={isLoading}
              className="pl-3 pr-10"
            />
          </div>
          {errors.first_name && (
            <p className="text-sm text-red-500">{errors.first_name.message}</p>
          )}
        </div>

        {/* الاسم الأخير */}
        <div className="space-y-2">
          <Label htmlFor="last_name" className="text-foreground font-medium">
            الاسم الأخير
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-foreground/50" />
            </div>
            <Input
              id="last_name"
              {...register("last_name")}
              disabled={isLoading}
              className="pl-3 pr-10"
            />
          </div>
          {errors.last_name && (
            <p className="text-sm text-red-500">{errors.last_name.message}</p>
          )}
        </div>

        {/* البريد الإلكتروني */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground font-medium">
            البريد الإلكتروني
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-foreground/50" />
            </div>
            <Input
              id="email"
              type="email"
              dir="ltr"
              {...register("email")}
              disabled={isLoading}
              className="pl-3 pr-10"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* رقم الهاتف */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-foreground font-medium">
            رقم الهاتف
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-foreground/50" />
            </div>
            <Input
              id="phone"
              type="tel"
              dir="ltr"
              {...register("phone")}
              disabled={isLoading}
              className="pl-3 pr-10"
            />
          </div>
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        {/* المنطقة / الدولة */}
        <div className="space-y-2">
          <Label htmlFor="area_id" className="text-foreground font-medium">
            المنطقة / الدولة
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Map className="h-5 w-5 text-foreground/50" />
            </div>
            <Select onValueChange={handleAreaChange} value={areaValue}>
              <SelectTrigger id="area_id" className="pl-3 pr-10 h-10">
                <SelectValue placeholder="اختر المنطقة أو الدولة" />
              </SelectTrigger>
              <SelectContent className="z-50" dir="rtl" align="end">
                {/* إن وُجدت مناطق من النظام */}
                {areas.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>المناطق المتاحة (من النظام)</SelectLabel>
                    {areas.map((a) => (
                      <SelectItem key={a.id} value={`db:${a.id}`}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}

                {/* مناطق المملكة (ثابتة) */}
                <SelectGroup>
                  <SelectLabel>مناطق المملكة (ثابتة)</SelectLabel>
                  {ksaRegions.map((r) => (
                    <SelectItem key={r.code} value={`region:${r.code}`}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectGroup>

                {/* الدول (تحتيهم بنفس الترتيب) */}
                <SelectGroup>
                  <SelectLabel>الدول</SelectLabel>
                  {countryOptions.map((c) => (
                    <SelectItem key={c.code} value={`country:${c.code}`}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {/* لا نعرض خطأ لأن area اختيارية، والباك-إند يشترطها فقط لو كانت id موجود */}
        </div>

        {/* كلمة المرور */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground font-medium">
            كلمة المرور
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-foreground/50" />
            </div>
            <Input
              id="password"
              type="password"
              dir="ltr"
              {...register("password")}
              disabled={isLoading}
              className="pl-3 pr-10"
            />
          </div>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* تأكيد كلمة المرور */}
        <div className="space-y-2">
          <Label
            htmlFor="password_confirmation"
            className="text-foreground font-medium"
          >
            تأكيد كلمة المرور
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-foreground/50" />
            </div>
            <Input
              id="password_confirmation"
              type="password"
              dir="ltr"
              {...register("password_confirmation")}
              disabled={isLoading}
              className="pl-3 pr-10"
            />
          </div>
          {errors.password_confirmation && (
            <p className="text-sm text-red-500">
              {errors.password_confirmation.message}
            </p>
          )}
        </div>

        {/* نوع الحساب */}
        <div className="space-y-2">
          <Label htmlFor="account_type" className="text-foreground font-medium">
            نوع الحساب
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-foreground/50" />
            </div>
            <Select
              onValueChange={(value) => {
                const typedValue = value as
                  | "user"
                  | "dealer"
                  | "venue_owner"
                  | "investor";
                setAccountType(typedValue);
                setValue("account_type", typedValue);
              }}
              value={accountType}
            >
              <SelectTrigger id="account_type" className="pl-3 pr-10 h-10">
                <SelectValue placeholder="اختر نوع الحساب" />
              </SelectTrigger>
              <SelectContent className="z-50" dir="rtl" align="end">
                <SelectItem value="user">مستخدم</SelectItem>
                <SelectItem value="dealer">تاجر</SelectItem>
                <SelectItem value="venue_owner">مالك المعرض</SelectItem>
                <SelectItem value="investor">مستثمر</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* الحقول الديناميكية */}
        {accountType === "dealer" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-foreground font-medium">
                اسم الشركة
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-foreground/50" />
                </div>
                <Input
                  id="company_name"
                  {...register("company_name")}
                  disabled={isLoading}
                  className="pl-3 pr-10"
                />
              </div>
              {errors.company_name && (
                <p className="text-sm text-red-500">{errors.company_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="commercial_registry" className="text-foreground font-medium">
                السجل التجاري
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <ClipboardList className="h-5 w-5 text-foreground/50" />
                </div>
                <Input
                  id="commercial_registry"
                  {...register("commercial_registry")}
                  disabled={isLoading}
                  className="pl-3 pr-10"
                />
              </div>
              {errors.commercial_registry && (
                <p className="text-sm text-red-500">
                  {errors.commercial_registry.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground font-medium">
                وصف النشاط التجاري (اختياري)
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                disabled={isLoading}
                rows={3}
                placeholder="اكتب وصفاً مختصراً عن نشاطك التجاري..."
              />
            </div>
          </>
        )}

        {accountType === "venue_owner" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-foreground font-medium">
                اسم المعرض
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-foreground/50" />
                </div>
                <Input
                  id="company_name"
                  {...register("company_name")}
                  disabled={isLoading}
                  className="pl-3 pr-10"
                />
              </div>
              {errors.company_name && (
                <p className="text-sm text-red-500">{errors.company_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-foreground font-medium">
                عنوان المعرض
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-foreground/50" />
                </div>
                <Input
                  id="address"
                  {...register("address")}
                  disabled={isLoading}
                  className="pl-3 pr-10"
                  placeholder="مثال: القاهرة، مدينة نصر..."
                />
              </div>
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="commercial_registry" className="text-foreground font-medium">
                السجل التجاري
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <ClipboardList className="h-5 w-5 text-foreground/50" />
                </div>
                <Input
                  id="commercial_registry"
                  {...register("commercial_registry")}
                  disabled={isLoading}
                  className="pl-3 pr-10"
                />
              </div>
              {errors.commercial_registry && (
                <p className="text-sm text-red-500">
                  {errors.commercial_registry.message}
                </p>
              )}
            </div>
          </>
        )}

        {accountType === "investor" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-foreground font-medium">
                اسم الشركة الاستثمارية
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-foreground/50" />
                </div>
                <Input
                  id="company_name"
                  {...register("company_name")}
                  disabled={isLoading}
                  className="pl-3 pr-10"
                />
              </div>
              {errors.company_name && (
                <p className="text-sm text-red-500">{errors.company_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="commercial_registry" className="text-foreground font-medium">
                السجل التجاري
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <ClipboardList className="h-5 w-5 text-foreground/50" />
                </div>
                <Input
                  id="commercial_registry"
                  {...register("commercial_registry")}
                  disabled={isLoading}
                  className="pl-3 pr-10"
                />
              </div>
              {errors.commercial_registry && (
                <p className="text-sm text-red-500">
                  {errors.commercial_registry.message}
                </p>
              )}
            </div>
          </>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <span className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
              جاري التسجيل...
            </span>
          ) : (
            "إنشاء حساب"
          )}
        </Button>
      </div>
    </form>
  );
} 