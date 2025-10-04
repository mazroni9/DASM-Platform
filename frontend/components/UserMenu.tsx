"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
} from "react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import {
  ChevronDown,
  LogOut,
  Settings,
  LayoutDashboard,
  Building2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/types";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const router = useLoadingRouter();

  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // --------- تطبيع الدور إذا جاء كسلسلة نصية ---------
  const normalizeRole = (r: unknown): UserRole | undefined => {
    if (r == null) return undefined;
    const v = String(r).toUpperCase();
    switch (v) {
      case "ADMIN":
        return UserRole.ADMIN;
      case "MODERATOR":
        return UserRole.MODERATOR;
      case "VENUE_OWNER":
        return UserRole.VENUE_OWNER;
      case "INVESTOR":
        return UserRole.INVESTOR;
      default:
        return undefined;
    }
  };

  const role = useMemo<UserRole | undefined>(() => normalizeRole((user as any)?.role), [user]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    // إعادة التركيز على زر الفتح
    triggerRef.current?.focus();
  }, []);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    },
    [isOpen]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push("/auth/login");
  }, [logout, router]);

  const navigateTo = useCallback(
    (path: string) => {
      router.push(path);
      setIsOpen(false);
    },
    [router]
  );

  if (!user) return null;

  // Initials + (اختياري) صورة المستخدم إن وُجدت
  const getUserInitials = () => {
    const name = user.first_name || user.email || "مستخدم";
    return (name[0] || "م").toUpperCase();
  };

  const roleLabel = (r?: UserRole | string) => {
    const rr = normalizeRole(r);
    switch (rr) {
      case UserRole.ADMIN:
        return "مسؤول";
      case UserRole.MODERATOR:
        return "مشرف";
      case UserRole.VENUE_OWNER:
        return "مالك معرض";
      case UserRole.INVESTOR:
        return "مستثمر";
      default:
        return "مستخدم";
    }
  };

  // عناصر القائمة تُبنى ديناميكياً حسب الدور
  type MenuItem = {
    label: string;
    icon: JSX.Element;
    onClick: () => void;
    kind?: "danger" | "normal";
  };

  const items = useMemo<MenuItem[]>(() => {
    const list: MenuItem[] = [
      {
        label: "لوحة التحكم",
        icon: <LayoutDashboard className="w-4 h-4" />,
        onClick: () => navigateTo("/dashboard"),
      },
    ];

    if (role === UserRole.ADMIN || role === UserRole.MODERATOR) {
      list.push({
        label: "لوحه الكنترول رووم",
        icon: <Building2 className="w-4 h-4" />,
        onClick: () => navigateTo("https://control.dasm.com.sa/dashboard"),
      });
    }

    if (role === UserRole.ADMIN) {
      list.push(
        {
          label: " المسؤول",
          icon: <ShieldCheck className="w-4 h-4" />,
          onClick: () => navigateTo("/admin"),
        },
        {
          label: "لوحة المعارض",
          icon: <Building2 className="w-4 h-4" />,
          onClick: () => navigateTo("/admin/venues"),
        }
      );
    }

    if (role === UserRole.MODERATOR) {
      list.push({
        label: "لوحة المشرف",
        icon: <ShieldCheck className="w-4 h-4" />,
        onClick: () => navigateTo("/moderator/dashboard"),
      });
    }

    if (role === UserRole.VENUE_OWNER) {
      list.push({
        label: "لوحة المعرض",
        icon: <Building2 className="w-4 h-4" />,
        onClick: () => navigateTo("/exhibitor"),
      });
    }

    if (role === UserRole.INVESTOR) {
      list.push({
        label: "لوحة المستثمر",
        icon: <TrendingUp className="w-4 h-4" />,
        onClick: () => navigateTo("/investor/dashboard"),
      });
    }

    list.push(
      {
        label: "إعدادات الحساب",
        icon: <Settings className="w-4 h-4" />,
        onClick: () => navigateTo("/dashboard/profile"),
      },
      {
        label: "تسجيل الخروج",
        icon: <LogOut className="w-4 h-4" />,
        onClick: handleLogout,
        kind: "danger",
      }
    );

    return list;
  }, [navigateTo, handleLogout, role]);

  // فتح القائمة بالكيبورد والتركيز على أول عنصر
  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(() => {
        itemRefs.current[0]?.focus();
      }, 0);
      return () => clearTimeout(id);
    }
  }, [isOpen, items.length]);

  // تحكم لوحة المفاتيح لعناصر المنيو
  const handleItemKeyDown = (e: React.KeyboardEvent, index: number) => {
    const max = items.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      itemRefs.current[Math.min(index + 1, max)]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      itemRefs.current[Math.max(index - 1, 0)]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      itemRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      itemRefs.current[max]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
    } else if (e.key === "Tab") {
      setIsOpen(false);
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  // --------- تموضع المنيو: fixed + كشف التصادم ---------
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; from: "top" | "bottom" } | null>(null);

  const computePosition = useCallback(() => {
    if (!isOpen || !triggerRef.current || !menuRef.current) return;
    const spacing = 8; // مسافة بين الزر والقائمة
    const btn = triggerRef.current.getBoundingClientRect();

    // اعرض مؤقتاً للحصول على الأبعاد الحقيقية
    const menuEl = menuRef.current;
    const { width: mw, height: mh } = menuEl.getBoundingClientRect();

    // محاذاة نهاية (RTL): اجعل القائمة تنتهي عند يمين الزر
    let left = btn.right - mw;

    // اقلب أفقياً لو خرجت
    left = Math.max(8, Math.min(left, window.innerWidth - mw - 8));

    // الوضع الرأسي: افتراض أسفل
    let top = btn.bottom + spacing;
    let from: "top" | "bottom" = "top";
    if (top + mh > window.innerHeight - 8) {
      // اقلب لأعلى
      top = Math.max(8, btn.top - spacing - mh);
      from = "bottom";
    }

    setMenuPos({ top, left, from });
  }, [isOpen]);

  useLayoutEffect(() => {
    if (isOpen) {
      computePosition();
      const onScroll = () => computePosition();
      const onResize = () => computePosition();
      window.addEventListener("scroll", onScroll, true);
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("scroll", onScroll, true);
        window.removeEventListener("resize", onResize);
      };
    }
  }, [isOpen, computePosition]);

  return (
    <div className="relative" dir="rtl">
      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen((s) => !s)}
        onKeyDown={handleTriggerKeyDown}
        className="group flex items-center gap-2 rounded-xl px-2.5 py-1.5
                   text-white hover:text-cyan-300
                   hover:bg-slate-800/60 focus:outline-none
                   focus:ring-2 focus:ring-cyan-500/40 transition-all"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="user-menu"
        title="قائمة المستخدم"
      >
        {/* Avatar */}
        <span className="relative inline-flex items-center justify-center w-8 h-8 rounded-full overflow-hidden ring-1 ring-slate-600 bg-gradient-to-br from-sky-600 to-cyan-500 text-white text-sm font-semibold">
          {user?.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.first_name || user.email || "User avatar"}
              fill
              className="object-cover"
            />
          ) : (
            getUserInitials()
          )}
        </span>

        {/* Name + Role (مخفية على الشاشات الصغيرة) */}
        <span className="hidden md:flex flex-col items-start leading-tight max-w-[12rem]">
          <span className="text-sm font-semibold truncate text-white">
            {user.first_name || user.email || "مستخدم"}
          </span>
          <span className="text-[11px] text-cyan-300/90 font-medium truncate">
            {roleLabel(role)}
          </span>
        </span>

        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 transition-transform text-cyan-300/90 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={menuRef}
          id="user-menu"
          role="menu"
          aria-orientation="vertical"
          // نستخدم fixed + style حسب الحسابات لمنع الخروج خارج الشاشة
          style={{
            position: "fixed",
            top: menuPos?.top ?? 0,
            left: menuPos?.left ?? 0,
            // origin للأنيميشن حسب اتجاه الفتح
            transformOrigin: menuPos?.from === "top" ? "top right" : "bottom right",
            // حماية إضافية
            maxHeight: "min(70vh, calc(100vh - 16px))",
          }}
          className="mt-2 w-72 rounded-xl border border-slate-700/80
                     bg-slate-900/95 backdrop-blur-md shadow-lg z-50
                     p-2 animate-in fade-in zoom-in-95"
          onKeyDown={(e) => {
            if (e.key === "Escape") closeMenu();
          }}
        >
          {/* User header */}
          <div className="flex items-center gap-3 px-2 py-2.5">
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-1 ring-slate-600 bg-gradient-to-br from-sky-600 to-cyan-500 text-white text-sm font-semibold flex items-center justify-center">
              {user?.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.first_name || user.email || "User avatar"}
                  fill
                  className="object-cover"
                />
              ) : (
                getUserInitials()
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white truncate">
                  {user.first_name || user.email || "مستخدم"}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/20">
                  {roleLabel(role)}
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate">{user.email}</div>
            </div>
          </div>

          <div className="my-1 h-px bg-slate-700/70" />

          {/* Menu items */}
          <ul className="max-h-[inherit] overflow-auto pr-1">
            {items.map((item, idx) => (
              <li key={item.label}>
                <button
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  role="menuitem"
                  onKeyDown={(e) => handleItemKeyDown(e, idx)}
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                              transition-colors
                              hover:bg-slate-800/70 focus:bg-slate-800/70 focus:outline-none
                              ${item.kind === "danger"
                                ? "text-rose-300 hover:text-rose-200"
                                : "text-slate-100 hover:text-cyan-200"
                              }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-md
                                bg-slate-800/60 border border-slate-700/70
                                ${item.kind === "danger" ? "text-rose-300" : "text-cyan-300"}`}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
