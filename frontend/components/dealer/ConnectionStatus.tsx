// components/dealer/ConnectionStatus.tsx
"use client";

import { useDealerStore } from "@/store/dealerStore";
import { Wifi, WifiOff, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConnectionStatus() {
  const { isConnected, latencyMs } = useDealerStore();

  const getStatusColor = () => {
    if (!isConnected) return "text-red-400";
    if (latencyMs < 50) return "text-emerald-400";
    if (latencyMs < 100) return "text-amber-400";
    return "text-red-400";
  };

  const getStatusBg = () => {
    if (!isConnected) return "bg-red-500/10 border-red-500/30";
    if (latencyMs < 50) return "bg-emerald-500/10 border-emerald-500/30";
    if (latencyMs < 100) return "bg-amber-500/10 border-amber-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-all duration-300",
        getStatusBg()
      )}
    >
      {isConnected ? (
        <Wifi className={cn("w-4 h-4", getStatusColor())} />
      ) : (
        <WifiOff className="w-4 h-4 text-red-400" />
      )}
      <span className="text-sm text-foreground/70">جودة الاتصال</span>
      <div className="flex items-center gap-1">
        <Zap className={cn("w-3 h-3", getStatusColor())} />
        <span className={cn("font-mono text-sm font-bold", getStatusColor())}>
          {isConnected ? `${latencyMs} ms` : "متقطع"}
        </span>
      </div>
    </div>
  );
}
