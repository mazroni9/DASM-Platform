"use client";

import { useState } from "react";
import { Car as CarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
};

/**
 * صورة قائمة سيارات بدون صورة مخزنة عامة تُضلّل المستخدم بأنها مركبة حقيقية.
 */
export function CarThumbnail({ src, alt, className, imgClassName }: Props) {
  const [failed, setFailed] = useState(false);
  const url = typeof src === "string" && src.trim() ? src.trim() : "";

  if (!url || failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/80 text-muted-foreground",
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <CarIcon className="h-10 w-10 opacity-35" aria-hidden />
        <span className="px-2 text-center text-xs font-medium opacity-80">
          بانتظار صور موثوقة
        </span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={cn("h-full w-full object-cover", imgClassName)}
      onError={() => setFailed(true)}
    />
  );
}
