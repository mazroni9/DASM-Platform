"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Car,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Filter,
  Search,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";

interface PendingAuction {
  id: number;
  car: {
    id: number;
    make: string;
    model: string;
    year: number;
    vin: string;
    plate_number: string;
    condition: string;
    transmission: string;
    category: string;
    odometer: number;
    images?: string[];
    dealer?: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
    user?: {
      first_name: string;
      last_name: string;
    };
  };
  starting_bid: number;
  min_price: number;
  max_price: number;
  reserve_price: number;
  auction_type: string;
  status: string;
  created_at: string;
}

export default function AdminAuctionApproval() {
  const [pendingAuctions, setPendingAuctions] = useState<PendingAuction[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedAuction, setSelectedAuction] = useState<PendingAuction | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [approvalData, setApprovalData] = useState({
    opening_price: "",
    auction_type: "silent_instant",
    approved_for_live: false,
    category: "",
  });

  const [rejectionReason, setRejectionReason] = useState("");

  // ===== API helpers =====
  const isOk = (resData: any) => resData?.status === "success" || resData?.success === true;

  const unwrapData = (resData: any) => {
    if (resData?.data && isOk(resData)) return resData.data;
    if (resData?.data?.data && isOk(resData?.data)) return resData.data.data;
    return null;
  };

  useEffect(() => {
    fetchPendingAuctions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPendingAuctions = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/auctions/pending");

      if (isOk(response.data)) {
        const data = unwrapData(response.data);
        const list = data?.data ?? data?.items ?? data ?? [];
        setPendingAuctions(Array.isArray(list) ? list : []);
      } else {
        setPendingAuctions([]);
      }
    } catch (error) {
      console.error("Error fetching pending auctions:", error);
      toast.error("حدث خطأ أثناء جلب المزادات المعلقة");
      setPendingAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAuctions = useMemo(() => {
    let filtered = pendingAuctions;

    if (statusFilter !== "all") {
      filtered = filtered.filter((auction) => auction.status === statusFilter);
    }

    const q = searchTerm.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((auction) => {
        const make = (auction.car?.make || "").toLowerCase();
        const model = (auction.car?.model || "").toLowerCase();
        const vin = (auction.car?.vin || "").toLowerCase();
        const plate = (auction.car?.plate_number || "").toLowerCase();
        return make.includes(q) || model.includes(q) || vin.includes(q) || plate.includes(q);
      });
    }

    return filtered;
  }, [pendingAuctions, statusFilter, searchTerm]);

  const handleApprove = (auction: PendingAuction) => {
    setSelectedAuction(auction);
    setApprovalData({
      opening_price: (auction.starting_bid ?? 0).toString(),
      auction_type: auction.auction_type || "silent_instant",
      approved_for_live: false,
      category: auction.car.category || "",
    });
    setShowApprovalModal(true);
  };

  const handleReject = (auction: PendingAuction) => {
    setSelectedAuction(auction);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  const submitApproval = async () => {
    if (!selectedAuction) return;

    if (!approvalData.category) {
      toast.error("يرجى اختيار تصنيف السيارة");
      return;
    }

    try {
      setProcessingId(selectedAuction.id);
      const response = await api.post(
        `/api/admin/auctions/${selectedAuction.id}/approve`,
        approvalData
      );

      if (isOk(response.data)) {
        toast.success("تم الموافقة على المزاد بنجاح");
        setShowApprovalModal(false);
        setSelectedAuction(null);
        await fetchPendingAuctions();
      } else {
        toast.error(response.data?.message || "حدث خطأ أثناء الموافقة على المزاد");
      }
    } catch (error: any) {
      console.error("Error approving auction:", error);
      toast.error(error.response?.data?.message || "حدث خطأ أثناء الموافقة على المزاد");
    } finally {
      setProcessingId(null);
    }
  };

  const submitRejection = async () => {
    if (!selectedAuction || !rejectionReason.trim()) {
      toast.error("يرجى إدخال سبب الرفض");
      return;
    }

    try {
      setProcessingId(selectedAuction.id);
      const response = await api.post(`/api/admin/auctions/${selectedAuction.id}/reject`, {
        reason: rejectionReason,
      });

      if (isOk(response.data)) {
        toast.success("تم رفض المزاد");
        setShowRejectionModal(false);
        setSelectedAuction(null);
        await fetchPendingAuctions();
      } else {
        toast.error(response.data?.message || "حدث خطأ أثناء رفض المزاد");
      }
    } catch (error: any) {
      console.error("Error rejecting auction:", error);
      toast.error(error.response?.data?.message || "حدث خطأ أثناء رفض المزاد");
    } finally {
      setProcessingId(null);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR" }).format(price ?? 0);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));

  const getOwnerName = (auction: PendingAuction) => {
    if (auction.car.dealer?.user) {
      const user = auction.car.dealer.user;
      return `${user.first_name} ${user.last_name}`;
    }
    if (auction.car.user) {
      const user = auction.car.user;
      return `${user.first_name} ${user.last_name}`;
    }
    return "غير محدد";
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "pending_approval":
        return "في انتظار الموافقة";
      case "approved":
        return "موافق عليه";
      case "rejected":
        return "مرفوض";
      default:
        return status || "غير معروف";
    }
  };

  // ✅ Dark mode fix: add dark: colors (was missing previously)
  const statusPillClass = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/15 text-green-700 border-green-500/25 dark:text-green-300";
      case "rejected":
        return "bg-red-500/15 text-red-700 border-red-500/25 dark:text-red-300";
      default:
        return "bg-amber-500/15 text-amber-800 border-amber-500/25 dark:text-amber-300";
    }
  };

  // ============ Shared UI Classes (RTL + Dark) ============
  // 👇 أهم تعديل: ما فيش ولا bg-white / text-gray-* ثابتين
  // كله مبني على tokens: bg-card/bg-background/text-foreground/border-border + dark variants لما نستخدم ألوان “ثابتة”
  const card = "rounded-2xl border border-border bg-card shadow-sm overflow-hidden";

  const input =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground " +
    "placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background";

  const label = "block text-sm font-medium text-foreground mb-1";
  const muted = "text-muted-foreground";

  const iconBox =
    "inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/15";

  const btnBase =
    "inline-flex items-center justify-center flex-row-reverse gap-2 rounded-xl px-4 py-2.5 " +
    "transition disabled:opacity-60 disabled:cursor-not-allowed";

  const btnGhost =
    `${btnBase} bg-muted/30 hover:bg-muted/40 border border-border text-foreground`;

  const btnSuccess =
    `${btnBase} bg-green-600 text-white hover:bg-green-700`;

  const btnDanger =
    `${btnBase} bg-red-600 text-white hover:bg-red-700`;

  const badgeBase =
    "inline-flex items-center flex-row-reverse gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border";

  // ========= Modal (Dark + RTL) =========
  const Modal = ({
    title,
    subtitle,
    children,
    onClose,
  }: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    onClose: () => void;
  }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl" lang="ar">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 md:p-6 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              {subtitle && <p className={`mt-1 text-sm ${muted}`}>{subtitle}</p>}
            </div>

            <button
              onClick={onClose}
              className="rounded-lg border border-border bg-muted/30 hover:bg-muted/40 px-3 py-1.5 text-sm text-foreground transition"
            >
              إغلاق
            </button>
          </div>
        </div>

        <div className="p-5 md:p-6">{children}</div>
      </div>
    </div>
  );

  return (
    <div dir="rtl" lang="ar" className="space-y-6 text-right">
      {/* Header + Filters */}
      <div className={card}>
        <div className="p-5 md:p-6 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3 flex-row-reverse">
              <span className={iconBox}>
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  المزادات المعلقة للموافقة
                </h2>
                <p className={`text-sm ${muted}`}>
                  المجموع:{" "}
                  <span className="font-semibold text-foreground">{filteredAuctions.length}</span>
                </p>
              </div>
            </div>

            <button
              onClick={fetchPendingAuctions}
              disabled={loading}
              className={`${btnGhost} w-full md:w-auto`}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {loading ? "جاري التحديث..." : "تحديث"}
            </button>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={label}>البحث</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث بالماركة أو الموديل أو VIN أو اللوحة..."
                  className={`${input} pr-10`}
                />
              </div>
            </div>

            <div>
              <label className={label}>الحالة</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={input}
              >
                <option value="all">جميع الحالات</option>
                <option value="pending_approval">في انتظار الموافقة</option>
                <option value="approved">موافق عليه</option>
                <option value="rejected">مرفوض</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className={`${btnGhost} w-full`}
              >
                <Filter className="h-4 w-4" />
                إعادة تعيين الفلاتر
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className={`${card} p-8`}>
          <div className="flex items-center justify-center gap-3 flex-row-reverse text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>جاري تحميل المزادات...</span>
          </div>
        </div>
      ) : filteredAuctions.length === 0 ? (
        <div className={`${card} p-8 text-center`}>
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد مزادات مطابقة</h3>
          <p className={muted}>لا توجد مزادات تحتاج إلى موافقة حالياً</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredAuctions.map((auction) => (
            <div key={auction.id} className={card}>
              {/* Accent strip */}
              <div className="h-1.5 w-full bg-amber-500/70" />

              <div className="p-5 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Car Details */}
                  <div className="lg:col-span-2">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <h3 className="text-lg md:text-xl font-semibold text-foreground inline-flex items-center flex-row-reverse gap-2">
                          <Car className="h-5 w-5 text-primary" />
                          <span className="truncate">
                            {auction.car.make} {auction.car.model} {auction.car.year}
                          </span>
                        </h3>

                        <p className={`mt-1 text-sm ${muted}`}>
                          <span className="font-medium">VIN:</span>{" "}
                          <span dir="ltr" className="inline-block text-left">
                            {auction.car.vin}
                          </span>
                        </p>

                        {!!auction.car.plate_number && (
                          <p className={`mt-1 text-sm ${muted}`}>
                            <span className="font-medium">رقم اللوحة:</span>{" "}
                            <span dir="ltr" className="inline-block text-left">
                              {auction.car.plate_number}
                            </span>
                          </p>
                        )}
                      </div>

                      <span className={`${badgeBase} ${statusPillClass(auction.status)}`}>
                        <Clock className="h-3.5 w-3.5" />
                        {statusLabel(auction.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-border bg-muted/20 p-3">
                        <div className={muted}>الحالة</div>
                        <div className="font-semibold text-foreground mt-1">{auction.car.condition}</div>
                      </div>

                      <div className="rounded-xl border border-border bg-muted/20 p-3">
                        <div className={muted}>ناقل الحركة</div>
                        <div className="font-semibold text-foreground mt-1">{auction.car.transmission}</div>
                      </div>

                      <div className="rounded-xl border border-border bg-muted/20 p-3">
                        <div className={muted}>العداد</div>
                        <div className="font-semibold text-foreground mt-1">
                          {Number(auction.car.odometer || 0).toLocaleString("ar-SA")} كم
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-muted/20 p-3">
                        <div className={muted}>التصنيف</div>
                        <div className="font-semibold text-foreground mt-1">
                          {auction.car.category || "غير محدد"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-muted/20 p-3 sm:col-span-2">
                        <div className={muted}>المالك</div>
                        <div className="font-semibold text-foreground mt-1">{getOwnerName(auction)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Auction Info & Actions */}
                  <div className="lg:border-r lg:border-border lg:pr-6">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-3 flex-row-reverse">
                        <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15 text-green-700 border border-green-500/25 dark:text-green-300">
                          <DollarSign className="h-4 w-4" />
                        </span>
                        <div>
                          <div className={`text-sm ${muted}`}>سعر البداية المقترح</div>
                          <div className="font-semibold text-green-700 dark:text-green-300 mt-1">
                            {formatPrice(auction.starting_bid)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 flex-row-reverse">
                        <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/15">
                          <Calendar className="h-4 w-4" />
                        </span>
                        <div>
                          <div className={`text-sm ${muted}`}>تاريخ الطلب</div>
                          <div className="text-sm text-foreground mt-1">{formatDate(auction.created_at)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(auction)}
                        disabled={processingId === auction.id}
                        className={`${btnSuccess} flex-1`}
                      >
                        {processingId === auction.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        موافقة
                      </button>

                      <button
                        onClick={() => handleReject(auction)}
                        disabled={processingId === auction.id}
                        className={`${btnDanger} flex-1`}
                      >
                        {processingId === auction.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        رفض
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedAuction && (
        <Modal
          title="موافقة على المزاد"
          subtitle={`${selectedAuction.car.make} ${selectedAuction.car.model} ${selectedAuction.car.year}`}
          onClose={() => setShowApprovalModal(false)}
        >
          <div className="space-y-4">
            <div>
              <label className={label}>سعر الافتتاح</label>
              <input
                type="number"
                value={approvalData.opening_price}
                onChange={(e) => setApprovalData({ ...approvalData, opening_price: e.target.value })}
                className={input}
                placeholder="سعر الافتتاح"
              />
            </div>

            <div>
              <label className={label}>نوع المزاد</label>
              <select
                value={approvalData.auction_type}
                onChange={(e) => setApprovalData({ ...approvalData, auction_type: e.target.value })}
                className={input}
              >
                <option value="silent_instant">مزاد صامت فوري</option>
                <option value="live_instant">مزاد فوري مباشر</option>
                <option value="live">مزاد مباشر</option>
              </select>
            </div>

            <div>
              <label className={label}>تصنيف السيارة</label>
              <select
                value={approvalData.category}
                onChange={(e) => setApprovalData({ ...approvalData, category: e.target.value })}
                className={input}
                required
              >
                <option value="">-- اختر تصنيف السيارة --</option>
                <option value="luxury">فاخرة</option>
                <option value="truck">شاحنة</option>
                <option value="bus">حافلة</option>
                <option value="caravan">كارافان</option>
                <option value="government">حكومية</option>
                <option value="company">شركة</option>
                <option value="auction">مزاد</option>
                <option value="classic">كلاسيكية</option>
              </select>
            </div>

            <label className="inline-flex items-center flex-row-reverse gap-2 rounded-xl border border-border bg-muted/20 px-4 py-3">
              <input
                type="checkbox"
                checked={approvalData.approved_for_live}
                onChange={(e) => setApprovalData({ ...approvalData, approved_for_live: e.target.checked })}
                className="h-4 w-4"
              />
              <span className="text-sm text-foreground">موافق للمزاد المباشر</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                onClick={submitApproval}
                disabled={processingId === selectedAuction.id}
                className={`${btnSuccess} flex-1`}
              >
                {processingId === selectedAuction.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                موافقة
              </button>

              <button onClick={() => setShowApprovalModal(false)} className={`${btnGhost} flex-1`}>
                إلغاء
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedAuction && (
        <Modal
          title="رفض المزاد"
          subtitle={`${selectedAuction.car.make} ${selectedAuction.car.model} ${selectedAuction.car.year}`}
          onClose={() => setShowRejectionModal(false)}
        >
          <div className="space-y-4">
            <div>
              <label className={label}>سبب الرفض</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className={`${input} min-h-[120px] resize-y`}
                rows={4}
                placeholder="يرجى إدخال سبب رفض المزاد..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={submitRejection}
                disabled={processingId === selectedAuction.id}
                className={`${btnDanger} flex-1`}
              >
                {processingId === selectedAuction.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                رفض المزاد
              </button>

              <button onClick={() => setShowRejectionModal(false)} className={`${btnGhost} flex-1`}>
                إلغاء
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
