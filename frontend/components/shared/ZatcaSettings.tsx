"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

/* ---------------- helpers ---------------- */

export interface ZatcaSettingsFormData {
  environment: string;
  common_name: string;
  organization_name: string;
  organizational_unit_name: string;
  tax_number: string;
  business_category: string;
  egs_serial_number: string;
  registration_number: string;
  registered_address: string;
  street_name: string;
  building_number: string;
  plot_identification: string;
  city_sub_division: string;
  postal_number: string;
  email: string;
  city: string;
  invoice_report_type: string;
  report_method: string;
  is_zatca_verified: Boolean;
}

export interface ZatcaVerifiyFormData {
  otp: string;
}

const emptyZatcaVerify: ZatcaVerifiyFormData = {
  otp: "",
}

const emptyZatcaSettings: ZatcaSettingsFormData = {
  environment: "",
  common_name: "",
  organization_name: "",
  organizational_unit_name: "",
  tax_number: "",
  business_category: "",
  egs_serial_number: "",
  registration_number: "",
  registered_address: "",
  street_name: "",
  building_number: "",
  plot_identification: "",
  city_sub_division: "",
  postal_number: "",
  email: "",
  city: "",
  invoice_report_type: "",
  report_method: "",
  is_zatca_verified: false,
};

/* ---------------- component ---------------- */

interface ZatcaSettingsProps {
  settingsEndpoint: string,
  verifyEndpoint: string,
  initialData?: any; // The car object from API
  onSuccess?: (data?: any) => void;
}

