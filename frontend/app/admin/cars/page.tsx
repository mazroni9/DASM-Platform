"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  ChangeEvent,
  FormEvent,
} from "react";
import {
  Car,
  Search,
  Filter,
  CheckSquare,
  Archive,
  RotateCcw,
  ChevronDown,
  X,
  Eye,
  Play,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import Modal from "@/components/Modal";
import Pagination from "@/components/OldPagination";
import { MoveToLiveDialog } from "@/components/admin/MoveToLiveDialog";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { PriceWithIcon } from "@/components/ui/priceWithIcon";
import { cn } from "@/lib/utils";

interface CarFormData {
  price: string;
  id: string | number;
}

let carOjbect: CarFormData = {
  price: "",
  id: "",
};

type LocalizedObj =
  | {
      ar?: string;
      en?: string;
      color?: string;
      icon?: string;
    }
  | string
  | null
  | undefined;

interface CarData {
  id: number;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;

  condition?: LocalizedObj;
  transmission?: LocalizedObj;

  category?: string;
  market_category?: string;

  odometer?: number;

  evaluation_price?: number | string | null;
  plate_number?: string | null;

  auction_status: string; // pending / available / in_auction / sold ...

  min_price?: number | string;
  max_price?: number | string;

  dealer?: {
    user: { first_name: string; last_name: string };
  } | null;

  // Owner info (unified - replaces dealer.user)
  owner?: {
    first_name?: string;
    last_name?: string;
  } | null;

  user?: {
    first_name?: string;
    last_name?: string;
    name?: string;
  } | null;

  created_at: string;

  auctions?: any[];
  active_auction?: {
    id: number | string;
    minimum_bid: number;
    maximum_bid: number;
  };
}

interface FilterOptions {
  status: string;
  category: string;
  condition: string;
  transmission: string;
}

type StatsState = {
  total: number;
  inAuction: number;
  pending: number;
  sold: number;
  available: number;
};

// Helpers
const asNumber = (v: any) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

const normalizeLabel = (v: LocalizedObj) => {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.ar || v.en || "";
};

const normalizeCategory = (car: CarData) => {
  return (car.category || car.market_category || "").toString();
};

const safeDate = (v: string) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "ط؛ظٹط± ظ…طھظˆظپط±";
  return d.toLocaleDateString("ar-SA");
};

/**
 * âœ… ظٹط¯ط¹ظ…:
 * 1) API ط§ظ„ط¬ط¯ظٹط¯:
 *    { data: { data: [...] }, pagination: {...} }
 *
 * 2) API ط§ظ„ظ‚ط¯ظٹظ…:
 *    { status:"success", data:{ data:[...] }, pagination:{...} }
 *    ط£ظˆ { status:"success", data:{ data:{data:[...]} }, pagination:{...} }
 */
function extractCarsResponse(raw: any): {
  list: CarData[];
  pagination: {
    current_page?: number;
    total?: number;
    last_page?: number;
    per_page?: number;
  } | null;
} {
  if (!raw) return { list: [], pagination: null };

  if (Array.isArray(raw?.data?.data)) {
    return { list: raw.data.data, pagination: raw.pagination ?? null };
  }

  if (raw?.status === "success" && Array.isArray(raw?.data?.data)) {
    return { list: raw.data.data, pagination: raw.pagination ?? null };
  }

  if (raw?.status === "success" && Array.isArray(raw?.data?.data?.data)) {
    return { list: raw.data.data.data, pagination: raw.pagination ?? null };
  }

  if (Array.isArray(raw?.data?.data?.data)) {
    return { list: raw.data.data.data, pagination: raw.pagination ?? null };
  }

  return { list: [], pagination: raw?.pagination ?? null };
}

/**
 * âœ… Normalize ظ„ط±ظٹط¨ظˆظ†ط³ ط§ظ„ط¥ط­طµط§ط¦ظٹط§طھ ظ…ظ‡ظ…ط§ ظƒط§ظ† ط´ظƒظ„ظ‡:
 * ظ…ظ…ظƒظ† ظٹظٹط¬ظٹ:
 * - { status:"success", data:{ total:.. } }
 * - { data:{ total:.. } }
 * - { success:true, data:{...} }
 * - { data:{ data:{...} } }
 *
 * ظˆط§ظ„ظ…ظپط§طھظٹط­ ظ…ظ…ظƒظ† طھظƒظˆظ†:
 * total / inAuction / pending / sold / available
 * ط£ظˆ snake_case: in_auction
 */
