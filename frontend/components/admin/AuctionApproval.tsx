"use client";

import { useEffect, useMemo, useState } from "react";
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
  status: string;
  starting_bid: number;
  control_room_approved?: boolean;
  created_at: string;
  car: {
    make: string;
    model: string;
    year: number;
    vin?: string;
    plate_number?: string;
    condition?: string;
    transmission?: string;
    category?: string;
    odometer?: number;
    user?: {
      first_name?: string;
      last_name?: string;
    };
  };
}

function isOk(data: any) {
  return data?.status === "success" || data?.success === true;
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
  const [openingPrice, setOpeningPrice] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchPendingAuctions = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/auctions?control_room_approved=0&per_page=100");

      if (!isOk(response.data)) {
        setPendingAuctions([]);
        return;
      }

      const list = response?.data?.data?.data ?? [];
      const normalized = Array.isArray(list) ? list : [];
      setPendingAuctions(
        normalized.filter((auction: PendingAuction) => !auction.control_room_approved)
      );
    } catch (error) {
      console.error("Error fetching pending auctions:", error);
      toast.error("فشل جلب المزادات المعلقة");
      setPendingAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAuctions();
  }, []);

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
  }, [pendingAuctions, searchTerm, statusFilter]);

  const handleApprove = (auction: PendingAuction) => {
    setSelectedAuction(auction);
    setOpeningPrice(String(auction.starting_bid || 0));
    setShowApprovalModal(true);
  };

  const handleReject = (auction: PendingAuction) => {
    setSelectedAuction(auction);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  const submitApproval = async () => {
    if (!selectedAuction) return;
    const parsedPrice = Number(openingPrice || 0);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("سعر الافتتاح غير صالح");
      return;
    }

    try {
      setProcessingId(selectedAuction.id);
      const response = await api.post(`/api/admin/auctions/${selectedAuction.id}/approve`, {
        opening_price: parsedPrice,
      });

      if (isOk(response.data)) {
        toast.success("تمت الموافقة على المزاد");
        setShowApprovalModal(false);
        setSelectedAuction(null);
        await fetchPendingAuctions();
      } else {
        toast.error(response.data?.message || "تعذر اعتماد المزاد");
      }
    } catch (error: any) {
      console.error("Error approving auction:", error);
      toast.error(error?.response?.data?.message || "فشل اعتماد المزاد");
    } finally {
      setProcessingId(null);
    }
  };

  const submitRejection = async () => {
    if (!selectedAuction) return;

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
        toast.error(response.data?.message || "تعذر رفض المزاد");
      }
    } catch (error: any) {
      console.error("Error rejecting auction:", error);
      toast.error(error?.response?.data?.message || "فشل رفض المزاد");
    } finally {
      setProcessingId(null);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR" }).format(price || 0);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));

  const getOwnerName = (auction: PendingAuction) => {
    const user = auction.car?.user;
    if (!user) return "غير محدد";
    return `${user.first_name || ""} ${user.last_name || ""}`.trim() || "غير محدد";
  };

  const statusLabel = (status: string) => {
    if (status === "pending_approval") return "في انتظار الموافقة";
    if (status === "approved") return "معتمد";
    if (status === "rejected") return "مرفوض";
    return status || "غير معروف";
  };

  return (
    <div dir="rtl" lang="ar" className="space-y-6 text-right">
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3 flex-row-reverse">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/15">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">المزادات المعلقة للاعتماد</h2>
                <p className="text-sm text-muted-foreground">
                  الإجمالي: <span className="font-semibold text-foreground">{filteredAuctions.length}</span>
                </p>
              </div>
            </div>

            <button
              onClick={fetchPendingAuctions}
              disabled={loading}
              className="inline-flex items-center justify-center flex-row-reverse gap-2 rounded-xl px-4 py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed bg-muted/30 hover:bg-muted/40 border border-border text-foreground"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {loading ? "جارٍ التحديث..." : "تحديث"}
            </button>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">البحث</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ماركة، موديل، VIN، لوحة"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-sm text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">الحالة</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground"
              >
                <option value="all">جميع الحالات</option>
                <option value="pending_approval">في انتظار الموافقة</option>
                <option value="approved">معتمد</option>
                <option value="rejected">مرفوض</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="inline-flex items-center justify-center flex-row-reverse gap-2 rounded-xl px-4 py-2.5 transition bg-muted/30 hover:bg-muted/40 border border-border text-foreground w-full"
              >
                <Filter className="h-4 w-4" />
                إعادة تعيين
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card shadow-sm p-8">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>جارٍ تحميل البيانات...</span>
          </div>
        </div>
      ) : filteredAuctions.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-sm p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد مزادات مطابقة</h3>
          <p className="text-muted-foreground">لا توجد عناصر تحتاج اعتمادًا حاليًا.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredAuctions.map((auction) => (
            <div key={auction.id} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="h-1.5 w-full bg-amber-500/70" />
              <div className="p-5 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-lg md:text-xl font-semibold text-foreground inline-flex items-center flex-row-reverse gap-2">
                          <Car className="h-5 w-5 text-primary" />
                          <span>{auction.car.make} {auction.car.model} {auction.car.year}</span>
                        </h3>
                        {!!auction.car.vin && (
                          <p className="mt-1 text-sm text-muted-foreground">VIN: <span dir="ltr">{auction.car.vin}</span></p>
                        )}
                        {!!auction.car.plate_number && (
                          <p className="mt-1 text-sm text-muted-foreground">رقم اللوحة: <span dir="ltr">{auction.car.plate_number}</span></p>
                        )}
                      </div>

                      <span className="inline-flex items-center flex-row-reverse gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-500/15 text-amber-800 border-amber-500/25 dark:text-amber-300">
                        <Clock className="h-3.5 w-3.5" />
                        {statusLabel(auction.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-border bg-muted/20 p-3">
                        <div className="text-muted-foreground">الحالة</div>
                        <div className="font-semibold text-foreground mt-1">{auction.car.condition || "غير محدد"}</div>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/20 p-3">
                        <div className="text-muted-foreground">ناقل الحركة</div>
                        <div className="font-semibold text-foreground mt-1">{auction.car.transmission || "غير محدد"}</div>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/20 p-3">
                        <div className="text-muted-foreground">العداد</div>
                        <div className="font-semibold text-foreground mt-1">
                          {Number(auction.car.odometer || 0).toLocaleString("ar-SA")} كم
                        </div>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/20 p-3">
                        <div className="text-muted-foreground">التصنيف</div>
                        <div className="font-semibold text-foreground mt-1">{auction.car.category || "غير محدد"}</div>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/20 p-3 sm:col-span-2">
                        <div className="text-muted-foreground">المالك</div>
                        <div className="font-semibold text-foreground mt-1">{getOwnerName(auction)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:border-r lg:border-border lg:pr-6">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-3 flex-row-reverse">
                        <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15 text-green-700 border border-green-500/25 dark:text-green-300">
                          <DollarSign className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-sm text-muted-foreground">سعر البداية المقترح</div>
                          <div className="font-semibold text-green-700 dark:text-green-300 mt-1">{formatPrice(auction.starting_bid)}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 flex-row-reverse">
                        <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/15">
                          <Calendar className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-sm text-muted-foreground">تاريخ الطلب</div>
                          <div className="text-sm text-foreground mt-1">{formatDate(auction.created_at)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(auction)}
                        disabled={processingId === auction.id}
                        className="inline-flex items-center justify-center flex-row-reverse gap-2 rounded-xl px-4 py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed bg-green-600 text-white hover:bg-green-700 flex-1"
                      >
                        {processingId === auction.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        موافقة
                      </button>

                      <button
                        onClick={() => handleReject(auction)}
                        disabled={processingId === auction.id}
                        className="inline-flex items-center justify-center flex-row-reverse gap-2 rounded-xl px-4 py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed bg-red-600 text-white hover:bg-red-700 flex-1"
                      >
                        {processingId === auction.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
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

      {showApprovalModal && selectedAuction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowApprovalModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl">
            <div className="p-5 md:p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">اعتماد المزاد</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedAuction.car.make} {selectedAuction.car.model} {selectedAuction.car.year}
              </p>
            </div>
            <div className="p-5 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">سعر الافتتاح</label>
                <input
                  type="number"
                  value={openingPrice}
                  onChange={(e) => setOpeningPrice(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={submitApproval}
                  disabled={processingId === selectedAuction.id}
                  className="inline-flex items-center justify-center flex-row-reverse gap-2 rounded-xl px-4 py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed bg-green-600 text-white hover:bg-green-700 flex-1"
                >
                  {processingId === selectedAuction.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  اعتماد
                </button>

                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="inline-flex items-center justify-center flex-row-reverse gap-2 rounded-xl px-4 py-2.5 transition bg-muted/30 hover:bg-muted/40 border border-border text-foreground flex-1"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectionModal && selectedAuction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowRejectionModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl">
            <div className="p-5 md:p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">رفض المزاد</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedAuction.car.make} {selectedAuction.car.model} {selectedAuction.car.year}
              </p>
            </div>
            <div className="p-5 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">سبب الرفض (اختياري)</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground min-h-[120px]"
                  rows={4}
                  placeholder="أدخل الملاحظة إن وجدت"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={submitRejection}
                  disabled={processingId === selectedAuction.id}
                  className="inline-flex items-center justify-center flex-row-reverse gap-2 rounded-xl px-4 py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed bg-red-600 text-white hover:bg-red-700 flex-1"
                >
                  {processingId === selectedAuction.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  تأكيد الرفض
                </button>

                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="inline-flex items-center justify-center flex-row-reverse gap-2 rounded-xl px-4 py-2.5 transition bg-muted/30 hover:bg-muted/40 border border-border text-foreground flex-1"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

