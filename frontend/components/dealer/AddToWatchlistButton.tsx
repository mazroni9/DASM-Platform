// components/dealer/AddToWatchlistButton.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Heart,
  Loader2,
  Plus,
  Check,
  X,
  FolderPlus,
  ArrowRightLeft,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

interface WatchlistMenu {
  id: number;
  name: string;
  count: number;
  has_car: boolean;
}

interface AddToWatchlistButtonProps {
  carId: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function AddToWatchlistButton({
  carId,
  className,
  size = "md",
}: AddToWatchlistButtonProps) {
  const { token, isLoggedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menus, setMenus] = useState<WatchlistMenu[]>([]);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [currentWatchlist, setCurrentWatchlist] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");
  const [creatingMenu, setCreatingMenu] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowCreateInput(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle click on heart icon
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    setLoading(true);

    try {
      // Call quick-add endpoint
      const response = await fetch("/api/dealer/watchlists/quick-add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ car_id: carId }),
      });

      const data = await response.json();

      if (data.status === "success") {
        // Handle different actions
        if (data.action === "select_menu") {
          // Car not in any list - show menu selection
          setMenus(data.data.menus);
          setIsInWatchlist(false);
          setCurrentWatchlist(null);
          setIsOpen(true);
        } else if (data.action === "already_in_watchlist") {
          // Car is in a watchlist - show menus for moving
          setMenus(data.data.menus);
          setIsInWatchlist(true);
          setCurrentWatchlist({
            id: data.data.current_menu_id,
            name: data.data.current_menu_name,
          });
          setIsOpen(true);
        } else {
          // Car was added (either to default menu or successfully)
          setIsInWatchlist(true);
          if (data.data?.menu_id && data.data?.menu_name) {
            setCurrentWatchlist({
              id: data.data.menu_id,
              name: data.data.menu_name,
            });
          }
          toast.success(data.message, {
            icon: "❤️",
            style: { borderRadius: "10px", background: "#333", color: "#fff" },
          });
        }
      } else {
        toast.error(data.message || "حدث خطأ");
      }
    } catch (error) {
      console.error("Quick-add failed:", error);
      toast.error("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  // Add or move car to a specific menu
  const addToMenu = async (menuId: number, menuName: string) => {
    // If car is already in this menu, do nothing
    if (currentWatchlist?.id === menuId) {
      toast.success("السيارة موجودة بالفعل في هذه القائمة", {
        icon: "✓",
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/dealer/watchlists/quick-add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ car_id: carId, menu_id: menuId }),
      });

      const data = await response.json();

      if (data.status === "success") {
        setIsInWatchlist(true);
        setCurrentWatchlist({ id: menuId, name: menuName });
        setIsOpen(false);

        // Different toast based on action
        if (data.action === "moved") {
          toast.success(data.message || `تم نقل السيارة إلى "${menuName}"`, {
            icon: "↔️",
            style: { borderRadius: "10px", background: "#333", color: "#fff" },
          });
        } else {
          toast.success(data.message || `تمت الإضافة إلى "${menuName}"`, {
            icon: "❤️",
            style: { borderRadius: "10px", background: "#333", color: "#fff" },
          });
        }

        // Update local state - only this menu has the car now
        setMenus((prev) =>
          prev.map((m) => ({ ...m, has_car: m.id === menuId })),
        );
      } else {
        toast.error(data.message || "حدث خطأ");
      }
    } catch (error) {
      console.error("Add to menu failed:", error);
      toast.error("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  // Create new menu and add car
  const createMenuAndAdd = async () => {
    if (!newMenuName.trim()) return;

    setCreatingMenu(true);
    try {
      // First create the menu
      const createResponse = await fetch("/api/dealer/watchlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newMenuName }),
      });

      const createData = await createResponse.json();

      if (createData.status === "success") {
        // Then add the car to the new menu
        const addResponse = await fetch("/api/dealer/watchlists/quick-add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            car_id: carId,
            menu_id: createData.data.id,
          }),
        });

        const addData = await addResponse.json();

        if (addData.status === "success") {
          setIsInWatchlist(true);
          setCurrentWatchlist({
            id: createData.data.id,
            name: newMenuName,
          });
          setIsOpen(false);
          setShowCreateInput(false);
          setNewMenuName("");

          const actionText =
            addData.action === "moved"
              ? `تم نقل السيارة إلى "${newMenuName}"`
              : `تم إنشاء قائمة "${newMenuName}" وإضافة السيارة`;

          toast.success(actionText, {
            icon: "✨",
            style: { borderRadius: "10px", background: "#333", color: "#fff" },
          });
        }
      } else {
        toast.error(createData.message || "فشل إنشاء القائمة");
      }
    } catch (error) {
      console.error("Create menu failed:", error);
      toast.error("حدث خطأ في الاتصال");
    } finally {
      setCreatingMenu(false);
    }
  };

