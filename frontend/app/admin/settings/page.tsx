"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Globe,
  Bell,
  Shield,
  Database,
  Save,
  AlertTriangle,
  Loader2,
  Mail,
  MessageSquare,
  Zap,
  Server,
  CreditCard,
  Car,
  TrafficCone,
  Calendar,
  DollarSign,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";

interface SystemSettings {
  siteName: string;
  siteUrl: string;
  adminEmail: string;
  supportEmail: string;
  platformFee: number;
  tamFee: number;
  muroorFee: number;
  CarEntryFees: number;
  auctionDuration: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  maintenanceMode: boolean;
  autoApproveAuctions: boolean;
  maxBidAmount: number;
  minBidIncrement: number;
}

type ApiResponse =
  | { success: true; data: any; message?: string }
  | { status: "success"; data: any; message?: string }
  | any;

const cn = (...xs: Array<string | false | undefined | null>) =>
  xs.filter(Boolean).join(" ");

const toNumber = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const toBool = (v: any, fallback = false) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") return ["true", "1", "yes", "on"].includes(v.toLowerCase());
  return fallback;
};

function mapSettingsFromApi(raw: any, fallback: SystemSettings): SystemSettings {
  // ظٹط¯ط¹ظ… camelCase ط£ظˆ snake_case
  const d = raw ?? {};
  return {
    siteName: d.siteName ?? d.site_name ?? fallback.siteName,
    siteUrl: d.siteUrl ?? d.site_url ?? fallback.siteUrl,
    adminEmail: d.adminEmail ?? d.admin_email ?? fallback.adminEmail,
    supportEmail: d.supportEmail ?? d.support_email ?? fallback.supportEmail,

    platformFee: toNumber(d.platformFee ?? d.platform_fee, fallback.platformFee),
    tamFee: toNumber(d.tamFee ?? d.tam_fee, fallback.tamFee),
    muroorFee: toNumber(d.muroorFee ?? d.muroor_fee, fallback.muroorFee),
    CarEntryFees: toNumber(
      d.CarEntryFees ?? d.carEntryFees ?? d.car_entry_fees,
      fallback.CarEntryFees
    ),

    auctionDuration: toNumber(d.auctionDuration ?? d.auction_duration, fallback.auctionDuration),
    emailNotifications: toBool(
      d.emailNotifications ?? d.email_notifications,
      fallback.emailNotifications
    ),
    smsNotifications: toBool(d.smsNotifications ?? d.sms_notifications, fallback.smsNotifications),

    maintenanceMode: toBool(d.maintenanceMode ?? d.maintenance_mode, fallback.maintenanceMode),
    autoApproveAuctions: toBool(
      d.autoApproveAuctions ?? d.auto_approve_auctions,
      fallback.autoApproveAuctions
    ),

    maxBidAmount: toNumber(d.maxBidAmount ?? d.max_bid_amount, fallback.maxBidAmount),
    minBidIncrement: toNumber(d.minBidIncrement ?? d.min_bid_increment, fallback.minBidIncrement),
  };
}

function getColorClass(color: string) {
  const colors = {
    blue:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
    purple:
      "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300",
    green:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
    red:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
  };
  return (colors as any)[color] || colors.blue;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {children}
      {hint ? (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border px-4 py-3 text-sm shadow-sm outline-none transition",
        "border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500",
        "dark:border-white/10 dark:bg-gray-900/50 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-500",
        props.className
      )}
    />
  );
}

function SwitchRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  activeColor = "blue",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  activeColor?: "blue" | "green" | "red";
}) {
  const activeTrack =
    activeColor === "green"
      ? "peer-checked:bg-emerald-500"
      : activeColor === "red"
      ? "peer-checked:bg-rose-500"
      : "peer-checked:bg-blue-500";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-6 rounded-2xl border p-6 transition",
        "border-gray-200 bg-white/70 hover:bg-white shadow-sm",
        "dark:border-white/10 dark:bg-gray-950/20 dark:hover:bg-white/5"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-gray-100 p-3 text-gray-700 dark:bg-white/5 dark:text-gray-200">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="mb-1 font-semibold text-gray-900 dark:text-white">{title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>

      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div
          className={cn(
            "h-6 w-12 rounded-full transition",
            "bg-gray-200 dark:bg-gray-700",
            activeTrack,
            "peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500"
          )}
        />
        <span
          className={cn(
            "pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full transition",
            "bg-white shadow",
            "peer-checked:translate-x-6"
          )}
        />
      </label>
    </div>
  );
}

