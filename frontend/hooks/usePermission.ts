import { useAuthStore } from "@/store/authStore";

export function usePermission() {
  const { user } = useAuthStore();

  const can = (permission: string) => {
    if (!user || !user.permissions) return false;

    // Super Admin bypass (optional on frontend, but good for UX)
    // Backend is the source of truth, but this helps show/hide UI
    if (user.role === "super_admin") return true;

    return user.permissions.includes(permission);
  };

  const canAny = (permissions: string[]) => {
    if (!user || !user.permissions) return false;
    if (user.role === "super_admin") return true;
    return permissions.some((p) => user.permissions?.includes(p));
  };

  const canAll = (permissions: string[]) => {
    if (!user || !user.permissions) return false;
    if (user.role === "super_admin") return true;
    return permissions.every((p) => user.permissions?.includes(p));
  };

  return { can, canAny, canAll };
}
