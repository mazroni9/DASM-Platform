/**
 * يستخرج روابط صور السيارة من استجابة الـ API (يدعم images_list من Laravel + الحقول القديمة).
 */
export function getCarImageUrls(
  car: Record<string, unknown> | null | undefined,
): string[] {
  if (!car || typeof car !== "object") return [];

  const list = car["images_list"];
  if (Array.isArray(list)) {
    const out = list
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
    if (out.length) return out;
  }

  const images = car["images"];
  if (Array.isArray(images)) {
    const out: string[] = [];
    for (const item of images) {
      if (typeof item === "string" && item.trim()) {
        out.push(item.trim());
        continue;
      }
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        for (const k of ["url", "secure_url", "path", "image"] as const) {
          const u = o[k];
          if (typeof u === "string" && u.trim()) {
            out.push(u.trim());
            break;
          }
        }
      }
    }
    if (out.length) return out;
  }

  const single = car["image_url"] ?? car["image"];
  if (typeof single === "string" && single.trim()) return [single.trim()];

  return [];
}
