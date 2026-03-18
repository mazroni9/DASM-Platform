/**
 * Slug generation for Market Council articles.
 * Produces ASCII-only, hyphen-separated slugs. Uses fallback for Arabic-only titles.
 */

/** Only ASCII letters, digits, hyphen. No Arabic, no spaces, no punctuation. */
const ASCII_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Check if a string is valid slug (ASCII, lowercase, hyphen-separated).
 */
export function isValidSlug(s: string): boolean {
  const t = (s || "").trim();
  if (!t || t.length > 255) return false;
  return ASCII_SLUG_REGEX.test(t);
}

/**
 * Convert input to ASCII-only slug. Strips non-ASCII.
 * Falls back to article-<shortId> when result would be empty.
 */
function toAsciiSlug(input: string): string {
  const s = (input || "")
    .trim()
    .toLowerCase()
    // Keep only ASCII letters and digits, replace other chars with space
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "";
}

/**
 * Generate a fallback slug when title yields no ASCII (e.g. Arabic-only).
 */
function fallbackSlug(): string {
  return `article-${Date.now().toString(36)}`;
}

/**
 * Generate slug from title(s). Prefers title_en for ASCII; falls back for Arabic-only.
 */
export function generateSlug(titleAr: string, titleEn?: string | null): string {
  const en = (titleEn || "").trim();
  const ar = (titleAr || "").trim();
  const fromEn = toAsciiSlug(en);
  const fromAr = toAsciiSlug(ar);
  const candidate = fromEn || fromAr;
  return candidate || fallbackSlug();
}

/**
 * Sanitize slug before submit. Ensures ASCII-only, or falls back.
 */
export function sanitizeSlugForSubmit(slug: string, titleAr: string, titleEn?: string | null): string {
  const raw = (slug || "").trim();
  const cleaned = toAsciiSlug(raw);
  if (cleaned) return cleaned;
  return generateSlug(titleAr, titleEn);
}
