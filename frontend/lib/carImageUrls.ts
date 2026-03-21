/**
 * يستخرج روابط صور السيارة من استجابة الـ API (يدعم images_list من Laravel + الحقول القديمة).
 */
export function getCarImageUrls(car: unknown): string[] {
  if (car === null || car === undefined) return [];
  if (typeof car !== "object") return [];
  const c = car as Record<string, unknown>;

  const list = c["images_list"];
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

  const single = c["image_url"] ?? c["image"];
  if (typeof single === "string" && single.trim()) return [single.trim()];

  return [];
}
