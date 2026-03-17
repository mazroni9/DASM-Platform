"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import api from "@/lib/axios";
import Footer from "@/components/shared/Footer";
import LoadingLink from "@/components/LoadingLink";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Calendar,
  Tags,
  Image as ImageIcon,
  Clock,
  Eye,
  MessageCircle,
  ThumbsUp,
  Bookmark,
  CheckCircle,
  Share2,
  Link2,
  Loader2,
} from "lucide-react";

type MarketArticle = {
  id?: number | string;
  title_ar: string;
  title_en?: string | null;
  slug: string;
  content_ar?: string | null;
  content_en?: string | null;
  excerpt_ar?: string | null;
  excerpt_en?: string | null;
  cover_image?: string | null;
  author_name?: string | null;
  read_time?: number;
  views_count?: number;
  comments_count?: number;
  likes_count?: number;
  saves_count?: number;
  helpful_count?: number;
  published_at?: string | null;
  category?: { id: number | string; name_ar: string; name_en?: string | null; slug: string } | null;
  user_reactions?: string[];
  contexts?: { id?: number; context_type: string; context_key?: string | null }[];
};

function safeDateLabel(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "—";
  }
}

function isBadSlug(s: string) {
  const v = (s || "").trim();
  return !v || v === "undefined" || v === "null";
}