export default function ZatcaSettings({
  settingsEndpoint,
  verifyEndpoint,
  initialData,
  onSuccess,
}: ZatcaSettingsProps) {
  const [formData, setFormData] = useState<ZatcaSettingsFormData>(emptyZatcaSettings);
  const [verifyFormData, setVerifyFormData] = useState<ZatcaVerifiyFormData>(emptyZatcaVerify);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Data for Edit Mode
  useEffect(() => {
    if (initialData) {
      // Map initialData to formData
      const zatcaSettings = initialData;

      // Helpers to safely get string values
      const val = (k: string) => (zatcaSettings[k] != null ? String(zatcaSettings[k]) : "");

      // Determine auction settings from latest scheduled auction if available
      // Or from car fields if they exist (backend car object might have them)

      setFormData((prev) => ({
        ...prev,
        // Override with string conversions to match form state
        environment: val("environment"),
        common_name: val("common_name"),
        organization_name: val("organization_name"),
        organizational_unit_name: val("organizational_unit_name"),
        tax_number: val("tax_number"),
        business_category: val("business_category"),
        egs_serial_number: val("egs_serial_number"),
        registration_number: val("registration_number"),
        registered_address: val("registered_address"),
        street_name: val("street_name"),
        building_number: val("building_number"),
        plot_identification: val("plot_identification"),
        city_sub_division: val("city_sub_division"),
        postal_number: val("postal_number"),
        email: val("email"),
        city: val("city"),
        invoice_report_type: val("invoice_report_type"),
        report_method: val("report_method"),
      }));
    }
  }, [initialData]);

  /* ------------ handlers ------------ */

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    let environmentEgs, invoiceReportTypeEgs;
    if (name === 'environment') {
      invoiceReportTypeEgs = generateInvoiceReportTypeEgs(formData.invoice_report_type);
      environmentEgs = generateEnvironmentEgs(value);
    }
    else if (name === 'invoice_report_type') {
      environmentEgs = generateEnvironmentEgs(formData.environment);
      invoiceReportTypeEgs = generateInvoiceReportTypeEgs(value);
    }

    if (environmentEgs && invoiceReportTypeEgs) {
      const uuid = crypto.randomUUID();
      const egs = `1-${environmentEgs}|2-${invoiceReportTypeEgs}|3-${uuid}`;
      setFormData((prev) => ({ ...prev, egs_serial_number: egs }))
    }
  };

  function generateEnvironmentEgs(value) {
    switch (value) {
      case 'simulation':
        return 'SIM';

      case 'production':
        return 'PRO';
    
      default:
        return 'TST';
    }
  } 

  function generateInvoiceReportTypeEgs(value) {
    switch (value) {
      case '0100':
        return 'SIMP';

      case '1000':
        return 'STAD';
    
      default:
        return 'BOTH';
    }
  } 

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("يجب تسجيل الدخول أولاً");

      const fd = new FormData();

      const baseFields: (keyof ZatcaSettingsFormData)[] = [
        "environment",
        "common_name",
        "organization_name",
        "organizational_unit_name",
        "tax_number",
        "business_category",
        "egs_serial_number",
        "registration_number",
        "registered_address",
        "street_name",
        "building_number",
        "plot_identification",
        "city_sub_division",
        "postal_number",
        "email",
        "city",
        "invoice_report_type",
        "report_method",
      ];

      baseFields.forEach((k) => {
        const v = formData[k];
        fd.append(String(k), String(v));
      });

      const response = await api.post(settingsEndpoint, fd);

      if (response?.data?.success) {
        toast.success("تم تعديل بيانات الزكاة والدخل بنجاح");

        if (onSuccess) {
          onSuccess(response?.data?.data);
        }
      } else {
        toast.error("فشل في العملية");
      }
    } catch (error: any) {
      // Error Handling
      const status = error?.response?.status;
      const data = error?.response?.data;

      if (status === 422 && data?.errors) {
        const msgs: string[] = [];
        for (const k in data.errors) {
          const v = data.errors[k];
          if (Array.isArray(v)) msgs.push(...v);
          else msgs.push(String(v));
        }
        toast.error(`أخطاء: ${msgs.join(", ")}`);
      } else {
        toast.error(data?.message || error?.message || "حدث خطأ غير متوقع");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("يجب تسجيل الدخول أولاً");

      const fd = new FormData();

      const baseFields: (keyof ZatcaVerifiyFormData)[] = [
        "otp",
      ];

      baseFields.forEach((k) => {
        const v = formData[k];
        fd.append(String(k), String(v));
      });

      const response = await api.post(verifyEndpoint, fd);

      if (response?.data?.success) {
        toast.success("تم تفعيل الزكاة والدخل بنجاح");

        if (onSuccess) {
          onSuccess(response?.data?.data);
        }
      } else {
        toast.error("فشل في العملية");
      }
    } catch (error: any) {
      // Error Handling
      const status = error?.response?.status;
      const data = error?.response?.data;

      if (status === 422 && data?.errors) {
        const msgs: string[] = [];
        for (const k in data.errors) {
          const v = data.errors[k];
          if (Array.isArray(v)) msgs.push(...v);
          else msgs.push(String(v));
        }
        toast.error(`أخطاء: ${msgs.join(", ")}`);
      } else {
        toast.error(data?.message || error?.message || "حدث خطأ غير متوقع");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <>
      <div className="bg-card rounded-lg shadow-md p-4 sm:p-6 w-full max-w-6xl mx-auto mb-10">
        <div className="border-b pb-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            إعدادات الزكاة والدخل
          </h1>
          <p className="text-sm sm:text-base text-foreground/70 mt-1">
            تعديل بيانات الزكاة والدخل (المرحلة الثانية)
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* بيانات أساسية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:p-6">
            <div>
              <label
                htmlFor="environment"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                بيئة العمل *
              </label>
              <select
                id="environment"
                name="environment"
                value={formData.environment}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                required
              >
                <option value="">-- اختر بيئة العمل --</option>
                {Object.entries({
                  "local": "تجريبي",
                  "simulation": "محاكاة",
                  "production": "إنتاج"
                }).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="invoice_report_type"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                نوع الفواتير *
              </label>
              <select
                id="invoice_report_type"
                name="invoice_report_type"
                value={formData.invoice_report_type}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                required
              >
                <option value="">-- اختر نوع الفواتير --</option>
                {Object.entries({
                  "0100": "فواتير مبسطة",
                  "1000": "فواتير ضريبية",
                  "1100": "كلاهما"
                }).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="common_name"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                الاسم الشائع *
              </label>
              <input
                type="text"
                id="common_name"
                name="common_name"
                value={formData.common_name}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                required
              />
            </div>

            <div>
              <label
                htmlFor="organization_name"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                اسم الشركة *
              </label>
              <input
                type="text"
                id="organization_name"
                name="organization_name"
                value={formData.organization_name}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                required
              />
            </div>
            
            <div>
              <label
                htmlFor="organizational_unit_name"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                اسم الفرع *
              </label>
              <input
                type="text"
                id="organizational_unit_name"
                name="organizational_unit_name"
                value={formData.organizational_unit_name}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                required
              />
            </div>

            <div>
              <label
                htmlFor="tax_number"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                الرقم الضريبي *
              </label>
              <input
                type="text"
                id="tax_number"
                name="tax_number"
                value={formData.tax_number}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                required
              />
            </div>

            <div>
              <label
                htmlFor="business_category"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                نشاط العمل *
              </label>
              <input
                type="text"
                id="business_category"
                name="business_category"
                value={formData.business_category}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                required
              />
            </div>

            <div>
              <label
                htmlFor="egs_serial_number"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                الرقم التسلسلي EGS *
              </label>
              <input
                type="text"
                id="egs_serial_number"
                name="egs_serial_number"
                value={formData.egs_serial_number}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                style={{ direction: 'ltr' }}
                required
              />
            </div>

            <div>
              <label
                htmlFor="registration_number"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                رقم السجل التجاري *
              </label>
              <input
                type="text"
                id="registration_number"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                required
              />
            </div>

            <div>
              <label
                htmlFor="registered_address"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                العنوان المختصر *
              </label>
              <input
                type="text"
                id="registered_address"
                name="registered_address"
                value={formData.registered_address}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                required
              />
            </div>

            <div>
              <label
                htmlFor="street_name"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                اسم الشارع *
              </label>
              <input
                type="text"
                id="street_name"
                name="street_name"
                value={formData.street_name}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                required
              />
            </div>

            <div>
              <label
                htmlFor="building_number"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                رقم المبني *
              </label>
              <input
                type="text"
                id="building_number"
                name="building_number"
                value={formData.building_number}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                required
              />
            </div>

            <div>
              <label
                htmlFor="plot_identification"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                الرقم الفرعي *
              </label>
              <input
                type="text"
                id="plot_identification"
                name="plot_identification"
                value={formData.plot_identification}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                required
              />
            </div>

            <div>
              <label
                htmlFor="city_sub_division"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                اسم الحي *
              </label>
              <input
                type="text"
                id="city_sub_division"
                name="city_sub_division"
                value={formData.city_sub_division}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                required
              />
            </div>

            <div>
              <label
                htmlFor="postal_number"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                الرمز البريدي *
              </label>
              <input
                type="text"
                id="postal_number"
                name="postal_number"
                value={formData.postal_number}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                البريد الالكتروني *
              </label>
              <input
                type="text"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                required
              />
            </div>

            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                المدينة *
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                required
              />
            </div>

            <div>
              <label
                htmlFor="report_method"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                طريقة الارسال *
              </label>
              <select
                id="report_method"
                name="report_method"
                value={formData.report_method}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                required
              >
                <option value="">-- اختر طريقة الارسال --</option>
                {Object.entries({
                  "auto": "تلقائي",
                  "manual": "يدوي"
                }).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {isSubmitting
                ? "جاري الحفظ..."
                : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-card rounded-lg shadow-md p-4 sm:p-6 w-full max-w-6xl mx-auto mb-10">
        <div className="border-b pb-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            تفعيل الزكاة والدخل
          </h1>
          <p className="text-sm sm:text-base text-foreground/70 mt-1">
            تفعيل الزكاة والدخل (المرحلة الثانية)
          </p>
          {formData.is_zatca_verified && (
            <span className={"mt-2 px-2 py-1 inline-flex text-[11px] leading-5 font-semibold rounded-full bg-green-500/15 text-green-600 border border-green-600/30 dark:text-green-30"}>
              مفعل
            </span>
          )}
          
          {!formData.is_zatca_verified && (
            <span className={"mt-2 px-2 py-1 inline-flex text-[11px] leading-5 font-semibold rounded-full bg-rose-500/15 text-rose-600 border border-rose-600/30 dark:text-rose-300"}>
              غير مفعل
            </span>
          )}
        </div>
        <form onSubmit={handleVerifySubmit} className="space-y-6">
          {/* بيانات أساسية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:p-6">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-foreground/80 mb-1"
              >
                رمز التفعيل *
              </label>
              
              <input
                type="text"
                id="otp"
                name="otp"
                value={verifyFormData.otp}
                onChange={e => setVerifyFormData(prev => ({...prev, otp: e.target.value}))}
                className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                required
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {isSubmitting
                ? "جاري التفعيل..."
                : "تفعيل"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
