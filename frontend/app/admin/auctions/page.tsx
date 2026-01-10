"use client";

import { useState, useEffect } from "react";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import {
  Car,
  Clock,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  CircleDollarSign,
  Search,
  MoreVertical,
  RefreshCw,
  BarChart3,
  Zap,
  Volume2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import Pagination from "@/components/OldPagination";
import { getAxiosErrorMessage } from "@/utils/errorUtils";

interface Auction {
  id: number;
  car: {
    id: number;
    make: string;
    model: string;
    year: number;
  };
  starting_bid: number;
  current_bid: number;
  reserve_price: number;
  status: string;
  start_time: string;
  end_time: string;
  control_room_approved: boolean;
  auction_type: string;
  approved_for_live: boolean;
  created_at: string;
}

export default function AdminAuctionsPage() {
  const router = useLoadingRouter();

  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvedAuction, setApprovedAuction] = useState<Auction[]>([]);
  const [filter, setFilter] = useState("all");
  const [selectedAuctions, setSelectedAuctions] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "approvals">("all");

  // Additional state for approvals tab
  const [pendingAuctions, setPendingAuctions] = useState<Auction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Approval form state
  const [approvalData, setApprovalData] = useState({
    opening_price: "",
    auction_type: "silent_instant",
    approved_for_live: false,
  });

  // Rejection form state
  const [rejectionReason, setRejectionReason] = useState("");

  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    live: 0,
    scheduled: 0,
    completed: 0,
    pending: 0,
  });

  useEffect(() => {
    if (activeTab === "all") {
      fetchAuctions();
      fetchStats();
    } else if (activeTab === "approvals") {
      fetchPendingAuctions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filter, activeTab]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append("status", filter);

      const response = await api.get(
        `/api/admin/auctions?page=${currentPage}&pageSize=${pageSize}&${params.toString()}`
      );
      if (response.data.status === "success") {
        const data = response.data.data.data || response.data.data;
        const approvedLive = data.filter((a: Auction) => a.approved_for_live);
        setApprovedAuction(approvedLive);
        setAuctions(data);
        setTotalCount(response.data.data.total);
      }
    } catch (error) {
      console.error("Error fetching auctions:", error);
      toast.error("حدث خطأ أثناء جلب المزادات");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/api/admin/auctions/stats");
      if (response.data.status === "success") {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchPendingAuctions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);

      const response = await api.get(`/api/admin/auctions/pending?${params}`);
      if (response.data.status === "success") {
        setPendingAuctions(response.data.data.data || response.data.data);
      }
    } catch (error) {
      console.error("Error fetching pending auctions:", error);
      toast.error("فشل في تحميل المزادات المعلقة");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAuction = (auctionId: number) => {
    setSelectedAuctions((prev) =>
      prev.includes(auctionId)
        ? prev.filter((id) => id !== auctionId)
        : [...prev, auctionId]
    );
  };

  const handleSelectAll = () => {
    const currentList =
      activeTab === "all" ? filteredAuctions : pendingAuctions;
    if (selectedAuctions.length === currentList.length) {
      setSelectedAuctions([]);
    } else {
      setSelectedAuctions(currentList.map((auction) => auction.id));
    }
  };

  /**
   * ====== NEW HELPERS (bulk endpoints) ======
   */
  const bulkApproveSchedule = async (ids: number[]) => {
    return api.post(`/api/admin/auctions/bulk-approve`, {
      ids,
      mode: "schedule",
    });
  };

  const bulkApproveLive = async (id: number) => {
    return api.post(`/api/admin/auctions/bulk-approve`, {
      ids: [id],
      mode: "live",
    });
  };

  const bulkReject = async (ids: number[], reason?: string) => {
    return api.post(`/api/admin/auctions/bulk-reject`, {
      ids,
      reason: reason || "",
    });
  };

  /**
   * Bulk UI action (Approve/Reject)
   * - Approve:
   *   - في تبويب "approvals": موافقة كـ schedule دفعة واحدة
   *   - في تبويب "all":
   *       - لو مختار عنصر واحد: نسأل هل تريد Live أم Schedule
   *       - لو أكثر من عنصر: Schedule
   * - Reject: نطلب سبب (اختياري) ونرفض دفعة واحدة
   */
  const handleBulkAction = async (action: string) => {
    if (selectedAuctions.length === 0) {
      toast.error("يرجى اختيار مزاد واحد على الأقل");
      return;
    }

    try {
      if (action === "approve") {
        if (activeTab === "approvals") {
          await bulkApproveSchedule(selectedAuctions);
          toast.success("تمت الموافقة على المزادات المحددة (جدولة)");
        } else {
          if (selectedAuctions.length === 1) {
            const live = window.confirm(
              "هل تريد اعتماد هذا المزاد للبث المباشر؟\n(موافق = بث مباشر، إلغاء = موافقة كجدولة)"
            );
            if (live) {
              await bulkApproveLive(selectedAuctions[0]);
              toast.success("تم اعتماد المزاد للبث المباشر");
            } else {
              await bulkApproveSchedule(selectedAuctions);
              toast.success("تمت الموافقة على المزاد (جدولة)");
            }
          } else {
            await bulkApproveSchedule(selectedAuctions);
            toast.success("تمت الموافقة على المزادات المحددة (جدولة)");
          }
        }
      } else if (action === "reject") {
        const reason = window.prompt("سبب الرفض (اختياري):") || "";
        await bulkReject(selectedAuctions, reason);
        toast.success("تم رفض المزادات المحددة");
      }

      setSelectedAuctions([]);
      if (activeTab === "all") {
        fetchAuctions();
      } else {
        fetchPendingAuctions();
      }
    } catch (error: any) {
      console.error("Error performing bulk action:", error);
      toast.error(getAxiosErrorMessage(error, "حدث خطأ أثناء تنفيذ العملية"));
    }
  };

  /**
   * Single row actions (open modals)
   */
  const handleApprove = async (auction: Auction) => {
    setSelectedAuction(auction);
    setApprovalData({
      opening_price: auction.starting_bid?.toString?.() || "",
      auction_type: "silent_instant",
      approved_for_live: false,
    });
    setShowApprovalModal(true);
  };

  const handleReject = async (auction: Auction) => {
    setSelectedAuction(auction);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  /**
   * Approve one pending auction (modal submit)
   * - يضبط opening_price (إن تم إدخاله)
   * - ثم bulk-approve (mode=schedule) للمزاد الواحد
   */
  const submitApproval = async () => {
    if (!selectedAuction) return;

    try {
      setProcessingId(selectedAuction.id);

      // اضبط سعر الافتتاح إن وُجد
      const openingPrice = Number(approvalData.opening_price);
      if (!Number.isNaN(openingPrice) && approvalData.opening_price !== "") {
        await api.put(
          `/api/admin/auctions/${selectedAuction.id}/set-open-price`,
          { price: openingPrice }
        );
      }

      // موافقة كجدولة لهذا المزاد فقط
      await bulkApproveSchedule([selectedAuction.id]);

      toast.success("تم قبول المزاد بنجاح");
      setShowApprovalModal(false);
      if (activeTab === "approvals") {
        fetchPendingAuctions();
      } else {
        fetchAuctions();
      }
    } catch (error: any) {
      console.error("Error approving auction:", error);
      toast.error(getAxiosErrorMessage(error, "فشل في قبول المزاد"));
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Reject one pending auction (modal submit)
   * - يستخدم bulk-reject بــ id واحد + سبب
   */
  const submitRejection = async () => {
    if (!selectedAuction || !rejectionReason.trim()) {
      toast.error("يرجى إدخال سبب الرفض");
      return;
    }

    try {
      setProcessingId(selectedAuction.id);
      await bulkReject([selectedAuction.id], rejectionReason.trim());

      toast.success("تم رفض المزاد بنجاح");
      setShowRejectionModal(false);
      if (activeTab === "approvals") {
        fetchPendingAuctions();
      } else {
        fetchAuctions();
      }
    } catch (error: any) {
      console.error("Error rejecting auction:", error);
      toast.error(getAxiosErrorMessage(error, "فشل في رفض المزاد"));
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_approval":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "scheduled":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "live":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "ended":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "completed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending_approval":
        return "في انتظار الموافقة";
      case "live":
        return "نشط";
      case "scheduled":
        return "مجدول";
      case "ended":
        return "منتهي";
      case "cancelled":
        return "ملغي";
      case "completed":
        return "مكتمل";
      default:
        return status;
    }
  };

  const getStatusText1 = (status: string) => {
    switch (status) {
      case "live":
        return "الحراج المباشر";
      case "live_instant":
        return "الحراج الفوري";
      case "silent_instant":
        return "الحراج المتأخر";
      default:
        return status;
    }
  };

  const getAuctionTypeIcon = (type: string) => {
    switch (type) {
      case "live":
        return Volume2;
      case "live_instant":
        return Zap;
      case "silent_instant":
        return Clock;
      default:
        return Clock;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "غير متوفر";
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredAuctions = auctions.filter((auction) => {
    if (filter === "all") return true;
    return auction.status === filter;
    // ملاحظة: ممكن تضيف فلترة بالبحث لو حابب لاحقًا
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-2 rtl">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            إدارة المزادات
          </h1>
          <p className="text-foreground/70 mt-2">
            إدارة وتنظيم جميع المزادات في النظام
          </p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <button
            onClick={fetchAuctions}
            className="bg-card border border-border text-foreground/80 hover:bg-border hover:text-foreground transition-all duration-300 px-4 py-2 rounded-xl flex items-center"
          >
            <RefreshCw
              className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`}
            />
            تحديث
          </button>
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground/70 text-sm">إجمالي المزادات</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.total}
              </p>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-xl">
              <Car className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground/70 text-sm">مزادات نشطة</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.live}
              </p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-xl">
              <Play className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground/70 text-sm">مزادات مجدولة</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.scheduled}
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
              <p className="text-foreground/70 text-sm">مزادات مكتملة</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.completed}
              </p>
            </div>
            <div className="bg-emerald-500/10 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground/70 text-sm">في انتظار الموافقة</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.pending}
              </p>
            </div>
            <div className="bg-purple-500/10 p-3 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden mb-6">
        <div className="border-b border-border">
          <nav className="flex space-x-8 space-x-reverse px-6">
            <button
              onClick={() => setActiveTab("all")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                activeTab === "all"
                  ? "border-primary text-primary"
                  : "border-transparent text-foreground/70 hover:text-foreground hover:border-border"
              }`}
            >
              جميع المزادات
            </button>
            <button
              onClick={() => setActiveTab("approvals")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                activeTab === "approvals"
                  ? "border-primary text-primary"
                  : "border-transparent text-foreground/70 hover:text-foreground hover:border-border"
              }`}
            >
              الموافقات المعلقة
              {stats.pending > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 mr-2">
                  {stats.pending}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "all" ? (
            // All Auctions Tab
            <div className="space-y-6">
              {/* Filters and Actions */}
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/70 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="ابحث في المزادات..."
                      className="bg-background/50 border border-border rounded-xl py-2 pr-10 pl-4 text-foreground placeholder-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-background/50 border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">جميع المزادات</option>
                    <option value="scheduled">مجدولة</option>
                    <option value="live">نشطة</option>
                    <option value="ended">منتهية</option>
                    <option value="cancelled">ملغية</option>
                    <option value="completed">مكتملة</option>
                  </select>
                </div>

                {selectedAuctions.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-foreground/70">
                      تم اختيار {selectedAuctions.length} مزاد
                    </span>
                    <button
                      onClick={() => handleBulkAction("approve")}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-all duration-300 text-sm flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 ml-2" />
                      موافقة الكل
                    </button>
                    <button
                      onClick={() => handleBulkAction("reject")}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-all duration-300 text-sm flex items-center"
                    >
                      <XCircle className="w-4 h-4 ml-2" />
                      رفض الكل
                    </button>
                  </div>
                )}
              </div>

              {/* Auctions Table */}
              <div className="bg-background rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-border/50 border-b border-border">
                        <th className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={
                              selectedAuctions.length ===
                                filteredAuctions.length &&
                              filteredAuctions.length > 0
                            }
                            onChange={handleSelectAll}
                            className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                          />
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                          السيارة
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                          السعر الحالي
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                          الحالة
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                          وقت البداية
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                          نوع الحراج
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                          في البث
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredAuctions.map((auction) => {
                        const TypeIcon = getAuctionTypeIcon(
                          auction.auction_type
                        );
                        return (
                          <tr
                            key={auction.id}
                            className="hover:bg-border/50 transition-colors duration-200"
                          >
                            <td className="px-6 py-4 text-center">
                              <input
                                type="checkbox"
                                checked={selectedAuctions.includes(auction.id)}
                                onChange={() => handleSelectAuction(auction.id)}
                                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="bg-primary p-2 rounded-xl">
                                  <Car className="w-4 h-4 text-white" />
                                </div>
                                <div className="mr-4">
                                  <div
                                    className="text-sm font-medium text-foreground cursor-pointer hover:text-primary"
                                    onClick={() =>
                                      window.open(
                                        `/carDetails/${
                                          auction.car?.id || auction.id
                                        }`,
                                        "_blank"
                                      )
                                    }
                                  >
                                    {auction.car?.make} {auction.car?.model}
                                  </div>
                                  <div className="text-xs text-foreground/70 mt-1">
                                    {auction.car?.year}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center text-primary">
                                <DollarSign className="w-4 h-4 ml-1" />
                                <span className="text-sm font-medium">
                                  {auction.current_bid?.toLocaleString() || 0}{" "}
                                  ريال
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                  auction.status
                                )}`}
                              >
                                {getStatusText(auction.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground/80">
                              {formatDate(auction.start_time)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center text-sm text-foreground/80">
                                <TypeIcon className="w-4 h-4 ml-1" />
                                {getStatusText1(auction.auction_type)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {auction.approved_for_live ? (
                                <span className="text-green-400 flex items-center">
                                  <div className="w-2 h-2 bg-green-400 rounded-full ml-2 animate-pulse"></div>
                                  في البث
                                </span>
                              ) : (
                                <span className="text-foreground/70">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <button
                                  onClick={() =>
                                    window.open(
                                      `/auctions/${auction.id}`,
                                      "_blank"
                                    )
                                  }
                                  className="text-primary hover:text-primary/80 hover:bg-primary/10 p-2 rounded-lg transition-all duration-300"
                                  title="عرض التفاصيل"
                                >
                                  <Eye size={16} />
                                </button>

                                {/* Actions for live and approved */}
                                {auction.status === "live" &&
                                  auction.approved_for_live && (
                                    <>
                                      <button
                                        onClick={async function complete() {
                                          const status = await api.put(
                                            `/api/admin/auctions/${auction.id}/status`,
                                            { status: "completed" }
                                          );
                                          if (
                                            status.data.status === "success"
                                          ) {
                                            toast.success("تم إتمام الصفقة");
                                            router.refresh();
                                          } else {
                                            toast.error("حدث خطأ ما");
                                            router.refresh();
                                          }
                                        }}
                                        className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-2 rounded-lg transition-all duration-300"
                                        title="إتمام الصفقة"
                                      >
                                        <CircleDollarSign size={16} />
                                      </button>
                                      <button
                                        onClick={async function cancel() {
                                          const status = await api.put(
                                            `/api/admin/auctions/${auction.id}/status`,
                                            { status: "ended" }
                                          );
                                          if (
                                            status.data.status === "success"
                                          ) {
                                            toast.success(
                                              "تم الغاء المزاد بنجاح"
                                            );
                                            router.refresh();
                                          } else {
                                            toast.error("حدث خطأ ما");
                                            router.refresh();
                                          }
                                        }}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-all duration-300"
                                        title="إلغاء المزاد"
                                      >
                                        <XCircle size={16} />
                                      </button>
                                    </>
                                  )}

                                {/* Start live (واحد فقط في نفس الوقت) */}
                                {auction.auction_type === "live" &&
                                  !auction.approved_for_live &&
                                  auction.status === "live" &&
                                  approvedAuction.length === 0 && (
                                    <button
                                      onClick={async function approve() {
                                        const status = await api.put(
                                          `/api/admin/auctions/${auction.id}/auction-type`,
                                          {
                                            auction_type: "live",
                                            approved_for_live: true,
                                          }
                                        );
                                        if (status.data.status === "success") {
                                          toast.success("تم بدأ البث بنجاح");
                                          router.refresh();
                                        } else {
                                          toast.error("حدث خطأ ما");
                                          router.refresh();
                                        }
                                      }}
                                      className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-2 rounded-lg transition-all duration-300"
                                      title="بدأ البث"
                                    >
                                      <CheckCircle size={16} />
                                    </button>
                                  )}

                                {auction.status === "pending_approval" && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(auction)}
                                      className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-2 rounded-lg transition-all duration-300"
                                      title="موافقة"
                                    >
                                      <CheckCircle size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleReject(auction)}
                                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-all duration-300"
                                      title="رفض"
                                    >
                                      <XCircle size={16} />
                                    </button>
                                  </>
                                )}

                                <button className="text-foreground/70 hover:text-foreground hover:bg-border/50 p-2 rounded-lg transition-all duration-300">
                                  <MoreVertical size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            // Approvals Tab
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative flex-grow">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/70 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="البحث في المزادات المعلقة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-background/50 border border-border rounded-xl py-2 pr-10 pl-4 text-foreground placeholder-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <button
                  onClick={fetchPendingAuctions}
                  className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center"
                >
                  <Search className="w-4 h-4 ml-2" />
                  بحث
                </button>
              </div>

              {/* Pending Auctions Table */}
              <div className="bg-background rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-border/50 border-b border-border">
                        <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                          السيارة
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                          السعر المطلوب
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                          تاريخ الطلب
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pendingAuctions.map((auction) => (
                        <tr
                          key={auction.id}
                          className="hover:bg-border/50 transition-colors duration-200"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="bg-primary p-2 rounded-xl">
                                <Car className="w-4 h-4 text-white" />
                              </div>
                              <div className="mr-4">
                                <div className="text-sm font-medium text-foreground">
                                  {auction.car.make} {auction.car.model}
                                </div>
                                <div className="text-xs text-foreground/70 mt-1">
                                  {auction.car.year}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-primary">
                              <DollarSign className="w-4 h-4 ml-1" />
                              <span className="text-sm font-medium">
                                {auction.starting_bid?.toLocaleString()} ريال
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground/80">
                            {formatDate(auction.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <button
                                onClick={() => handleApprove(auction)}
                                disabled={processingId === auction.id}
                                className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-2 rounded-lg transition-all duration-300 disabled:opacity-50"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={() => handleReject(auction)}
                                disabled={processingId === auction.id}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-all duration-300 disabled:opacity-50"
                              >
                                <XCircle size={16} />
                              </button>
                              <button className="text-foreground/70 hover:text-foreground hover:bg-border/50 p-2 rounded-lg transition-all duration-300">
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center">
        <Pagination
          className="pagination-bar"
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedAuction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className="bg-green-500/20 p-2 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  موافقة على المزاد
                </h2>
                <p className="text-foreground/70 text-sm">
                  تأكيد موافقة على المزاد المحدد
                </p>
              </div>
            </div>

            {/* محتوى بسيط (سعر الافتتاح) */}
            <div className="space-y-4">
              <label className="block text-sm text-foreground/80">
                سعر الافتتاح (اختياري)
              </label>
              <input
                type="number"
                value={approvalData.opening_price}
                onChange={(e) =>
                  setApprovalData((p) => ({
                    ...p,
                    opening_price: e.target.value,
                  }))
                }
                className="w-full bg-background/50 border border-border rounded-xl py-2 px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="bg-border hover:bg-border/80 text-foreground px-4 py-2 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  onClick={submitApproval}
                  disabled={processingId === selectedAuction.id}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl disabled:opacity-50"
                >
                  تأكيد الموافقة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedAuction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className="bg-red-500/20 p-2 rounded-xl">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  رفض المزاد
                </h2>
                <p className="text-foreground/70 text-sm">
                  تأكيد رفض المزاد المحدد
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm text-foreground/80">
                سبب الرفض
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full bg-background/50 border border-border rounded-xl py-2 px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="bg-border hover:bg-border/80 text-foreground px-4 py-2 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  onClick={submitRejection}
                  disabled={processingId === selectedAuction.id}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl disabled:opacity-50"
                >
                  تأكيد الرفض
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