function safeDecode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function escapeHtml(text: string) {
  return (text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function contentToHtml(content: string) {
  const c = (content || "").trim();
  if (!c) return "";
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(c);
  if (looksLikeHtml) return c;
  return escapeHtml(c).replace(/\n/g, "<br />");
}

function isAbortError(err: unknown) {
  const e = err as { name?: string; code?: string; message?: string };
  const m = String(e?.message || "").toLowerCase();
  return (
    e?.name === "CanceledError" ||
    e?.name === "AbortError" ||
    e?.code === "ERR_CANCELED" ||
    m.includes("canceled") ||
    m.includes("aborted")
  );
}

export default function MarketCouncilArticlePage({
  params,
}: {
  params?: { slug?: string | string[] };
}) {
  const routeParams = useParams();
  const pathname = usePathname();

  const { isLoggedIn } = useAuth();
  const slug = useMemo(() => {
    const p = params?.slug;
    const fromProps = typeof p === "string" ? p : Array.isArray(p) ? p[0] : "";
    const rp = routeParams as { slug?: string | string[] };
    const r = rp?.slug;
    const fromRoute = typeof r === "string" ? r : Array.isArray(r) ? r[0] : "";
    const parts = (pathname || "").split("/").filter(Boolean);
    const last = parts.length ? parts[parts.length - 1] : "";
    const fromPath = last ? safeDecode(last) : "";
    return safeDecode((fromProps || fromRoute || fromPath || "").trim()).trim();
  }, [params?.slug, routeParams, pathname]);

  const [article, setArticle] = useState<MarketArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [reactingType, setReactingType] = useState<string | null>(null);
  const [comments, setComments] = useState<{ id: number; content: string; created_at: string; user_name: string }[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [moderationMessage, setModerationMessage] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<{ id: number | string; title_ar: string; excerpt_ar?: string | null; slug: string; read_time?: number; category?: { name_ar: string } | null }[]>([]);

  const lastFetchedSlugRef = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const cover = useMemo(() => (article ? (article.cover_image || "").trim() : ""), [article]);
  const dateLabel = useMemo(() => (article ? safeDateLabel(article.published_at) : "—"), [article]);
  const articleHtml = useMemo(
    () => (article ? contentToHtml(article.content_ar || article.content_en || "") : ""),
    [article]
  );

  const fetchArticle = async (slugValue: string) => {
    const clean = (slugValue || "").trim();

    if (isBadSlug(clean)) {
      setArticle(null);
      setLoading(false);
      return;
    }

    if (lastFetchedSlugRef.current === clean) return;
    lastFetchedSlugRef.current = clean;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      const encoded = encodeURIComponent(clean);
      const res = await api.get(`/api/market-council/articles/${encoded}`, {
        signal: controller.signal,
      });
      const payload = res?.data;

      if (payload?.success === false) {
        setArticle(null);
        return;
      }

      const data = payload?.data ?? null;
      setArticle(data && data?.title_ar ? (data as MarketArticle) : null);
    } catch (err: unknown) {
      if (isAbortError(err)) return;
      setArticle(null);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticle(slug);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const ctxList = (article?.contexts || []) as { context_type?: string }[];
    const firstCtx = ctxList.find((c) => c?.context_type);
    if (!article?.id || !firstCtx?.context_type) {
      setRelatedArticles([]);
      return;
    }
    let mounted = true;
    api
      .get("/api/market-council/recommended", {
        params: { context_type: firstCtx.context_type, limit: 3, exclude_article_id: article.id },
      })
      .then((res) => {
        const data = res?.data?.data ?? res?.data;
        const list = Array.isArray(data) ? data : [];
        if (mounted) setRelatedArticles(list.slice(0, 3));
      })
      .catch(() => {
        if (mounted) setRelatedArticles([]);
      });
    return () => { mounted = false; };
  }, [article?.id, article?.contexts]);

  useEffect(() => {
    if (!article?.id) return;
    setModerationMessage(false);
    let mounted = true;
    setCommentsLoading(true);
    api
      .get(`/api/market-council/articles/${article.id}/comments`)
      .then((res) => {
        const data = res?.data?.data ?? [];
        if (mounted) setComments(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (mounted) setComments([]);
      })
      .finally(() => {
        if (mounted) setCommentsLoading(false);
      });
    return () => { mounted = false; };
  }, [article?.id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      useAuthStore.getState().openAuthModal("login");
      return;
    }
    if (!article?.id || !commentContent.trim() || commentContent.trim().length < 3) return;
    setCommentSubmitting(true);
    setModerationMessage(false);
    try {
      await api.post(`/api/market-council/articles/${article.id}/comments`, {
        content: commentContent.trim(),
      });
      setCommentContent("");
      setModerationMessage(true);
    } catch {
      toast.error("حدث خطأ في إرسال التعليق");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleReaction = async (type: "like" | "save" | "helpful") => {
    if (!isLoggedIn) {
      useAuthStore.getState().openAuthModal("login");
      return;
    }
    if (!article?.id) return;
    setReactingType(type);
    try {
      const userReactions = (article.user_reactions || []) as string[];
      const isActive = userReactions.includes(type);
      if (isActive) {
        const res = await api.delete(`/api/market-council/articles/${article.id}/react?type=${type}`);
        const counts = res?.data?.data?.counts;
        setArticle((prev) =>
          prev
            ? {
                ...prev,
                user_reactions: (prev.user_reactions || []).filter((t) => t !== type),
                likes_count: counts?.likes_count ?? prev.likes_count,
                saves_count: counts?.saves_count ?? prev.saves_count,
                helpful_count: counts?.helpful_count ?? prev.helpful_count,
              }
            : null
        );
      } else {
        const res = await api.post(`/api/market-council/articles/${article.id}/react`, { type });
        const counts = res?.data?.data?.counts;
        setArticle((prev) =>
          prev
            ? {
                ...prev,
                user_reactions: [...(prev.user_reactions || []), type],
                likes_count: counts?.likes_count ?? prev.likes_count,
                saves_count: counts?.saves_count ?? prev.saves_count,
                helpful_count: counts?.helpful_count ?? prev.helpful_count,
              }
            : null
        );
      }
    } catch {
      toast.error("حدث خطأ في الاتصال");
    } finally {
      setReactingType(null);
    }
  };

  const handleWhatsAppShare = () => {
    if (!article?.slug) return;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${url}/market-council/${article.slug}`;
    const text = `${article.title_ar}\n${fullUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    if (!article?.slug) return;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${url}/market-council/${article.slug}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("تم نسخ الرابط");
    } catch {
      toast.error("تعذر نسخ الرابط");
    }
  };

  const reactionButtons: { type: "like" | "save" | "helpful"; label: string; Icon: typeof ThumbsUp }[] = [
    { type: "like", label: "إعجاب", Icon: ThumbsUp },
    { type: "save", label: "حفظ", Icon: Bookmark },
    { type: "helpful", label: "مفيد", Icon: CheckCircle },
  ];

  return (
    <>
      {/* Top bar */}
      <section className="bg-background border-b border-border">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-6 rtl">
          <LoadingLink
            href="/market-council"
            className="inline-flex items-center gap-2 text-foreground/70 hover:text-foreground font-semibold"
          >
            <ArrowRight className="w-4 h-4" />
            الرجوع لمجلس السوق
          </LoadingLink>
        </div>
      </section>

      {/* Content */}
      <section className="bg-background">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-8 md:py-12 rtl">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
              <div className="lg:col-span-12">
                <div className="h-[280px] md:h-[420px] bg-card border border-border rounded-3xl overflow-hidden">
                  <div className="h-full bg-border/70" />
                </div>
              </div>
              <div className="lg:col-span-9">
                <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-4">
                  <div className="h-4 w-40 bg-border rounded" />
                  <div className="h-8 w-3/4 bg-border rounded" />
                  <div className="h-4 w-full bg-border rounded" />
                  <div className="h-4 w-5/6 bg-border rounded" />
                  <div className="h-4 w-4/6 bg-border rounded" />
                </div>
              </div>
              <div className="lg:col-span-3">
                <div className="bg-card border border-border rounded-3xl p-5 md:p-6 space-y-3">
                  <div className="h-4 w-2/3 bg-border rounded" />
                  <div className="h-10 w-full bg-border rounded" />
                  <div className="h-10 w-full bg-border rounded" />
                </div>
              </div>
            </div>
          ) : !article ? (
            <div className="bg-card border border-border rounded-3xl p-10 text-center">
              <p className="text-foreground font-bold text-lg">المقال غير موجود</p>
              <p className="text-foreground/60 text-sm mt-2">قد يكون تم حذفه أو تغيير الرابط.</p>

              <div className="mt-6 flex justify-center">
                <LoadingLink
                  href="/market-council"
                  className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold transition"
                >
                  الرجوع لمجلس السوق
                </LoadingLink>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Hero */}
              <div className="lg:col-span-12">
                <div className="relative rounded-3xl overflow-hidden border border-border bg-card">
                  <div className="h-[280px] md:h-[440px] bg-border/60">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={article.title_ar}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-foreground/60">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-5 h-5" />
                          لا يوجد صورة
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/35 to-transparent" />

                  <div className="absolute bottom-0 right-0 left-0 p-5 md:p-8">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-foreground/80">
                      <span className="inline-flex items-center gap-2 bg-card/70 border border-border backdrop-blur px-3 py-1.5 rounded-full">
                        <Tags className="w-4 h-4 text-primary" />
                        {article.category?.name_ar || "—"}
                      </span>
                      <span className="inline-flex items-center gap-2 bg-card/70 border border-border backdrop-blur px-3 py-1.5 rounded-full">
                        <Calendar className="w-4 h-4 text-primary" />
                        {dateLabel}
                      </span>
                      <span className="inline-flex items-center gap-2 bg-card/70 border border-border backdrop-blur px-3 py-1.5 rounded-full">
                        <Clock className="w-4 h-4 text-primary" />
                        {article.read_time ?? 1} د
                      </span>
                      <span className="inline-flex items-center gap-2 bg-card/70 border border-border backdrop-blur px-3 py-1.5 rounded-full">
                        <Eye className="w-4 h-4 text-primary" />
                        {article.views_count ?? 0}
                      </span>
                      {typeof article.comments_count === "number" ? (
                        <span className="inline-flex items-center gap-2 bg-card/70 border border-border backdrop-blur px-3 py-1.5 rounded-full">
                          <MessageCircle className="w-4 h-4 text-primary" />
                          {article.comments_count} تعليق
                        </span>
                      ) : null}
                    </div>

                    <h1 className="mt-4 text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-foreground">
                      {article.title_ar}
                    </h1>

                    {article.author_name ? (
                      <p className="mt-2 text-foreground/70 text-sm md:text-base">
                        بقلم: {article.author_name}
                      </p>
                    ) : null}

                    {article.excerpt_ar || article.excerpt_en ? (
                      <p className="mt-3 text-foreground/80 leading-relaxed text-base md:text-lg max-w-4xl">
                        {article.excerpt_ar || article.excerpt_en}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Article body */}
              <div className="lg:col-span-9">
                <article className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <div>
                      <div className="text-xs font-bold text-foreground/50">محتوى المقال</div>
                      <div className="h-1 w-14 bg-primary/30 rounded-full mt-2" />
                    </div>
                    <div className="text-xs text-foreground/50">{dateLabel}</div>
                  </div>

                  <div
                    className="
                      prose prose-zinc dark:prose-invert max-w-none
                      prose-p:leading-8 prose-li:leading-8
                      prose-headings:font-extrabold prose-headings:text-foreground
                      prose-a:text-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                      prose-img:rounded-2xl prose-img:border prose-img:border-border
                      prose-hr:border-border
                      prose-blockquote:border-primary/30
                    "
                  >
                    <div dangerouslySetInnerHTML={{ __html: articleHtml }} />
                  </div>

                  {/* Article Actions: إعجاب، حفظ، مفيد، واتساب، نسخ الرابط */}
                  <div className="mt-10 pt-6 border-t border-border">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {reactionButtons.map(({ type, label, Icon }) => {
                        const userReactions = (article.user_reactions || []) as string[];
                        const isActive = userReactions.includes(type);
                        const count =
                          type === "like"
                            ? article.likes_count ?? 0
                            : type === "save"
                              ? article.saves_count ?? 0
                              : article.helpful_count ?? 0;
                        const loading = reactingType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleReaction(type)}
                            disabled={loading}
                            className={`
                              inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold
                              border transition-all duration-200
                              ${isActive
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-background/50 border-border text-foreground/70 hover:border-primary/50 hover:text-primary"}
                            `}
                            aria-label={label}
                            title={label}
                          >
                            {loading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Icon className={`w-4 h-4 ${isActive ? "fill-current" : ""}`} />
                            )}
                            <span>{label}</span>
                            {count > 0 && (
                              <span className="text-xs opacity-80">({count})</span>
                            )}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={handleWhatsAppShare}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-border bg-background/50 text-foreground/70 hover:border-primary/50 hover:text-primary transition-all duration-200"
                        aria-label="واتساب"
                        title="مشاركة عبر واتساب"
                      >
                        <Share2 className="w-4 h-4" />
                        واتساب
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-border bg-background/50 text-foreground/70 hover:border-primary/50 hover:text-primary transition-all duration-200"
                        aria-label="نسخ الرابط"
                        title="نسخ الرابط"
                      >
                        <Link2 className="w-4 h-4" />
                        نسخ الرابط
                      </button>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-10 pt-8 border-t border-border">
                    <LoadingLink
                      href="/auctions"
                      className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl font-extrabold transition"
                    >
                      طبّق هذه المعرفة في المزاد الآن
                      <ArrowRight className="w-4 h-4" />
                    </LoadingLink>
                  </div>

                  {/* Comments Section - التعليقات */}
                  <div className="mt-10 pt-8 border-t border-border">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-primary" />
                      التعليقات
                      {comments.length > 0 && (
                        <span className="text-sm font-normal text-foreground/60">({comments.length})</span>
                      )}
                    </h3>

                    {commentsLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-16 bg-border/40 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-foreground/60 py-6 text-center rounded-xl bg-background/40 border border-dashed border-border">
                        لا توجد تعليقات بعد
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {comments.map((c) => (
                          <div
                            key={c.id}
                            className="rounded-xl border border-border bg-background/40 p-4"
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="font-bold text-foreground text-sm">{c.user_name}</span>
                              <span className="text-xs text-foreground/50">
                                {c.created_at
                                  ? new Date(c.created_at).toLocaleDateString("ar-SA", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "—"}
                              </span>
                            </div>
                            <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">
                              {c.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {isLoggedIn ? (
                      <form onSubmit={handleCommentSubmit} className="mt-6">
                        <label htmlFor="comment-content" className="block text-sm font-bold text-foreground mb-2">
                          أضف تعليقك
                        </label>
                        <textarea
                          id="comment-content"
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          placeholder="اكتب تعليقك هنا"
                          rows={4}
                          maxLength={2000}
                          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                          disabled={commentSubmitting}
                        />
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            type="submit"
                            disabled={commentSubmitting || commentContent.trim().length < 3}
                            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                          >
                            {commentSubmitting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : null}
                            إرسال التعليق
                          </button>
                          {moderationMessage && (
                            <span className="text-sm text-primary font-medium">
                              تم استلام تعليقك وسيظهر بعد المراجعة
                            </span>
                          )}
                        </div>
                      </form>
                    ) : (
                      <div className="mt-6 p-4 rounded-xl border border-border bg-background/40 text-center">
                        <p className="text-foreground/70 text-sm mb-3">سجّل الدخول لإضافة تعليق</p>
                        <button
                          type="button"
                          onClick={() => useAuthStore.getState().openAuthModal("login")}
                          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-colors"
                        >
                          تسجيل الدخول
                        </button>
                      </div>
                    )}
                  </div>

                  {/* مقالات ذات صلة - Related Articles */}
                  {relatedArticles.length > 0 && (
                    <div className="mt-10 pt-8 border-t border-border">
                      <h3 className="text-lg font-bold text-foreground mb-4">مقالات ذات صلة</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {relatedArticles.map((rel) => (
                          <LoadingLink key={rel.id} href={`/market-council/${rel.slug}`}>
                            <div className="rounded-xl border border-border bg-background/40 p-4 hover:border-primary/30 transition-colors h-full flex flex-col">
                              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded mb-2 inline-block w-fit">
                                {rel.category?.name_ar || "—"}
                              </span>
                              <h4 className="font-bold text-foreground text-sm line-clamp-2 mb-1 flex-1">{rel.title_ar}</h4>
                              <span className="text-xs text-foreground/50 flex items-center gap-1 mt-2">
                                <Clock className="w-3 h-3" />
                                {rel.read_time ?? 1} د
                              </span>
                            </div>
                          </LoadingLink>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-3">
                <div className="bg-card border border-border rounded-3xl p-5 md:p-6 shadow-sm lg:sticky lg:top-6 space-y-3">
                  <div className="rounded-2xl border border-border bg-background/40 p-4">
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <Tags className="w-4 h-4 text-primary" />
                      التصنيف
                    </div>
                    <p className="font-extrabold text-foreground mt-1">
                      {article.category?.name_ar || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-background/40 p-4">
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <Calendar className="w-4 h-4 text-primary" />
                      تاريخ النشر
                    </div>
                    <p className="font-bold text-foreground mt-1">{dateLabel}</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-background/40 p-4">
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <Clock className="w-4 h-4 text-primary" />
                      وقت القراءة
                    </div>
                    <p className="font-bold text-foreground mt-1">{article.read_time ?? 1} دقيقة</p>
                  </div>

                  {typeof article.comments_count === "number" ? (
                    <div className="rounded-2xl border border-border bg-background/40 p-4">
                      <div className="flex items-center gap-2 text-sm text-foreground/70">
                        <MessageCircle className="w-4 h-4 text-primary" />
                        التعليقات
                      </div>
                      <p className="font-bold text-foreground mt-1">{article.comments_count}</p>
                    </div>
                  ) : null}

                  <div className="flex">
                    <LoadingLink
                      href="/market-council"
                      className="w-full bg-border hover:bg-border/80 py-3 rounded-2xl font-extrabold transition text-center"
                    >
                      رجوع
                    </LoadingLink>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
