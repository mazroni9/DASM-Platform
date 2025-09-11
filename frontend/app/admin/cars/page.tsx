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
    Loader2,
    ChevronDown,
    X,
    MoveVertical,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { redirect } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";

interface CarFormData {
    price:string;
    id:string;
}

let carOjbect = {
    price:"",
    id:""
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
    min_price:number;
    max_price:number;
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
    const [loading, setLoading] = useState(true);
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
  const pageSize = 10; // or allow user to change it
    const [filters, setFilters] = useState<FilterOptions>({
        status: "",
        category: "",
        condition: "",
        transmission: "",
        dealer_id: "",
    });
    const [enumOptions, setEnumOptions] = useState<any>({});


    useEffect(() => {
        fetchCars();
        //fetchEnumOptions();
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
            if (filters.dealer_id)
                params.append("dealer_id", filters.dealer_id);

            const response = await api.get(`/api/admin/cars?page=${currentPage}&pageSize=${pageSize}`);
            if (response.data.status === "success") {
                setCars(response.data.data.data);
                setTotalCount(response.data.data.total); // Laravel gives you total

            }
        } catch (error) {
            console.error("Error fetching cars:", error);
            toast.error("فشل في تحميل السيارات");
        } finally {
            setLoading(false);
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

        // التعامل مع تغيير قيم حقول النموذج
    const handleInputChange = (
        e: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };


// تقديم النموذج
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
try {
            // Check authentication first
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("يجب تسجيل الدخول أولاً");
            }

                // إضافة بيانات السيارة
                Object.keys(formData).forEach((key) => {
                    const value = formData[key as keyof CarFormData];
                    if (value !== null && value !== undefined) {
                        carOjbect[key]=value;
                    }
                });
                const response = await api.put(`/api/admin/auctions/${carOjbect["id"]}/set-open-price`, carOjbect);
                console.log("API Response:", response);

                if (response.data.status === "success") {
                    toast.success(
                        "تم وضع السعر الافتراضي"
                    );
                    setTimeout(() =>{
                        location.reload();
                    },1000);
                } else {
                    toast.error("حصل خطأ ما");
                }
 } catch (error: any) {
            console.error("خطأ في حفظ البيانات:", error);
  
        }

}

    const handleBulkAction = async (action: string) => {
        if (selectedCars.size === 0) {
            toast.error("يرجى اختيار سيارة واحدة على الأقل");
            return;
        }

        const carIds = Array.from(selectedCars);
        try {
            switch (action) {
                case "approve-auctions":
                    const approveStatus =  await api.put("/api/admin/cars/bulk/approve-rejcet",{
                        ids: carIds,
                        action: true,
                    });
                    toast.success(approveStatus.data.message);
                    break;
                case "reject-auctions":
                  const  rejectStatus= await api.put("/api/admin/cars/bulk/approve-rejcet",{
                        ids: carIds,
                        action: false,
                    });
                    toast.success(rejectStatus.data.message);
                    break;
                    case "move-to-live":
                    // Add bulk status update endpoint if needed
                const  moveLiveStatus= await api.put("/api/admin/auctions/bulk/move-to-status",{
                        ids: carIds,
                        status: "live",
                    });
                    toast.success(moveLiveStatus.data.message);
                    break;
                case "move-to-active":
                    // Add bulk status update endpoint if needed
                const  moveActiveStatus= await api.put("/api/admin/auctions/bulk/move-to-status",{
                        ids: carIds,
                        status: "active",
                    });
                    toast.success(moveActiveStatus.data.message);
                    break;
             case "move-to-instant":
                    // Add bulk status update endpoint if needed
                const  moveInstantStatus= await api.put("/api/admin/auctions/bulk/move-to-status",{
                        ids: carIds,
                        status: "instant",
                    });
                    toast.success(moveInstantStatus.data.message);
                    break;
            case "move-to-late":
                    // Add bulk status update endpoint if needed
                const  moveLateStatus= await api.put("/api/admin/auctions/bulk/move-to-status",{
                        ids: carIds,
                        status: "late",
                    });
                    toast.success(moveLateStatus.data.message);
                    break;        
                case "move-to-pending":
                     const  movePendingStatus= await api.put("/api/admin/auctions/bulk/move-to-status",{
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
            toast.error(
                error.response?.data?.message || "فشل في تنفيذ العملية"
            );
        }
    };

    const approveCarAuction = async (carId: number, approve: boolean) => {
        try {
            await api.put(`/api/admin/cars/${carId}/approve-auction`, {
                approve: approve,
            });
            toast.success(
                approve ? "تم الموافقة على مزاد السيارة" : "تم رفض مزاد السيارة"
            );
            fetchCars();
        } catch (error: any) {
            console.error("Error approving auction:", error);
            toast.error(
                error.response?.data?.message || "فشل في معالجة طلب المزاد"
            );
        }
    };

    const handleProcessAuction = (carId: number) => {
        router.push(`/admin/cars/${carId}/process-auction`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "completed":
                return "bg-gray-100 text-gray-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
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
            default:
                return status;
        }
    };

    const filteredCars = cars.filter((car) => {
        if (filters.category && car.category !== filters.category) return false;
        if (filters.condition && car.condition !== filters.condition)
            return false;
        if (filters.transmission && car.transmission !== filters.transmission)
            return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">
                    إدارة السيارات
                </h1>
                <div className="text-sm text-gray-500">
                    {filteredCars.length} سيارة
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                            <input
                                type="text"
                                placeholder="البحث بالماركة، الموديل، أو رقم الشاصي..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        <Filter size={20} />
                        فلاتر
                        <ChevronDown
                            className={`transition-transform ${
                                showFilters ? "rotate-180" : ""
                            }`}
                            size={16}
                        />
                    </button>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-md">
                        <select
                            value={filters.status}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    status: e.target.value,
                                }))
                            }
                            className="p-2 border border-gray-300 rounded-md"
                        >
                            <option value="">كل الحالات</option>
                            <option value="active">نشط</option>
                            <option value="pending">في الانتظار</option>
                            <option value="completed">مكتمل</option>
                            <option value="cancelled">ملغي</option>
                        </select>

                        <select
                            value={filters.category}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    category: e.target.value,
                                }))
                            }
                            className="p-2 border border-gray-300 rounded-md"
                        >
                            <option value="">كل الفئات</option>
                            {enumOptions.categories?.map((category: any) => (
                                <option
                                    key={category.value}
                                    value={category.value}
                                >
                                    {category.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.condition}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    condition: e.target.value,
                                }))
                            }
                            className="p-2 border border-gray-300 rounded-md"
                        >
                            <option value="">كل الحالات</option>
                            {enumOptions.conditions?.map((condition: any) => (
                                <option
                                    key={condition.value}
                                    value={condition.value}
                                >
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
                            className="p-2 border border-gray-300 rounded-md"
                        >
                            <option value="">كل أنواع الناقل</option>
                            {enumOptions.transmissions?.map(
                                (transmission: any) => (
                                    <option
                                        key={transmission.value}
                                        value={transmission.value}
                                    >
                                        {transmission.label}
                                    </option>
                                )
                            )}
                        </select>
                    </div>
                )}
            </div>

            {/* Bulk Actions */}
            {selectedCars.size > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                        <span className="text-blue-800">
                            تم اختيار {selectedCars.size} سيارة
                        </span>
                        <div className="relative">
                            <button
                                onClick={() =>
                                    setShowBulkActions(!showBulkActions)
                                }
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                إجراءات جماعية
                                <ChevronDown
                                    className={`transition-transform ${
                                        showBulkActions ? "rotate-180" : ""
                                    }`}
                                    size={16}
                                />
                            </button>

                            {showBulkActions && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                    <div className="p-2">
                                        <button
                                            onClick={() =>
                                                handleBulkAction(
                                                    "approve-auctions"
                                                )
                                            }
                                            className="w-full text-right px-4 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                                        >
                                            <CheckSquare size={16} />
                                            الموافقة على المزادات
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleBulkAction(
                                                    "reject-auctions"
                                                )
                                            }
                                            className="w-full text-right px-4 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                                        >
                                            <X size={16} />
                                            رفض المزادات
                                        </button>
                                                                                <button
                                            onClick={() =>
                                                handleBulkAction(
                                                    "move-to-live"
                                                )
                                            }
                                            className="w-full text-right px-4 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                                        >
                                            <CheckSquare size={16} />
                                            نقل إلى الحراج المباشر 
                                         </button>
   
                                        <button
                                            onClick={() =>
                                                handleBulkAction(
                                                    "move-to-instant"
                                                )
                                            }
                                            className="w-full text-right px-4 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                                        >
                                            <CheckSquare size={16} />
                                            نقل الى المزادات الفورية
                                        </button>
                                         <button
                                            onClick={() =>
                                                handleBulkAction(
                                                    "move-to-late"
                                                )
                                            }
                                            className="w-full text-right px-4 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                                        >
                                            <CheckSquare size={16} />
                                            نقل إلى المزادات المتأخرة
                                        </button>
                                           <button
                                            onClick={() =>
                                                handleBulkAction(
                                                    "move-to-active"
                                                )
                                            }
                                            className="w-full text-right px-4 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                                        >
                                            <CheckSquare size={16} />
                                            نقل إلى المزادات النشطة
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleBulkAction(
                                                    "move-to-pending"
                                                )
                                            }
                                            className="w-full text-right px-4 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                                        >
                                            <RotateCcw size={16} />
                                            نقل إلى المزادات المعلقة
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleBulkAction("archive")
                                            }
                                            className="w-full text-right px-4 py-2 hover:bg-gray-100 rounded flex items-center gap-2 text-red-600"
                                        >
                                            <Archive size={16} />
                                            أرشفة
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cars Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <span className="mr-2">جاري تحميل السيارات...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        <input
                                            type="checkbox"
                                            checked={selectAll}
                                            onChange={(e) =>
                                                handleSelectAll(
                                                    e.target.checked
                                                )
                                            }
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        السيارة
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        المالك
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        حالة المزاد
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        حالة الموافقة
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                       سعر الأفتتاح
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        أقل سعر مرغوب
                                    </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                       أعلى سعر مرغوب
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                       أقل سعر في المزاد
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                       أعلى سعر في المزاد
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        تاريخ الإضافة
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        الإجراءات
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredCars.map((car) => (
                                    <tr
                                        key={car.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedCars.has(
                                                    car.id
                                                )}
                                                onChange={(e) =>
                                                    handleSelectCar(
                                                        car.id,
                                                        e.target.checked
                                                    )
                                                }
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div
                                                className="flex items-center cursor-pointer hover:text-blue-600"
                                                onClick={() =>
                                                    redirect(
                                                        `/carDetails/${car.id}`
                                                    )
                                                }
                                            >
                                                <Car className="w-8 h-8 text-gray-400 ml-3" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {car.make} {car.model}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {car.year} •{" "}
                                                        {car.plate_number ||
                                                            "بدون لوحة"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {car.dealer
                                                ? `${car.dealer.user.first_name} ${car.dealer.user.last_name} (معرض)`
                                                : car.user
                                                ? `${car.user.first_name} ${car.user.last_name}`
                                                : "غير محدد"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                    car.auction_status
                                                )}`}
                                            >
                                                {getStatusText(
                                                    car.auction_status
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    car.auction_status ===
                                                    "in_auction"
                                                        ? "bg-green-100 text-green-800"
                                                        : car.auction_status ===
                                                          "pending_approval"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : car.auction_status ===
                                                          "rejected"
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-gray-100 text-gray-800"
                                                }`}
                                            >
                                                {car.auction_status ===
                                                "in_auction"
                                                    ? "تمت الموافقة"
                                                    : car.auction_status ===
                                                      "pending_approval"
                                                    ? "في انتظار الموافقة"
                                                    : car.auction_status ===
                                                      "rejected"
                                                    ? "مرفوضة"
                                                    :car.auction_status === "sold" ? "تم إغلاق الصفقة": "متاحة"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {car.evaluation_price
                                                ? `${car.evaluation_price.toLocaleString() }`
                                                : "0"}
                                        </td>
                                                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {car.min_price
                                                ? `${car.min_price.toLocaleString() }`
                                                : "0"}
                                        </td>
                                                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {car.max_price
                                                ? `${car.max_price.toLocaleString() }`
                                                : "0"}
                                        </td>
                                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {car['auctions'][0]
                                                ? `${car['auctions'][0].minimum_bid }`
                                                : "0"}
                                        </td>
                                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {car['auctions'][0]
                                                ? `${car['auctions'][0].maximum_bid }`
                                                : "0"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            
                                            {new Date(
                                                car.created_at
                                            ).toLocaleDateString("ar-SA")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        redirect(
                                                            `/admin/carDetailsPreview/${car.id}`
                                                        )
                                                    }
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="عرض التفاصيل"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {car.auction_status ===
                                                    "pending" && (
                                                    <button
                                                        onClick={() =>
                                                            handleProcessAuction(
                                                                car.id
                                                            )
                                                        }
                                                        className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
                                                        title="معالجة طلب المزاد"
                                                    >
                                                        معالجة
                                                    </button>
                                                )}
                                                {car.auction_status ===
                                                    "in_auction" && (
                                                <button
                                                 onClick= { function t(){
                                                    formData.price=car.evaluation_price.toString();
                                                    formData.id=car['auctions'][0].id;
                                                     setShowModal(true);
                                                 }}
                                                    className="bg-gray-600 text-white px-4 py-2 rounded"
                                                    title="عرض التفاصيل"
                                                >
                                                    حدد السعر للمزاد
                                                </button>)}
                                 </div>
                                 
<Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title="حدد السعر للمزاد "
      >
                 <form onSubmit={handleSubmit} className="space-y-6" >
                                                 <div>
                                                      <input
                            type="text"
                            id="id"
                            name="id"
                            value={formData.id}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            readOnly
                            hidden
                        />
                                                 </div>
                  <div>
                        <label
                            htmlFor="price"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                        </label>
                      
                        <input
                            type="string"
                            id="price"
                            name="price"
                            value={formData.price} 
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="سعر بدأ المزاد"
                            required
                        />
  
                    </div>
                      <button
                        type="submit"
                        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md text-white shadow-sm text-sm font-medium bg-green-600  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      حفظ
                    </button>
                         <button
          onClick={() => setShowModal(false)}
          className="m-2 p-4 bg-red-500 text-white px-4 py-2 rounded"
        >
          إغلاق
        </button>
</form>                                      
   
      </Modal>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                                                 

                        {filteredCars.length === 0 && !loading && (
                            <div className="text-center py-12">
                                <Car className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    لا توجد سيارات
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    لم يتم العثور على سيارات تطابق معايير البحث.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
    <Pagination
        className="pagination-bar"
        currentPage={currentPage}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={page => setCurrentPage(page)}
      />
        </div>
        
    );
}
