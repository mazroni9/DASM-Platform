"use client";

import { useState, useEffect } from "react";
import { Car, Check, X, Plus, Minus, Search, Filter } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface CarForAuction {
    id: number;
    make: string;
    model: string;
    year: number;
    condition: string;
    evaluation_price: number;
    images: string[];
    selected_for_live_auction: boolean;
    owner: string;
    created_at: string;
}

interface LiveAuctionCarSelectionProps {
    userRole: "admin" | "moderator";
}

export default function LiveAuctionCarSelection({
    userRole,
}: LiveAuctionCarSelectionProps) {
    const [availableCars, setAvailableCars] = useState<CarForAuction[]>([]);
    const [selectedCars, setSelectedCars] = useState<CarForAuction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCondition, setFilterCondition] = useState("");
    const [activeTab, setActiveTab] = useState<"available" | "selected">(
        "available"
    );
    const [bulkSelection, setBulkSelection] = useState<number[]>([]);

    useEffect(() => {
        loadCars();
    }, []);

    const loadCars = async () => {
        try {
            setLoading(true);
            const rolePrefix = userRole === "admin" ? "/admin" : "/moderator";

            const [availableResponse, selectedResponse] = await Promise.all([
                api.get(`${rolePrefix}/cars/live-auction-available`),
                api.get(`${rolePrefix}/cars/live-auction-selected`),
            ]);

            if (availableResponse.data.status === "success") {
                setAvailableCars(availableResponse.data.data);
            }

            if (selectedResponse.data.status === "success") {
                setSelectedCars(selectedResponse.data.data);
            }
        } catch (error) {
            console.error("Error loading cars:", error);
            toast.error("حدث خطأ أثناء تحميل السيارات");
        } finally {
            setLoading(false);
        }
    };

    const toggleCarSelection = async (carId: number) => {
        try {
            const rolePrefix = userRole === "admin" ? "/admin" : "/moderator";
            const response = await api.put(
                `${rolePrefix}/cars/${carId}/toggle-live-auction`
            );

            if (response.data.status === "success") {
                toast.success(response.data.message);
                await loadCars(); // Reload data
            }
        } catch (error) {
            console.error("Error toggling car selection:", error);
            toast.error("حدث خطأ أثناء تحديث حالة السيارة");
        }
    };

    const bulkUpdateCars = async (selected: boolean) => {
        if (bulkSelection.length === 0) {
            toast.error("يرجى اختيار سيارات أولاً");
            return;
        }

        try {
            const rolePrefix = userRole === "admin" ? "/admin" : "/moderator";
            const response = await api.put(
                `${rolePrefix}/cars/bulk-live-auction`,
                {
                    car_ids: bulkSelection,
                    selected: selected,
                }
            );

            if (response.data.status === "success") {
                toast.success(response.data.message);
                setBulkSelection([]);
                await loadCars();
            }
        } catch (error) {
            console.error("Error bulk updating cars:", error);
            toast.error("حدث خطأ أثناء تحديث السيارات");
        }
    };

    const toggleBulkSelection = (carId: number) => {
        setBulkSelection((prev) =>
            prev.includes(carId)
                ? prev.filter((id) => id !== carId)
                : [...prev, carId]
        );
    };

    const getFilteredCars = (cars: CarForAuction[]) => {
        return cars.filter((car) => {
            const matchesSearch =
                searchTerm === "" ||
                car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                car.year.toString().includes(searchTerm);

            const matchesCondition =
                filterCondition === "" || car.condition === filterCondition;

            return matchesSearch && matchesCondition;
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("ar-SA", {
            style: "currency",
            currency: "SAR",
        }).format(price);
    };

    const CarCard = ({
        car,
        showToggle = true,
    }: {
        car: CarForAuction;
        showToggle?: boolean;
    }) => (
        <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
                {/* Car Image */}
                <div className="w-20 h-20 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                    {car.images && car.images.length > 0 ? (
                        <img
                            src={car.images[0]}
                            alt={`${car.make} ${car.model}`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Car className="h-8 w-8 text-gray-400" />
                        </div>
                    )}
                </div>

                {/* Car Details */}
                <div className="flex-1">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-semibold text-lg">
                                {car.make} {car.model} {car.year}
                            </h3>
                            <p className="text-sm text-gray-600">
                                المالك: {car.owner}
                            </p>
                            <p className="text-sm text-gray-600">
                                الحالة: {car.condition}
                            </p>
                            <p className="text-sm font-medium text-green-600">
                                السعر المقدر:{" "}
                                {formatPrice(car.evaluation_price)}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Bulk Selection Checkbox */}
                            {activeTab === "available" && (
                                <input
                                    type="checkbox"
                                    checked={bulkSelection.includes(car.id)}
                                    onChange={() => toggleBulkSelection(car.id)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                            )}

                            {/* Toggle Button */}
                            {showToggle && (
                                <button
                                    onClick={() => toggleCarSelection(car.id)}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                        car.selected_for_live_auction
                                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                                            : "bg-green-100 text-green-700 hover:bg-green-200"
                                    }`}
                                >
                                    {car.selected_for_live_auction ? (
                                        <>
                                            <Minus className="h-4 w-4 inline ml-1" />
                                            إلغاء الاختيار
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 inline ml-1" />
                                            اختيار للمزاد
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">جاري تحميل السيارات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    اختيار السيارات للمزاد المباشر
                </h2>
                <p className="text-gray-600">
                    اختر السيارات التي ستظهر في المزاد المباشر القادم
                </p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b">
                    <nav className="flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveTab("available")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === "available"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            السيارات المتاحة ({availableCars.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("selected")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === "selected"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            السيارات المختارة ({selectedCars.length})
                        </button>
                    </nav>
                </div>

                {/* Filters and Search */}
                <div className="p-6 border-b bg-gray-50">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="البحث في السيارات..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Condition Filter */}
                        <div className="w-full md:w-48">
                            <select
                                value={filterCondition}
                                onChange={(e) =>
                                    setFilterCondition(e.target.value)
                                }
                                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">جميع الحالات</option>
                                <option value="excellent">ممتازة</option>
                                <option value="good">جيدة</option>
                                <option value="fair">متوسطة</option>
                                <option value="poor">ضعيفة</option>
                            </select>
                        </div>

                        {/* Bulk Actions */}
                        {activeTab === "available" &&
                            bulkSelection.length > 0 && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => bulkUpdateCars(true)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        اختيار المحدد ({bulkSelection.length})
                                    </button>
                                    <button
                                        onClick={() => setBulkSelection([])}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                                    >
                                        إلغاء التحديد
                                    </button>
                                </div>
                            )}
                    </div>
                </div>

                {/* Cars List */}
                <div className="p-6">
                    {activeTab === "available" ? (
                        <div className="space-y-4">
                            {getFilteredCars(availableCars).length === 0 ? (
                                <div className="text-center py-8">
                                    <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">
                                        لا توجد سيارات متاحة
                                    </p>
                                </div>
                            ) : (
                                getFilteredCars(availableCars).map((car) => (
                                    <CarCard key={car.id} car={car} />
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {getFilteredCars(selectedCars).length === 0 ? (
                                <div className="text-center py-8">
                                    <Check className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">
                                        لم يتم اختيار أي سيارات للمزاد المباشر
                                    </p>
                                </div>
                            ) : (
                                getFilteredCars(selectedCars).map((car) => (
                                    <CarCard key={car.id} car={car} />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
