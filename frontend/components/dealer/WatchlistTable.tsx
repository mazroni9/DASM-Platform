// components/dealer/WatchlistTable.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListChecks,
  Plus,
  TrendingUp,
  Eye,
  Car,
  Trash2,
  Edit3,
  X,
  FolderPlus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface WatchlistMenu {
  id: number;
  name: string;
  count: number;
}

interface WatchlistItem {
  id: number;
  vehicle_id: number;
  name: string;
  type: string;
  image: string | null;
  current_price: number;
  status: string;
  auction_end: string | null;
  menu_id?: number;
  menu_name?: string;
  has_active_auction: boolean;
}

export default function WatchlistTable() {
  const { token } = useAuth();
  const [menus, setMenus] = useState<WatchlistMenu[]>([]);
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<number | "all">("all");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");
  const [creating, setCreating] = useState(false);

  // Fetch watchlist menus
  const fetchMenus = async () => {
    try {
      const response = await fetch("/api/dealer/watchlists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.status === "success") {
        setMenus(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch watchlist menus:", error);
    }
  };

  // Fetch items (all or by menu)
  const fetchItems = async (menuId: number | "all") => {
    setLoading(true);
    try {
      const url =
        menuId === "all"
          ? "/api/dealer/watchlists/all-items"
          : `/api/dealer/watchlists/${menuId}/items`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.status === "success") {
        setItems(menuId === "all" ? data.data : data.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch watchlist items:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create new menu
  const handleCreateMenu = async () => {
    if (!newMenuName.trim()) return;
    setCreating(true);

    try {
      const response = await fetch("/api/dealer/watchlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newMenuName }),
      });

      const data = await response.json();
      if (data.status === "success") {
        setMenus((prev) => [...prev, data.data]);
        setNewMenuName("");
        setShowCreateModal(false);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Failed to create menu:", error);
    } finally {
      setCreating(false);
    }
  };

  // Delete menu
  const handleDeleteMenu = async (menuId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه القائمة؟")) return;

    try {
      const response = await fetch(`/api/dealer/watchlists/${menuId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setMenus((prev) => prev.filter((m) => m.id !== menuId));
        if (activeMenuId === menuId) {
          setActiveMenuId("all");
        }
      }
    } catch (error) {
      console.error("Failed to delete menu:", error);
    }
  };

  // Remove item from menu
  const handleRemoveItem = async (menuId: number, carId: number) => {
    try {
      const response = await fetch(
        `/api/dealer/watchlists/${menuId}/items/${carId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setItems((prev) =>
          prev.filter(
            (item) => !(item.menu_id === menuId && item.vehicle_id === carId)
          )
        );
        // Update menu count
        setMenus((prev) =>
          prev.map((m) => (m.id === menuId ? { ...m, count: m.count - 1 } : m))
        );
      }
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (token) {
      fetchMenus();
      fetchItems("all");
    }
  }, [token]);

  // Fetch items when active menu changes
  useEffect(() => {
    if (token) {
      fetchItems(activeMenuId);
    }
  }, [activeMenuId, token]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "text-emerald-400 bg-emerald-500/10";
      case "ended":
        return "text-gray-400 bg-gray-500/10";
      case "pending":
        return "text-amber-400 bg-amber-500/10";
      default:
        return "text-gray-400 bg-gray-500/10";
    }
  };

  const totalCount = menus.reduce((sum, m) => sum + m.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card backdrop-blur-xl border border-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <ListChecks className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">قوائم المراقبة</h3>
              <p className="text-xs text-foreground/50">
                إدارة السيارات المفضلة
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-foreground/50">القوائم:</span>
              <span className="font-bold text-foreground">{menus.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-foreground/50">السيارات:</span>
              <span className="font-bold text-primary">{totalCount}</span>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              <span className="text-sm">قائمة جديدة</span>
            </button>
          </div>
        </div>

        {/* Menu Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveMenuId("all")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300",
              activeMenuId === "all"
                ? "bg-primary text-white"
                : "bg-background/50 text-foreground/60 hover:bg-border hover:text-foreground"
            )}
          >
            الكل ({totalCount})
          </button>
          {menus.map((menu) => (
            <div key={menu.id} className="relative group">
              <button
                onClick={() => setActiveMenuId(menu.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 pr-8",
                  activeMenuId === menu.id
                    ? "bg-primary text-white"
                    : "bg-background/50 text-foreground/60 hover:bg-border hover:text-foreground"
                )}
              >
                {menu.name} ({menu.count})
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMenu(menu.id);
                }}
                className="absolute left-1 top-1/2 -translate-y-1/2 p-1 text-foreground/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-foreground/50">
            <Car className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>لا توجد سيارات في هذه القائمة</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-background/50 border-b border-border">
                <th className="text-right py-3 px-4 text-xs font-medium text-foreground/50">
                  السيارة
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-foreground/50">
                  النوع
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-foreground/50">
                  السعر الحالي
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-foreground/50">
                  الحالة
                </th>
                {activeMenuId === "all" && (
                  <th className="text-right py-3 px-4 text-xs font-medium text-foreground/50">
                    القائمة
                  </th>
                )}
                <th className="text-center py-3 px-4 text-xs font-medium text-foreground/50">
                  إجراء
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <motion.tr
                  key={`${item.id}-${item.vehicle_id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-border hover:bg-background/30 transition-colors group"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Car className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <p className="font-medium text-foreground">{item.name}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-foreground/70">
                      {item.type || "N/A"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-foreground">
                      {item.current_price.toLocaleString()} ر.س
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded",
                        getStatusColor(item.status)
                      )}
                    >
                      {item.status === "active" ? "نشط" : item.status}
                    </span>
                  </td>
                  {activeMenuId === "all" && (
                    <td className="py-3 px-4">
                      <span className="text-xs text-foreground/50">
                        {item.menu_name}
                      </span>
                    </td>
                  )}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 bg-primary/10 text-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleRemoveItem(
                            item.menu_id || (activeMenuId as number),
                            item.vehicle_id
                          )
                        }
                        className="p-2 bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Menu Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-foreground mb-4">
                إنشاء قائمة جديدة
              </h3>
              <input
                type="text"
                value={newMenuName}
                onChange={(e) => setNewMenuName(e.target.value)}
                placeholder="اسم القائمة (مثال: سيارات فاخرة)"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-background border border-border rounded-lg text-foreground/70 hover:bg-border transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCreateMenu}
                  disabled={creating || !newMenuName.trim()}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "إنشاء"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
