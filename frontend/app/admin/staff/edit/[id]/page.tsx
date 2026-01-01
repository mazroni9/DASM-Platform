"use client";

import { useState, useEffect, FormEvent, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  X,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  User,
  Mail,
  Phone,
  Key,
  CheckCircle,
  Clock,
  Settings,
  RefreshCw,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import Link from "next/link";

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  type: string; // User Type
  spatie_role_id: string; // Spatie Role ID
}

interface Role {
  id: number;
  display_name: string;
  name: string;
}

interface FormErrors {
  first_name?: string[];
  last_name?: string[];
  email?: string[];
  phone?: string[];
  password?: string[];
  password_confirmation?: string[];
  type?: string[];
  spatie_role_id?: string[];
}

interface ModeratorData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  email_verified_at: string | null;
  roles?: Role[];
}

export default function EditModeratorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);
  const [moderator, setModerator] = useState<ModeratorData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    type: "",
    spatie_role_id: "",
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get("/api/admin/roles-list");
      if (response.data && response.data.status === "success") {
        setRoles(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("فشل في تحميل قائمة الأدوار");
    }
  };

  useEffect(() => {
    fetchModeratorDetails();
  }, []);

  const fetchModeratorDetails = async () => {
    try {
      const response = await api.get(`/api/admin/staff/${id}`);

      if (response.data && response.data.status === "success") {
        const moderatorData = response.data.data;
        setModerator(moderatorData);
        setFormData({
          first_name: moderatorData.first_name,
          last_name: moderatorData.last_name,
          email: moderatorData.email,
          phone: moderatorData.phone,
          password: "",
          password_confirmation: "",
          type: moderatorData.type,
          spatie_role_id:
            moderatorData.roles && moderatorData.roles.length > 0
              ? moderatorData.roles[0].id.toString()
              : "",
        });
      }
    } catch (error: any) {
      console.error("Error fetching moderator details:", error);
      const errorMessage =
        error.response?.data?.message || "فشل في تحميل بيانات المشرف";
      toast.error(errorMessage);
      router.push("/admin/staff");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = ["الاسم الأول مطلوب"];
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = ["الاسم الأخير مطلوب"];
    }

    if (!formData.email.trim()) {
      newErrors.email = ["البريد الإلكتروني مطلوب"];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = ["يرجى إدخال بريد إلكتروني صالح"];
    }

    if (!formData.phone.trim()) {
      newErrors.phone = ["رقم الهاتف مطلوب"];
    }

    // Password is optional for editing, but if provided, must be validated
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = ["كلمة المرور يجب أن تكون 8 أحرف على الأقل"];
      }

      if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = ["كلمة المرور وتأكيدها غير متطابقين"];
      }
    } else if (formData.password_confirmation) {
      newErrors.password = ["يرجى إدخال كلمة المرور"];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("يرجى تصحيح الأخطاء في النموذج");
      return;
    }

    setLoading(true);
    try {
      // Prepare data for submission (exclude empty password)
      const submitData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        type: formData.type,
        spatie_role_id: formData.spatie_role_id,
      };

      // Only include password if provided
      if (formData.password) {
        submitData.password = formData.password;
        submitData.password_confirmation = formData.password_confirmation;
      }

      const response = await api.put(`/api/admin/staff/${id}`, submitData);

      if (response.data && response.data.status === "success") {
        toast.success(response.data.message);
        router.push("/admin/staff");
      }
    } catch (error: any) {
      console.error("Error updating moderator:", error);

      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        toast.error("يرجى تصحيح الأخطاء في النموذج");
      } else {
        const errorMessage =
          error.response?.data?.message || "حدث خطأ أثناء تحديث بيانات المشرف";
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (
      moderator &&
      (formData.first_name !== moderator.first_name ||
        formData.last_name !== moderator.last_name ||
        formData.email !== moderator.email ||
        formData.phone !== moderator.phone ||
        formData.password)
    ) {
      if (
        confirm(
          "هل أنت متأكد من إلغاء العملية؟ ستفقد جميع التغييرات غير المحفوظة."
        )
      ) {
        router.push("/admin/moderators");
      }
    } else {
      router.push("/admin/moderators");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "غير متوفر";
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل بيانات المشرف...</p>
        </div>
      </div>
    );
  }

  if (!moderator) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <AlertTriangle className="w-20 h-20 text-destructive mb-6" />
        <h1 className="text-2xl font-bold text-foreground mb-4 text-center">
          لم يتم العثور على المشرف
        </h1>
        <p className="text-muted-foreground mb-8 text-center">
          المشرف المطلوب غير موجود أو تم حذفه
        </p>
        <Link
          href="/admin/staffs"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl transition-all duration-300 flex items-center"
        >
          <ArrowLeft className="w-5 h-5 ml-2" />
          العودة إلى قائمة المشرفين
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <Link
            href="/admin/staff"
            className="inline-flex items-center text-primary hover:text-primary/80 transition-colors duration-300 mb-4"
          >
            <ArrowLeft className="w-5 h-5 ml-2" />
            العودة إلى قائمة المشرفين
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            تعديل بيانات المشرف
          </h1>
          <p className="text-muted-foreground mt-2">
            تحديث معلومات المشرف وإعدادات الحساب
          </p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <Button
            onClick={fetchModeratorDetails}
            variant="outline"
            className="bg-secondary border-border text-secondary-foreground hover:bg-secondary/80 transition-all duration-300"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث البيانات
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          {/* Moderator Info Card */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-4 space-x-reverse mb-6">
              <div className="bg-primary p-3 rounded-xl">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {moderator.first_name} {moderator.last_name}
                </h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                    <Shield className="w-3 h-3 ml-1" />
                    مشرف
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                      moderator.is_active
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}
                  >
                    {moderator.is_active ? (
                      <>
                        <CheckCircle className="w-3 h-3 ml-1" />
                        نشط
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 ml-1" />
                        غير نشط
                      </>
                    )}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground border border-border">
                    <User className="w-3 h-3 ml-1" />
                    ID: {moderator.id}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-muted-foreground">تاريخ الإنشاء</div>
                <div className="text-foreground">
                  {formatDate(moderator.created_at)}
                </div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-muted-foreground">
                  حالة البريد الإلكتروني
                </div>
                <div
                  className={`flex items-center ${
                    moderator.email_verified_at
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {moderator.email_verified_at ? (
                    <>
                      <CheckCircle className="w-3 h-3 ml-1" />
                      مؤكد
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 ml-1" />
                      غير مؤكد
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <Settings className="w-5 h-5 ml-2 text-primary" />
                تعديل المعلومات الأساسية
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-medium text-foreground mb-3"
                  >
                    الاسم الأول *
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className={`w-full bg-background border-border text-foreground placeholder:text-muted-foreground pl-10 ${
                        errors.first_name
                          ? "border-destructive focus:ring-destructive"
                          : "focus:ring-primary"
                      }`}
                      placeholder="أدخل الاسم الأول"
                      disabled={loading}
                    />
                  </div>
                  {errors.first_name && (
                    <p className="mt-2 text-sm text-destructive flex items-center">
                      <AlertTriangle className="w-3 h-3 ml-1" />
                      {errors.first_name[0]}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-medium text-foreground mb-3"
                  >
                    الاسم الأخير *
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className={`w-full bg-background border-border text-foreground placeholder:text-muted-foreground pl-10 ${
                        errors.last_name
                          ? "border-destructive focus:ring-destructive"
                          : "focus:ring-primary"
                      }`}
                      placeholder="أدخل الاسم الأخير"
                      disabled={loading}
                    />
                  </div>
                  {errors.last_name && (
                    <p className="mt-2 text-sm text-destructive flex items-center">
                      <AlertTriangle className="w-3 h-3 ml-1" />
                      {errors.last_name[0]}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-foreground mb-3"
                  >
                    البريد الإلكتروني *
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full bg-background border-border text-foreground placeholder:text-muted-foreground pl-10 ${
                        errors.email
                          ? "border-destructive focus:ring-destructive"
                          : "focus:ring-primary"
                      }`}
                      placeholder="أدخل البريد الإلكتروني"
                      disabled={loading}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-destructive flex items-center">
                      <AlertTriangle className="w-3 h-3 ml-1" />
                      {errors.email[0]}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-foreground mb-3"
                  >
                    رقم الهاتف *
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full bg-background border-border text-foreground placeholder:text-muted-foreground pl-10 ${
                        errors.phone
                          ? "border-destructive focus:ring-destructive"
                          : "focus:ring-primary"
                      }`}
                      placeholder="أدخل رقم الهاتف"
                      disabled={loading}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-2 text-sm text-destructive flex items-center">
                      <AlertTriangle className="w-3 h-3 ml-1" />
                      {errors.phone[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* User Type Selection */}
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-foreground mb-3"
                >
                  نوع المستخدم *
                </label>
                <div className="relative">
                  <Shield className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <select
                    id="role"
                    name="role"
                    value={formData.type}
                    onChange={handleSelectChange}
                    className={`w-full bg-background border-border text-foreground placeholder:text-muted-foreground pl-10 pr-10 py-2 rounded-md border ${
                      errors.type
                        ? "border-destructive focus:ring-destructive"
                        : "focus:ring-primary"
                    }`}
                    disabled={loading}
                  >
                    <option value="">اختر نوع المستخدم</option>
                    <option value="admin">مدير</option>
                    <option value="moderator">مشرف</option>
                  </select>
                </div>
                {errors.type && (
                  <p className="mt-2 text-sm text-destructive flex items-center">
                    <AlertTriangle className="w-3 h-3 ml-1" />
                    {errors.type[0]}
                  </p>
                )}
              </div>

              {/* Role Selection (Spatie Permissions) */}
              <div>
                <label
                  htmlFor="spatie_role_id"
                  className="block text-sm font-medium text-foreground mb-3"
                >
                  الدور الوظيفي (إختياري)
                </label>
                <div className="relative">
                  <Briefcase className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <select
                    id="spatie_role_id"
                    name="spatie_role_id"
                    value={formData.spatie_role_id}
                    onChange={handleSelectChange}
                    className={`w-full bg-background border-border text-foreground placeholder:text-muted-foreground pl-10 pr-10 py-2 rounded-md border ${
                      errors.spatie_role_id
                        ? "border-destructive focus:ring-destructive"
                        : "focus:ring-primary"
                    }`}
                    disabled={loading}
                  >
                    <option value="">اختر الدور الوظيفي</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.display_name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.spatie_role_id && (
                  <p className="mt-2 text-sm text-destructive flex items-center">
                    <AlertTriangle className="w-3 h-3 ml-1" />
                    {errors.spatie_role_id[0]}
                  </p>
                )}
              </div>

              {/* Password Section */}
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
                  <Key className="w-5 h-5 ml-2 text-primary" />
                  تغيير كلمة المرور (اختياري)
                </h3>

                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
                  <p className="text-sm text-primary flex items-center">
                    <AlertTriangle className="w-4 h-4 ml-2" />
                    اترك هذه الحقول فارغة إذا كنت لا تريد تغيير كلمة المرور
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-foreground mb-3"
                    >
                      كلمة المرور الجديدة
                    </label>
                    <div className="relative">
                      <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full bg-background border-border text-foreground placeholder:text-muted-foreground pl-10 ${
                          errors.password
                            ? "border-destructive focus:ring-destructive"
                            : "focus:ring-primary"
                        }`}
                        placeholder="أدخل كلمة المرور الجديدة"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-2 text-sm text-destructive flex items-center">
                        <AlertTriangle className="w-3 h-3 ml-1" />
                        {errors.password[0]}
                      </p>
                    )}
                    {formData.password && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        يجب أن تكون كلمة المرور 8 أحرف على الأقل
                      </p>
                    )}
                  </div>

                  {/* Password Confirmation */}
                  <div>
                    <label
                      htmlFor="password_confirmation"
                      className="block text-sm font-medium text-foreground mb-3"
                    >
                      تأكيد كلمة المرور الجديدة
                    </label>
                    <div className="relative">
                      <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="password_confirmation"
                        name="password_confirmation"
                        type={showPasswordConfirmation ? "text" : "password"}
                        value={formData.password_confirmation}
                        onChange={handleInputChange}
                        className={`w-full bg-background border-border text-foreground placeholder:text-muted-foreground pl-10 ${
                          errors.password_confirmation
                            ? "border-destructive focus:ring-destructive"
                            : "focus:ring-primary"
                        }`}
                        placeholder="أعد إدخال كلمة المرور الجديدة"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswordConfirmation(!showPasswordConfirmation)
                        }
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswordConfirmation ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.password_confirmation && (
                      <p className="mt-2 text-sm text-destructive flex items-center">
                        <AlertTriangle className="w-3 h-3 ml-1" />
                        {errors.password_confirmation[0]}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 space-x-reverse pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                  className="bg-secondary border-border text-secondary-foreground hover:bg-secondary/80 transition-all duration-300"
                >
                  <X className="w-4 h-4 ml-2" />
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 ml-2" />
                  )}
                  تحديث البيانات
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              إجراءات سريعة
            </h3>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
              >
                <Mail className="w-4 h-4 ml-2" />
                إرسال بريد إلكتروني
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
              >
                <Shield className="w-4 h-4 ml-2" />
                إدارة الصلاحيات
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
              >
                <User className="w-4 h-4 ml-2" />
                عرض النشاط
              </Button>
            </div>
          </div>

          {/* Form Tips */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">
              نصائح مهمة
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span className="text-cyan-300">
                  الحقول المميزة بـ * إلزامية
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span className="text-cyan-300">
                  كلمة المرور اختيارية للتعديل
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span className="text-cyan-300">
                  سيتم إشعار المشرف بالتغييرات
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