  // Remove car from watchlist
  const removeFromWatchlist = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dealer/watchlists/quick-remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ car_id: carId }),
      });

      const data = await response.json();

      if (data.status === "success") {
        setIsInWatchlist(false);
        setCurrentWatchlist(null);
        setIsOpen(false);
        // Update menus to show none has the car
        setMenus((prev) => prev.map((m) => ({ ...m, has_car: false })));
        toast.success(data.message || "تمت إزالة السيارة من القائمة", {
          icon: "🗑️",
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        });
      } else {
        toast.error(data.message || "حدث خطأ");
      }
    } catch (error) {
      console.error("Remove from watchlist failed:", error);
      toast.error("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Heart Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        disabled={loading}
        className={cn(
          "rounded-full transition-all duration-300",
          isInWatchlist
            ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
            : "bg-white/90 dark:bg-slate-800/90 text-foreground/60 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 border border-border/50",
          sizeClasses[size],
          className,
        )}
      >
        {loading ? (
          <Loader2 className={cn("animate-spin", iconSizes[size])} />
        ) : (
          <Heart
            className={cn(iconSizes[size], isInWatchlist && "fill-current")}
          />
        )}
      </motion.button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute z-50 left-0 top-full mt-2 w-60 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
            dir="rtl"
          >
            {/* Header */}
            <div className="px-3 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isInWatchlist ? (
                  <ArrowRightLeft className="w-4 h-4 text-primary" />
                ) : (
                  <Plus className="w-4 h-4 text-primary" />
                )}
                <span className="text-sm font-medium text-foreground">
                  {isInWatchlist ? "نقل السيارة" : "إضافة إلى قائمة"}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-border rounded-full"
              >
                <X className="w-3 h-3 text-foreground/50" />
              </button>
            </div>

            {/* Current Watchlist Info with Remove Button */}
            {isInWatchlist && currentWatchlist && (
              <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border-b border-border flex items-center justify-between">
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  موجودة في:{" "}
                  <span className="font-bold">{currentWatchlist.name}</span>
                </p>
                <button
                  onClick={removeFromWatchlist}
                  disabled={loading}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  إزالة
                </button>
              </div>
            )}

            {/* Menu List */}
            <div className="max-h-48 overflow-y-auto">
              {menus.map((menu) => (
                <button
                  key={menu.id}
                  onClick={() => addToMenu(menu.id, menu.name)}
                  disabled={menu.has_car}
                  className={cn(
                    "w-full px-3 py-2.5 text-right flex items-center justify-between transition-colors",
                    menu.has_car
                      ? "bg-emerald-500/5 text-emerald-500 cursor-default"
                      : "hover:bg-muted/50 text-foreground",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{menu.name}</span>
                    <span className="text-xs text-foreground/40">
                      ({menu.count})
                    </span>
                  </div>
                  {menu.has_car && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>

            {/* Create New */}
            <div className="border-t border-border">
              {showCreateInput ? (
                <div className="p-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={newMenuName}
                    onChange={(e) => setNewMenuName(e.target.value)}
                    placeholder="اسم القائمة..."
                    className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") createMenuAndAdd();
                      if (e.key === "Escape") setShowCreateInput(false);
                    }}
                  />
                  <button
                    onClick={createMenuAndAdd}
                    disabled={creatingMenu || !newMenuName.trim()}
                    className="p-1.5 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
                  >
                    {creatingMenu ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateInput(true)}
                  className="w-full px-3 py-2.5 text-right flex items-center gap-2 text-primary hover:bg-primary/5 transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span className="text-sm font-medium">قائمة جديدة</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
