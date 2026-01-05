"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  X,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Key,
  AlertTriangle,
  CheckCircle,
  Settings,
  UserPlus,
  Sparkles,
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
  type: string; // User Type (admin/moderator)
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

export default function AddStaffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);
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

    if (!formData.password) {
      newErrors.password = ["كلمة المرور مطلوبة"];
    } else if (formData.password.length < 8) {
      newErrors.password = ["كلمة المرور يجب أن تكون 8 أحرف على الأقل"];
    }

    if (!formData.password_confirmation) {
      newErrors.password_confirmation = ["تأكيد كلمة المرور مطلوب"];
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = ["كلمة المرور وتأكيدها غير متطابقين"];
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
      const response = await api.post("/api/admin/staff", formData);

      if (response.data && response.data.status === "success") {
        toast.success(response.data.message);
        router.push("/admin/staff");
      }
    } catch (error: any) {
      console.error("Error creating moderator:", error);

      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        toast.error("يرجى تصحيح الأخطاء في النموذج");
      } else {
        const errorMessage =
          error.response?.data?.message || "حدث خطأ أثناء إنشاء الموظف";
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (Object.values(formData).some((value) => value.trim() !== "")) {
      if (
        confirm("هل أنت متأكد من إلغاء العملية؟ ستفقد جميع البيانات المدخلة.")
      ) {
        router.push("/admin/staff");
      }
    } else {
      router.push("/admin/staff");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-2">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <Link
            href="/admin/staff"
            className="inline-flex items-center text-primary hover:text-primary/80 transition-colors duration-300 mb-4"
          >
            <ArrowLeft className="w-5 h-5 ml-2" />
            العودة إلى قائمة الموظفين
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            إضافة موظف جديد
          </h1>
          <p className="text-muted-foreground mt-2">
            إنشاء حساب موظف جديد (مدير أو مشرف) مع الصلاحيات المناسبة
          </p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <div className="bg-primary p-3 rounded-xl">
            <UserPlus className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          {/* Welcome Card */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="bg-primary p-3 rounded-xl">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  مرحباً بك في إضافة موظف جديد
                </h2>
                <p className="text-muted-foreground mt-1">
                  املأ النموذج أدناه لإنشاء حساب موظف جديد في النظام
                </p>
              </div>
            </div>
          </div>

          {/* Add Form */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <Settings className="w-5 h-5 ml-2 text-primary" />
                المعلومات الأساسية للموظف
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
                    id="type"
                    name="type"
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
                  إعدادات الأمان
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-foreground mb-3"
                    >
                      كلمة المرور *
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
                        placeholder="أدخل كلمة المرور"
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
                    <p className="mt-2 text-xs text-muted-foreground">
                      يجب أن تكون كلمة المرور 8 أحرف على الأقل
                    </p>
                  </div>

                  {/* Password Confirmation */}
                  <div>
                    <label
                      htmlFor="password_confirmation"
                      className="block text-sm font-medium text-foreground mb-3"
                    >
                      تأكيد كلمة المرور *
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
                        placeholder="أعد إدخال كلمة المرور"
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
                  إنشاء الموظف
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Tips */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">
              نصائح سريعة
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  جميع الحقول المميزة بـ * إلزامية
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  استخدم بريد إلكتروني فعال
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  كلمة مرور قوية تحمي الحساب
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  تأكد من صحة جميع البيانات
                </span>
              </div>
            </div>
          </div>

          {/* Moderator Permissions */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
              <Shield className="w-5 h-5 ml-2" />
              صلاحيات المشرف
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2 space-x-reverse text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>إدارة المزادات والمشاركين</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>التحقق من المستخدمين والتجار</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>مراقبة النشاطات والمخالفات</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>إعداد التقارير والإحصائيات</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">
              بعد الإنشاء
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  سيتم تفعيل الحساب تلقائياً
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  إشعار المشرف ببيانات الدخول
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  إمكانية تعديل البيانات لاحقاً
                </span>
              </div>
              <div className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  إدارة الصلاحيات من لوحة التحكم
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 bg-card rounded-xl p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="text-primary font-semibold">
            جاري إنشاء الموظف الجديد
          </div>
          <div className="text-muted-foreground">الخطوة 1 من 1</div>
        </div>
        <div className="mt-2 w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full w-full"></div>
        </div>
      </div>
    </div>
  );
}
