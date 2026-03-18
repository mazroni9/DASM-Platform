"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  Calendar,
  ChevronDown,
  TrendingUp,
  Clock,
  CheckCircle,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";
import Pagination from "@components/Pagination";
import StatusBadge from "@/components/admin/StatusBadge";
import { PriceWithIcon } from "@/components/ui/priceWithIcon";
import { GatewayIcon } from "@/components/admin/GatewayIcon";

// Types
interface Settlement {
  id: number;
  auction_id: number;
  verification_code: string;
  status: string;
  created_at: string;
  car: {
    id: number;
    make: string;
    model: string;
    year: number;
    image: string | null;
    title: string;
  } | null;
  auction: {
    id: number;
    ref: string;
    type: string;
  } | null;
  seller: {
    id: number;
    name: string;
    type: string;
  } | null;
  buyer: {
    id: number;
    name: string;
  } | null;
  car_price: number;
  platform_commission: number;
  commission_vat: number;
  partner_incentive: number;
  net_profit: number;
  service_fees_total: number;
  phase1: {
    status: string;
    gateway: string;
    transaction_ref: string;
  };
  phase2: {
    status: string;
    release_status: string;
    amount: number;
  };
}

interface Stats {
  total_sales: number;
  total_commission: number;
  pending_escrow: number;
  released_funds: number;
  total_volume: number;
}

