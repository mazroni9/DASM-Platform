/**
 * مؤشر جودة الاتصال - منطق التصنيف والتسميات
 * يقيم الجودة بناءً على: navigator.onLine, Network Info API, وlatency من ping
 */

export type ConnectionQualityLevel =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "unsuitable"
  | "offline";

export interface ConnectionQualityResult {
  level: ConnectionQualityLevel;
  labelAr: string;
  latencyMs: number | null;
  isOnline: boolean;
  showBidWarning: boolean;
}

const LABELS: Record<ConnectionQualityLevel, string> = {
  excellent: "ممتاز",
  good: "جيد",
  fair: "متوسط",
  poor: "ضعيف",
  unsuitable: "غير مناسب للمزايدة",
  offline: "غير متصل",
};

/** يصنف جودة الاتصال بناءً على آخر قراءات latency والمعلومات المتاحة */
export function computeConnectionQuality(
  isOnline: boolean,
  latencyMs: number | null,
  recentLatencies: number[],
  networkInfo?: {
    downlink?: number;
    effectiveType?: string;
    rtt?: number;
  } | null
): ConnectionQualityResult {
  if (!isOnline) {
    return {
      level: "offline",
      labelAr: LABELS.offline,
      latencyMs: null,
      isOnline: false,
      showBidWarning: true,
    };
  }

  // متوسط آخر 3–5 قراءات (median لتقليل تأثير القراءات الشاذة)
  const samples = recentLatencies.filter((n) => n > 0).slice(-5);
  const medianLatency = (() => {
    if (!samples.length) return latencyMs ?? -1;
    const sorted = [...samples].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    return Math.round(median);
  })();

  const effectiveLatency = medianLatency >= 0 ? medianLatency : latencyMs ?? -1;

  // تحسين باستخدام Network Information API إن وُجدت
  let adjustedLatency = effectiveLatency;
  if (networkInfo?.rtt != null && networkInfo.rtt > 0) {
    adjustedLatency = Math.max(adjustedLatency, networkInfo.rtt);
  }

  let level: ConnectionQualityLevel;

  if (adjustedLatency < 0) {
    level = "good"; // لم نستطع القياس بعد
  } else if (adjustedLatency < 100) {
    level = "excellent";
  } else if (adjustedLatency < 180) {
    level = "good";
  } else if (adjustedLatency < 300) {
    level = "fair";
  } else if (adjustedLatency < 500) {
    level = "poor";
  } else {
    level = "unsuitable";
  }

  // فشل ping متكرر => unsuitable
  const failCount = recentLatencies.filter((n) => n < 0).length;
  if (samples.length >= 2 && failCount >= 2) {
    level = "unsuitable";
  }

  return {
    level,
    labelAr: LABELS[level],
    latencyMs: effectiveLatency >= 0 ? effectiveLatency : null,
    isOnline: true,
    showBidWarning:
      level === "poor" || level === "unsuitable" || level === "offline",
  };
}
