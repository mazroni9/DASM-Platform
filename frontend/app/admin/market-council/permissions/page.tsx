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
  AlertCircle,
  Inbox,
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
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [permissionsError, setPermissionsError] = useState(false);
  const [usersError, setUsersError] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [userSelections, setUserSelections] = useState<Record<number, number[]>>({});

  const fetchPermissions = useCallback(async () => {
    setLoadingPermissions(true);
    setPermissionsError(false);
    try {
      const res = await api.get("/api/admin/market-council/permissions/list");
      const data = res?.data?.data;
      setPermissions(Array.isArray(data) ? data : []);
    } catch {
      setPermissions([]);
      setPermissionsError(true);
      toast.error("تعذر تحميل صلاحيات مجلس السوق");
    } finally {
      setLoadingPermissions(false);
    }
  }, []);

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoadingUsers(true);
      setUsersError(false);
      try {
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
        setUsersError(true);
        toast.error("تعذر تحميل المستخدمين");
      } finally {
        setLoadingUsers(false);
      }
    },
    [permissions, search]
  );

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    if (permissions.length > 0) fetchUsers(currentPage);
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

  const permissionsReady = !loadingPermissions;
  const hasPermissions = permissions.length > 0;
  const showUsersSection = permissionsReady && hasPermissions;
  const canSearchOrRefresh = showUsersSection;

  return (
    <div className="space-y-6 p-2" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          صلاحيات مجلس السوق
        </h1>
        {canSearchOrRefresh && (
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
              disabled={loadingUsers}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
              aria-label="تحديث"
            >
              <RefreshCw className={`w-4 h-4 ${loadingUsers ? "animate-spin" : ""}`} />
            </button>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        حدّد صلاحيات مجلس السوق لكل مستخدم. منح صلاحية مثل &quot;الدخول لاستوديو مجلس السوق&quot; يجعل الاستوديو يظهر في لوحة المستخدم.
      </p>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* 1. Loading permissions */}
        {loadingPermissions ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">جاري تحميل صلاحيات مجلس السوق...</p>
          </div>
        ) : /* 2. Permissions load failed */ permissionsError ? (
          <div className="py-16 px-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <p className="text-destructive font-semibold text-lg mb-2">تعذر تحميل صلاحيات مجلس السوق</p>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              حدث خطأ أثناء جلب البيانات. تأكد من اتصالك بالشبكة وحاول مجددًا.
            </p>
            <button
              onClick={fetchPermissions}
              className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : /* 3. Permissions empty */ permissions.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground font-semibold text-lg mb-2">لا توجد صلاحيات مجلس السوق معرفة في النظام</p>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              صلاحيات <code className="bg-muted px-1 rounded">council.*</code> غير موجودة في النظام. يحتاج المسؤول لإضافة صلاحيات المجلس قبل إدارة صلاحيات المستخدمين.
            </p>
          </div>
        ) : /* 4. Loading users (permissions loaded, fetching users) */ loadingUsers && users.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">جاري تحميل المستخدمين...</p>
          </div>
        ) : /* 5. Users load failed */ usersError && users.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <p className="text-destructive font-semibold text-lg mb-2">تعذر تحميل المستخدمين</p>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              حدث خطأ أثناء جلب قائمة المستخدمين. حاول مجددًا.
            </p>
            <button
              onClick={() => fetchUsers(currentPage)}
              className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : /* 6. Users empty results (success, but no users match) */ users.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <Inbox className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground font-medium mb-1">لا يوجد مستخدمين</p>
            <p className="text-muted-foreground text-sm">لم يتم العثور على نتائج تطابق البحث.</p>
          </div>
        ) : (
          /* 7. Users table with data */
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

        {showUsersSection && lastPage > 1 && (
          <div className="flex justify-center gap-2 p-3 border-t border-border">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loadingUsers}
              className="px-3 py-1 rounded border border-border disabled:opacity-50"
            >
              السابق
            </button>
            <span className="px-3 py-1 text-muted-foreground">
              {currentPage} / {lastPage}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
              disabled={currentPage >= lastPage || loadingUsers}
              className="px-3 py-1 rounded border border-border disabled:opacity-50"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
