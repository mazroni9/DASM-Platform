"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { ClipboardCheck, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import LoadingLink from "@/components/LoadingLink";

export default function TechnicalInspectionPage() {
  const router = useLoadingRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/dashboard/technical-inspection");
    }
  }, [isLoggedIn, router]);

  return (
    <div className="space-y-6" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card backdrop-blur-xl border border-border rounded-2xl p-8 max-w-xl mx-auto text-center"
      >
        <div className="p-4 bg-primary/10 rounded-2xl inline-flex mb-6">
          <ClipboardCheck className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-4">
          الفحص الفني عبر الورش
        </h1>
        <p className="text-foreground/80 leading-relaxed mb-6">
          نعمل على تطوير خدمة الفحص الفني عبر الورش المعتمدة داخل المنصة،
          وستكون متاحة قريبًا بإذن الله.
        </p>
        <LoadingLink
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-3 bg-background border border-border rounded-xl hover:bg-border/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة للرئيسية
        </LoadingLink>
      </motion.div>
    </div>
  );
}
