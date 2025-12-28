// components/dealer/BiddingEfficiencyChart.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Loader2, AlertCircle, TrendingUp } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BiddingEfficiencyChartProps {
  authToken: string;
}

interface BiddingData {
  labels: string[];
  data: number[];
  colors: string[];
  is_global: boolean;
  title: string;
}

export default function BiddingEfficiencyChart({
  authToken,
}: BiddingEfficiencyChartProps) {
  const [data, setData] = useState<BiddingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!authToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dealer/dashboard/bidding-stats", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const result = await response.json();

      if (result.status === "success") {
        setData(result.data);
      } else {
        setError(result.message || "فشل تحميل البيانات");
      }
    } catch (err) {
      console.error("Failed to fetch bidding data:", err);
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [authToken]);

  // Chart configuration
  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: "عدد المزايدات",
        data: data?.data || [],
        backgroundColor: data?.colors || [
          "rgba(59, 130, 246, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(245, 158, 11, 0.8)",
        ],
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const, // Horizontal bar chart
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#fff",
        bodyColor: "#94a3b8",
        borderColor: "rgba(51, 65, 85, 0.5)",
        borderWidth: 1,
        padding: 12,
        rtl: true,
        displayColors: false,
        callbacks: {
          label: function (context: any) {
            return `${context.parsed.x} مزايدة`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(51, 65, 85, 0.3)" },
        ticks: {
          color: "rgba(148, 163, 184, 0.6)",
          font: { size: 10 },
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: "rgba(148, 163, 184, 0.6)",
          font: { size: 9 },
        },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card backdrop-blur-xl border border-border rounded-2xl p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {data?.title || "كفاءة المزايدة (VELOCITY)"}
            </h3>
          </div>
        </div>

        {/* Indicator for global/personal data */}
        {data && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              data.is_global
                ? "bg-amber-500/10 text-amber-400"
                : "bg-emerald-500/10 text-emerald-400"
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>{data.is_global ? "الأكثر نشاطاً" : "نشاطك"}</span>
          </div>
        )}
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
          <Bar data={chartData} options={chartOptions} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-foreground/40">
            <Activity className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs">لا توجد مزايدات حالياً</p>
          </div>
        )}
      </div>

      <p className="text-xs text-foreground/40 mt-2 text-center">
        {data?.is_global
          ? "سيارات الأكثر تفاعلاً في المنصة"
          : "أكثر السيارات التي زايدت عليها"}
      </p>
    </motion.div>
  );
}
