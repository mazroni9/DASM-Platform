/**
 * Shared display helpers for user records (auth store, profile API, etc.).
 * Keep in sync with GET /api/user/profile shape.
 */

export type UserDisplaySource = {
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  email?: string | null;
  display_location?: string | null;
};

const DEFAULT_NAME = "مستخدم";

export function formatUserFullName(
  src: UserDisplaySource | null | undefined,
  options?: { fallbackEmail?: boolean }
): string {
  const fallbackEmail = options?.fallbackEmail === true;
  if (!src) return DEFAULT_NAME;
  const combined = `${src.first_name ?? ""} ${src.last_name ?? ""}`.trim();
  if (combined) return combined;
  if (src.name && String(src.name).trim()) return String(src.name).trim();
  if (fallbackEmail && src.email) return src.email;
  return DEFAULT_NAME;
}

/** Non-empty trimmed location, or null to hide UI. */
export function pickUserDisplayLocation(
  src: UserDisplaySource | null | undefined
): string | null {
  if (!src) return null;
  const v = src.display_location;
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}
