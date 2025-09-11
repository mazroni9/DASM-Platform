"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";

import {
    ArrowLeft,
    Car,
    Calendar,
    DollarSign,
    Eye,
    FileText,
    Gauge,
    MapPin,
    Settings,
    User,
    CheckCircle,
    XCircle,
    Loader2,
    Edit3,
    Save,
    X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import Image from "next/image";

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
    color: string;
    engine: string;
    description: string;
    images: string[];
    dealer?: {
        user: {
            first_name: string;
            last_name: string;
            email: string;
        };
    };
    user?: {
        first_name: string;
        last_name: string;
        email: string;
    };
    created_at: string;
}

interface AuctionData {
    id: number;
    minimum_bid: number;
    maximum_bid: number;
    reserve_price: number;
    auction_type: string;
    status: string;
}

export default function AdminProcessAuctionPage() {
    const router = useLoadingRouter();
  
    const params = useParams();
    const carId = params.id as string;

    const [car, setCar] = useState<CarData | null>(null);
    const [auction, setAuction] = useState<AuctionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [editMode, setEditMode] = useState(false);

    // Form data for editing and approval
    const [formData, setFormData] = useState({
        make: "",
        model: "",
        year: 0,
        condition: "",
        transmission: "",
        category: "",
        odometer: 0,
        color: "",
        engine: "",
        description: "",
        opening_price: 0,
        evaluation_price: 0,
        rejection_reason: "",
    });

    useEffect(() => {
        fetchCarData();
    }, [carId]);

    useEffect(() => {
        if (car) {
            setFormData({
                make: car.make,
                model: car.model,
                year: car.year,
                condition: car.condition,
                transmission: car.transmission,
                category: car.category,
                odometer: car.odometer,
                color: car.color,
                engine: car.engine,
                description: car.description,
                opening_price: 0,
                evaluation_price: car.evaluation_price || 0,
                rejection_reason: "",
            });
        }
    }, [car]);

    const fetchCarData = async () => {
        try {
            setLoading(true);
            const response = await api.get(
                `/api/admin/cars/${carId}/process-auction`
            );
            if (response.data.status === "success") {
                setCar(response.data.data.car);
                setAuction(response.data.data.pending_auction);
            }
        } catch (error: any) {
            console.error("Error fetching car data:", error);
            toast.error("فشل في تحميل بيانات السيارة");
            router.push("/admin/cars");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (formData.opening_price <= 0 || formData.evaluation_price <= 0) {
            toast.error("يرجى إدخال السعر الافتتاحي وسعر التقييم");
            return;
        }

        try {
            setProcessing(true);
            const response = await api.post(
                `/api/admin/cars/${carId}/handle-auction`,
                {
                    action: "approve",
                    opening_price: formData.opening_price,
                    evaluation_price: formData.evaluation_price,
                    updated_attributes: editMode
                        ? {
                              make: formData.make,
                              model: formData.model,
                              year: formData.year,
                              condition: formData.condition,
                              transmission: formData.transmission,
                              category: formData.category,
                              odometer: formData.odometer,
                              color: formData.color,
                              engine: formData.engine,
                              description: formData.description,
                          }
                        : {},
                }
            );

            if (response.data.status === "success") {
                toast.success("تم قبول طلب المزاد بنجاح");
                router.push("/admin/cars");
            }
        } catch (error: any) {
            console.error("Error approving auction:", error);
            toast.error(
                error.response?.data?.message || "فشل في قبول طلب المزاد"
            );
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!formData.rejection_reason.trim()) {
            toast.error("يرجى إدخال سبب الرفض");
            return;
        }

        try {
            setProcessing(true);
            const response = await api.post(
                `/api/admin/cars/${carId}/handle-auction`,
                {
                    action: "reject",
                    rejection_reason: formData.rejection_reason,
                }
            );

            if (response.data.status === "success") {
                toast.success("تم رفض طلب المزاد");
                router.push("/admin/cars");
            }
        } catch (error: any) {
            console.error("Error rejecting auction:", error);
            toast.error(
                error.response?.data?.message || "فشل في رفض طلب المزاد"
            );
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="mr-2">جاري تحميل البيانات...</span>
            </div>
        );
    }

    if (!car || !auction) {
        return (
            <div className="text-center py-12">
                <XCircle className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                    لم يتم العثور على البيانات
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    لا يوجد طلب مزاد معلق لهذه السيارة
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/admin/cars")}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} />
                        العودة إلى السيارات
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800">
                        معالجة طلب المزاد
                    </h1>
                </div>
                <button
                    onClick={() => setEditMode(!editMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                        editMode
                            ? "bg-gray-600 text-white hover:bg-gray-700"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                    {editMode ? <X size={16} /> : <Edit3 size={16} />}
                    {editMode ? "إلغاء التعديل" : "تعديل البيانات"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Car Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Car className="w-5 h-5" />
                        معلومات السيارة
                    </h2>

                    {/* Car Images */}
                    {car.images && car.images.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">
                                صور السيارة
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {car.images.slice(0, 4).map((image, index) => (
                                    <div
                                        key={index}
                                        className="relative h-32 rounded-lg overflow-hidden"
                                    >
                                        <Image
                                            src={image}
                                            alt={`صورة السيارة ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    الماركة
                                </label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        value={formData.make}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                make: e.target.value,
                                            }))
                                        }
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                ) : (
                                    <p className="text-gray-900">{car.make}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    الموديل
                                </label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        value={formData.model}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                model: e.target.value,
                                            }))
                                        }
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                ) : (
                                    <p className="text-gray-900">{car.model}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    سنة الصنع
                                </label>
                                {editMode ? (
                                    <input
                                        type="number"
                                        value={formData.year}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                year: parseInt(e.target.value),
                                            }))
                                        }
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                ) : (
                                    <p className="text-gray-900">{car.year}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    عداد الكيلومترات
                                </label>
                                {editMode ? (
                                    <input
                                        type="number"
                                        value={formData.odometer}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                odometer: parseInt(
                                                    e.target.value
                                                ),
                                            }))
                                        }
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                ) : (
                                    <p className="text-gray-900">
                                        {car.odometer?.toLocaleString()} كم
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    الحالة
                                </label>
                                {editMode ? (
                                    <select
                                        value={formData.condition}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                condition: e.target.value,
                                            }))
                                        }
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="excellent">
                                            ممتازة
                                        </option>
                                        <option value="good">جيدة</option>
                                        <option value="fair">متوسطة</option>
                                        <option value="poor">ضعيفة</option>
                                    </select>
                                ) : (
                                    <p className="text-gray-900">
                                        {car.condition}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ناقل الحركة
                                </label>
                                {editMode ? (
                                    <select
                                        value={formData.transmission}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                transmission: e.target.value,
                                            }))
                                        }
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="automatic">
                                            أوتوماتيك
                                        </option>
                                        <option value="manual">عادي</option>
                                    </select>
                                ) : (
                                    <p className="text-gray-900">
                                        {car.transmission}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                الوصف
                            </label>
                            {editMode ? (
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                            ) : (
                                <p className="text-gray-900">
                                    {car.description || "لا يوجد وصف"}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                المالك
                            </label>
                            <p className="text-gray-900 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {car.dealer
                                    ? `${car.dealer.user.first_name} ${car.dealer.user.last_name} (معرض)`
                                    : car.user
                                    ? `${car.user.first_name} ${car.user.last_name}`
                                    : "غير محدد"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Auction Information and Approval */}
                <div className="space-y-6">
                    {/* Auction Details */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            معلومات المزاد المطلوب
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    الحد الأدنى للسعر
                                </label>
                                <p className="text-gray-900">
                                    {auction.minimum_bid?.toLocaleString()} ريال
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    الحد الأقصى للسعر
                                </label>
                                <p className="text-gray-900">
                                    {auction.maximum_bid?.toLocaleString()} ريال
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    السعر الاحتياطي
                                </label>
                                <p className="text-gray-900">
                                    {auction.reserve_price?.toLocaleString()}{" "}
                                    ريال
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    نوع المزاد
                                </label>
                                <p className="text-gray-900">
                                    {auction.auction_type}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Approval Form */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            قرار المعالجة
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    السعر الافتتاحي للمزاد *
                                </label>
                                <input
                                    type="number"
                                    value={formData.opening_price}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            opening_price: parseFloat(
                                                e.target.value
                                            ),
                                        }))
                                    }
                                    className="w-full p-3 border border-gray-300 rounded-md"
                                    placeholder="أدخل السعر الافتتاحي"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    سعر التقييم *
                                </label>
                                <input
                                    type="number"
                                    value={formData.evaluation_price}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            evaluation_price: parseFloat(
                                                e.target.value
                                            ),
                                        }))
                                    }
                                    className="w-full p-3 border border-gray-300 rounded-md"
                                    placeholder="أدخل سعر التقييم"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    سبب الرفض (في حالة الرفض)
                                </label>
                                <textarea
                                    value={formData.rejection_reason}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            rejection_reason: e.target.value,
                                        }))
                                    }
                                    rows={3}
                                    className="w-full p-3 border border-gray-300 rounded-md"
                                    placeholder="أدخل سبب رفض المزاد إذا كان القرار هو الرفض"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={handleApprove}
                                    disabled={processing}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                >
                                    {processing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4" />
                                    )}
                                    قبول المزاد
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={processing}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                                >
                                    {processing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <XCircle className="w-4 h-4" />
                                    )}
                                    رفض المزاد
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
