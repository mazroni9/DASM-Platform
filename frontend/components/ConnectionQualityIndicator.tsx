"use client";

import { useState, useRef, useEffect } from "react";
import { useConnectionQuality } from "@/hooks/useConnectionQuality";
import { cn } from "@/lib/utils";
import type { ConnectionQualityLevel } from "@/lib/connectionQuality";

const LEVEL_COLORS: Record<ConnectionQualityLevel, string> = {
  excellent: "text-emerald-500",
  good: "text-green-500",
  fair: "text-amber-500",
  poor: "text-orange-500",
  unsuitable: "text-red-500",
  offline: "text-red-400",
};

const LEVEL_BG: Record<ConnectionQualityLevel, string> = {
  excellent: "bg-emerald-500",
  good: "bg-green-500",
  fair: "bg-amber-500",
  poor: "bg-orange-500",
  unsuitable: "bg-red-500",
  offline: "bg-red-400",
};

function SignalBars({ level }: { level: ConnectionQualityLevel }) {
  const bars = [1, 2, 3, 4, 5];
  const fillCount =
    level === "offline"
      ? 0
      : level === "unsuitable"
        ? 1
        : level === "poor"
          ? 2
          : level === "fair"
            ? 3
            : level === "good"
              ? 4
              : 5;

  return (
    <div className="flex items-end gap-0.5 h-4">
      {bars.map((i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-sm transition-colors",
            i <= fillCount ? LEVEL_BG[level] : "bg-muted-foreground/30"
          )}
          style={{ height: `${(i / 5) * 12}px`, minHeight: 2 }}
        />
      ))}
    </div>
  );
}

export default function ConnectionQualityIndicator() {
  const { level, labelAr, latencyMs, isChecking, isOnline } =
    useConnectionQuality();
  const [showTooltip, setShowTooltip] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };
    if (showTooltip) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTooltip]);

  const tooltipContent = (
    <div className="text-sm font-medium leading-5 space-y-1.5 text-right">
      <div>جودة الاتصال</div>
      <div>
        {isChecking ? (
          <span className="text-slate-500 dark:text-slate-400">جاري فحص الاتصال...</span>
        ) : (
          <>
            <span>{labelAr}</span>
            {latencyMs != null && (
              <div className="text-slate-500 dark:text-slate-400 mt-1">
                زمن الاستجابة: {latencyMs} ms
              </div>
            )}
            {!isOnline && (
              <div className="text-red-500 dark:text-red-400 mt-1">غير متصل</div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div
      ref={ref}
      className="relative inline-flex items-center"
      role="button"
      tabIndex={0}
      onClick={() => setShowTooltip(!showTooltip)}
      onKeyDown={(e) => e.key === "Enter" && setShowTooltip(!showTooltip)}
      aria-label={`جودة الاتصال: ${labelAr}`}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer",
          "hover:bg-background/20 dark:hover:bg-foreground/5 transition-colors",
          LEVEL_COLORS[level]
        )}
      >
        {isChecking ? (
          <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <SignalBars level={level} />
        )}
      </div>

      {showTooltip && (
        <div
          className={cn(
            "absolute bottom-full start-0 end-auto translate-x-0 mb-2 z-[9999]",
            "px-3 py-2 rounded-lg shadow-xl",
            "bg-white dark:bg-slate-900",
            "text-slate-900 dark:text-white",
            "border border-slate-200 dark:border-slate-700",
            "min-w-[180px] max-w-[90vw]"
          )}
          role="tooltip"
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
}
