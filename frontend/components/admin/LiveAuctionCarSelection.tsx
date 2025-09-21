"use client";

import { useState, useEffect } from "react";
import { Car, Check, X, Plus, Minus, Search, Filter, Eye } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { UserRole } from "@/types/types";

interface CarForAuction {
    id: number;
    make: string;
    model: string;
    year: number;
    condition: string;
    evaluation_price: number;
    images: string[];
    auction_status: string;
    is_currently_displayed: boolean; // For tracking which car is currently shown to viewers
    owner: string;
    created_at: string;
}

interface LiveAuctionCarSelectionProps {
    userRole: "admin" | "moderator";
    broadcastId?: number; // ID of the current broadcast
}

export default function LiveAuctionCarSelection({
    userRole,
    broadcastId,
}: LiveAuctionCarSelectionProps) {
    const [availableCars, setAvailableCars] = useState<CarForAuction[]>([]);
    const [currentlyDisplayedCar, setCurrentlyDisplayedCar] =
        useState<CarForAuction | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCondition, setFilterCondition] = useState("");
    const [activeTab, setActiveTab] = useState<"available" | "current">(
        "available"
    );
    const [bulkSelection, setBulkSelection] = useState<number[]>([]);

    useEffect(() => {
        loadCars();
    }, []);

    const loadCars = async () => {
        try {
            setLoading(true);
            const rolePrefix = userRole === UserRole.ADMIN ? "/admin" : "/moderator";

            // Get approved auctions (cars ready for live auction)
            const availableResponse = await api.get(
                `${rolePrefix}/cars/approved-auctions`
            );

            // Get current broadcast info to see which car is currently displayed
            const broadcastResponse = await api.get("/api/broadcast");

            if (availableResponse.data.status === "success") {
                const cars = availableResponse.data.data || [];
                const currentCar = broadcastResponse.data.data?.current_car;

                // Mark which car is currently displayed
                const carsWithDisplayStatus = cars.map((car: any) => ({
                    ...car,
                    is_currently_displayed: currentCar?.id === car.id,
                }));

                setAvailableCars(carsWithDisplayStatus);
                setCurrentlyDisplayedCar(currentCar || null);
            }
        } catch (error) {
            console.error("Error loading cars:", error);
            toast.error("حدث خطأ أثناء تحميل السيارات");
        } finally {
            setLoading(false);
        }
    };

    const selectCarForDisplay = async (carId: number) => {
        try {
            const rolePrefix = userRole === UserRole.ADMIN ? "/admin" : "/moderator";
            const response = await api.put(
                `${rolePrefix}/broadcast/current-car`,
                { car_id: carId }
            );

            if (response.data.status === "success") {
                toast.success("تم تحديد السيارة للعرض في البث المباشر");
                await loadCars(); // Reload data to update display status
            }
        } catch (error) {
            console.error("Error selecting car for display:", error);
            toast.error("حدث خطأ أثناء تحديد السيارة للعرض");
        }
    };

    const bulkUpdateCars = async (selected: boolean) => {
        if (bulkSelection.length === 0) {
            toast.error("يرجى اختيار سيارات أولاً");
            return;
        }

        try {
            const rolePrefix = userRole === UserRole.ADMIN ? "/admin" : "/moderator";
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
                            {/* Display Button */}
                            {showToggle && (
                                <button
                                    onClick={() => selectCarForDisplay(car.id)}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                        car.is_currently_displayed
                                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                            : "bg-green-100 text-green-700 hover:bg-green-200"
                                    }`}
                                >
                                    {car.is_currently_displayed ? (
                                        <>
                                            <Eye className="h-4 w-4 inline ml-1" />
                                            معروضة حالياً
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 inline ml-1" />
                                            عرض في البث المباشر
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

  

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    إدارة السيارات في البث المباشر
                </h2>
                <p className="text-gray-600">
                    اختر السيارة التي ستظهر للمشاهدين في البث المباشر
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
                            onClick={() => setActiveTab("current")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === "current"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            السيارة المعروضة حالياً (
                            {currentlyDisplayedCar ? 1 : 0})
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
                            {!currentlyDisplayedCar ? (
                                <div className="text-center py-8">
                                    <Check className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">
                                        لم يتم تحديد أي سيارة للعرض في البث
                                        المباشر
                                    </p>
                                </div>
                            ) : (
                                <CarCard
                                    key={currentlyDisplayedCar.id}
                                    car={currentlyDisplayedCar}
                                    showToggle={false}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
