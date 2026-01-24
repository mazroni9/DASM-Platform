// components/dealer/LiquidityChart.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Loader2, AlertCircle } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { cn } from "@/lib/utils";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface LiquidityChartProps {
  authToken: string;
}

interface LiquidityData {
  labels: string[];
  credit: number[];
  debit: number[];
  period: number;
}

export default function LiquidityChart({ authToken }: LiquidityChartProps) {
  const [data, setData] = useState<LiquidityData | null>(null);
  const [period, setPeriod] = useState<7 | 30>(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!authToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/dealer/dashboard/liquidity-stats?period=${period}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      const result = await response.json();

      if (result.status === "success") {
        setData(result.data);
      } else {
        setError(result.message || "فشل تحميل البيانات");
      }
    } catch (err) {
      console.error("Failed to fetch liquidity data:", err);
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [authToken, period]);

  // Chart configuration
  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: "الإيداعات",
        data: data?.credit || [],
        fill: true,
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "rgb(34, 197, 94)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
      {
        label: "السحوبات",
        data: data?.debit || [],
        fill: true,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "rgb(239, 68, 68)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        rtl: true,
        labels: {
          color: "rgba(148, 163, 184, 0.8)",
          font: { size: 10 },
          boxWidth: 12,
          padding: 10,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#fff",
        bodyColor: "#94a3b8",
        borderColor: "rgba(51, 65, 85, 0.5)",
        borderWidth: 1,
        padding: 12,
        rtl: true,
        callbacks: {
          label: function (context: any) {
            return `${
              context.dataset.label
            }: ${context.parsed.y.toLocaleString()} ر.س`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "rgba(148, 163, 184, 0.6)",
          font: { size: 10 },
        },
      },
      y: {
        grid: { color: "rgba(51, 65, 85, 0.3)" },
        ticks: {
          color: "rgba(148, 163, 184, 0.6)",
          font: { size: 10 },
          callback: function (value: any) {
            return value / 1000 + "K";
          },
        },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card backdrop-blur-xl border border-border rounded-2xl p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              تدفق السيولة (LIQUIDITY)
            </h3>
          </div>
        </div>

        {/* Period Toggle */}
        <div className="flex items-center gap-1 bg-background/50 rounded-lg p-1">
          <button
            onClick={() => setPeriod(7)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-all",
              period === 7
                ? "bg-primary text-primary-foreground"
                : "text-foreground/60 hover:text-foreground",
            )}
          >
            7 أيام
          </button>
          <button
            onClick={() => setPeriod(30)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-all",
              period === 30
                ? "bg-primary text-primary-foreground"
                : "text-foreground/60 hover:text-foreground",
            )}
          >
            30 يوم
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-40">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-400">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p className="text-xs">{error}</p>
          </div>
        ) : data && data.labels.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-foreground/40">
            <TrendingUp className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs">لا توجد بيانات حالياً</p>
          </div>
        )}
      </div>

      <p className="text-xs text-foreground/40 mt-2 text-center">
        تحليل حركة الرصيد خلال المزادات
      </p>
    </motion.div>
  );
}
