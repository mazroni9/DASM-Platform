"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  DollarSign,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Send,
  Unlock,
  FileText,
  CreditCard,
  Building,
  User,
  Calendar,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";
import StatusBadge from "@/components/admin/StatusBadge";
import { PriceWithIcon } from "@/components/ui/priceWithIcon";
import { GatewayIcon } from "@/components/admin/GatewayIcon";

interface FinancialItem {
  label: string;
  amount: number;
}

interface Phase1Breakdown {
  label: string;
  gateway: string;
  transaction_id: string;
  status: string;
  breakdown: FinancialItem[];
  total: number;
}

interface Phase2Breakdown {
  label: string;
  method: string;
  reference_code: string;
  status: string;
  amount: number;
  release_status: string;
}

interface SellerSettlement {
  is_partner: boolean;
  car_price: number;
  deductions: FinancialItem[];
  total_deductions: number;
  net_payout: number;
  payout_status: string;
}

interface SaleDetails {
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
  financial_breakdown: {
    phase1: Phase1Breakdown;
    phase2: Phase2Breakdown;
  };
  seller_settlement: SellerSettlement;
}

export default function SaleDetailsPage() {
  const params = useParams();
  const saleId = params.id as string;
  const [sale, setSale] = useState<SaleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (saleId) {
      fetchSaleDetails();
    }
  }, [saleId]);

  const fetchSaleDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/admin/sales/${saleId}`);
      if (response.data?.status === "success") {
        setSale(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching sale details:", error);
      toast.error("فشل في تحميل تفاصيل الصفقة");
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseFunds = async () => {
    if (!confirm("هل أنت متأكد من الإفراج عن الأموال للبائع؟")) return;

    setActionLoading("release");
    try {
      const response = await api.post(
        `/api/admin/sales/${saleId}/release-funds`
      );
      if (response.data?.status === "success") {
        toast.success("تم الإفراج عن الأموال بنجاح");
        fetchSaleDetails();
      }
    } catch (error) {
      console.error("Error releasing funds:", error);
      toast.error("فشل في الإفراج عن الأموال");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefundBuyer = async () => {
    if (!confirm("هل أنت متأكد من استرداد المبلغ للمشتري؟")) return;

    setActionLoading("refund");
    try {
      const response = await api.post(`/api/admin/sales/${saleId}/refund`);
      if (response.data?.status === "success") {
        toast.success("تم بدء إجراء الاسترداد");
        fetchSaleDetails();
      }
    } catch (error) {
      console.error("Error refunding:", error);
      toast.error("فشل في بدء إجراء الاسترداد");
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyTransfer = async () => {
    if (!confirm("هل أنت متأكد من التحقق من التحويل البنكي؟")) return;

    setActionLoading("verify");
    try {
      const response = await api.post(
        `/api/admin/sales/${saleId}/verify-transfer`
      );
      if (response.data?.status === "success") {
        toast.success("تم التحقق من التحويل البنكي بنجاح");
        fetchSaleDetails();
      }
    } catch (error) {
      console.error("Error verifying:", error);
      toast.error("فشل في التحقق من التحويل");
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ");
  };

  const getOverallStatus = () => {
    if (!sale) return { label: "غير معروف", color: "gray" };

    if (sale.phase2.release_status === "RELEASED") {
      return { label: "مكتملة - تم الإفراج عن الأموال", color: "green" };
    }
    if (sale.phase2.status === "VERIFIED" || sale.phase2.status === "PAID") {
      return { label: "الأموال مؤمنة في الضمان", color: "cyan" };
    }
    if (sale.phase1.status === "PAID") {
      return { label: "رسوم الخدمة مدفوعة - في انتظار الضمان", color: "amber" };
    }
    return { label: "في انتظار الدفع", color: "yellow" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">الصفقة غير موجودة</h2>
          <LoadingLink href="/admin/sales">
            <Button variant="outline">العودة للقائمة</Button>
          </LoadingLink>
        </div>
      </div>
    );
  }

  const overallStatus = getOverallStatus();

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      {/* Back Button */}
      <div className="mb-6">
        <LoadingLink href="/admin/sales">
          <Button variant="ghost" size="sm">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة لقائمة المبيعات
          </Button>
        </LoadingLink>
      </div>

      {/* Section A: Deal Header */}
      <div className="bg-card rounded-xl border border-border shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Car Image & Info */}
          <div className="flex gap-4 flex-1">
            <div className="w-24 h-24 rounded-xl bg-muted overflow-hidden flex-shrink-0">
              {sale.car?.image ? (
                <img
                  src={sale.car.image}
                  alt={sale.car.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {sale.car?.title || "صفقة مزاد"}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-sm text-muted-foreground">
                  {sale.auction?.ref}
                </span>
                <span className="text-cyan-500 font-mono text-sm flex items-center gap-1">
                  {sale.verification_code}
                  <button
                    onClick={() => copyToClipboard(sale.verification_code)}
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </span>
              </div>
              <div className="mt-3">
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold
                    ${
                      overallStatus.color === "green"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : ""
                    }
                    ${
                      overallStatus.color === "cyan"
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : ""
                    }
                    ${
                      overallStatus.color === "amber"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : ""
                    }
                    ${
                      overallStatus.color === "yellow"
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : ""
                    }
                    ${
                      overallStatus.color === "gray"
                        ? "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        : ""
                    }
                  `}
                >
                  <CheckCircle className="w-4 h-4 ml-2" />
                  {overallStatus.label}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-2 lg:items-end">
            <Button
              onClick={handleReleaseFunds}
              disabled={
                actionLoading !== null ||
                sale.phase2.release_status === "RELEASED"
              }
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {actionLoading === "release" ? (
                <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Unlock className="w-4 h-4 ml-2" />
              )}
              الإفراج عن الأموال للبائع
            </Button>
            <Button
              onClick={handleRefundBuyer}
              disabled={actionLoading !== null}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500/10"
            >
              {actionLoading === "refund" ? (
                <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 ml-2" />
              )}
              استرداد للمشتري
            </Button>
          </div>
        </div>

        {/* Parties Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Building className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">البائع</p>
              <p className="font-medium">{sale.seller?.name || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/10 p-2 rounded-lg">
              <User className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">المشتري</p>
              <p className="font-medium">{sale.buyer?.name || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section B: Financial Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Phase 1: Online Payment */}
        <div className="bg-card rounded-xl border border-border shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              المرحلة 1: رسوم الخدمة
            </h3>
            <StatusBadge
              status={
                sale.financial_breakdown?.phase1?.status || sale.phase1.status
              }
              type="payment"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">بوابة الدفع</span>
              <GatewayIcon gateway={sale.phase1.gateway} />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">معرّف العملية</span>
              <span className="font-mono text-sm flex items-center gap-1">
                {sale.phase1.transaction_ref?.substring(0, 16) || "—"}
                {sale.phase1.transaction_ref && (
                  <button
                    onClick={() => copyToClipboard(sale.phase1.transaction_ref)}
                  >
                    <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </span>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium mb-2">تفصيل المبلغ:</p>
              {sale.financial_breakdown?.phase1?.breakdown?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <PriceWithIcon
                    price={new Intl.NumberFormat("ar-SA").format(item.amount)}
                    iconSize={14}
                  />
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border mt-2">
                <span>الإجمالي</span>
                <PriceWithIcon
                  price={new Intl.NumberFormat("ar-SA").format(
                    sale.service_fees_total
                  )}
                  iconSize={14}
                  className="font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Phase 2: Escrow */}
        <div className="bg-card rounded-xl border border-border shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-500" />
              المرحلة 2: قيمة المركبة
            </h3>
            <StatusBadge status={sale.phase2.status} type="escrow" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">طريقة التحويل</span>
              <span className="font-medium">
                {sale.financial_breakdown?.phase2?.method || "تحويل بنكي"}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">رمز المرجع</span>
              <span className="font-mono text-cyan-500">
                {sale.verification_code}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">قيمة المركبة</span>
              <PriceWithIcon
                price={new Intl.NumberFormat("ar-SA").format(sale.car_price)}
                iconSize={18}
                className="text-lg font-semibold"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">حالة الإفراج</span>
              <StatusBadge status={sale.phase2.release_status} type="release" />
            </div>

            {sale.phase2.status === "PENDING" && (
              <Button
                onClick={handleVerifyTransfer}
                disabled={actionLoading !== null}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {actionLoading === "verify" ? (
                  <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 ml-2" />
                )}
                التحقق من التحويل البنكي يدوياً
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Section C: Seller Settlement */}
      <div className="bg-card rounded-xl border border-border shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          تسوية البائع
        </h3>

        {sale.seller_settlement?.is_partner && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 mb-4">
            <p className="text-cyan-400 text-sm">
              <CheckCircle className="w-4 h-4 inline ml-1" />
              هذا البائع شريك - لا يتم خصم عمولة
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Price */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">سعر المركبة</p>
            <PriceWithIcon
              price={new Intl.NumberFormat("ar-SA").format(
                sale.seller_settlement?.car_price || sale.car_price
              )}
              iconSize={20}
              className="text-2xl font-bold text-foreground justify-center"
            />
          </div>

          {/* Deductions */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">الخصومات</p>
            <div className="space-y-1">
              {sale.seller_settlement?.deductions?.map((d, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="text-red-400">
                    -{new Intl.NumberFormat("ar-SA").format(d.amount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold pt-1 border-t border-border">
                <span>إجمالي الخصومات</span>
                <span className="text-red-400 flex items-center">
                  -
                  <PriceWithIcon
                    price={new Intl.NumberFormat("ar-SA").format(
                      sale.seller_settlement?.total_deductions || 0
                    )}
                    iconSize={14}
                  />
                </span>
              </div>
            </div>
          </div>

          {/* Net Payout */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">
              صافي المستحق للبائع
            </p>
            <PriceWithIcon
              price={new Intl.NumberFormat("ar-SA").format(
                sale.seller_settlement?.net_payout || 0
              )}
              iconSize={20}
              className="text-2xl font-bold text-green-400 justify-center"
            />
            <div className="mt-2">
              <StatusBadge
                status={sale.seller_settlement?.payout_status || "PENDING"}
                type="payment"
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-6 text-center text-muted-foreground text-sm">
        <Calendar className="w-4 h-4 inline ml-1" />
        تاريخ الإنشاء: {new Date(sale.created_at).toLocaleString("ar-SA")}
      </div>
    </div>
  );
}