export default function SalesListPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [feesStatusFilter, setFeesStatusFilter] = useState("");
  const [escrowStatusFilter, setEscrowStatusFilter] = useState("");
  const [gatewayFilter, setGatewayFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      if (feesStatusFilter) params.append("fees_status", feesStatusFilter);
      if (escrowStatusFilter)
        params.append("escrow_status", escrowStatusFilter);
      if (gatewayFilter) params.append("gateway", gatewayFilter);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const response = await api.get(`/api/admin/sales?${params.toString()}`);

      if (response.data?.status === "success") {
        setSettlements(response.data.data.settlements.data || []);
        setTotalPages(response.data.data.settlements.last_page || 1);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("فشل في تحميل بيانات المبيعات");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    feesStatusFilter,
    escrowStatusFilter,
    gatewayFilter,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      params.append("export", "csv");
      if (feesStatusFilter) params.append("fees_status", feesStatusFilter);
      if (escrowStatusFilter)
        params.append("escrow_status", escrowStatusFilter);
      if (gatewayFilter) params.append("gateway", gatewayFilter);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const response = await api.get(`/api/admin/sales?${params.toString()}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `sales_export_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("تم تصدير البيانات بنجاح");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("فشل في تصدير البيانات");
    }
  };

  const clearFilters = () => {
    setFeesStatusFilter("");
    setEscrowStatusFilter("");
    setGatewayFilter("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-2">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            إدارة المبيعات
          </h1>
          <p className="text-muted-foreground mt-2">
            مركز التحكم المالي لتتبع المزادات المكتملة والعمولات ومدفوعات الضمان
          </p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <Button onClick={fetchSales} variant="outline" size="sm">
            <RefreshCw
              className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`}
            />
            تحديث
          </Button>
          <Button
            onClick={handleExportCSV}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="w-4 h-4 ml-2" />
            تصدير CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">إجمالي المبيعات</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats?.total_sales || 0}
              </p>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">إجمالي العمولات</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                <PriceWithIcon
                  price={new Intl.NumberFormat("ar-SA").format(
                    stats?.total_commission || 0
                  )}
                  iconSize={20}
                />
              </p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">ضمانات معلقة</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats?.pending_escrow || 0}
              </p>
            </div>
            <div className="bg-amber-500/10 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">أموال مُفرج عنها</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats?.released_funds || 0}
              </p>
            </div>
            <div className="bg-cyan-500/10 p-3 rounded-xl">
              <Wallet className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl p-6 border border-border shadow-lg mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={feesStatusFilter}
              onChange={(e) => setFeesStatusFilter(e.target.value)}
              className="p-2 border border-border rounded-lg bg-background text-foreground text-sm"
            >
              <option value="">حالة الرسوم (الكل)</option>
              <option value="PAID">مدفوع</option>
              <option value="PENDING">في الانتظار</option>
              <option value="FAILED">فشل</option>
            </select>

            <select
              value={escrowStatusFilter}
              onChange={(e) => setEscrowStatusFilter(e.target.value)}
              className="p-2 border border-border rounded-lg bg-background text-foreground text-sm"
            >
              <option value="">حالة الضمان (الكل)</option>
              <option value="PENDING">في الانتظار</option>
              <option value="VERIFIED">تم التحقق</option>
              <option value="PAID">مدفوع</option>
            </select>

            <select
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
              className="p-2 border border-border rounded-lg bg-background text-foreground text-sm"
            >
              <option value="">بوابة الدفع (الكل)</option>
              <option value="MOYASAR">Moyasar</option>
              <option value="CLICKPAY">ClickPay</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex gap-2 items-center">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36 bg-background border-border"
              placeholder="من"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36 bg-background border-border"
              placeholder="إلى"
            />
          </div>

          {/* Clear Filters */}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            مسح الفلاتر
          </Button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">
              قائمة المبيعات ({settlements.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="px-4 py-4 text-right text-sm font-medium text-muted-foreground">
                  المزاد / السيارة
                </th>
                <th className="px-4 py-4 text-right text-sm font-medium text-muted-foreground">
                  الأطراف
                </th>
                <th className="px-4 py-4 text-right text-sm font-medium text-muted-foreground">
                  سعر المركبة
                </th>
                <th className="px-4 py-4 text-right text-sm font-medium text-muted-foreground">
                  العمولة
                </th>
                <th className="px-4 py-4 text-right text-sm font-medium text-muted-foreground">
                  صافي الربح
                </th>
                <th className="px-4 py-4 text-right text-sm font-medium text-muted-foreground">
                  رسوم الخدمة
                </th>
                <th className="px-4 py-4 text-right text-sm font-medium text-muted-foreground">
                  الضمان
                </th>
                <th className="px-4 py-4 text-right text-sm font-medium text-muted-foreground">
                  التاريخ
                </th>
                <th className="px-4 py-4 text-right text-sm font-medium text-muted-foreground">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">
                      جاري التحميل...
                    </p>
                  </td>
                </tr>
              ) : settlements.length > 0 ? (
                settlements.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    {/* Auction/Car */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {sale.car?.image ? (
                            <img
                              src={sale.car.image}
                              alt={sale.car.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <DollarSign className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {sale.car?.title || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {sale.auction?.ref}
                          </p>
                          <p className="text-xs text-cyan-500 font-mono">
                            {sale.verification_code}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Parties */}
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="text-muted-foreground">البائع:</span>{" "}
                          <span className="font-medium">
                            {sale.seller?.name || "—"}
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">
                            المشتري:
                          </span>{" "}
                          <span className="font-medium">
                            {sale.buyer?.name || "—"}
                          </span>
                        </p>
                      </div>
                    </td>

                    {/* Car Price */}
                    <td className="px-4 py-4">
                      <PriceWithIcon
                        price={new Intl.NumberFormat("ar-SA").format(
                          sale.car_price
                        )}
                        iconSize={16}
                        className="font-medium"
                      />
                    </td>

                    {/* Commission */}
                    <td className="px-4 py-4">
                      <PriceWithIcon
                        price={new Intl.NumberFormat("ar-SA").format(
                          sale.platform_commission
                        )}
                        iconSize={16}
                        className="font-medium"
                      />
                    </td>

                    {/* Net Profit */}
                    <td className="px-4 py-4">
                      <PriceWithIcon
                        price={new Intl.NumberFormat("ar-SA").format(
                          sale.net_profit
                        )}
                        iconSize={16}
                        className="font-semibold text-green-500"
                      />
                    </td>

                    {/* Phase 1 - Fees */}
                    <td className="px-4 py-4">
                      <div className="space-y-1.5">
                        <StatusBadge
                          status={sale.phase1.status}
                          type="payment"
                          size="sm"
                        />
                        <GatewayIcon
                          gateway={sale.phase1.gateway}
                          size="sm"
                          showLabel={false}
                        />
                      </div>
                    </td>

                    {/* Phase 2 - Escrow */}
                    <td className="px-4 py-4">
                      <div className="space-y-1.5">
                        <StatusBadge
                          status={sale.phase2.status}
                          type="escrow"
                          size="sm"
                        />
                        <StatusBadge
                          status={sale.phase2.release_status}
                          type="release"
                          size="sm"
                          showIcon={false}
                        />
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {formatDate(sale.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <Button asChild variant="outline" size="sm">
                        <LoadingLink href={`/admin/sales/${sale.id}`}>
                          <Eye className="w-4 h-4 ml-1" />
                          التفاصيل
                        </LoadingLink>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p>لا توجد مبيعات مطابقة للفلاتر المحددة</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-border flex justify-center">
            <Pagination
              totalPages={totalPages}
              page={currentPage}
              onPageChange={(_, page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
