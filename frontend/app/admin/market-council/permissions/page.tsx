"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import {
  Shield,
  Loader2,
  Search,
  RefreshCw,
  Save,
} from "lucide-react";

type CouncilPermission = { id: number; name: string; display_name: string };

type UserWithCouncilPerms = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  type: string;
  council_permissions: string[];
};

const TYPE_LABELS: Record<string, string> = {
  user: "مستخدم",
  dealer: "تاجر",
  admin: "مدير",
  super_admin: "مدير النظام",
  moderator: "مشرف",
  venue_owner: "مالك معرض",
  investor: "مستثمر",
};

function normalizePaginated<T>(resData: unknown): {
  list: T[];
  current_page?: number;
  last_page?: number;
} {
  const root = resData as { status?: string; data?: unknown };
  if (!root?.data) return { list: [] };
  const d = root.data as { data?: T[]; current_page?: number; last_page?: number };
  if (d && typeof d === "object" && Array.isArray((d as any).data)) {
    const paginated = d as { data: T[]; current_page?: number; last_page?: number };
    return {
      list: paginated.data,
      current_page: paginated.current_page ?? 1,
      last_page: paginated.last_page ?? 1,
    };
  }
  return { list: [] };
}

export default function AdminCouncilPermissionsPage() {
  const [permissions, setPermissions] = useState<CouncilPermission[]>([]);
  const [users, setUsers] = useState<UserWithCouncilPerms[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [userSelections, setUserSelections] = useState<Record<number, number[]>>({});

  const fetchPermissions = async () => {
    try {
      const res = await api.get("/api/admin/market-council/permissions/list");
      const data = res?.data?.data;
      setPermissions(Array.isArray(data) ? data : []);
    } catch {
      setPermissions([]);
      toast.error("تعذر تحميل صلاحيات مجلس السوق");
    }
  };

  const fetchUsers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params: Record<string, string | number> = { page, per_page: 15 };
        if (search.trim()) params.search = search.trim();
        const res = await api.get("/api/admin/market-council/permissions/users", { params });
        const { list, last_page } = normalizePaginated<UserWithCouncilPerms>(res?.data);
        setUsers(list);
        setLastPage(last_page ?? 1);
        setUserSelections((prev) => {
          const next = { ...prev };
          list.forEach((u) => {
            const permIds = permissions
              .filter((p) => u.council_permissions?.includes(p.name))
              .map((p) => p.id);
            next[u.id] = permIds;
          });
          return next;
        });
      } catch {
        setUsers([]);
        toast.error("تعذر تحميل المستخدمين");
      } finally {
        setLoading(false);
      }
    },
    [permissions, search]
  );

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (permissions.length) fetchUsers(currentPage);
  }, [permissions.length, currentPage, fetchUsers]);

  const handleToggle = (userId: number, permId: number, checked: boolean) => {
    setUserSelections((prev) => {
      const curr = prev[userId] ?? [];
      const next = checked ? [...curr, permId] : curr.filter((id) => id !== permId);
      return { ...prev, [userId]: next };
    });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleSave = async (userId: number) => {
    const ids = userSelections[userId] ?? [];
    try {
      setSavingUserId(userId);
      await api.put(`/api/admin/market-council/permissions/users/${userId}`, {
        permission_ids: ids,
      });
      toast.success("تم حفظ صلاحيات مجلس السوق");
      fetchUsers(currentPage);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "تعذر الحفظ");
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="space-y-6 p-2" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          صلاحيات مجلس السوق
        </h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers(1)}
              className="pr-9 pl-3 py-2 rounded-lg border border-border bg-background text-sm w-48"
            />
          </div>
          <button
            onClick={() => fetchUsers(currentPage)}
            disabled={loading}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            aria-label="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        حدّد صلاحيات مجلس السوق لكل مستخدم. منح صلاحية مثل &quot;الدخول لاستوديو مجلس السوق&quot; يجعل الاستوديو يظهر في لوحة المستخدم.
      </p>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            لا يوجد مستخدمين أو لم يتم العثور على نتائج.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-right p-3 font-medium">الاسم</th>
                  <th className="text-right p-3 font-medium">البريد</th>
                  <th className="text-right p-3 font-medium">النوع</th>
                  <th className="text-right p-3 font-medium">صلاحيات المجلس</th>
                  <th className="text-right p-3 font-medium w-24">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="p-3 text-muted-foreground">{user.email}</td>
                    <td className="p-3">{TYPE_LABELS[user.type] ?? user.type}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2 max-w-md">
                        {permissions.map((p) => {
                          const selected = (userSelections[user.id] ?? []).includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className="flex items-center gap-1.5 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(e) =>
                                  handleToggle(user.id, p.id, e.target.checked)
                                }
                                className="rounded border-border"
                              />
                              <span className="text-xs">{p.display_name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleSave(user.id)}
                        disabled={savingUserId === user.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary text-primary-foreground text-xs hover:opacity-90 disabled:opacity-60"
                      >
                        {savingUserId === user.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Save className="w-3 h-3" />
                        )}
                        حفظ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lastPage > 1 && (
          <div className="flex justify-center gap-2 p-3 border-t border-border">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1 rounded border border-border disabled:opacity-50"
            >
              السابق
            </button>
            <span className="px-3 py-1 text-muted-foreground">
              {currentPage} / {lastPage}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
              disabled={currentPage >= lastPage}
              className="px-3 py-1 rounded border border-border disabled:opacity-50"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
