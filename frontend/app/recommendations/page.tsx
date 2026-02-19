"use client";

import { useEffect, useMemo, useState } from "react";
import LoadingLink from "@/components/LoadingLink";
import { ArrowLeft, Search, Star, Zap, AlertCircle } from "lucide-react";
import api from "@/lib/axios";
import { formatCurrency } from "@/utils/formatCurrency";

interface RecommendedCar {
  id: number;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  marketPrice: number;
  discountPercentage: number;
  confidence: number;
  reason: string;
  category: "value" | "smart";
}

function parseVehicleName(name: string) {
  const parts = (name || "").trim().split(/\s+/);
  const maybeYear = Number(parts[parts.length - 1]);
  const year = Number.isFinite(maybeYear) ? maybeYear : 0;

  if (parts.length < 2) {
    return { make: name || "سيارة", model: "", year };
  }

  return {
    make: parts[0],
    model: parts.slice(1, Number.isFinite(maybeYear) ? -1 : undefined).join(" "),
    year,
  };
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<"all" | "value" | "smart">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get("/api/dealer/ai/recommendations");
        if (response?.data?.status !== "success") {
          throw new Error(response?.data?.message || "تعذر تحميل التوصيات");
        }

        const list = response?.data?.data?.recommendations ?? [];
        const mapped: RecommendedCar[] = (Array.isArray(list) ? list : []).map((item: any) => {
          const parsed = parseVehicleName(item?.name || "");
          const confidence = Math.round((Number(item?.confidence_score || 0) || 0) * 100);
          const discount = Number(item?.discount_percentage || 0) || 0;

          return {
            id: Number(item?.vehicle_id || item?.auction_id || 0),
            title: item?.name || `سيارة #${item?.vehicle_id || ""}`,
            make: parsed.make,
            model: parsed.model,
            year: parsed.year,
            price: Number(item?.current_price || 0),
            marketPrice: Number(item?.market_price || 0),
            discountPercentage: discount,
            confidence,
            reason: item?.reason || "",
            category: discount >= 15 ? "value" : "smart",
          };
        });

        setRecommendations(mapped);
      } catch (err: any) {
        console.error("Failed to fetch recommendations:", err);
        setRecommendations([]);
        setError(err?.response?.data?.message || err?.message || "فشل تحميل التوصيات");
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, []);

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((car) => {
      if (activeCategory !== "all" && car.category !== activeCategory) {
        return false;
      }

      if (!searchTerm.trim()) return true;

      const q = searchTerm.trim().toLowerCase();
      return (
        car.title.toLowerCase().includes(q) ||
        car.make.toLowerCase().includes(q) ||
        car.model.toLowerCase().includes(q) ||
        String(car.year).includes(q)
      );
    });
  }, [recommendations, activeCategory, searchTerm]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/3 mb-8" />
          <div className="h-12 bg-gray-200 rounded mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                <div className="h-40 bg-gray-200 rounded mb-4" />
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">توصيات ذكية لك</h1>
          <LoadingLink
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors gap-1 px-3 py-2 rounded-full border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
          >
            <span>لوحة التحكم</span>
            <ArrowLeft className="h-4 w-4" />
          </LoadingLink>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="ابحث عن ماركة، موديل أو سنة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute right-4 top-3.5 h-5 w-5 text-gray-400" />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-3 rounded-lg border ${
                activeCategory === "all" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300"
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setActiveCategory("value")}
              className={`px-4 py-3 rounded-lg border ${
                activeCategory === "value" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300"
              }`}
            >
              فرص سعر
            </button>
            <button
              onClick={() => setActiveCategory("smart")}
              className={`px-4 py-3 rounded-lg border ${
                activeCategory === "smart" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300"
              }`}
            >
              توصيات ذكية
            </button>
          </div>
        </div>
      </div>

      {filteredRecommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((car) => (
            <div key={car.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold text-gray-900">{car.title}</h2>
                <div className="text-right">
                  <div className="text-sm text-green-600 font-semibold">-{car.discountPercentage}%</div>
                  <div className="text-xs text-gray-500">خصم متوقع</div>
                </div>
              </div>

              <div className="mt-2 text-gray-600">
                {car.year ? `${car.year} • ` : ""}
                {car.make}
                {car.model ? ` • ${car.model}` : ""}
              </div>

              <div className="mt-4 space-y-1">
                <div className="text-2xl font-bold text-gray-800">{formatCurrency(car.price)} ريال</div>
                <div className="text-sm text-gray-500">السعر السوقي التقريبي: {formatCurrency(car.marketPrice)} ريال</div>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="inline-flex items-center text-blue-600">
                  <Star className="h-4 w-4 ml-1" />
                  الثقة {car.confidence}%
                </div>
                <div className="inline-flex items-center text-green-600">
                  <Zap className="h-4 w-4 ml-1" />
                  فرصة {car.discountPercentage}%
                </div>
              </div>

              {!!car.reason && <p className="mt-3 text-sm text-gray-600">{car.reason}</p>}

              <div className="mt-4">
                <LoadingLink
                  href={`/car/${car.id}`}
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
                >
                  عرض التفاصيل
                </LoadingLink>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">لا توجد توصيات متاحة حاليًا حسب الفلتر الحالي.</p>
          {(searchTerm || activeCategory !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setActiveCategory("all");
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              إعادة تعيين الفلتر
            </button>
          )}
        </div>
      )}
    </div>
  );
}

