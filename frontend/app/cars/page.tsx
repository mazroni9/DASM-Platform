"use client";

import { useState, useEffect } from "react";
import LoadingLink from "@/components/LoadingLink";
import {
    Search,
    Filter,
    Car,
    Eye,
    Edit,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";

interface Car {
    id: number;
    make: string;
    model: string;
    year: number;
    color: string;
    condition: string;
    odometer: number;
    evaluation_price: number;
    auction_status: string;
    images: string[];
    description: string;
    dealer?: {
        name: string;
    };
    user?: {
        name: string;
    };
    auctions?: Array<{
        id: number;
        status: string;
        current_bid: number;
        start_time: string;
        end_time: string;
    }>;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function PublicCarsPage() {
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        make: "",
        condition: "",
        year_from: "",
        year_to: "",
        price_from: "",
        price_to: "",
        sort_by: "created_at",
        sort_dir: "desc",
    });
    const [showFilters, setShowFilters] = useState(false);
    const { user, isLoggedIn } = useAuth();

    const fetchCars = async (page = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: "12",
                ...filters,
            });

            if (searchTerm) {
                params.append("search", searchTerm);
            }

            const response = await api.get(`/api/cars?${params}`);

            if (response.data.status === "success") {
                setCars(response.data.data.data);
                setPagination({
                    current_page: response.data.data.current_page,
                    last_page: response.data.data.last_page,
                    per_page: response.data.data.per_page,
                    total: response.data.data.total,
                });
            }
        } catch (error) {
            console.error("Error fetching cars:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCars(currentPage);
    }, [currentPage, filters]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchCars(1);
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({
            make: "",
            condition: "",
            year_from: "",
            year_to: "",
            price_from: "",
            price_to: "",
            sort_by: "created_at",
            sort_dir: "desc",
        });
        setSearchTerm("");
        setCurrentPage(1);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "available":
                return "text-green-600 bg-green-50";
            case "in_auction":
                return "text-blue-600 bg-blue-50";
            case "sold":
                return "text-gray-600 bg-gray-50";
            default:
                return "text-gray-600 bg-gray-50";
        }
    };

    const getConditionColor = (condition: string) => {
        switch (condition) {
            case "excellent":
                return "text-green-600";
            case "good":
                return "text-blue-600";
            case "fair":
                return "text-yellow-600";
            case "poor":
                return "text-red-600";
            default:
                return "text-gray-600";
        }
    };

    const canEditCar = (car: Car) => {
        if (!isLoggedIn) return false;

        // Admin and moderator can edit any car
        if (user?.type === "admin" || user?.type === "moderator") return true;

        // Car owner can edit their own car
        if (car.dealer && user?.dealer?.id === car.dealer.id) return true;
        if (car.user && user?.id === car.user.id) return true;

        return false;
    };

    const renderPagination = () => {
        if (!pagination || pagination.last_page <= 1) return null;

        return (
            <div className="flex items-center justify-center space-x-2 mt-8">
                <button
                    onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={pagination.current_page === 1}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight className="h-4 w-4 ml-1" />
                    السابق
                </button>

                <span className="px-3 py-2 text-sm text-gray-700">
                    صفحة {pagination.current_page} من {pagination.last_page}
                </span>

                <button
                    onClick={() =>
                        setCurrentPage((prev) =>
                            Math.min(prev + 1, pagination.last_page)
                        )
                    }
                    disabled={pagination.current_page === pagination.last_page}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    التالي
                    <ChevronLeft className="h-4 w-4 mr-1" />
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            السيارات المتاحة
                        </h1>
                        <p className="text-gray-600 mt-2">
                            تصفح جميع السيارات المتاحة للمزايدة
                        </p>
                    </div>
                    <LoadingLink
                        href="/"
                        className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                        الرئيسية
                    </LoadingLink>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <form onSubmit={handleSearch} className="mb-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                    <input
                                        type="text"
                                        placeholder="ابحث في الماركة، الموديل، أو الوصف..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                            >
                                بحث
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                            >
                                <Filter className="h-4 w-4 ml-2" />
                                فلاتر
                            </button>
                        </div>
                    </form>

                    {/* Filters */}
                    {showFilters && (
                        <div className="border-t pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        الماركة
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="تويوتا، نيسان، إلخ"
                                        value={filters.make}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                "make",
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        الحالة
                                    </label>
                                    <select
                                        value={filters.condition}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                "condition",
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">جميع الحالات</option>
                                        <option value="excellent">
                                            ممتازة
                                        </option>
                                        <option value="good">جيدة</option>
                                        <option value="fair">متوسطة</option>
                                        <option value="poor">ضعيفة</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        السنة من
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="2020"
                                        value={filters.year_from}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                "year_from",
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        السنة إلى
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="2024"
                                        value={filters.year_to}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                "year_to",
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        الترتيب
                                    </label>
                                    <select
                                        value={`${filters.sort_by}_${filters.sort_dir}`}
                                        onChange={(e) => {
                                            const [sortBy, sortDir] =
                                                e.target.value.split("_");
                                            handleFilterChange(
                                                "sort_by",
                                                sortBy
                                            );
                                            handleFilterChange(
                                                "sort_dir",
                                                sortDir
                                            );
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="created_at_desc">
                                            الأحدث أولاً
                                        </option>
                                        <option value="created_at_asc">
                                            الأقدم أولاً
                                        </option>
                                        <option value="evaluation_price_asc">
                                            السعر: من الأقل للأعلى
                                        </option>
                                        <option value="evaluation_price_desc">
                                            السعر: من الأعلى للأقل
                                        </option>
                                        <option value="year_desc">
                                            السنة: من الأحدث للأقدم
                                        </option>
                                        <option value="year_asc">
                                            السنة: من الأقدم للأحدث
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                >
                                    إعادة تعيين الفلاتر
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Cars Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {cars.map((car) => (
                                <div
                                    key={car.id}
                                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                                >
                                    <div className="relative">
                                        <img
                                            src={
                                                car.images?.[0] ||
                                                "/placeholder-car.jpg"
                                            }
                                            alt={`${car.make} ${car.model}`}
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="absolute top-2 right-2">
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                                    car.auction_status
                                                )}`}
                                            >
                                                {car.auction_status ===
                                                "available"
                                                    ? "متاحة"
                                                    : car.auction_status ===
                                                      "in_auction"
                                                    ? "في المزاد"
                                                    : car.auction_status ===
                                                      "sold"
                                                    ? "مباعة"
                                                    : car.auction_status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <h3 className="font-bold text-lg text-gray-900 mb-2">
                                            {car.make} {car.model} {car.year}
                                        </h3>

                                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                                            <div className="flex justify-between">
                                                <span>الحالة:</span>
                                                <span
                                                    className={`font-medium ${getConditionColor(
                                                        car.condition
                                                    )}`}
                                                >
                                                    {car.condition ===
                                                    "excellent"
                                                        ? "ممتازة"
                                                        : car.condition ===
                                                          "good"
                                                        ? "جيدة"
                                                        : car.condition ===
                                                          "fair"
                                                        ? "متوسطة"
                                                        : car.condition ===
                                                          "poor"
                                                        ? "ضعيفة"
                                                        : car.condition}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>المسافة المقطوعة:</span>
                                                <span>
                                                    {car.odometer?.toLocaleString()}{" "}
                                                    كم
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>السعر التقديري:</span>
                                                <span className="font-semibold text-blue-600">
                                                    {car.evaluation_price?.toLocaleString()}{" "}
                                                    ريال
                                                </span>
                                            </div>
                                        </div>

                                        {/* Active Auction Info */}
                                        {car.auctions &&
                                            car.auctions.length > 0 && (
                                                <div className="bg-blue-50 p-3 rounded-md mb-4">
                                                    <p className="text-sm text-blue-800">
                                                        مزاد نشط - السعر الحالي:{" "}
                                                        {car.auctions[0].current_bid?.toLocaleString()}{" "}
                                                        ريال
                                                    </p>
                                                </div>
                                            )}

                                        <div className="flex gap-2">
                                            <LoadingLink
                                                href={`/carDetails/${car.id}`}
                                                className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                            >
                                                <Eye className="h-4 w-4 ml-2" />
                                                عرض التفاصيل
                                            </LoadingLink>

                                            {canEditCar(car) && (
                                                <LoadingLink
                                                    href={`/carDetails/${car.id}?edit=true`}
                                                    className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </LoadingLink>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {cars.length === 0 && (
                            <div className="text-center py-12">
                                <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    لا توجد سيارات
                                </h3>
                                <p className="text-gray-600">
                                    لم يتم العثور على سيارات تطابق معايير البحث
                                    الخاصة بك.
                                </p>
                            </div>
                        )}

                        {renderPagination()}
                    </>
                )}
            </div>
        </div>
    );
}
