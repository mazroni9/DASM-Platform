"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Header } from "../../../components/exhibitor/Header";
import { Sidebar } from "../../../components/exhibitor/sidebar";
import {
  FiMenu,
  FiUser,
  FiMail,
  FiPhone,
  FiEdit2,
  FiSave,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCamera,
} from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

type Tab = "info" | "password";

type RatingSummary = {
  average: number;
  count: number;
  distribution?: Record<string, number>;
};

type Review = {
  id: number;
  rating: number;
  comment?: string | null;
  user_name?: string | null;
  created_at?: string | null;
};

type Profile = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  venue_name: string;
  venue_address: string;
  description: string;
  rating: string;
  avatar: string;
};

const DEFAULT_AVATAR = "https://saraahah.com/images/profile.png";

/* =========================
   Response helpers (Laravel-friendly)
========================= */
function pickData(payload: any) {
  if (!payload) return null;
  if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    if (payload.data.data && typeof payload.data.data === "object") return payload.data.data;
    return payload.data;
  }
  return payload;
}

function pickList(payload: any): any[] {
  if (!payload) return [];
  const d = payload.data ?? payload;
  if (Array.isArray(d)) return d;
  if (d?.data && Array.isArray(d.data)) return d.data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function normalizeProfile(raw: any): Profile {
  const r = raw ?? {};
  return {
    first_name: String(r.first_name ?? r.firstName ?? ""),
    last_name: String(r.last_name ?? r.lastName ?? ""),
    email: String(r.email ?? ""),
    phone: String(r.phone ?? r.mobile ?? ""),
    venue_name: String(r.venue_name ?? r.venueName ?? r.exhibitor_name ?? ""),
    venue_address: String(r.venue_address ?? r.venueAddress ?? r.address ?? ""),
    description: String(r.description ?? ""),
    rating: r.rating == null ? "" : String(r.rating),
    avatar:
      String(
        r.avatar_url ??
          r.avatar ??
          r.image_url ??
          r.image ??
          r.profile_image ??
          DEFAULT_AVATAR
      ) || DEFAULT_AVATAR,
  };
}

function normalizeSummary(raw: any): RatingSummary {
  const r = raw ?? {};
  const avg = Number(r.average ?? r.avg ?? r.rating_average ?? 0);
  const count = Number(r.count ?? r.total ?? r.rating_count ?? 0);
  const distribution =
    r.distribution && typeof r.distribution === "object" ? r.distribution : undefined;
  return {
    average: Number.isFinite(avg) ? avg : 0,
    count: Number.isFinite(count) ? count : 0,
    distribution,
  };
}

function normalizeReview(raw: any): Review {
  const r = raw ?? {};
  const rating = Number(r.rating ?? r.stars ?? r.rate ?? 0);
  return {
    id: Number(r.id ?? 0),
    rating: Number.isFinite(rating) ? rating : 0,
    comment: (r.comment ?? r.review ?? r.message ?? "") || "",
    user_name: r.user_name ?? r.author_name ?? r.user?.first_name ?? r.user?.name ?? null,
    created_at: r.created_at ?? r.createdAt ?? null,
  };
}

function formatDate(iso?: string | null) {
  if (!iso) return "â€”";
  try {
    return new Date(iso).toLocaleDateString("ar-SA");
  } catch {
    return iso;
  }
}

function roleLabel(type?: any) {
  const t = String(type ?? "").toLowerCase();
  if (t === "venue_owner" || t === "exhibitor") return "طµط§ط­ط¨ ظ…ط¹ط±ط¶";
  if (t === "admin") return "ظ…ط´ط±ظپ";
  if (t === "user") return "ظ…ط³طھط®ط¯ظ…";
  return type ? String(type) : "ظ…ط³طھط®ط¯ظ…";
}

/* =========================
   Page
========================= */
export default function ExhibitorProfilePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  if (!isClient) {
    return (
      <div dir="rtl" className="flex min-h-screen bg-background overflow-x-hidden">
        <div className="hidden md:block w-72 bg-card border-l border-border animate-pulse" />
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-card border-b border-border animate-pulse" />
          <main className="p-6 flex-1 bg-background" />
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex min-h-screen bg-background relative text-foreground overflow-x-hidden">
      {/* Sidebar (desktop) */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Drawer (mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-40 md:hidden flex"
            role="dialog"
            aria-modal="true"
          >
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="ط¥ط؛ظ„ط§ظ‚ ط§ظ„ظ‚ط§ط¦ظ…ط©"
            />
            <motion.div className="relative w-72 ml-auto h-full bg-background border-l border-border shadow-2xl">
              <Sidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col w-0">
        <Header />
        <main className="p-4 md:p-6 flex-1 overflow-y-auto bg-background overflow-x-hidden">
          <div className="max-w-5xl mx-auto">
            <ProfileSection />
          </div>
        </main>
      </div>

      {/* FAB (mobile) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-xl z-40 hover:bg-primary/90 transition-all duration-200 flex items-center justify-center"
        aria-label="ط§ظ„ظ‚ط§ط¦ظ…ط©"
        title="ط§ظ„ظ‚ط§ط¦ظ…ط©"
      >
        <FiMenu size={22} />
      </button>
    </div>
  );
}

/* =========================
   Profile Section
========================= */
function ProfileSection() {
  const { user } = useAuthStore();

  const [editMode, setEditMode] = useState(false);
  const [tab, setTab] = useState<Tab>("info");
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    venue_name: "",
    venue_address: "",
    description: "",
    rating: "",
    avatar: DEFAULT_AVATAR,
  });

  const [saving, setSaving] = useState(false);

  // Ratings
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [recent, setRecent] = useState<Review[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(true);

  const fullName = useMemo(() => {
    const n = `${profile.first_name} ${profile.last_name}`.trim();
    return n || "â€”";
  }, [profile.first_name, profile.last_name]);

  const averageStars = useMemo(
    () => Math.round((summary?.average ?? 0) * 10) / 10,
    [summary]
  );

  const fetchProfile = useCallback(async () => {
    const endpoints = ["/api/user/profile"];
    for (const url of endpoints) {
      try {
        const res = await api.get(url);
        const u = pickData(res?.data) ?? {};
        const normalized = normalizeProfile(u);

        setProfile((p) => ({
          ...p,
          ...normalized,
          avatar: normalized.avatar || p.avatar || DEFAULT_AVATAR,
        }));

        useAuthStore.setState({
          user: { ...(useAuthStore.getState().user ?? {}), ...u },
          lastProfileFetch: Date.now(),
        });
        return;
      } catch {
        // try next
      }
    }

    const u = user ?? {};
    const normalized = normalizeProfile(u);
    setProfile((p) => ({ ...p, ...normalized, avatar: normalized.avatar || p.avatar }));
  }, [user]);

  const fetchRatings = useCallback(async () => {
    setLoadingRatings(true);
    try {
      const [s, r] = await Promise.all([
        api.get("/api/exhibitor/ratings/summary"),
        api.get("/api/exhibitor/ratings", { params: { per_page: 5 } }),
      ]);

      const sData = pickData(s?.data);
      setSummary(normalizeSummary(sData ?? s?.data));

      const list = pickList(r?.data);
      setRecent(list.map(normalizeReview).filter((x) => x.id));
    } catch {
      // non-blocking
    } finally {
      setLoadingRatings(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchProfile();
      await fetchRatings();
    })();
    return () => {
      mounted = false;
    };
  }, [fetchProfile, fetchRatings]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        venue_name: profile.venue_name,
        venue_address: profile.venue_address,
        description: profile.description,
      };

      const endpoints = ["/api/user/profile"];
      let updated: any = null;

      for (const url of endpoints) {
        try {
          const res = await api.put(url, payload);
          updated = pickData(res?.data) ?? payload;
          break;
        } catch {
          // try next
        }
      }

      if (!updated) throw new Error("NO_ENDPOINT");

      const normalized = normalizeProfile(updated);
      setProfile((p) => ({ ...p, ...normalized }));

      useAuthStore.setState({
        user: { ...(useAuthStore.getState().user ?? {}), ...updated },
        lastProfileFetch: Date.now(),
      });

      toast.success("طھظ… ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط¨ظ†ط¬ط§ط­ âœ…");
      setEditMode(false);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("Update profile error:", err?.response?.data || err);
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.first_error ||
          "ظپط´ظ„ ظپظٹ ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ â‌Œ"
      );
    } finally {
      setSaving(false);
    }
  }, [profile]);

  const handleChangePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordError("");

      if (!passwords.old || !passwords.new || !passwords.confirm) {
        setPasswordError("ط¬ظ…ظٹط¹ ط§ظ„ط­ظ‚ظˆظ„ ظ…ط·ظ„ظˆط¨ط©");
        return;
      }
      if (passwords.new.length < 8) {
        setPasswordError("ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط§ظ„ط¬ط¯ظٹط¯ط© ظٹط¬ط¨ ط£ظ„ط§ طھظ‚ظ„ ط¹ظ† 8 ط£ط­ط±ظپ");
        return;
      }
      if (passwords.new !== passwords.confirm) {
        setPasswordError("ظƒظ„ظ…طھط§ ط§ظ„ظ…ط±ظˆط± ط؛ظٹط± ظ…طھط·ط§ط¨ظ‚طھظٹظ†");
        return;
      }

      try {
        await api.put("/api/user/password", {
          current_password: passwords.old,
          password: passwords.new,
          password_confirmation: passwords.confirm,
        });

        toast.success("طھظ… طھط؛ظٹظٹط± ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± âœ…");
        setPasswords({ old: "", new: "", confirm: "" });
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "طھط¹ط°ط± طھط؛ظٹظٹط± ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±");
      }
    },
    [passwords]
  );

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    const localURL = URL.createObjectURL(file);
    setProfile((p) => ({ ...p, avatar: localURL }));

    try {
      const form = new FormData();
      form.append("image", file);

      const res = await api.post("/api/upload-image", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedUrl =
        res?.data?.secure_url ||
        res?.data?.url ||
        res?.data?.data?.secure_url ||
        res?.data?.data?.url ||
        null;

      if (uploadedUrl) {
        setProfile((p) => ({ ...p, avatar: uploadedUrl! }));
        toast.success("طھظ… طھط­ط¯ظٹط« ط§ظ„طµظˆط±ط© âœ…");

        try {
          await api.put("/api/user/profile", { avatar_url: uploadedUrl });
        } catch {
          // ignore
        }
      } else {
        toast("طھظ… ط§ظ„ط±ظپط¹ ظ„ظƒظ† ظ„ظ… ظٹطµظ„ظ†ط§ ط±ط§ط¨ط· ط§ظ„طµظˆط±ط© ظ…ظ† ط§ظ„ط®ط§ط¯ظ…", { icon: "â„¹ï¸ڈ" });
      }
    } catch {
      toast.error("ظپط´ظ„ ط±ظپط¹ ط§ظ„طµظˆط±ط©");
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl border border-border bg-card p-4 md:p-6 overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">ظ…ظ„ظپ ط§ظ„ظ…ط¹ط±ط¶</h1>
          <p className="text-muted-foreground text-sm mt-1">
            طھط­ظƒظ… ظƒط§ظ…ظ„ ظپظٹ ط¨ظٹط§ظ†ط§طھظƒ + ظ†ط¸ط±ط© ط³ط±ظٹط¹ط© ط¹ظ„ظ‰ طھظ‚ظٹظٹظ… ط§ظ„ظ…ط¹ط±ط¶.
          </p>
        </div>

        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="inline-flex items-center gap-2 px-4 h-11 rounded-lg border border-border text-foreground hover:bg-muted"
          >
            <FiEdit2 />
            طھط¹ط¯ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ
          </button>
        ) : (
          <button
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
          >
            <FiSave />
            {saving ? "ط¬ط§ط±ظگ ط§ظ„ط­ظپط¸â€¦" : "ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ"}
          </button>
        )}
      </div>

      {/* Top section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: avatar */}
        <div className="lg:col-span-1 rounded-xl border border-border bg-background p-4 overflow-hidden">
          <div className="flex flex-col items-center">
            <div className="relative group">
              <img
                src={profile.avatar || DEFAULT_AVATAR}
                alt="ط§ظ„طµظˆط±ط© ط§ظ„ط´ط®طµظٹط©"
                className="w-32 h-32 rounded-full border border-border object-cover shadow-sm"
              />
              {editMode && (
                <>
                  <button
                    type="button"
                    className="absolute bottom-2 left-2 bg-background text-foreground p-2 rounded-full shadow-lg border border-border hover:bg-muted transition"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="طھط؛ظٹظٹط± ط§ظ„طµظˆط±ط©"
                  >
                    <FiCamera size={18} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </>
              )}
            </div>

            <div className="mt-4 text-center min-w-0">
              <div className="text-lg font-semibold text-foreground truncate">{fullName}</div>
              <div className="mt-1 text-xs inline-block bg-muted text-muted-foreground px-3 py-1 rounded-full border border-border">
                {roleLabel((user as any)?.type)}
              </div>
              {profile.rating !== "" && (
                <div className="mt-3 text-foreground text-sm">
                  ط§ظ„طھظ‚ظٹظٹظ…: <span className="font-semibold">{profile.rating}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ratings summary */}
          <div className="mt-6 rounded-lg border border-border bg-card p-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="text-foreground font-semibold">ظ…ظ„ط®طµ ط§ظ„طھظ‚ظٹظٹظ…</div>
              <div className="flex items-center gap-1">
                <FaStar className="text-amber-500" />
                <span className="text-foreground">{Math.round((averageStars || 0) * 10) / 10}</span>
              </div>
            </div>

            <div className="mt-2 text-muted-foreground text-sm">
              ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط±ط§ط¬ط¹ط§طھ: <span className="text-foreground">{summary?.count ?? 0}</span>
            </div>

            {loadingRatings ? (
              <div className="mt-3 h-16 rounded bg-muted animate-pulse" />
            ) : (
              <div className="mt-3 space-y-1">
                {[5, 4, 3, 2, 1].map((s) => {
                  const count = Number(summary?.distribution?.[String(s)] ?? 0);
                  const total = Math.max(1, summary?.count ?? 1);
                  const pct = Math.min(100, Math.round((count / total) * 100));
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">{s}</span>
                      <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-left">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: tabs */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-background overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-2 p-2 border-b border-border overflow-x-auto">
            <TabButton active={tab === "info"} onClick={() => setTab("info")}>
              ط§ظ„ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط´ط®طµظٹط©
            </TabButton>
            <TabButton active={tab === "password"} onClick={() => setTab("password")}>
              طھط؛ظٹظٹط± ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±
            </TabButton>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 overflow-hidden">
            <AnimatePresence mode="wait">
              {tab === "info" && (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.25 }}
                >
                  <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field
                        label="ط§ظ„ط§ط³ظ… ط§ظ„ط£ظˆظ„"
                        value={profile.first_name}
                        onChange={(v) => setProfile((p) => ({ ...p, first_name: v }))}
                        disabled={!editMode}
                        iconRight={<FiUser className="text-muted-foreground" />}
                      />
                      <Field
                        label="ط§ظ„ط§ط³ظ… ط§ظ„ط£ط®ظٹط±"
                        value={profile.last_name}
                        onChange={(v) => setProfile((p) => ({ ...p, last_name: v }))}
                        disabled={!editMode}
                        iconRight={<FiUser className="text-muted-foreground" />}
                      />
                    </div>

                    {/* âœ… ط¥طµظ„ط§ط­ ط§ظ„طھط¯ط§ط®ظ„: ط£ظٹظ‚ظˆظ†ط© ط¯ط§ط®ظ„ ط­ط§ظˆظٹط© ظٹط³ط§ط± + padding-left ط£ظƒط¨ط± + LTR ظ„ظ„ط¥ظٹظ…ظٹظ„ */}
                    <Field
                      label="ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ"
                      value={profile.email}
                      onChange={(v) => setProfile((p) => ({ ...p, email: v }))}
                      disabled={!editMode}
                      inputProps={{ type: "email", dir: "ltr", autoComplete: "email" }}
                      iconRight={<FiMail className="text-muted-foreground" />}
                    />

                    {/* âœ… ظ†ظپط³ ط§ظ„ظپظƒط±ط© ظ„ظ„ظ…ظˆط¨ط§ظٹظ„ */}
                    <Field
                      label="ط±ظ‚ظ… ط§ظ„ط¬ظˆط§ظ„"
                      value={profile.phone}
                      onChange={(v) => setProfile((p) => ({ ...p, phone: v }))}
                      disabled={!editMode}
                      inputProps={{ dir: "ltr", autoComplete: "tel" }}
                      iconRight={<FiPhone className="text-muted-foreground" />}
                    />

                    <Field
                      label="ط§ط³ظ… ط§ظ„ظ…ط¹ط±ط¶"
                      value={profile.venue_name}
                      onChange={(v) => setProfile((p) => ({ ...p, venue_name: v }))}
                      disabled={!editMode}
                      iconRight={<FiUser className="text-muted-foreground" />}
                    />
                    <Field
                      label="ط¹ظ†ظˆط§ظ† ط§ظ„ظ…ط¹ط±ط¶"
                      value={profile.venue_address}
                      onChange={(v) => setProfile((p) => ({ ...p, venue_address: v }))}
                      disabled={!editMode}
                    />

                    <div>
                      <label className="block text-muted-foreground mb-1">ظˆطµظپ ط§ظ„ظ…ط¹ط±ط¶</label>
                      <textarea
                        rows={3}
                        disabled={!editMode}
                        value={profile.description}
                        onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-70"
                      />
                    </div>

                    {editMode && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={saving}
                          className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
                        >
                          <FiSave />
                          {saving ? "ط¬ط§ط±ظگ ط§ظ„ط­ظپط¸â€¦" : "ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ"}
                        </button>
                      </div>
                    )}
                  </form>
                </motion.div>
              )}

              {tab === "password" && (
                <motion.div
                  key="password"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.25 }}
                >
                  <form className="space-y-5" onSubmit={handleChangePassword}>
                    <PasswordField
                      label="ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط§ظ„ط­ط§ظ„ظٹط©"
                      value={passwords.old}
                      onChange={(v) => setPasswords((p) => ({ ...p, old: v }))}
                      show={showPassword}
                      toggleShow={() => setShowPassword((s) => !s)}
                    />
                    <PasswordField
                      label="ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط§ظ„ط¬ط¯ظٹط¯ط©"
                      value={passwords.new}
                      onChange={(v) => setPasswords((p) => ({ ...p, new: v }))}
                    />
                    <PasswordField
                      label="طھط£ظƒظٹط¯ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط§ظ„ط¬ط¯ظٹط¯ط©"
                      value={passwords.confirm}
                      onChange={(v) => setPasswords((p) => ({ ...p, confirm: v }))}
                    />

                    {passwordError && <div className="text-destructive text-sm">{passwordError}</div>}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-5 h-11 rounded-lg border border-border hover:bg-muted text-foreground"
                      >
                        <FiLock />
                        طھط؛ظٹظٹط± ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Recent reviews */}
      <div className="mt-6 rounded-xl border border-border bg-card p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="text-foreground font-semibold">ط¢ط®ط± ط§ظ„ظ…ط±ط§ط¬ط¹ط§طھ</div>
        </div>

        {loadingRatings ? (
          <div className="h-24 rounded bg-muted animate-pulse" />
        ) : recent.length ? (
          <ul className="divide-y divide-border">
            {recent.map((rev) => (
              <li key={rev.id} className="py-3 flex items-start gap-3">
                <FaStar className="text-amber-500 mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-foreground min-w-0">
                    <span className="font-semibold truncate">{rev.user_name || "ظ…ط³طھط®ط¯ظ…"}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(rev.created_at)}</span>
                  </div>
                  <div className="text-sm text-foreground mt-1 break-words">
                    {rev.comment || "ط¨ط¯ظˆظ† طھط¹ظ„ظٹظ‚"}
                  </div>
                </div>
                <div className="shrink-0 text-muted-foreground">{rev.rating}/5</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-muted-foreground text-sm">ظ„ط§ طھظˆط¬ط¯ ظ…ط±ط§ط¬ط¹ط§طھ ط¨ط¹ط¯.</div>
        )}
      </div>
    </motion.div>
  );
}

/* =========================
   UI helpers
========================= */
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 h-10 rounded-lg text-sm font-semibold border whitespace-nowrap ${
        active
          ? "bg-muted text-foreground border-border"
          : "text-muted-foreground border-transparent hover:bg-muted/50"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * âœ… ط¥طµظ„ط§ط­ ط§ظ„طھط¯ط§ط®ظ„:
 * - ط£ظٹظ‚ظˆظ†ط© ط«ط§ط¨طھط© ط¯ط§ط®ظ„ container ط¹ظ„ظ‰ ط§ظ„ظٹط³ط§ط±
 * - input ظٹط£ط®ط° padding-left ظƒط¨ظٹط± (pl-11) ط¹ط´ط§ظ† ظ…ط§ ظٹط®ط¨ط·ط´ ظپظٹ ط§ظ„ط£ظٹظ‚ظˆظ†ط©
 * - ظˆط¨ط§ظ„ظ†ط³ط¨ط© ظ„ط­ظ‚ظˆظ„ LTR (email/phone) ظ‡ظٹط´طھط؛ظ„ ظƒظˆظٹط³ ط¨ط¯ظˆظ† ظ…ط§ ظٹط±ط¬ظ‘ط¹ ط§ظ„ظ…ط­طھظˆظ‰ طھط­طھ ط§ظ„ط£ظٹظ‚ظˆظ†ط©
 */
function Field({
  label,
  value,
  onChange,
  disabled,
  iconRight,
  inputProps,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  iconRight?: React.ReactNode;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  const hasIcon = Boolean(iconRight);

  return (
    <div className="min-w-0">
      <label className="block text-muted-foreground mb-1">{label}</label>

      <div className="relative">
        <input
          {...inputProps}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={[
            "w-full h-11 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-70",
            "px-3",
            hasIcon ? "pl-11" : "", // âœ… ظ…ط³ط§ط­ط© ظ„ظ„ط£ظٹظ‚ظˆظ†ط© (ظٹط³ط§ط±)
          ].join(" ")}
        />

        {hasIcon && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          >
            {iconRight}
          </div>
        )}
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  toggleShow,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show?: boolean;
  toggleShow?: () => void;
}) {
  return (
    <div className="min-w-0">
      <label className="block text-muted-foreground mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 px-3 pl-11 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {toggleShow && (
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={toggleShow}
            tabIndex={-1}
            aria-label="ط¥ط¸ظ‡ط§ط±/ط¥ط®ظپط§ط، ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±"
          >
            {show ? <FiEyeOff /> : <FiEye />}
          </button>
        )}
      </div>
    </div>
  );
}