export default function AdminSettingsPage() {
  const defaults: SystemSettings = {
    siteName: "ظ…ظ†طµط© ط£ط³ظˆط§ظ‚ ط§ظ„ظ…ط²ط§ط¯ط§طھ ط§ظ„ط±ظ‚ظ…ظٹط© ط§ظ„ط³ط¹ظˆط¯ظٹط©",
    siteUrl: "https://mazbrothers.com",
    adminEmail: "admin@mazbrothers.com",
    supportEmail: "support@mazbrothers.com",
    platformFee: 0,
    tamFee: 0,
    CarEntryFees: 0,
    muroorFee: 0,
    auctionDuration: 24,
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMode: false,
    autoApproveAuctions: false,
    maxBidAmount: 1000000,
    minBidIncrement: 100,
  };

  const [settings, setSettings] = useState<SystemSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "notifications" | "security" | "financial" | "system">(
    "general"
  );
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const tabs = [
    { id: "general", name: "ط¹ط§ظ…", icon: Settings, color: "blue" },
    { id: "notifications", name: "ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ", icon: Bell, color: "purple" },
    { id: "security", name: "ط§ظ„ط£ظ…ط§ظ†", icon: Shield, color: "green" },
    { id: "financial", name: "ط§ظ„ظ…ط§ظ„ظٹط©", icon: CreditCard, color: "amber" },
    { id: "system", name: "ط§ظ„ظ†ط¸ط§ظ…", icon: Database, color: "red" },
  ] as const;

  useEffect(() => {
    if (!settingsLoaded) void fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoaded]);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const res = await api.get<ApiResponse>("/api/admin/settings");
      if (!res?.data) throw new Error("No response data");

      const payload: ApiResponse = res.data;
      const ok = payload?.success === true || payload?.status === "success";
      const data = payload?.data;

      if (ok && data) {
        setSettings(mapSettingsFromApi(data, defaults));
      } else {
        // ظ„ظˆ ط§ظ„ظ€ API ط±ط¬ط¹ ط´ظƒظ„ ظ…ط®طھظ„ظپطŒ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„ ظ…ط§ ظ†ظƒط³ط± ط§ظ„طµظپط­ط©
        setSettings((prev) => mapSettingsFromApi(data, prev));
      }

      setSettingsLoaded(true);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("طھظ… طھط­ظ…ظٹظ„ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©");
      setSettingsLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      const res = await api.put<ApiResponse>("/api/admin/settings", settings);
      if (!res?.data) throw new Error("No response data");

      const payload: ApiResponse = res.data;
      const ok = payload?.success === true || payload?.status === "success";

      if (ok) toast.success(payload?.message || "طھظ… ط­ظپط¸ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط¨ظ†ط¬ط§ط­");
      else toast.error(payload?.message || "ظپط´ظ„ ط­ظپط¸ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      const errorMessage = error?.response?.data?.message || "ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، ط­ظپط¸ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ";
      toast.error(errorMessage);

      if (error?.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach((err: any) => {
          toast.error(Array.isArray(err) ? err[0] : String(err));
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center"
        dir="rtl"
      >
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-500" />
          <p className="text-lg text-gray-600 dark:text-gray-300">ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 dark:from-gray-950 dark:to-gray-900"
      dir="rtl"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ†ط¸ط§ظ…</h1>
            <p className="text-gray-600 dark:text-gray-400">ط¥ط¯ط§ط±ط© ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…ظ†طµط© ظˆط§ظ„طھظƒظˆظٹظ†ط§طھ ط§ظ„ظ…ط®طھظ„ظپط©</p>
          </div>

          <button
            onClick={saveSettings}
            disabled={saving}
            className={cn(
              "inline-flex items-center gap-3 rounded-xl px-6 py-3 font-medium shadow-sm transition",
              "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {saving ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..." : "ط­ظپط¸ ط§ظ„طھط؛ظٹظٹط±ط§طھ"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium transition",
                  isActive
                    ? cn("border", getColorClass(tab.color))
                    : cn(
                        "border border-transparent",
                        "text-gray-600 hover:text-gray-900 hover:bg-white/70",
                        "dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5"
                      )
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Card */}
      <div className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm dark:border-white/10 dark:bg-gray-900/40">
        {/* General */}
        {activeTab === "general" && (
          <div className="p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-700 dark:text-blue-300">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط¹ط§ظ…ط©</h3>
                <p className="text-gray-600 dark:text-gray-400">ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…ظˆظ‚ط¹ ظˆط§ظ„ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط£ط³ط§ط³ظٹط©</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <Field label="ط§ط³ظ… ط§ظ„ظ…ظˆظ‚ط¹">
                  <TextInput
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => handleInputChange("siteName", e.target.value)}
                    placeholder="ط£ط¯ط®ظ„ ط§ط³ظ… ط§ظ„ظ…ظˆظ‚ط¹"
                  />
                </Field>

                <Field label="ط¨ط±ظٹط¯ ط§ظ„ظ…ط¯ظٹط± ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ">
                  <TextInput
                    type="email"
                    value={settings.adminEmail}
                    onChange={(e) => handleInputChange("adminEmail", e.target.value)}
                    placeholder="admin@example.com"
                  />
                </Field>
              </div>

              <div className="space-y-4">
                <Field label="ط±ط§ط¨ط· ط§ظ„ظ…ظˆظ‚ط¹">
                  <TextInput
                    type="url"
                    value={settings.siteUrl}
                    onChange={(e) => handleInputChange("siteUrl", e.target.value)}
                    placeholder="https://example.com"
                  />
                </Field>

                <Field label="ط¨ط±ظٹط¯ ط§ظ„ط¯ط¹ظ… ط§ظ„ظپظ†ظٹ">
                  <TextInput
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => handleInputChange("supportEmail", e.target.value)}
                    placeholder="support@example.com"
                  />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === "notifications" && (
          <div className="p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-purple-500/10 p-3 text-purple-700 dark:text-purple-300">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ</h3>
                <p className="text-gray-600 dark:text-gray-400">ط¥ط¯ط§ط±ط© طھظپط¶ظٹظ„ط§طھ ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ ظˆط§ظ„طھظ†ط¨ظٹظ‡ط§طھ</p>
              </div>
            </div>

            <div className="space-y-6">
              <SwitchRow
                icon={Mail}
                title="ط¥ط´ط¹ط§ط±ط§طھ ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ"
                description="ط¥ط±ط³ط§ظ„ ط¥ط´ط¹ط§ط±ط§طھ ط¹ط¨ط± ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ ظ„ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†"
                checked={settings.emailNotifications}
                onChange={(v) => handleInputChange("emailNotifications", v)}
                activeColor="blue"
              />

              <SwitchRow
                icon={MessageSquare}
                title="ط¥ط´ط¹ط§ط±ط§طھ ط§ظ„ط±ط³ط§ط¦ظ„ ط§ظ„ظ†طµظٹط©"
                description="ط¥ط±ط³ط§ظ„ ط¥ط´ط¹ط§ط±ط§طھ ط¹ط¨ط± ط§ظ„ط±ط³ط§ط¦ظ„ ط§ظ„ظ†طµظٹط© ظ„ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†"
                checked={settings.smsNotifications}
                onChange={(v) => handleInputChange("smsNotifications", v)}
                activeColor="green"
              />
            </div>
          </div>
        )}

        {/* Security */}
        {activeTab === "security" && (
          <div className="p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-300">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط£ظ…ط§ظ†</h3>
                <p className="text-gray-600 dark:text-gray-400">ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط£ظ…ط§ظ† ظˆط§ظ„طھط­ظƒظ… ظپظٹ ط§ظ„ظˆطµظˆظ„</p>
              </div>
            </div>

            <div className="space-y-6">
              <SwitchRow
                icon={Zap}
                title="ط§ظ„ظ…ظˆط§ظپظ‚ط© ط§ظ„طھظ„ظ‚ط§ط¦ظٹط© ط¹ظ„ظ‰ ط§ظ„ظ…ط²ط§ط¯ط§طھ"
                description="ط§ظ„ط³ظ…ط§ط­ ط¨ط§ظ„ظ…ظˆط§ظپظ‚ط© ط§ظ„طھظ„ظ‚ط§ط¦ظٹط© ط¹ظ„ظ‰ ط§ظ„ظ…ط²ط§ط¯ط§طھ ط§ظ„ط¬ط¯ظٹط¯ط©"
                checked={settings.autoApproveAuctions}
                onChange={(v) => handleInputChange("autoApproveAuctions", v)}
                activeColor="blue"
              />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Field label="ط§ظ„ط­ط¯ ط§ظ„ط£ظ‚طµظ‰ ظ„ظ…ط¨ظ„ط؛ ط§ظ„ظ…ط²ط§ظٹط¯ط© (ط±ظٹط§ظ„)">
                  <TextInput
                    type="number"
                    value={settings.maxBidAmount}
                    onChange={(e) => handleInputChange("maxBidAmount", toNumber(e.target.value, 0))}
                  />
                </Field>

                <Field label="ط§ظ„ط­ط¯ ط§ظ„ط£ط¯ظ†ظ‰ ظ„ط²ظٹط§ط¯ط© ط§ظ„ظ…ط²ط§ظٹط¯ط© (ط±ظٹط§ظ„)">
                  <TextInput
                    type="number"
                    value={settings.minBidIncrement}
                    onChange={(e) =>
                      handleInputChange("minBidIncrement", toNumber(e.target.value, 0))
                    }
                  />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* Financial */}
        {activeTab === "financial" && (
          <div className="p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…ط§ظ„ظٹط©</h3>
                <p className="text-gray-600 dark:text-gray-400">ط¥ط¯ط§ط±ط© ط§ظ„ط±ط³ظˆظ… ظˆط§ظ„طھظƒط§ظ„ظٹظپ ط§ظ„ظ…ط§ظ„ظٹط©</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Field label="ط±ط³ظˆظ… ط§ظ„ظ…ظ†طµط©" hint="ط±ط³ظˆظ… ط§ظ„ظ…ظ†طµط© (ط¥ظ† ظˆط¬ط¯طھ)">
                <div className="relative">
                  <DollarSign className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <TextInput
                    type="number"
                    step="0.1"
                    value={settings.platformFee}
                    onChange={(e) => handleInputChange("platformFee", toNumber(e.target.value, 0))}
                    className="pr-10"
                  />
                </div>
              </Field>

              <Field label="ط±ط³ظˆظ… طھط§ظ…" hint="ط±ط³ظˆظ… طھط§ظ… ظ…ظ† ظƒظ„ ط¹ظ…ظ„ظٹط© ط¨ظٹط¹">
                <div className="relative">
                  <Car className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <TextInput
                    type="number"
                    step="0.1"
                    value={settings.tamFee}
                    onChange={(e) => handleInputChange("tamFee", toNumber(e.target.value, 0))}
                    className="pr-10"
                  />
                </div>
              </Field>

              <Field label="ط±ط³ظˆظ… ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط±ظˆط±" hint="ط±ط³ظˆظ… ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط±ظˆط± ظ…ظ† ظƒظ„ ط¹ظ…ظ„ظٹط© ط¨ظٹط¹">
                <div className="relative">
                  <TrafficCone className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <TextInput
                    type="number"
                    step="0.1"
                    value={settings.muroorFee}
                    onChange={(e) => handleInputChange("muroorFee", toNumber(e.target.value, 0))}
                    className="pr-10"
                  />
                </div>
              </Field>

              <Field label="ط±ط³ظˆظ… ط¥ط¯ط®ط§ظ„ ط§ظ„ط³ظٹط§ط±ط© ظ„ظ„ظ…ط²ط§ط¯" hint="ط±ط³ظˆظ… ط¥ط¯ط®ط§ظ„ ط§ظ„ط³ظٹط§ط±ط© ظ„ظ„ظ…ط²ط§ط¯ ظٹط¯ظپط¹ظ‡ط§ ط§ظ„ط¨ط§ط¦ط¹">
                <div className="relative">
                  <Car className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <TextInput
                    type="number"
                    step="0.1"
                    value={settings.CarEntryFees}
                    onChange={(e) =>
                      handleInputChange("CarEntryFees", toNumber(e.target.value, 0))
                    }
                    className="pr-10"
                  />
                </div>
              </Field>
            </div>
          </div>
        )}

        {/* System */}
        {activeTab === "system" && (
          <div className="p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-rose-500/10 p-3 text-rose-700 dark:text-rose-300">
                <Server className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ†ط¸ط§ظ…</h3>
                <p className="text-gray-600 dark:text-gray-400">ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ†ط¸ط§ظ… ظˆط§ظ„طµظٹط§ظ†ط©</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-500/20 dark:bg-rose-500/10">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-rose-500/10 p-3 text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold text-gray-900 dark:text-white">ظˆط¶ط¹ ط§ظ„طµظٹط§ظ†ط©</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-400">
                        طھظپط¹ظٹظ„ ظˆط¶ط¹ ط§ظ„طµظٹط§ظ†ط© ظ„ظ…ظ†ط¹ ط§ظ„ظˆطµظˆظ„ ظ„ظ„ظ…ظˆظ‚ط¹ ظ…ط¤ظ‚طھط§ظ‹
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleInputChange("maintenanceMode", e.target.checked)}
                      className="peer sr-only"
                    />
                    <div
                      className={cn(
                        "h-6 w-12 rounded-full transition",
                        "bg-gray-200 dark:bg-gray-700",
                        "peer-checked:bg-rose-500",
                        "peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-rose-500"
                      )}
                    />
                    <span
                      className={cn(
                        "pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition",
                        "peer-checked:translate-x-6"
                      )}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Field
                  label="ظ…ط¯ط© ط§ظ„ظ…ط²ط§ط¯ ط§ظ„ط§ظپطھط±ط§ط¶ظٹط© (ط³ط§ط¹ط©)"
                  hint="ط§ظ„ظ…ط¯ط© ط§ظ„ط§ظپطھط±ط§ط¶ظٹط© ظ„ظ„ظ…ط²ط§ط¯ط§طھ ط¨ط§ظ„ط³ط§ط¹ط§طھ"
                >
                  <div className="relative">
                    <Calendar className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <TextInput
                      type="number"
                      value={settings.auctionDuration}
                      onChange={(e) =>
                        handleInputChange("auctionDuration", toNumber(e.target.value, 0))
                      }
                      className="pr-10"
                    />
                  </div>
                </Field>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
