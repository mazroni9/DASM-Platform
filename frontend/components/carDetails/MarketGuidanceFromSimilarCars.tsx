"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, Info } from "lucide-react";
import { PriceWithIcon } from "@/components/ui/priceWithIcon";
import {
  buildMarketGuidanceFromSimilarCars,
  similarityLabelAr,
  type SimilarCarForGuidance,
  type SubjectCarForGuidance,
} from "@/lib/similarCarsMarketGuidance";

type Props = {
  subject: SubjectCarForGuidance;
  similarCars: SimilarCarForGuidance[] | null | undefined;
};

function fmtNum(n: number): string {
  return Math.round(n).toLocaleString("ar-SA");
}

export default function MarketGuidanceFromSimilarCars({
  subject,
  similarCars,
}: Props) {
  const guidance = useMemo(
    () => buildMarketGuidanceFromSimilarCars(subject, similarCars),
    [subject.make, subject.model, subject.year, similarCars],
  );

  if (guidance.status === "insufficient") {
    return (
      <section
        className="mt-10 border-t border-border/50 pt-10 pb-4"
        dir="rtl"
        aria-labelledby="market-guidance-heading"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
            <Info
              className="mx-auto mb-3 h-10 w-10 text-foreground/35"
              aria-hidden
            />
            <p className="text-sm font-medium text-foreground/80 leading-relaxed max-w-lg mx-auto">
              البيانات السوقية غير كافية حاليًا لإظهار استرشاد سعري موثوق.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const { sampleCount, priceLow, priceMid, priceHigh, yearRange, odometerRange, similarity, tableRows } =
    guidance;

  return (
    <section
      className="mt-10 border-t border-border/40 pt-10 pb-6 bg-muted/15 dark:bg-muted/5"
      dir="rtl"
      aria-labelledby="market-guidance-heading"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 sm:p-8 shadow-sm"
        >
          <div className="flex flex-col gap-2 mb-6 border-b border-border/40 pb-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-slate-500/10 dark:bg-slate-400/10 p-2.5 shrink-0">
                <BarChart3
                  className="h-6 w-6 text-slate-600 dark:text-slate-300"
                  aria-hidden
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  id="market-guidance-heading"
                  className="text-xl sm:text-2xl font-bold text-foreground tracking-tight"
                >
                  الاسترشاد السوقي من السيارات المشابهة
                </h2>
                <p className="mt-2 text-sm text-foreground/65 leading-relaxed max-w-3xl">
                  قراءة سوقية مبنية على عينات مشابهة فعلية، وليست تقديرًا بالذكاء
                  الصناعي. يُستند إلى مزايدات/أسعار افتتاح أو تقييمات مسجّلة للعينات
                  الظاهرة في المزاد فقط.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border border-border/50 bg-background/50 px-4 py-4">
              <p className="text-xs font-semibold text-foreground/50 mb-2">
                النطاق المنخفض
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                <PriceWithIcon price={fmtNum(priceLow)} className="gap-1" iconSize={18} />
              </p>
              <p className="text-[11px] text-foreground/45 mt-1">أدنى سعر مرجعي بين العينات</p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4">
              <p className="text-xs font-semibold text-primary/80 mb-2">
                النطاق المرجّح
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                <PriceWithIcon price={fmtNum(priceMid)} className="gap-1" iconSize={18} />
              </p>
              <p className="text-[11px] text-foreground/45 mt-1">وسيط الأسعار المرجعية للعينات</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/50 px-4 py-4">
              <p className="text-xs font-semibold text-foreground/50 mb-2">
                النطاق المرتفع
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                <PriceWithIcon price={fmtNum(priceHigh)} className="gap-1" iconSize={18} />
              </p>
              <p className="text-[11px] text-foreground/45 mt-1">أعلى سعر مرجعي بين العينات</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/70 mb-8 pb-6 border-b border-border/30">
            <span>
              <span className="text-foreground/45">عدد العينات:</span>{" "}
              <span className="font-semibold text-foreground">{sampleCount}</span>
            </span>
            {yearRange ? (
              <span>
                <span className="text-foreground/45">مدى السنوات:</span>{" "}
                <span className="font-semibold text-foreground">
                  {yearRange.min} — {yearRange.max}
                </span>
              </span>
            ) : null}
            {odometerRange ? (
              <span>
                <span className="text-foreground/45">مدى الممشى (كم):</span>{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {odometerRange.min.toLocaleString("ar-SA")} —{" "}
                  {odometerRange.max.toLocaleString("ar-SA")}
                </span>
              </span>
            ) : null}
            <span>
              <span className="text-foreground/45">درجة التشابه:</span>{" "}
              <span className="font-semibold text-foreground">
                {similarityLabelAr(similarity)}
              </span>
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-foreground mb-3">
              أقرب العينات السوقية
            </h3>
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-sm text-right min-w-[320px]">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/50">
                    <th className="px-3 py-2.5 font-semibold text-foreground/70">
                      الماركة / الموديل
                    </th>
                    <th className="px-3 py-2.5 font-semibold text-foreground/70">
                      السنة
                    </th>
                    <th className="px-3 py-2.5 font-semibold text-foreground/70">
                      الممشى
                    </th>
                    <th className="px-3 py-2.5 font-semibold text-foreground/70">
                      السعر المرجعي
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, idx) => (
                    <tr
                      key={row.id ?? idx}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-3 py-2.5 text-foreground">
                        {(row.make ?? "—") + " " + (row.model ?? "")}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-foreground/85">
                        {row.year ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-foreground/85">
                        {row.odometer != null && Number.isFinite(Number(row.odometer))
                          ? Number(row.odometer).toLocaleString("ar-SA")
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 font-medium tabular-nums">
                        <PriceWithIcon
                          price={fmtNum(row.referencePrice)}
                          className="gap-1"
                          iconSize={16}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
