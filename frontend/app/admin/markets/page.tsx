"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Edit,
  Loader2,
  Search,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import AddMarketForm from "../../../components/admin/AddMarketForm";
import UpdateMarketForm from "@/components/admin/UpdateMarketForm";
import api from "@/lib/axios";
// Types
interface MarketData {
  id: number;
  name: string;
  category_id: number;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  bg_color?: string;
  created_at: string;
  category?: {
    id: number;
    name: string;
  };
}

interface CategoryData {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  description?: string;
  markets: MarketData[];
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [filteredMarkets, setFilteredMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<MarketData | null>(null);

  useEffect(() => {
    fetchMarkets();
  }, []);

  useEffect(() => {
    filterMarkets();
  }, [markets, searchTerm]);

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/markets");
      const categories: CategoryData[] = response.data.data || [];
      
      // Extract all markets from all categories
      const allMarkets: MarketData[] = [];
      categories.forEach(category => {
        category.markets.forEach(market => {
          allMarkets.push({
            ...market,
            category: {
              id: category.id,
              name: category.name
            }
          });
        });
      });
      
      setMarkets(allMarkets);
      setFilteredMarkets(allMarkets);
    } catch (error) {
      toast.error("فشل في تحميل بيانات الأسواق");
    } finally {
      setLoading(false);
    }
  };

  const filterMarkets = () => {
    let result = [...markets];
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (market) =>
          market.name.toLowerCase().includes(searchLower) ||
          market.slug.toLowerCase().includes(searchLower) ||
          (market.description && market.description.toLowerCase().includes(searchLower))
      );
    }
    setFilteredMarkets(result);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "غير متوفر";
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <span className="mr-2 text-xl">جاري تحميل بيانات الأسواق...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AddMarketForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onMarketAdded={(newMarket) => {
          setMarkets((prev) => [newMarket, ...prev]);
          setShowAddForm(false);
        }}
      />

      <UpdateMarketForm
        isOpen={showUpdateForm}
        onClose={() => setShowUpdateForm(false)}
        market={selectedMarket}
        onMarketUpdated={(updated) => {
          setMarkets((prev) =>
            prev.map((m) =>
              m.id === updated.id
                ? { ...m, ...updated, category: m.category }
                : m
            )
          );
          setShowUpdateForm(false);
          setSelectedMarket(null);
        }}
      />

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">الأسواق</h1>
        <div>
          <Button onClick={fetchMarkets} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>

          <Button onClick={() => setShowAddForm(true)} variant="outline" className={"ms-2 bg-green-600 text-white"} size="sm">
            <Plus className="w-4 h-4 ml-2" />
            إضافة سوق جديد
          </Button>
        </div>
      </div>
      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow border flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            type="text"
            placeholder="بحث بالاسم أو السلاج أو الوصف"
            className="pr-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      {/* Markets table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">القسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السلاج</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوصف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الأيقونة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اللون</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">لون الخلفية</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الإنشاء</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMarkets.length > 0 ? (
                filteredMarkets.map((market) => (
                  <tr key={market.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{market.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{market.category?.name || market.category_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{market.slug}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {market.description
                        ? market.description.split(" ").slice(0, 5).join(" ") + (market.description.split(" ").length > 5 ? "..." : "")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{market.icon || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{market.color || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{market.bg_color || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(market.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedMarket(market);
                          setShowUpdateForm(true);
                        }}
                        className="bg-blue-50 hover:bg-blue-100"
                      >
                        <Edit className="w-4 h-4 ml-2" />
                        تعديل
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    لا توجد نتائج مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
