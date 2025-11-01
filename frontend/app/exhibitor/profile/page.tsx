'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '../../../components/exhibitor/Header';
import { Sidebar } from '../../../components/exhibitor/sidebar';
import { FiMenu, FiUser, FiMail, FiPhone, FiEdit2, FiSave, FiLock, FiEye, FiEyeOff, FiCamera } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

type Tab = 'info' | 'password';

type RatingSummary = {
  average: number;
  count: number;
  distribution?: Record<string, number>; // "5": 10, "4": 3 ...
};

type Review = {
  id: number;
  rating: number; // 1..5
  comment?: string | null;
  user_name?: string | null;
  created_at?: string | null;
};

export default function ExhibitorDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  if (!isClient) {
    return (
      <div dir="rtl" className="flex min-h-screen bg-slate-950">
        <div className="hidden md:block w-72 bg-slate-900/80 animate-pulse" />
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-slate-900/60 animate-pulse" />
          <main className="p-6 flex-1 bg-slate-950" />
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex min-h-screen bg-slate-950 relative">
      {/* Sidebar (desktop) */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Drawer (mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-40 md:hidden flex"
          >
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="إغلاق القائمة"
            />
            <motion.div className="relative w-72 ml-auto h-full bg-slate-950 border-l border-slate-800 shadow-2xl">
              <Sidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col w-0">
        <Header />
        <main className="p-4 md:p-6 flex-1 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
          <div className="max-w-5xl mx-auto">
            <ProfileSection />
          </div>
        </main>
      </div>

      {/* FAB (mobile) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 right-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-4 rounded-full shadow-xl z-40 hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200 flex items-center justify-center"
        style={{ boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.35), 0 4px 6px -4px rgba(0,0,0,.35)' }}
        aria-label="القائمة"
        title="القائمة"
      >
        <FiMenu size={22} />
      </button>
    </div>
  );
}

/* =========================
   Profile Section (inlined)
========================= */
function ProfileSection() {
  const { user } = useAuthStore();
  const [editMode, setEditMode] = useState(false);
  const [tab, setTab] = useState<Tab>('info');
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    venue_name: '',
    venue_address: '',
    description: '',
    rating: '',
    avatar: 'https://saraahah.com/images/profile.png',
  });

  const [saving, setSaving] = useState(false);

  // Ratings
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [recent, setRecent] = useState<Review[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(true);

  // load fresh profile on mount (so ما نعتمد فقط على الستور)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/user/profile');
        const u = data?.data ?? user ?? {};
        setProfile((p) => ({
          ...p,
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          email: u.email || '',
          phone: u.phone || '',
          venue_name: u.venue_name || '',
          venue_address: u.venue_address || u.address || '',
          description: u.description || '',
          rating: (u.rating ?? '') + '',
          avatar: u.avatar_url || p.avatar,
        }));
        // sync store بخلاصة التعديل
        useAuthStore.setState({ user: { ...(useAuthStore.getState().user ?? {}), ...u } });
      } catch (e) {
        // fallback: حمّل من الستور فقط
        const u = user ?? {};
        setProfile((p) => ({
          ...p,
          first_name: (u as any).first_name || '',
          last_name: (u as any).last_name || '',
          email: (u as any).email || '',
          phone: (u as any).phone || '',
          venue_name: (u as any).venue_name || '',
          venue_address: (u as any).venue_address || (u as any).address || '',
          description: (u as any).description || '',
          rating: ((u as any).rating ?? '') + '',
          avatar: (u as any).avatar_url || p.avatar,
        }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load rating summary + recent
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingRatings(true);
      try {
        const [s, r] = await Promise.all([
          api.get('/api/exhibitor/ratings/summary'),
          api.get('/api/exhibitor/ratings', { params: { per_page: 5 } }),
        ]);
        if (!mounted) return;
        setSummary({
          average: Number(s?.data?.data?.average ?? s?.data?.average ?? 0),
          count: Number(s?.data?.data?.count ?? s?.data?.count ?? 0),
          distribution: s?.data?.data?.distribution ?? s?.data?.distribution ?? undefined,
        });
        const reviews = (r?.data?.data ?? r?.data ?? []) as any[];
        setRecent(
          reviews.map((x) => ({
            id: Number(x.id),
            rating: Number(x.rating ?? x.stars ?? 0),
            comment: x.comment ?? '',
            user_name: x.user_name ?? x.author_name ?? null,
            created_at: x.created_at ?? null,
          }))
        );
      } catch (e) {
        // ignore, non-blocking
      } finally {
        setLoadingRatings(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const averageStars = useMemo(() => Math.round((summary?.average ?? 0) * 10) / 10, [summary]);

  // Save profile
  const handleSave = async () => {
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
        // avatar_url: profile.avatar  // فعّل لو الباك إند يدعم الحقل
      };
      const res = await api.put('/api/user/profile', payload);
      const fresh = res.data?.data ?? {};
      useAuthStore.setState({
        user: { ...(useAuthStore.getState().user ?? {}), ...fresh },
        lastProfileFetch: Date.now(),
      });
      toast.success('تم حفظ البيانات بنجاح ✅');
      setEditMode(false);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Update profile error:', err?.response?.data || err);
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.first_error ||
          'فشل في حفظ البيانات ❌'
      );
    } finally {
      setSaving(false);
    }
  };

  // Change password (best-effort: يستخدم reset-password لو متاح)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!passwords.old || !passwords.new || !passwords.confirm) {
      setPasswordError('جميع الحقول مطلوبة');
      return;
    }
    if (passwords.new.length < 8) {
      setPasswordError('كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordError('كلمتا المرور غير متطابقتين');
      return;
    }
    try {
      // لو عندك إندبوينت خاص بـ change-password بدّل السطر التالي به.
      await api.post('/api/reset-password', {
        current_password: passwords.old,
        password: passwords.new,
        password_confirmation: passwords.confirm,
      });
      toast.success('تم تغيير كلمة المرور ✅');
      setPasswords({ old: '', new: '', confirm: '' });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          'تغيير كلمة المرور غير متاح حاليًا على الخادم'
      );
    }
  };

  // Upload avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const localURL = URL.createObjectURL(file);
    setProfile((p) => ({ ...p, avatar: localURL })); // معاينة فورية

    try {
      const form = new FormData();
      form.append('image', file);
      const res = await api.post('/api/upload-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploaded =
        res?.data?.url ||
        res?.data?.data?.url ||
        res?.data?.path ||
        res?.data?.data?.path ||
        null;
      if (uploaded) {
        setProfile((p) => ({ ...p, avatar: uploaded }));
        // بإمكانك هنا إرسال avatar_url للبروفايل لو الخادم يدعم ذلك
      } else {
        toast('تم الرفع لكن لم يصلنا رابط الصورة من الخادم', { icon: 'ℹ️' });
      }
    } catch (err) {
      toast.error('فشل رفع الصورة');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100">ملف المعرض</h1>
          <p className="text-slate-400 text-sm mt-1">تحكم كامل في بياناتك + نظرة سريعة على تقييم المعرض.</p>
        </div>
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="inline-flex items-center gap-2 px-4 h-11 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800/60"
          >
            <FiEdit2 />
            تعديل البيانات
          </button>
        ) : (
          <button
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
          >
            <FiSave />
            {saving ? 'جارِ الحفظ…' : 'حفظ التعديلات'}
          </button>
        )}
      </div>

      {/* Top profile card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: avatar & role */}
        <div className="lg:col-span-1 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-col items-center">
            <div className="relative group">
              <img
                src={profile.avatar}
                alt="الصورة الشخصية"
                className="w-32 h-32 rounded-full border border-slate-800 object-cover shadow-lg"
              />
              {editMode && (
                <>
                  <button
                    className="absolute bottom-2 left-2 bg-slate-900 text-white p-2 rounded-full shadow-lg border border-slate-700 hover:bg-slate-800 transition"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="تغيير الصورة"
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

            <div className="mt-4 text-center">
              <div className="text-lg font-semibold text-slate-100">
                {profile.first_name} {profile.last_name}
              </div>
              <div className="mt-1 text-xs inline-block bg-slate-800/70 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                {(user?.role === 'venue_owner' && 'صاحب معرض') || user?.role || 'مستخدم'}
              </div>
              {profile.rating !== '' && (
                <div className="mt-3 text-slate-300 text-sm">
                  التقييم: <span className="font-semibold">{profile.rating}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ratings summary */}
          <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <div className="flex items-center justify-between">
              <div className="text-slate-200 font-semibold">ملخص التقييم</div>
              <div className="flex items-center gap-1">
                <FaStar className="text-yellow-400" />
                <span className="text-slate-100">{averageStars || 0}</span>
              </div>
            </div>
            <div className="mt-2 text-slate-400 text-sm">
              إجمالي المراجعات: <span className="text-slate-200">{summary?.count ?? 0}</span>
            </div>

            {/* Distribution bars */}
            {loadingRatings ? (
              <div className="mt-3 h-16 rounded bg-slate-800/50 animate-pulse" />
            ) : (
              <div className="mt-3 space-y-1">
                {[5, 4, 3, 2, 1].map((s) => {
                  const count = Number(summary?.distribution?.[String(s)] ?? 0);
                  const total = Math.max(1, summary?.count ?? 1);
                  const pct = Math.min(100, Math.round((count / total) * 100));
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-4">{s}</span>
                      <div className="flex-1 h-2 rounded bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-500 to-amber-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-10 text-left">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: tabs */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-950/60">
          {/* Tabs */}
          <div className="flex items-center gap-2 p-2 border-b border-slate-800">
            <TabButton active={tab === 'info'} onClick={() => setTab('info')}>
              المعلومات الشخصية
            </TabButton>
            <TabButton active={tab === 'password'} onClick={() => setTab('password')}>
              تغيير كلمة المرور
            </TabButton>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6">
            <AnimatePresence mode="wait">
              {tab === 'info' && (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.25 }}
                >
                  <form className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field
                        label="الاسم الأول"
                        value={profile.first_name}
                        onChange={(v) => setProfile((p) => ({ ...p, first_name: v }))}
                        disabled={!editMode}
                      />
                      <Field
                        label="الاسم الأخير"
                        value={profile.last_name}
                        onChange={(v) => setProfile((p) => ({ ...p, last_name: v }))}
                        disabled={!editMode}
                      />
                    </div>

                    <Field
                      label="البريد الإلكتروني"
                      value={profile.email}
                      onChange={(v) => setProfile((p) => ({ ...p, email: v }))}
                      disabled={!editMode}
                      inputProps={{ type: 'email', dir: 'ltr' }}
                      iconRight={<FiMail className="text-slate-500" />}
                    />
                    <Field
                      label="رقم الجوال"
                      value={profile.phone}
                      onChange={(v) => setProfile((p) => ({ ...p, phone: v }))}
                      disabled={!editMode}
                      inputProps={{ dir: 'ltr' }}
                      iconRight={<FiPhone className="text-slate-500" />}
                    />

                    {/* Venue fields */}
                    <Field
                      label="اسم المعرض"
                      value={profile.venue_name}
                      onChange={(v) => setProfile((p) => ({ ...p, venue_name: v }))}
                      disabled={!editMode}
                      iconRight={<FiUser className="text-slate-500" />}
                    />
                    <Field
                      label="عنوان المعرض"
                      value={profile.venue_address}
                      onChange={(v) => setProfile((p) => ({ ...p, venue_address: v }))}
                      disabled={!editMode}
                    />

                    <div>
                      <label className="block text-slate-300 mb-1">وصف المعرض</label>
                      <textarea
                        rows={3}
                        disabled={!editMode}
                        value={profile.description}
                        onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40 disabled:opacity-70"
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
                          {saving ? 'جارِ الحفظ…' : 'حفظ التعديلات'}
                        </button>
                      </div>
                    )}
                  </form>
                </motion.div>
              )}

              {tab === 'password' && (
                <motion.div
                  key="password"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.25 }}
                >
                  <form className="space-y-5" onSubmit={handleChangePassword}>
                    <PasswordField
                      label="كلمة المرور الحالية"
                      value={passwords.old}
                      onChange={(v) => setPasswords((p) => ({ ...p, old: v }))}
                      show={showPassword}
                      toggleShow={() => setShowPassword((s) => !s)}
                    />
                    <PasswordField
                      label="كلمة المرور الجديدة"
                      value={passwords.new}
                      onChange={(v) => setPasswords((p) => ({ ...p, new: v }))}
                    />
                    <PasswordField
                      label="تأكيد كلمة المرور الجديدة"
                      value={passwords.confirm}
                      onChange={(v) => setPasswords((p) => ({ ...p, confirm: v }))}
                    />

                    {passwordError && <div className="text-rose-400 text-sm">{passwordError}</div>}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-5 h-11 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-slate-200"
                      >
                        <FiLock />
                        تغيير كلمة المرور
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
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-slate-200 font-semibold">آخر المراجعات</div>
        </div>
        {loadingRatings ? (
          <div className="h-24 rounded bg-slate-800/50 animate-pulse" />
        ) : recent.length ? (
          <ul className="divide-y divide-slate-800">
            {recent.map((rev) => (
              <li key={rev.id} className="py-3 flex items-start gap-3">
                <FaStar className="text-yellow-400 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-slate-200">
                    <span className="font-semibold">{rev.user_name || 'مستخدم'}</span>
                    <span className="text-xs text-slate-400">{formatDate(rev.created_at)}</span>
                  </div>
                  <div className="text-sm text-slate-300 mt-1">{rev.comment || 'بدون تعليق'}</div>
                </div>
                <div className="shrink-0 text-slate-300">{rev.rating}/5</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-slate-400 text-sm">لا توجد مراجعات بعد.</div>
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
      onClick={onClick}
      className={`px-4 h-10 rounded-lg text-sm font-semibold border ${
        active
          ? 'bg-slate-900/70 text-slate-100 border-slate-700'
          : 'text-slate-300 border-transparent hover:bg-slate-900/40'
      }`}
    >
      {children}
    </button>
  );
}

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
  return (
    <div>
      <label className="block text-slate-300 mb-1">{label}</label>
      <div className="relative flex items-center">
        <input
          {...inputProps}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full h-11 px-3 pr-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40 disabled:opacity-70"
        />
        {iconRight && <div className="absolute left-3">{iconRight}</div>}
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
    <div>
      <label className="block text-slate-300 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
        />
        {toggleShow && (
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            onClick={toggleShow}
            tabIndex={-1}
          >
            {show ? <FiEyeOff /> : <FiEye />}
          </button>
        )}
      </div>
    </div>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ar-SA');
  } catch {
    return iso;
  }
}
