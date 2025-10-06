"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import {
    Car,
    Search,
    Filter,
    CheckSquare,
    Square,
    MoreVertical,
    Eye,
    Edit3,
    Trash2,
    Play,
    Pause,
    Archive,
    RotateCcw,
    ChevronDown,
    X,
    MoveVertical,
    Users,
    Calendar,
    DollarSign,
    BarChart3,
    RefreshCw,
    Sparkles,
    Settings,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { redirect } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import Modal from "@/components/Modal";
import Pagination from "@/components/OldPagination";
import { MoveToLiveDialog } from "@/components/admin/MoveToLiveDialog";

interface CarFormData {
    price: string;
    id: string;
}

let carOjbect = {
    price: "",
    id: ""
};

interface CarData {
    id: number;
    make: string;
    model: string;
    year: number;
    vin: string;
    condition: string;
    transmission: string;
    category: string;
    odometer: number;
    evaluation_price: number | null;
    plate_number: string | null;
    auction_status: string;
    min_price: number;
    max_price: number;
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
    created_at: string;
    auctions?: any[];
}

interface FilterOptions {
    status: string;
    category: string;
    condition: string;
    transmission: string;
    dealer_id: string;
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
    const [showActions, setShowActions] = useState(false);
    const [formData, setFormData] = useState<CarFormData>(carOjbect);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [showMoveToLiveDialog, setShowMoveToLiveDialog] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>({
        status: "",
        category: "",
        condition: "",
        transmission: "",
        dealer_id: "",
    });
    const [enumOptions, setEnumOptions] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        inAuction: 0,
        pending: 0,
        sold: 0,
        available: 0
    });

    useEffect(() => {
        fetchCars();
        fetchStats();
    }, [currentPage]);

    useEffect(() => {
        fetchCars();
    }, [currentPage, searchTerm, filters]);

    const fetchCars = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchTerm) params.append("search", searchTerm);
            if (filters.status) params.append("status", filters.status);
            const response = await api.get(`/api/admin/cars?page=${currentPage}&pageSize=${pageSize}&${params.toString()}`);
            if (response.data.status === "success") {
                setCars(response.data.data.data);
                setTotalCount(response.data.data.total);
            }
        } catch (error) {
            console.error("Error fetching cars:", error);
            toast.error("فشل في تحميل السيارات");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get("/api/admin/cars/stats");
            if (response.data.status === "success") {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchEnumOptions = async () => {
        try {
            const response = await api.get("/api/cars/enum-options");
            if (response.data.status === "success") {
                setEnumOptions(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching enum options:", error);
        }
    };

    const handleSelectCar = (carId: number, checked: boolean) => {
        const newSelected = new Set(selectedCars);
        if (checked) {
            newSelected.add(carId);
        } else {
            newSelected.delete(carId);
        }
        setSelectedCars(newSelected);
        setSelectAll(newSelected.size === cars.length);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedCars(new Set(cars.map((car) => car.id)));
        } else {
            setSelectedCars(new Set());
        }
        setSelectAll(checked);
    };

    const handleInputChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("يجب تسجيل الدخول أولاً");
            }

            Object.keys(formData).forEach((key) => {
                const value = formData[key as keyof CarFormData];
                if (value !== null && value !== undefined) {
                    carOjbect[key] = value;
                }
            });
            
            const response = await api.put(`/api/admin/auctions/${carOjbect["id"]}/set-open-price`, carOjbect);
            
            if (response.data.status === "success") {
                toast.success("تم وضع السعر الافتراضي");
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                toast.error("حصل خطأ ما");
            }
        } catch (error: any) {
            console.error("خطأ في حفظ البيانات:", error);
        }
    };

    const handleBulkAction = async (action: string) => {
        if (selectedCars.size === 0) {
            toast.error("يرجى اختيار سيارة واحدة على الأقل");
            return;
        }

        const carIds = Array.from(selectedCars);
        try {
            switch (action) {
                case "approve-auctions":
                    const approveStatus = await api.put("/api/admin/cars/bulk/approve-reject", {
                        ids: carIds,
                        action: true,
                    });
                    toast.success(approveStatus.data.message);
                    break;
                case "reject-auctions":
                    const rejectStatus = await api.put("/api/admin/cars/bulk/approve-reject", {
                        ids: carIds,
                        action: false,
                    });
                    toast.success(rejectStatus.data.message);
                    break;
                case "move-to-live":
                    setShowMoveToLiveDialog(true);
                    return;
                case "move-to-active":
                    const moveActiveStatus = await api.put("/api/admin/auctions/bulk/move-to-status", {
                        ids: carIds,
                        status: "active",
                    });
                    toast.success(moveActiveStatus.data.message);
                    break;
                case "move-to-instant":
                    const moveInstantStatus = await api.put("/api/admin/auctions/bulk/move-to-status", {
                        ids: carIds,
                        status: "instant",
                    });
                    toast.success(moveInstantStatus.data.message);
                    break;
                case "move-to-late":
                    const moveLateStatus = await api.put("/api/admin/auctions/bulk/move-to-status", {
                        ids: carIds,
                        status: "late",
                    });
                    toast.success(moveLateStatus.data.message);
                    break;
                case "move-to-pending":
                    const movePendingStatus = await api.put("/api/admin/auctions/bulk/move-to-status", {
                        ids: carIds,
                        status: "pending",
                    });
                    toast.success(movePendingStatus.data.message);
                    break;
                case "archive":
                    toast.success("سيتم إضافة هذه الوظيفة قريباً");
                    break;
            }

            fetchCars();
            setSelectedCars(new Set());
            setSelectAll(false);
            setShowBulkActions(false);
            setShowActions(false);
        } catch (error: any) {
            console.error("Error performing bulk action:", "");
            toast.error(error.response?.data?.message || "فشل في تنفيذ العملية");
        }
    };

    const approveCarAuction = async (carId: number, approve: boolean) => {
        try {
            await api.put(`/api/admin/cars/${carId}/approve-auction`, {
                approve: approve,
            });
            toast.success(approve ? "تم الموافقة على مزاد السيارة" : "تم رفض مزاد السيارة");
            fetchCars();
        } catch (error: any) {
            console.error("Error approving auction:", error);
            toast.error(error.response?.data?.message || "فشل في معالجة طلب المزاد");
        }
    };

    const handleProcessAuction = (carId: number) => {
        router.push(`/admin/cars/${carId}/process-auction`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-500/20 text-green-400 border-green-500/30";
            case "pending":
                return "bg-amber-500/20 text-amber-400 border-amber-500/30";
            case "completed":
                return "bg-gray-500/20 text-gray-400 border-gray-500/30";
            case "cancelled":
                return "bg-red-500/20 text-red-400 border-red-500/30";
            case "in_auction":
                return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            case "sold":
                return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
            default:
                return "bg-gray-500/20 text-gray-400 border-gray-500/30";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "active":
                return "نشط";
            case "pending":
                return "في الانتظار";
            case "completed":
                return "مكتمل";
            case "cancelled":
                return "ملغي";
            case "in_auction":
                return "في المزاد";
            case "sold":
                return "تم البيع";
            case "available":
                return "متاح";
            default:
                return status;
        }
    };

    const getAuctionStatusColor = (status: string) => {
        switch (status) {
            case "in_auction":
                return "bg-green-500/20 text-green-400";
            case "pending_approval":
                return "bg-amber-500/20 text-amber-400";
            case "rejected":
                return "bg-red-500/20 text-red-400";
            case "sold":
                return "bg-emerald-500/20 text-emerald-400";
            default:
                return "bg-gray-500/20 text-gray-400";
        }
    };

    const getAuctionStatusText = (status: string) => {
        switch (status) {
            case "in_auction":
                return "تمت الموافقة";
            case "pending_approval":
                return "في انتظار الموافقة";
            case "rejected":
                return "مرفوضة";
            case "sold":
                return "تم إغلاق الصفقة";
            default:
                return "متاحة";
        }
    };

    const filteredCars = cars.filter((car) => {
        if (filters.category && car.category !== filters.category) return false;
        if (filters.condition && car.condition !== filters.condition) return false;
        if (filters.transmission && car.transmission !== filters.transmission) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 md:p-6 rtl">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                        إدارة السيارات
                    </h1>
                    <p className="text-gray-400 mt-2">
                        إدارة وتنظيم جميع السيارات في النظام
                    </p>
                </div>
                
                <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
                    <button 
                        onClick={fetchCars}
                        className="bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300 px-4 py-2 rounded-xl flex items-center"
                    >
                        <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                        تحديث
                    </button>
                    <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-600/10 border border-emerald-500/20 rounded-xl p-3">
                        <Car className="w-6 h-6 text-emerald-400" />
                    </div>
                </div>
            </div>

            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">إجمالي السيارات</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                        </div>
                        <div className="bg-blue-500/10 p-3 rounded-xl">
                            <Car className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">في المزاد</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.inAuction}</p>
                        </div>
                        <div className="bg-green-500/10 p-3 rounded-xl">
                            <Play className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">في انتظار الموافقة</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.pending}</p>
                        </div>
                        <div className="bg-amber-500/10 p-3 rounded-xl">
                            <Clock className="w-6 h-6 text-amber-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">تم البيع</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.sold}</p>
                        </div>
                        <div className="bg-emerald-500/10 p-3 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">متاحة</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.available}</p>
                        </div>
                        <div className="bg-cyan-500/10 p-3 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-cyan-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
                {/* Search and Filters Header */}
                <div className="border-b border-gray-700/50 p-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                            <div className="relative flex-grow">
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="البحث بالماركة، الموديل، أو رقم الشاصي..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-2 pr-10 pl-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                            
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300 px-4 py-2 rounded-xl flex items-center"
                            >
                                <Filter className="w-4 h-4 ml-2" />
                                فلاتر
                                <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {selectedCars.size > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-400">
                                    تم اختيار {selectedCars.size} سيارة
                                </span>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowBulkActions(!showBulkActions)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center"
                                    >
                                        إجراءات جماعية
                                        <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showBulkActions ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showBulkActions && (
                                        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-700 border border-gray-600 rounded-xl shadow-2xl z-10">
                                            <div className="p-2 space-y-1">
                                                <button onClick={() => handleBulkAction("approve-auctions")} className="w-full text-right px-4 py-2 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-all duration-300">
                                                    <CheckSquare size={16} />
                                                    الموافقة على المزادات
                                                </button>
                                                <button onClick={() => handleBulkAction("reject-auctions")} className="w-full text-right px-4 py-2 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-all duration-300">
                                                    <X size={16} />
                                                    رفض المزادات
                                                </button>
                                                <button onClick={() => handleBulkAction("move-to-live")} className="w-full text-right px-4 py-2 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-all duration-300">
                                                    <Play size={16} />
                                                    نقل إلى الحراج المباشر
                                                </button>
                                                <button onClick={() => handleBulkAction("move-to-instant")} className="w-full text-right px-4 py-2 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-all duration-300">
                                                    <Clock size={16} />
                                                    نقل الى المزادات الفورية
                                                </button>
                                                <button onClick={() => handleBulkAction("move-to-late")} className="w-full text-right px-4 py-2 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-all duration-300">
                                                    <AlertTriangle size={16} />
                                                    نقل إلى المزادات المتأخرة
                                                </button>
                                                <button onClick={() => handleBulkAction("move-to-active")} className="w-full text-right px-4 py-2 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-all duration-300">
                                                    <CheckCircle size={16} />
                                                    نقل إلى المزادات النشطة
                                                </button>
                                                <button onClick={() => handleBulkAction("move-to-pending")} className="w-full text-right px-4 py-2 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-all duration-300">
                                                    <RotateCcw size={16} />
                                                    نقل إلى المزادات المعلقة
                                                </button>
                                                <button onClick={() => handleBulkAction("archive")} className="w-full text-right px-4 py-2 hover:bg-gray-600 rounded-lg flex items-center gap-2 text-red-400 transition-all duration-300">
                                                    <Archive size={16} />
                                                    أرشفة
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
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-700/30 rounded-xl mt-4">
                            <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} className="bg-gray-700/50 border border-gray-600 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                                <option value="">كل الحالات</option>
                                <option value="available">متاح</option>
                                <option value="in_auction">غير متاح</option>
                                <option value="completed">مكتمل</option>
                                <option value="cancelled">ملغي</option>
                            </select>

                            <select value={filters.category} onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))} className="bg-gray-700/50 border border-gray-600 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                                <option value="">كل الفئات</option>
                                {enumOptions.categories?.map((category: any) => (
                                    <option key={category.value} value={category.value}>{category.label}</option>
                                ))}
                            </select>

                            <select value={filters.condition} onChange={(e) => setFilters(prev => ({ ...prev, condition: e.target.value }))} className="bg-gray-700/50 border border-gray-600 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                                <option value="">كل الحالات</option>
                                {enumOptions.conditions?.map((condition: any) => (
                                    <option key={condition.value} value={condition.value}>{condition.label}</option>
                                ))}
                            </select>

                            <select value={filters.transmission} onChange={(e) => setFilters(prev => ({ ...prev, transmission: e.target.value }))} className="bg-gray-700/50 border border-gray-600 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                                <option value="">كل أنواع الناقل</option>
                                {enumOptions.transmissions?.map((transmission: any) => (
                                    <option key={transmission.value} value={transmission.value}>{transmission.label}</option>
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
                                <tr className="bg-gray-750 border-b border-gray-700/50">
                                    <th className="px-6 py-4 text-center">
                                        <input type="checkbox" checked={selectAll} onChange={(e) => handleSelectAll(e.target.checked)} className="w-4 h-4 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500" />
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">السيارة</th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">المالك</th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">حالة المزاد</th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">حالة الموافقة</th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">سعر الأفتتاح</th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">أقل سعر مرغوب</th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">أعلى سعر مرغوب</th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">أقل سعر في المزاد</th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">أعلى سعر في المزاد</th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">تاريخ الإضافة</th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {filteredCars.map((car) => (
                                    <tr key={car.id} className="hover:bg-gray-750/50 transition-colors duration-200">
                                        <td className="px-6 py-4 text-center">
                                            <input type="checkbox" checked={selectedCars.has(car.id)} onChange={(e) => handleSelectCar(car.id, e.target.checked)} className="w-4 h-4 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="bg-gradient-to-r from-emerald-500 to-cyan-600 p-2 rounded-xl">
                                                    <Car className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="mr-4">
                                                    <div className="text-sm font-medium text-white cursor-pointer hover:text-emerald-400" onClick={() => redirect(`/carDetails/${car.id}`)}>
                                                        {car.make} {car.model}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">{car.year} • {car.plate_number || "بدون لوحة"}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300">
                                            {car.dealer ? `${car.dealer.user.first_name} ${car.dealer.user.last_name} (معرض)` : car.user ? `${car.user.first_name} ${car.user.last_name}` : "غير محدد"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(car.auction_status)}`}>
                                                {getStatusText(car.auction_status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAuctionStatusColor(car.auction_status)}`}>
                                                {getAuctionStatusText(car.auction_status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-emerald-400">
                                                <DollarSign className="w-4 h-4 ml-1" />
                                                <span className="text-sm font-medium">{car.evaluation_price?.toLocaleString() || "0"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300">{car.min_price?.toLocaleString() || "0"}</td>
                                        <td className="px-6 py-4 text-sm text-gray-300">{car.max_price?.toLocaleString() || "0"}</td>
                                        <td className="px-6 py-4 text-sm text-gray-300">{car.auctions?.[0]?.minimum_bid || "0"}</td>
                                        <td className="px-6 py-4 text-sm text-gray-300">{car.auctions?.[0]?.maximum_bid || "0"}</td>
                                        <td className="px-6 py-4 text-sm text-gray-300">
                                            {new Date(car.created_at).toLocaleDateString("ar-SA")}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                <button onClick={() => redirect(`/admin/carDetailsPreview/${car.id}`)} className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 p-2 rounded-lg transition-all duration-300" title="عرض التفاصيل">
                                                    <Eye size={16} />
                                                </button>
                                                
                                                {car.auction_status === "pending" && (
                                                    <button onClick={() => handleProcessAuction(car.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs transition-all duration-300" title="معالجة طلب المزاد">
                                                        معالجة
                                                    </button>
                                                )}
                                                
                                                {car.auction_status === "in_auction" && (
                                                    <button onClick={() => { formData.price = car.evaluation_price?.toString() || ""; formData.id = car.auctions?.[0]?.id || ""; setShowModal(true); }} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-xs transition-all duration-300" title="تحديد السعر للمزاد">
                                                        حدد السعر
                                                    </button>
                                                )}
                                                
                                                <button className="text-gray-400 hover:text-white hover:bg-gray-700/50 p-2 rounded-lg transition-all duration-300">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredCars.length === 0 && (
                            <div className="text-center py-12">
                                <Car className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                                <h3 className="text-lg font-medium text-gray-400">لا توجد سيارات</h3>
                                <p className="text-gray-500 mt-1">لم يتم العثور على سيارات تطابق معايير البحث.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-6">
                <Pagination className="pagination-bar" currentPage={currentPage} totalCount={totalCount} pageSize={pageSize} onPageChange={page => setCurrentPage(page)} />
            </div>

            {/* Price Modal */}
            <Modal show={showModal} onClose={() => setShowModal(false)} title="حدد السعر للمزاد">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input type="text" id="id" name="id" value={formData.id} className="hidden" readOnly />
                    </div>
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">سعر بدأ المزاد</label>
                        <input type="string" id="price" name="price" value={formData.price} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="سعر بدأ المزاد" required />
                    </div>
                    <div className="flex gap-3">
                        <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md transition-all duration-300">
                            حفظ
                        </button>
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-all duration-300">
                            إغلاق
                        </button>
                    </div>
                </form>
            </Modal>

            <MoveToLiveDialog open={showMoveToLiveDialog} onClose={() => setShowMoveToLiveDialog(false)} carIds={Array.from(selectedCars)} onSuccess={() => { setSelectedCars(new Set()); setSelectAll(false); fetchCars(); setShowMoveToLiveDialog(false); }} />
        </div>
    );
}