function extractStats(raw: any): Partial<StatsState> | null {
  if (!raw) return null;

  const payload =
    raw?.data?.data ??
    raw?.data ??
    (raw?.success === true ? raw?.data : null) ??
    (raw?.status === "success" ? raw?.data : null);

  if (!payload || typeof payload !== "object") return null;

  const total =
    payload.total ??
    payload.total_cars ??
    payload.count ??
    payload.all ??
    undefined;

  const inAuction =
    payload.inAuction ??
    payload.in_auction ??
    payload.inAuctionCount ??
    payload.in_auction_count ??
    undefined;

  const pending =
    payload.pending ??
    payload.pending_cars ??
    payload.pendingCount ??
    payload.pending_count ??
    undefined;

  const sold =
    payload.sold ??
    payload.sold_cars ??
    payload.soldCount ??
    payload.sold_count ??
    undefined;

  const available =
    payload.available ??
    payload.available_cars ??
    payload.availableCount ??
    payload.available_count ??
    undefined;

  return {
    total: total !== undefined ? asNumber(total) : undefined,
    inAuction: inAuction !== undefined ? asNumber(inAuction) : undefined,
    pending: pending !== undefined ? asNumber(pending) : undefined,
    sold: sold !== undefined ? asNumber(sold) : undefined,
    available: available !== undefined ? asNumber(available) : undefined,
  };
}

function calcStatsFallback(
  list: CarData[],
  totalFromPagination?: number,
): StatsState {
  const counts = {
    pending: 0,
    in_auction: 0,
    sold: 0,
    available: 0,
  };

  for (const c of list) {
    const s = (c.auction_status || "").toLowerCase();
    if (s === "pending") counts.pending++;
    else if (s === "in_auction") counts.in_auction++;
    else if (s === "sold") counts.sold++;
    else if (s === "available") counts.available++;
  }

  return {
    total:
      typeof totalFromPagination === "number" && totalFromPagination > 0
        ? totalFromPagination
        : list.length,
    pending: counts.pending,
    inAuction: counts.in_auction,
    sold: counts.sold,
    available: counts.available,
  };
}

