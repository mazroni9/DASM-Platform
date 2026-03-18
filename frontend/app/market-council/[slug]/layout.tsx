import type { Metadata } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string }> | { slug?: string };
}): Promise<Metadata> {
  const resolved = params && typeof (params as Promise<unknown>).then === "function"
    ? await (params as Promise<{ slug?: string }>)
    : (params as { slug?: string });
  const slug = resolved?.slug;

  if (!slug || typeof slug !== "string") {
    return { title: "مجلس السوق | DASM" };
  }

  try {
    const url = `${API_BASE.replace(/\/$/, "")}/api/market-council/articles/${encodeURIComponent(slug)}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    const json = await res.json();

    if (json?.success && json?.data?.title_ar) {
      const title = json.data.title_ar;
      const desc = (json.data.excerpt_ar || json.data.excerpt_en || "").slice(0, 160).trim();
      return {
        title: `${title} | مجلس السوق | DASM`,
        description: desc || undefined,
      };
    }
  } catch {
    // ignore
  }

  return { title: "مجلس السوق | DASM" };
}

export default function MarketCouncilArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
