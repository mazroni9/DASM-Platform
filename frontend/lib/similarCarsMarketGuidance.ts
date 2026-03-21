/**
 * حساب الاسترشاد السوقي من سيارات مشابهة (بدون ذكاء صناعي).
 * السعر المرجعي لكل عينة: أعلى أولوية للمزايدة الحالية، ثم سعر الافتتاح/الحد الأدنى، ثم سعر التقييم.
 */

export type SimilarCarForGuidance = {
  id?: number;
  make?: string;
  model?: string;
  year?: number;
  odometer?: number;
  evaluation_price?: number;
  active_auction?: {
    current_bid?: number;
    opening_price?: number;
    minimum_bid?: number;
  } | null;
};

export type SubjectCarForGuidance = {
  make?: string;
  model?: string;
  year?: number;
};

/** أقل عدد عينات ذات سعر مرجعي صالح لعرض النطاقات دون إضلال */
export const MARKET_GUIDANCE_MIN_SAMPLES = 3;

export function extractReferencePrice(car: SimilarCarForGuidance): number | null {
  const a = car.active_auction;
  const bid = Number(a?.current_bid);
  if (Number.isFinite(bid) && bid > 0) return bid;

  const open = Number(a?.opening_price ?? a?.minimum_bid);
  if (Number.isFinite(open) && open > 0) return open;

  const ev = Number(car.evaluation_price);
  if (Number.isFinite(ev) && ev > 0) return ev;

  return null;
}

export type MarketGuidanceResult =
  | { status: "insufficient" }
  | {
      status: "ok";
      sampleCount: number;
      /** أدنى سعر مرجعي في العينة */
      priceLow: number;
      /** وسيط الأسعار المرجعية (نطاق مرجّح) */
      priceMid: number;
      /** أعلى سعر مرجعي في العينة */
      priceHigh: number;
      yearRange: { min: number; max: number } | null;
      odometerRange: { min: number; max: number } | null;
      similarity: "high" | "medium" | "limited";
      tableRows: Array<{
        id?: number;
        make?: string;
        model?: string;
        year?: number;
        odometer?: number;
        referencePrice: number;
      }>;
    };

function normModel(m: string | undefined): string {
  return (m ?? "").trim().toLowerCase();
}

/**
 * درجة التشابه: نفس الماركة مفترضة من الـ API؛ نميّز حسب تطابق الموديل مع سيارة العرض.
 */
function deriveSimilarity(
  subjectModel: string,
  enrichedCount: number,
  sameModelCount: number,
): "high" | "medium" | "limited" {
  if (!subjectModel || enrichedCount === 0) return "limited";
  const half = Math.ceil(enrichedCount * 0.5);
  if (sameModelCount >= half) return "high";
  if (sameModelCount >= 1) return "medium";
  return "limited";
}

export function buildMarketGuidanceFromSimilarCars(
  subject: SubjectCarForGuidance,
  similarCars: SimilarCarForGuidance[] | null | undefined,
): MarketGuidanceResult {
  const raw = Array.isArray(similarCars) ? similarCars : [];
  const enriched: Array<{ car: SimilarCarForGuidance; price: number }> = [];

  for (const car of raw) {
    const price = extractReferencePrice(car);
    if (price !== null) enriched.push({ car, price });
  }

  if (enriched.length < MARKET_GUIDANCE_MIN_SAMPLES) {
    return { status: "insufficient" };
  }

  const prices = enriched.map((e) => e.price).sort((a, b) => a - b);
  const priceLow = prices[0];
  const priceHigh = prices[prices.length - 1];
  const midIdx = Math.floor(prices.length / 2);
  const priceMid =
    prices.length % 2 === 1
      ? prices[midIdx]
      : Math.round((prices[midIdx - 1] + prices[midIdx]) / 2);

  const years = enriched
    .map((e) => Number(e.car.year))
    .filter((y) => Number.isFinite(y) && y >= 1980 && y <= new Date().getFullYear() + 1);
  const yearRange =
    years.length > 0
      ? { min: Math.min(...years), max: Math.max(...years) }
      : null;

  const odometers = enriched
    .map((e) => Number(e.car.odometer))
    .filter((o) => Number.isFinite(o) && o >= 0);
  const odometerRange =
    odometers.length > 0
      ? { min: Math.min(...odometers), max: Math.max(...odometers) }
      : null;

  const subModel = normModel(subject.model);
  const sameModelCount = enriched.filter(
    (e) => normModel(e.car.model) === subModel && subModel !== "",
  ).length;

  const similarity = deriveSimilarity(
    subModel,
    enriched.length,
    sameModelCount,
  );

  const sy = Number(subject.year);
  const tableRows = [...enriched]
    .sort((a, b) => {
      const am = normModel(a.car.model) === subModel ? 0 : 1;
      const bm = normModel(b.car.model) === subModel ? 0 : 1;
      if (am !== bm) return am - bm;
      if (Number.isFinite(sy)) {
        const da = Math.abs(Number(a.car.year) - sy);
        const db = Math.abs(Number(b.car.year) - sy);
        if (da !== db) return da - db;
      }
      return a.price - b.price;
    })
    .slice(0, 8)
    .map((e) => ({
      id: e.car.id,
      make: e.car.make,
      model: e.car.model,
      year: e.car.year,
      odometer: e.car.odometer,
      referencePrice: e.price,
    }));

  return {
    status: "ok",
    sampleCount: enriched.length,
    priceLow,
    priceMid,
    priceHigh,
    yearRange,
    odometerRange,
    similarity,
    tableRows,
  };
}

export function similarityLabelAr(
  s: "high" | "medium" | "limited",
): string {
  const map = { high: "عالية", medium: "متوسطة", limited: "محدودة" };
  return map[s];
}
