'use client';

import { useEffect, useMemo, useState } from "react";
import {
    Package,
    DollarSign,
    Truck,
    CheckCircle,
    MessageSquare,
    Loader2,
    Route,
    Car as CarIcon,
    Plus,
    Eye,
    Clock,
    TrendingUp,
    Filter,
    Search,
    Gauge,
    Settings,
    Sparkles
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Pagination } from "react-laravel-paginex";
import axios from "axios";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import LoadingLink from "@/components/LoadingLink";
import { Car } from "@/types/types";

export default function MyCarsPage() {
    const getAuctionStatusTextAndIcon = (status: string) => {
        const statusMap = {
            "available": {
                text: "متوفر للمزاد",
                color: "text-blue-400",
                bg: "bg-blue-500/20",
                border: "border-blue-500/30",
                icon: <DollarSign size={14} />
            },
            "pending_approval": {
                text: "في انتظار الموافقة",
                color: "text-amber-400",
                bg: "bg-amber-500/20", 
                border: "border-amber-500/30",
                icon: <Clock size={14} />
            },
            "in_auction": {
                text: "في المزاد",
                color: "text-emerald-400",
                bg: "bg-emerald-500/20",
                border: "border-emerald-500/30",
                icon: <TrendingUp size={14} />
            },
            "sold": {
                text: "مباع",
                color: "text-gray-400",
                bg: "bg-gray-500/20",
                border: "border-gray-500/30",
                icon: <CheckCircle size={14} />
            }
        };
        
        return statusMap[status] || { 
            text: status, 
            color: "text-gray-400", 
            bg: "bg-gray-500/20",
            border: "border-gray-500/30",
            icon: null 
        };
    };

    const [loading, setLoading] = useState(true);
    const [paginationData, setPagination] = useState([]);
    const [cars, setCars] = useState<Car[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const { user, isLoggedIn } = useAuth();
    const router = useLoadingRouter();
    
    const options = {
        containerClass: "pagination-container",
        prevButtonClass: "prev-button-class",
        nextButtonText: "التالي",
        prevButtonText: "السابق",
    };

    const getData = (paginationData) => {
        axios.get("/api/cars?page=" + paginationData.page).then((response) => {
            const carsData = response.data.data.data || response.data.data;
            setPagination(response.data.data);
            setCars(carsData);
        });
    };

    // Verify user is authenticated
    useEffect(() => {
        if (!isLoggedIn) {
            router.push("/auth/login?returnUrl=/dashboard/mycars");
        }
    }, [isLoggedIn, router]);

    // Fetch user cars data
    useEffect(() => {
        async function fetchCars() {
            if (!isLoggedIn) return;
            try {
                const response = await api.get("/api/cars");
                if (response.data.data || response.data.data) {
                    const carsData = response.data.data.data || response.data.data;
                    setPagination(response.data.data);
                    setCars(carsData);
                }
            } catch (error) {
                console.error("Error fetching cars:", error);
                toast.error("حدث خطأ أثناء تحميل بيانات السيارات");
            } finally {
                setLoading(false);
            }
        }

        fetchCars();
    }, [isLoggedIn]);

    // Filter cars based on search and status
    const filteredCars = useMemo(() => {
        return cars.filter(car => {
            const matchesSearch = car.make?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                               car.model?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || car.auction_status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [cars, searchTerm, statusFilter]);

    // Calculate quick stats
    const stats = useMemo(() => {
        return {
            total: cars.length,
            inAuction: cars.filter(car => car.auction_status === 'in_auction').length,
            pending: cars.filter(car => car.auction_status === 'pending_approval').length,
            sold: cars.filter(car => car.auction_status === 'sold').length,
        };
    }, [cars]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <Loader2 className="absolute inset-0 w-full h-full animate-spin text-purple-500" />
                        <div className="absolute inset-0 w-full h-full rounded-full border-4 border-transparent border-t-purple-500 animate-spin opacity-60"></div>
                    </div>
                    <p className="text-lg text-gray-400 font-medium">جاري تحميل سياراتك...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-2xl border border-gray-800/50 rounded-2xl p-6 shadow-2xl"
            >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                                <CarIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    سياراتي <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">({stats.total})</span>
                                </h1>
                                <p className="text-gray-400 text-sm mt-1">إدارة وعرض جميع سياراتك المعروضة في المزادات</p>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 bg-blue-500/20 rounded">
                                        <CarIcon className="w-3 h-3 text-blue-400" />
                                    </div>
                                    <span className="text-xs text-gray-400">المجموع</span>
                                </div>
                                <p className="text-lg font-bold text-white mt-1">{stats.total}</p>
                            </div>
                            <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 bg-emerald-500/20 rounded">
                                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                                    </div>
                                    <span className="text-xs text-gray-400">في المزاد</span>
                                </div>
                                <p className="text-lg font-bold text-emerald-400 mt-1">{stats.inAuction}</p>
                            </div>
                            <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 bg-amber-500/20 rounded">
                                        <Clock className="w-3 h-3 text-amber-400" />
                                    </div>
                                    <span className="text-xs text-gray-400">بانتظار الموافقة</span>
                                </div>
                                <p className="text-lg font-bold text-amber-400 mt-1">{stats.pending}</p>
                            </div>
                            <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 bg-gray-500/20 rounded">
                                        <CheckCircle className="w-3 h-3 text-gray-400" />
                                    </div>
                                    <span className="text-xs text-gray-400">مباعة</span>
                                </div>
                                <p className="text-lg font-bold text-gray-400 mt-1">{stats.sold}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <LoadingLink
                            href="/add/Car"
                            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl border border-green-400/30 hover:scale-105 transition-all duration-300 group"
                        >
                            <Plus className="w-4 h-4 text-white transition-transform group-hover:rotate-90" />
                            <span className="text-white font-medium">إضافة سيارة جديدة</span>
                        </LoadingLink>
                    </div>
                </div>
            </motion.div>

            {/* Filters and Search Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6"
            >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-3 flex-1">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ابحث عن سيارة..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl pl-4 pr-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 transition-colors"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                        >
                            <option value="all">جميع الحالات</option>
                            <option value="pending_approval">بانتظار الموافقة</option>
                            <option value="in_auction">في المزاد</option>
                            <option value="sold">مباعة</option>
                            <option value="available">متاحة</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Filter className="w-4 h-4" />
                        <span>عرض {filteredCars.length} من {cars.length} سيارة</span>
                    </div>
                </div>
            </motion.div>

            {/* Cars Grid */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
                {filteredCars.length === 0 ? (
                    <div className="col-span-full text-center py-16">
                        <div className="p-4 bg-gray-800/30 rounded-2xl border border-gray-700/50 max-w-md mx-auto">
                            <CarIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-400 mb-2">
                                {searchTerm || statusFilter !== 'all' ? 'لا توجد نتائج' : 'لا توجد سيارات'}
                            </h3>
                            <p className="text-gray-500 text-sm mb-4">
                                {searchTerm || statusFilter !== 'all' 
                                    ? 'لم نتمكن من العثور على سيارات تطابق معايير البحث'
                                    : 'لم تقم بإضافة أي سيارات بعد. عند إضافة سيارة، سيتم إنشاء مزاد تلقائياً وإرساله للمراجعة.'
                                }
                            </p>
                            {(searchTerm || statusFilter !== 'all') ? (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStatusFilter('all');
                                    }}
                                    className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
                                >
                                    إعادة تعيين الفلتر
                                </button>
                            ) : (
                                <LoadingLink
                                    href="/add/Car"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white hover:scale-105 transition-all duration-300"
                                >
                                    <Plus className="w-4 h-4" />
                                    إضافة أول سيارة
                                </LoadingLink>
                            )}
                        </div>
                    </div>
                ) : (
                    filteredCars.map((car, index) => {
                        const auctionStatus = getAuctionStatusTextAndIcon(car.auction_status);
                        const isApproved = car.auctions?.[0]?.control_room_approved;
                        
                        return (
                            <motion.div
                                key={car.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="group cursor-pointer"
                                onClick={() => router.push(`/dashboard/mycars/${car.id}`)}
                            >
                                <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl overflow-hidden hover:border-gray-700/70 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                                    {/* Car Image */}
                                    <div className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                                        <img
                                            src={
                                                car.images && car.images.length > 0
                                                    ? car.images[0]
                                                    : "https://cdn.pixabay.com/photo/2012/05/29/00/43/car-49278_1280.jpg"
                                            }
                                            alt={`${car.make} ${car.year}`}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = "https://cdn.pixabay.com/photo/2012/05/29/00/43/car-49278_1280.jpg";
                                            }}
                                        />
                                        
                                        {/* Auction Status Badge */}
                                        <div className={cn(
                                            "absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm flex items-center gap-1",
                                            auctionStatus.bg,
                                            auctionStatus.border,
                                            auctionStatus.color
                                        )}>
                                            {auctionStatus.icon}
                                            {auctionStatus.text}
                                        </div>

                                        {/* Approval Badge */}
                                        {isApproved && (
                                            <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-medium border border-emerald-500/30 backdrop-blur-sm flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                معتمدة
                                            </div>
                                        )}
                                    </div>

                                    {/* Car Details */}
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="text-lg font-bold text-white group-hover:text-gray-200 transition-colors">
                                                {car.make} {car.model} - {car.year}
                                            </h3>
                                            <div className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">
                                                {car.evaluation_price?.toLocaleString("ar-EG")}
                                            </div>
                                        </div>

                                        {/* Car Specs */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Gauge className="w-4 h-4 text-blue-400" />
                                                <span>العداد: {car.odometer} كم</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Settings className="w-4 h-4 text-purple-400" />
                                                <span>المحرك: {car.engine}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Route className="w-4 h-4 text-emerald-400" />
                                                <span>القير: {car.transmission}</span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {car.description && (
                                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                                                {car.description}
                                            </p>
                                        )}

                                        {/* Action Button */}
                                        <div className="pt-4 border-t border-gray-800/50">
                                            {car.auction_status === "in_auction" && isApproved ? (
                                                <LoadingLink
                                                    href={`/carDetails/${car.id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-all duration-300 group/view"
                                                >
                                                    <Eye className="w-4 h-4 transition-transform group-hover/view:scale-110" />
                                                    <span className="font-medium">عرض السيارة في المزاد</span>
                                                </LoadingLink>
                                            ) : car.auction_status === "sold" && isApproved ? (
                                                <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="font-medium">تم بيع السيارة</span>
                                                </div>
                                            ) : (
                                                <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="font-medium">في انتظار المعالجة</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </motion.div>

            {/* Pagination */}
            {filteredCars.length > 0 && paginationData && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center"
                >
                    <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4">
                        <Pagination 
                            data={paginationData} 
                            options={options} 
                            changePage={getData} 
                        />
                    </div>
                </motion.div>
            )}
        </div>
    );
}