export default function AdminCarsPage() {
  const router = useLoadingRouter();

  const [cars, setCars] = useState<CarData[]>([]);
  const [selectedCars, setSelectedCars] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CarFormData>(carOjbect);

  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [showMoveToLiveDialog, setShowMoveToLiveDialog] = useState(false);
  const [moveToLiveCarIds, setMoveToLiveCarIds] = useState<number[]>([]);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [carsToApprove, setCarsToApprove] = useState<number[]>([]);
  const [openingPrice, setOpeningPrice] = useState("");

  const [filters, setFilters] = useState<FilterOptions>({
    status: "",
    category: "",
    condition: "",
    transmission: "",
  });

  const [enumOptions, setEnumOptions] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const [stats, setStats] = useState<StatsState>({
    total: 0,
    inAuction: 0,
    pending: 0,
    sold: 0,
    available: 0,
  });

  useEffect(() => {
    fetchEnumOptions();
    fetchStats(); // âœ… ط´ط؛ظ‘ط§ظ„
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchCars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, filters]);

  const fetchCars = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (filters.status) params.append("status", filters.status);
      if (filters.category) params.append("category", filters.category);
      if (filters.condition) params.append("condition", filters.condition);
      if (filters.transmission)
        params.append("transmission", filters.transmission);

      const response = await api.get(
        `/api/admin/cars?page=${currentPage}&pageSize=${pageSize}&${params.toString()}`,
      );

      const { list, pagination } = extractCarsResponse(response.data);

      const safeList = Array.isArray(list) ? list : [];
      setCars(safeList);

      const total =
        pagination?.total !== undefined ? asNumber(pagination.total) : 0;
      if (total > 0) setTotalCount(total);

      if (pagination?.current_page !== undefined)
        setCurrentPage(asNumber(pagination.current_page));

      // âœ… Fallback ط³ط±ظٹط¹ ظ„ظ„ط¥ط­طµط§ط¦ظٹط§طھ ظ„ظˆ stats endpoint ظ…ط´ ط´ط؛ط§ظ„/ظ„ط³ظ‡ ظ…ط­ظ…ظ‘ظ„طھظˆط´
      setStats((prev) => {
        const fb = calcStatsFallback(safeList, total > 0 ? total : undefined);
        // ظ„ظˆ prev.total ظ„ط³ظ‡ 0 ط£ظˆ ط§ظ„ط§ط­طµط§ط¦ظٹط§طھ ظƒظ„ظ‡ط§ 0طŒ ط§ط³طھط¨ط¯ظ„ ط¨ظ€ fallback
        const prevSum =
          prev.total +
          prev.inAuction +
          prev.pending +
          prev.sold +
          prev.available;
        const fbSum =
          fb.total + fb.inAuction + fb.pending + fb.sold + fb.available;
        if (prevSum === 0 && fbSum > 0) return fb;
        // otherwise ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„ ط®ظ„ظٹ total ظٹطھط¸ط¨ط· ظ…ظ† pagination
        if (total > 0 && prev.total !== total) return { ...prev, total };
        return prev;
      });
    } catch (error) {
      console.error("Error fetching cars:", error);
      toast.error("ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ط§ظ„ط³ظٹط§ط±ط§طھ");
      setCars([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);

      const response = await api.get("/api/admin/cars/stats");

      const normalized = extractStats(response.data);
      if (normalized) {
        setStats((prev) => ({
          total: normalized.total ?? prev.total,
          inAuction: normalized.inAuction ?? prev.inAuction,
          pending: normalized.pending ?? prev.pending,
          sold: normalized.sold ?? prev.sold,
          available: normalized.available ?? prev.available,
        }));
        return;
      }

      // ظ„ظˆ ظ…ظپظٹط´ NormalizeطŒ ط§ط¹ظ…ظ„ fallback
      setStats(
        calcStatsFallback(cars, totalCount > 0 ? totalCount : undefined),
      );
    } catch (error) {
      console.error("Error fetching stats:", error);
      // fallback ط¨ط¯ظ„ ظ…ط§ طھظپط¶ظ„ 0
      setStats(
        calcStatsFallback(cars, totalCount > 0 ? totalCount : undefined),
      );
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchEnumOptions = async () => {
    try {
      const response = await api.get("/api/cars/enum-options");
      if (response.data?.status === "success") {
        setEnumOptions(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching enum options:", error);
    }
  };

  const handleSelectCar = (carId: number, checked: boolean) => {
    const newSelected = new Set(selectedCars);
    if (checked) newSelected.add(carId);
    else newSelected.delete(carId);

    setSelectedCars(newSelected);
    setSelectAll(newSelected.size === cars.length && cars.length > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedCars(new Set(cars.map((car) => car.id)));
    else setSelectedCars(new Set());

    setSelectAll(checked);
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      Object.keys(formData).forEach((key) => {
        const value = formData[key as keyof CarFormData];
        if (value !== null && value !== undefined) {
          // @ts-ignore
          carOjbect[key] = value;
        }
      });

      const response = await api.put(
        `/api/admin/auctions/${carOjbect["id"]}/set-open-price`,
        carOjbect,
      );

      if (response.data?.status === "success") {
        toast.success("طھظ… ظˆط¶ط¹ ط§ظ„ط³ط¹ط± ط§ظ„ط§ظپطھط±ط§ط¶ظٹ");
        setShowModal(false);
        fetchCars();
        fetchStats();
      } else {
        toast.error(response.data?.message || "ط­طµظ„ ط®ط·ط£ ظ…ط§");
      }
    } catch (error: any) {
      console.error("ط®ط·ط£ ظپظٹ ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ:", error);
      toast.error(error.response?.data?.message || "ط­طµظ„ ط®ط·ط£ ظ…ط§");
    }
  };

  const handleBulkAction = async (action: string, carId?: number) => {
    const carIds = carId ? [carId] : Array.from(selectedCars);
    if (carIds.length === 0) {
      toast.error("ظٹط±ط¬ظ‰ ط§ط®طھظٹط§ط± ط³ظٹط§ط±ط© ظˆط§ط­ط¯ط© ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„");
      return;
    }

    if (action === "approve-auctions-with-price") {
      setCarsToApprove(carIds);

      if (carId) {
        const car = cars.find((c) => c.id === carId);
        const ev = asNumber(car?.evaluation_price);
        setOpeningPrice(ev > 0 ? String(ev) : "");
      } else {
        setOpeningPrice("");
      }

      setShowApproveModal(true);
      return;
    }

    try {
      switch (action) {
        case "approve-auctions": {
          const res = await api.put("/api/admin/cars/bulk/approve-reject", {
            ids: carIds,
            action: true,
          });
          toast.success(res.data?.message || "طھظ…طھ ط§ظ„ط¹ظ…ظ„ظٹط©");
          break;
        }

        case "reject-auctions": {
          const res = await api.put("/api/admin/cars/bulk/approve-reject", {
            ids: carIds,
            action: false,
          });
          toast.success(res.data?.message || "طھظ…طھ ط§ظ„ط¹ظ…ظ„ظٹط©");
          break;
        }

        case "move-to-live":
          setMoveToLiveCarIds(carIds);
          setShowMoveToLiveDialog(true);
          return;

        case "move-to-active": {
          const res = await api.put("/api/admin/auctions/bulk/move-to-status", {
            ids: carIds,
            status: "active",
          });
          toast.success(res.data?.message || "طھظ…طھ ط§ظ„ط¹ظ…ظ„ظٹط©");
          break;
        }

        case "move-to-instant": {
          const res = await api.put("/api/admin/auctions/bulk/move-to-status", {
            ids: carIds,
            status: "instant",
          });
          toast.success(res.data?.message || "طھظ…طھ ط§ظ„ط¹ظ…ظ„ظٹط©");
          break;
        }

        case "move-to-late": {
          const res = await api.put("/api/admin/auctions/bulk/move-to-status", {
            ids: carIds,
            status: "late",
          });
          toast.success(res.data?.message || "طھظ…طھ ط§ظ„ط¹ظ…ظ„ظٹط©");
          break;
        }

        case "move-to-pending": {
          const res = await api.put("/api/admin/auctions/bulk/move-to-status", {
            ids: carIds,
            status: "pending",
          });
          toast.success(res.data?.message || "طھظ…طھ ط§ظ„ط¹ظ…ظ„ظٹط©");
          break;
        }

        case "archive":
          toast.success("ط³ظٹطھظ… ط¥ط¶ط§ظپط© ظ‡ط°ظ‡ ط§ظ„ظˆط¸ظٹظپط© ظ‚ط±ظٹط¨ط§ظ‹");
          break;
      }

      await fetchCars();
      await fetchStats();
      setSelectedCars(new Set());
      setSelectAll(false);
      setShowBulkActions(false);
    } catch (error: any) {
      console.error("Error performing bulk action:", error);
      toast.error(error.response?.data?.message || "ظپط´ظ„ ظپظٹ طھظ†ظپظٹط° ط§ظ„ط¹ظ…ظ„ظٹط©");
    }
  };

  const handleApproveWithPrice = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put("/api/admin/cars/bulk/approve-reject", {
        ids: carsToApprove,
        action: true,
        price: openingPrice,
      });

      toast.success(res.data?.message || "طھظ…طھ ط§ظ„ط¹ظ…ظ„ظٹط©");
      setShowApproveModal(false);
      setOpeningPrice("");
      setCarsToApprove([]);

      await fetchCars();
      await fetchStats();

      setSelectedCars(new Set());
      setSelectAll(false);
      setShowBulkActions(false);
    } catch (error: any) {
      console.error("Error performing bulk action:", error);
      toast.error(error.response?.data?.message || "ظپط´ظ„ ظپظٹ طھظ†ظپظٹط° ط§ظ„ط¹ظ…ظ„ظٹط©");
    }
  };


  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30";
      case "available":
        return "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/30";
      case "in_auction":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30";
      case "sold":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30";
    }
  };

  const getStatusText = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "active":
        return "ظ†ط´ط·";
      case "pending":
        return "ظپظٹ ط§ظ„ط§ظ†طھط¸ط§ط±";
      case "available":
        return "ظ…طھط§ط­";
      case "in_auction":
        return "ظپظٹ ط§ظ„ظ…ط²ط§ط¯";
      case "sold":
        return "طھظ… ط§ظ„ط¨ظٹط¹";
      case "completed":
        return "ظ…ظƒطھظ…ظ„";
      case "cancelled":
        return "ظ…ظ„ط؛ظٹ";
      default:
        return status || "ط؛ظٹط± ظ…ط¹ط±ظˆظپ";
    }
  };

  const getApprovalColor = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "pending":
      case "pending_approval":
        return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400";
      case "in_auction":
      case "available":
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400";
      case "sold":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400";
    }
  };

  const getApprovalText = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "pending":
      case "pending_approval":
        return "ظپظٹ ط§ظ†طھط¸ط§ط± ط§ظ„ظ…ظˆط§ظپظ‚ط©";
      case "rejected":
        return "ظ…ط±ظپظˆط¶ط©";
      case "in_auction":
      case "available":
      case "approved":
        return "طھظ…طھ ط§ظ„ظ…ظˆط§ظپظ‚ط©";
      case "sold":
        return "طھظ… ط¥ط؛ظ„ط§ظ‚ ط§ظ„طµظپظ‚ط©";
      default:
        return "ظ…طھط§ط­ط©";
    }
  };

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const category = normalizeCategory(car);
      const cond = normalizeLabel(car.condition);
      const trans = normalizeLabel(car.transmission);

      if (filters.category && category !== filters.category) return false;
      if (filters.condition && cond !== filters.condition) return false;
      if (filters.transmission && trans !== filters.transmission) return false;
      return true;
    });
  }, [cars, filters.category, filters.condition, filters.transmission]);

  const refreshAll = async () => {
    await fetchCars();
    await fetchStats();
    toast.success("طھظ… طھط­ط¯ظٹط« ط§ظ„ط¨ظٹط§ظ†ط§طھ");
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground p-2 rtl"
      dir="rtl"
      lang="ar"
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            ط¥ط¯ط§ط±ط© ط§ظ„ط³ظٹط§ط±ط§طھ
          </h1>
          <p className="text-foreground/70 mt-2">
            ط¥ط¯ط§ط±ط© ظˆطھظ†ط¸ظٹظ… ط¬ظ…ظٹط¹ ط§ظ„ط³ظٹط§ط±ط§طھ ظپظٹ ط§ظ„ظ†ط¸ط§ظ…
          </p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <button
            onClick={refreshAll}
            disabled={loading || statsLoading}
            className="bg-card border border-border text-foreground/80 hover:bg-border hover:text-foreground transition-all duration-300 px-4 py-2 rounded-xl flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-4 h-4 ml-2 ${
                loading || statsLoading ? "animate-spin" : ""
              }`}
            />
            طھط­ط¯ظٹط«
          </button>

          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
            <Car className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط³ظٹط§ط±ط§طھ"
          value={stats.total}
          icon={<Car className="w-6 h-6 text-primary" />}
          box="bg-primary/10"
        />
        <StatCard
          title="ظپظٹ ط§ظ„ظ…ط²ط§ط¯"
          value={stats.inAuction}
          icon={<Play className="w-6 h-6 text-green-400" />}
          box="bg-green-500/10"
        />
        <StatCard
          title="ظپظٹ ط§ظ†طھط¸ط§ط± ط§ظ„ظ…ظˆط§ظپظ‚ط©"
          value={stats.pending}
          icon={<Clock className="w-6 h-6 text-amber-400" />}
          box="bg-amber-500/10"
        />
        <StatCard
          title="طھظ… ط§ظ„ط¨ظٹط¹"
          value={stats.sold}
          icon={<CheckCircle className="w-6 h-6 text-emerald-400" />}
          box="bg-emerald-500/10"
        />
        <StatCard
          title="ظ…طھط§ط­ط©"
          value={stats.available}
          icon={<TrendingUp className="w-6 h-6 text-cyan-400" />}
          box="bg-cyan-500/10"
        />
      </div>

      {/* Main Content */}
      <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Search and Filters Header */}
        <div className="border-b border-border p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
              <div className="relative flex-grow">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/70 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ط§ظ„ط¨ط­ط« ط¨ط§ظ„ظ…ط§ط±ظƒط©طŒ ط§ظ„ظ…ظˆط¯ظٹظ„طŒ ط£ظˆ ط±ظ‚ظ… ط§ظ„ط´ط§طµظٹ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-xl py-2 pr-10 pl-4 text-foreground placeholder-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-background border border-border text-foreground/80 hover:bg-border hover:text-foreground transition-all duration-300 px-4 py-2 rounded-xl flex items-center"
              >
                <Filter className="w-4 h-4 ml-2" />
                ظپظ„ط§طھط±
                <ChevronDown
                  className={`w-4 h-4 mr-2 transition-transform ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {selectedCars.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-foreground/70">
                  طھظ… ط§ط®طھظٹط§ط± {selectedCars.size} ط³ظٹط§ط±ط©
                </span>

                <div className="relative">
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl transition-all duration-300 flex items-center"
                  >
                    ط¥ط¬ط±ط§ط،ط§طھ ط¬ظ…ط§ط¹ظٹط©
                    <ChevronDown
                      className={`w-4 h-4 mr-2 transition-transform ${
                        showBulkActions ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showBulkActions && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl z-10">
                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => handleBulkAction("approve-auctions")}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition-all duration-300"
                        >
                          <CheckSquare size={16} />
                          ط§ظ„ظ…ظˆط§ظپظ‚ط© ط¹ظ„ظ‰ ط§ظ„ظ…ط²ط§ط¯ط§طھ
                        </button>

                        <button
                          onClick={() => handleBulkAction("reject-auctions")}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition-all duration-300"
                        >
                          <X size={16} />
                          ط±ظپط¶ ط§ظ„ظ…ط²ط§ط¯ط§طھ
                        </button>

                        <button
                          onClick={() => handleBulkAction("move-to-live")}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition-all duration-300"
                        >
                          <Play size={16} />
                          ظ†ظ‚ظ„ ط¥ظ„ظ‰ ط§ظ„ط­ط±ط§ط¬ ط§ظ„ظ…ط¨ط§ط´ط±
                        </button>

                        <button
                          onClick={() => handleBulkAction("move-to-instant")}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition-all duration-300"
                        >
                          <Clock size={16} />
                          ظ†ظ‚ظ„ ط§ظ„ظ‰ ط§ظ„ظ…ط²ط§ط¯ط§طھ ط§ظ„ظپظˆط±ظٹط©
                        </button>

                        <button
                          onClick={() => handleBulkAction("move-to-late")}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition-all duration-300"
                        >
                          <AlertTriangle size={16} />
                          ظ†ظ‚ظ„ ط¥ظ„ظ‰ ط§ظ„ظ…ط²ط§ط¯ط§طھ ط§ظ„ظ…طھط£ط®ط±ط©
                        </button>

                        <button
                          onClick={() => handleBulkAction("move-to-active")}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition-all duration-300"
                        >
                          <CheckCircle size={16} />
                          ظ†ظ‚ظ„ ط¥ظ„ظ‰ ط§ظ„ظ…ط²ط§ط¯ط§طھ ط§ظ„ظ†ط´ط·ط©
                        </button>

                        <button
                          onClick={() => handleBulkAction("move-to-pending")}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition-all duration-300"
                        >
                          <RotateCcw size={16} />
                          ظ†ظ‚ظ„ ط¥ظ„ظ‰ ط§ظ„ظ…ط²ط§ط¯ط§طھ ط§ظ„ظ…ط¹ظ„ظ‚ط©
                        </button>

                        <button
                          onClick={() => handleBulkAction("archive")}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 text-red-500 transition-all duration-300"
                        >
                          <Archive size={16} />
                          ط£ط±ط´ظپط©
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-background/50 rounded-xl mt-4">
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="bg-background border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>
                <option value="available">ظ…طھط§ط­</option>
                <option value="pending">ظپظٹ ط§ظ„ط§ظ†طھط¸ط§ط±</option>
                <option value="in_auction">ظپظٹ ط§ظ„ظ…ط²ط§ط¯</option>
                <option value="sold">طھظ… ط§ظ„ط¨ظٹط¹</option>
                <option value="completed">ظ…ظƒطھظ…ظ„</option>
                <option value="cancelled">ظ…ظ„ط؛ظٹ</option>
              </select>

              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value }))
                }
                className="bg-background border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">ظƒظ„ ط§ظ„ظپط¦ط§طھ</option>
                {enumOptions.categories?.map((category: any) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.condition}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, condition: e.target.value }))
                }
                className="bg-background border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>
                {enumOptions.conditions?.map((condition: any) => (
                  <option key={condition.value} value={condition.value}>
                    {condition.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.transmission}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    transmission: e.target.value,
                  }))
                }
                className="bg-background border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">ظƒظ„ ط£ظ†ظˆط§ط¹ ط§ظ„ظ†ط§ظ‚ظ„</option>
                {enumOptions.transmissions?.map((transmission: any) => (
                  <option key={transmission.value} value={transmission.value}>
                    {transmission.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Cars Table */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-border/50 border-b border-border">
                  <th className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                    />
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                    ط§ظ„ط³ظٹط§ط±ط©
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                    ط§ظ„ظ…ط§ظ„ظƒ
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                    ط­ط§ظ„ط© ط§ظ„ظ…ط²ط§ط¯
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                    ط­ط§ظ„ط© ط§ظ„ظ…ظˆط§ظپظ‚ط©
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                    ط³ط¹ط± ط§ظ„ط£ظپطھطھط§ط­
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                    ط£ظ‚ظ„ ط³ط¹ط± ظ…ط±ط؛ظˆط¨
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                    ط£ط¹ظ„ظ‰ ط³ط¹ط± ظ…ط±ط؛ظˆط¨
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                    ط£ظ‚ظ„ ط³ط¹ط± ظپظٹ ط§ظ„ظ…ط²ط§ط¯
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                    ط£ط¹ظ„ظ‰ ط³ط¹ط± ظپظٹ ط§ظ„ظ…ط²ط§ط¯
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                    طھط§ط±ظٹط® ط§ظ„ط¥ط¶ط§ظپط©
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                    ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y border-border">
                {filteredCars.map((car) => {
                  const owner = car.dealer?.user
                    ? `${car.dealer.user.first_name} ${car.dealer.user.last_name} (ظ…ط¹ط±ط¶)`
                    : car.user
                      ? car.user.name ||
                        `${car.user.first_name || ""} ${
                          car.user.last_name || ""
                        }`.trim() ||
                        "ط؛ظٹط± ظ…ط­ط¯ط¯"
                      : "ط؛ظٹط± ظ…ط­ط¯ط¯";

                  return (
                    <tr
                      key={car.id}
                      className="hover:bg-border/50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCars.has(car.id)}
                          onChange={(e) =>
                            handleSelectCar(car.id, e.target.checked)
                          }
                          className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="bg-primary text-primary-foreground p-2 rounded-xl">
                            <Car className="w-4 h-4" />
                          </div>

                          <div className="mr-4">
                            <div
                              className="text-sm font-medium text-foreground cursor-pointer hover:text-primary"
                              onClick={() =>
                                router.push(`/carDetails/${car.id}`)
                              }
                            >
                              {car.make || "â€”"} {car.model || "â€”"}
                            </div>
                            <div className="text-xs text-foreground/70 mt-1">
                              {car.year ?? "â€”"} â€¢{" "}
                              {car.plate_number || "ط¨ط¯ظˆظ† ظ„ظˆط­ط©"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-foreground/80">
                        {owner}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                            getStatusColor(car.auction_status),
                          )}
                        >
                          {getStatusText(car.auction_status)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            getApprovalColor(car.auction_status),
                          )}
                        >
                          {getApprovalText(car.auction_status)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center text-primary">
                          <PriceWithIcon
                            iconSize={18}
                            className="text-sm font-medium"
                            price={asNumber(car.evaluation_price)}
                          />
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-foreground/80">
                        <PriceWithIcon
                          iconSize={18}
                          price={asNumber(car.min_price)}
                        />
                      </td>

                      <td className="px-6 py-4 text-sm text-foreground/80">
                        <PriceWithIcon
                          iconSize={18}
                          price={asNumber(car.max_price)}
                        />
                      </td>

                      <td className="px-6 py-4 text-sm text-foreground/80">
                        <PriceWithIcon
                          iconSize={18}
                          price={asNumber(car.auctions?.[0]?.minimum_bid)}
                        />
                      </td>

                      <td className="px-6 py-4 text-sm text-foreground/80">
                        <PriceWithIcon
                          iconSize={18}
                          price={asNumber(car.auctions?.[0]?.maximum_bid)}
                        />
                      </td>

                      <td className="px-6 py-4 text-sm text-foreground/80">
                        {safeDate(car.created_at)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => router.push(`/admin/cars/${car.id}`)}
                            className="text-primary hover:text-primary/80 hover:bg-primary/10 p-2 rounded-lg transition-all duration-300"
                            title="ط¹ط±ط¶ ط§ظ„طھظپط§طµظٹظ„"
                          >
                            <Eye size={16} />
                          </button>

                          {car.auction_status === "pending" && (
                            <button
                              onClick={() => { setCarsToApprove([car.id]); setOpeningPrice(String(asNumber(car.evaluation_price) || "")); setShowApproveModal(true); }}
                              className="bg-secondary hover:bg-secondary/90 text-white px-3 py-1 rounded-lg text-xs transition-all duration-300"
                              title="ظ…ط¹ط§ظ„ط¬ط© ط·ظ„ط¨ ط§ظ„ظ…ط²ط§ط¯"
                            >
                              ظ…ط¹ط§ظ„ط¬ط©
                            </button>
                          )}

                          {car.active_auction?.id ? (
                            <button
                              onClick={() => {
                                setFormData({
                                  price: String(
                                    asNumber(car.evaluation_price) || "",
                                  ),
                                  id: car.active_auction?.id || "",
                                });
                                setShowModal(true);
                              }}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded-lg text-xs transition-all duration-300"
                              title="طھط­ط¯ظٹط¯ ط§ظ„ط³ط¹ط± ظ„ظ„ظ…ط²ط§ط¯"
                            >
                              ط­ط¯ط¯ ط§ظ„ط³ط¹ط±
                            </button>
                          ) : null}

                          <ActionsMenu
                            car={car}
                            handleAction={handleBulkAction}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredCars.length === 0 && !loading && (
              <div className="text-center py-12">
                <Car className="mx-auto h-12 w-12 text-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground/70">
                  ظ„ط§ طھظˆط¬ط¯ ط³ظٹط§ط±ط§طھ
                </h3>
                <p className="text-foreground/50 mt-1">
                  ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ط³ظٹط§ط±ط§طھ طھط·ط§ط¨ظ‚ ظ…ط¹ط§ظٹظٹط± ط§ظ„ط¨ط­ط«.
                </p>
              </div>
            )}

            {loading && (
              <div className="text-center py-10 text-muted-foreground">
                <div className="inline-flex items-center gap-2 flex-row-reverse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <Pagination
          className="pagination-bar"
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={(p: number) => setCurrentPage(p)}
        />
      </div>

      {/* Price Modal */}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title="ط­ط¯ط¯ ط§ظ„ط³ط¹ط± ظ„ظ„ظ…ط²ط§ط¯"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            id="id"
            name="id"
            value={formData.id}
            className="hidden"
            readOnly
          />

          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-foreground mb-1"
            >
              ط³ط¹ط± ط¨ط¯ط£ ط§ظ„ظ…ط²ط§ط¯
            </label>
            <input
              type="text"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              placeholder="ط³ط¹ط± ط¨ط¯ط£ ط§ظ„ظ…ط²ط§ط¯"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-secondary hover:bg-secondary/90 text-white py-2 px-4 rounded-md transition-all duration-300"
            >
              ط­ظپط¸
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 bg-border hover:bg-border/80 text-foreground py-2 px-4 rounded-md transition-all duration-300"
            >
              ط¥ط؛ظ„ط§ظ‚
            </button>
          </div>
        </form>
      </Modal>

      {/* Approve with Price Modal */}
      <Modal
        show={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="ط§ظ„ظ…ظˆط§ظپظ‚ط© ط¹ظ„ظ‰ ط§ظ„ظ…ط²ط§ط¯ ظˆطھط­ط¯ظٹط¯ ط³ط¹ط± ط§ظ„ط¨ط¯ط§ظٹط©"
      >
        <form onSubmit={handleApproveWithPrice} className="space-y-6">
          <div>
            <label
              htmlFor="openingPrice"
              className="block text-sm font-medium text-foreground mb-1"
            >
              ط³ط¹ط± ط¨ط¯ط£ ط§ظ„ظ…ط²ط§ط¯
            </label>
            <input
              type="number"
              id="openingPrice"
              name="openingPrice"
              value={openingPrice}
              onChange={(e) => setOpeningPrice(e.target.value)}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              placeholder="ط³ط¹ط± ط¨ط¯ط£ ط§ظ„ظ…ط²ط§ط¯"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-secondary hover:bg-secondary/90 text-white py-2 px-4 rounded-md transition-all duration-300"
            >
              ظ…ظˆط§ظپظ‚
            </button>
            <button
              type="button"
              onClick={() => setShowApproveModal(false)}
              className="flex-1 bg-border hover:bg-border/80 text-foreground py-2 px-4 rounded-md transition-all duration-300"
            >
              ط¥ط؛ظ„ط§ظ‚
            </button>
          </div>
        </form>
      </Modal>

      <MoveToLiveDialog
        open={showMoveToLiveDialog}
        onClose={() => setShowMoveToLiveDialog(false)}
        carIds={moveToLiveCarIds}
        onSuccess={() => {
          setSelectedCars(new Set());
          setSelectAll(false);
          fetchCars();
          fetchStats();
          setShowMoveToLiveDialog(false);
        }}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  box,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  box: string;
}) {
  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-foreground/70 text-sm">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className={`${box} p-3 rounded-xl`}>{icon}</div>
      </div>
    </div>
  );
}

const ITEM_HEIGHT = 55;

export function ActionsMenu({
  car,
  handleAction,
}: {
  car: CarData;
  handleAction: (action: string, carId?: number) => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const actionItem = (
    action: string,
    label: string,
    Icon: any,
    danger = false,
  ) => (
    <MenuItem
      onClick={() => {
        handleClose();
        handleAction(action, car.id);
      }}
      sx={{ direction: "rtl" }}
    >
      <div
        className={cn(
          "w-full flex items-center justify-between",
          danger && "text-red-600",
        )}
      >
        <span className="text-sm">{label}</span>
        <Icon size={16} />
      </div>
    </MenuItem>
  );

  return (
    <div>
      <button
        aria-label="more"
        id="long-button"
        aria-controls={open ? "long-menu" : undefined}
        aria-expanded={open ? "true" : undefined}
        aria-haspopup="true"
        onClick={handleClick}
        className="text-foreground/70 hover:text-foreground hover:bg-border p-2 rounded-lg transition-all duration-300"
      >
        <span className="inline-block">â‹®</span>
      </button>

      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: { style: { maxHeight: ITEM_HEIGHT * 6.5, width: "25ch" } },
          list: { "aria-labelledby": "long-button" as any },
        }}
      >
        {actionItem(
          "approve-auctions-with-price",
          "ط§ظ„ظ…ظˆط§ظپظ‚ط© ط¹ظ„ظ‰ ط§ظ„ظ…ط²ط§ط¯ط§طھ",
          CheckSquare,
        )}
        {actionItem("reject-auctions", "ط±ظپط¶ ط§ظ„ظ…ط²ط§ط¯ط§طھ", X)}
        {actionItem("move-to-live", "ظ†ظ‚ظ„ ط¥ظ„ظ‰ ط§ظ„ط­ط±ط§ط¬ ط§ظ„ظ…ط¨ط§ط´ط±", Play)}
        {actionItem("move-to-instant", "ظ†ظ‚ظ„ ط§ظ„ظ‰ ط§ظ„ظ…ط²ط§ط¯ط§طھ ط§ظ„ظپظˆط±ظٹط©", Clock)}
        {actionItem("move-to-late", "ظ†ظ‚ظ„ ط¥ظ„ظ‰ ط§ظ„ظ…ط²ط§ط¯ط§طھ ط§ظ„ظ…طھط£ط®ط±ط©", AlertTriangle)}
        {actionItem("move-to-active", "ظ†ظ‚ظ„ ط¥ظ„ظ‰ ط§ظ„ظ…ط²ط§ط¯ط§طھ ط§ظ„ظ†ط´ط·ط©", CheckCircle)}
        {actionItem("move-to-pending", "ظ†ظ‚ظ„ ط¥ظ„ظ‰ ط§ظ„ظ…ط²ط§ط¯ط§طھ ط§ظ„ظ…ط¹ظ„ظ‚ط©", RotateCcw)}
        {actionItem("archive", "ط£ط±ط´ظپط©", Archive, true)}
      </Menu>
    </div>
  );
}
