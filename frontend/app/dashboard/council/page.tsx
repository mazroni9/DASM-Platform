"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";
import { usePermission } from "@/hooks/usePermission";
import { FileText, Send, MessageCircle, FolderOpen, CheckCircle2 } from "lucide-react";

type Stats = {
  my_articles?: number;
  pending_review?: number;
  published?: number;
  pending_comments?: number;
  pending_replies?: number;
};

export default function CouncilStudioPage() {
  const { can } = usePermission();
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);

  const canReview = can("council.article.review") || can("council.article.edit_any");
  const canPublish = can("council.article.publish");
  const canCommentReview = can("council.comment.review");

  useEffect(() => {
    let mounted = true;
    api
      .get("/api/council-studio/dashboard")
      .then((res) => {
        if (mounted && res?.data?.success) setStats(res.data.data || {});
      })
      .catch(() => {
        if (mounted) setStats({});
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!canReview && !canPublish) return;
    let mounted = true;
    api
      .get("/api/council-studio/articles", { params: { status: "published", count_only: 1 } })
      .then((res) => {
        if (mounted && res?.data?.success && typeof res.data.count === "number") {
          setStats((s) => ({ ...s, published: res.data.count }));
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [canReview, canPublish]);

  useEffect(() => {
    if (!canCommentReview) return;
    let mounted = true;
    const fetchBoth = async () => {
      try {
        const [commentsRes, repliesRes] = await Promise.all([
          api.get("/api/council-studio/comments", { params: { status: "pending", count_only: 1, type: "comment" } }),
          api.get("/api/council-studio/comments", { params: { status: "pending", count_only: 1, type: "reply" } }),
        ]);
        if (mounted) {
          const comments = commentsRes?.data?.success && typeof commentsRes.data.count === "number" ? commentsRes.data.count : 0;
          const replies = repliesRes?.data?.success && typeof repliesRes.data.count === "number" ? repliesRes.data.count : 0;
          setStats((s) => ({ ...s, pending_comments: comments, pending_replies: replies }));
        }
      } catch {
        if (mounted) setStats((s) => ({ ...s, pending_comments: 0, pending_replies: 0 }));
      }
    };
    fetchBoth();
    return () => { mounted = false; };
  }, [canCommentReview]);

  const canCreate = can("council.article.create");
  const canEditOwn = can("council.article.edit_own");
  const canCategories = can("council.category.manage");

  const cards: { title: string; href: string; count?: number; icon: React.ElementType; show: boolean }[] = [
    {
      title: "طلب صلاحية وصول للاستوديو",
      href: "/dashboard/council/access-request",
      icon: Send,
      show: true,
    },
    { title: "مقالاتي", href: "/dashboard/council/articles", count: stats.my_articles, icon: FileText, show: canCreate || canEditOwn },
    { title: "بانتظار المراجعة", href: "/dashboard/council/reviews", count: stats.pending_review, icon: Send, show: canReview || canPublish },
    { title: "مقال جديد", href: "/dashboard/council/articles/new", icon: FileText, show: canCreate },
    { title: "المنشور", href: "/dashboard/council/articles?status=published", count: stats.published, icon: CheckCircle2, show: canReview || canPublish },
    { title: "التعليقات والردود", href: "/dashboard/council/comments", icon: MessageCircle, show: canCommentReview },
    { title: "تعليقات معلقة", href: "/dashboard/council/comments?status=pending&type=comment", count: stats.pending_comments, icon: MessageCircle, show: canCommentReview },
    { title: "ردود معلقة", href: "/dashboard/council/comments?status=pending&type=reply", count: stats.pending_replies, icon: MessageCircle, show: canCommentReview },
    { title: "إدارة التصنيفات", href: "/dashboard/council/categories", icon: FolderOpen, show: canCategories },
  ].filter((c) => c.show);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] gap-3">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-foreground/60 text-sm">...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 rtl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary">استوديو مجلس السوق</h1>
        <p className="text-foreground/60 mt-1 text-sm">التحرير والمراجعة والإشراف</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <LoadingLink
              key={card.href}
              href={card.href}
              className="block p-5 rounded-2xl border border-border bg-card hover:bg-border/40 transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground">{card.title}</p>
                  {typeof card.count === "number" && (
                    <p className="text-sm text-foreground/60">{card.count} عنصر</p>
                  )}
                </div>
              </div>
            </LoadingLink>
          );
        })}
      </div>

      {cards.length === 0 && (
        <div className="p-8 rounded-2xl border border-border bg-card text-center text-foreground/60">
          لا توجد صلاحيات لعرضها في استوديو مجلس السوق.
        </div>
      )}
    </div>
  );
}
