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
  Sparkles,
  AlertTriangle,
  Info,
  Shield,
  Clock,
  TrendingUp,
  BarChart3,
  Camera,
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
  const [processing, setProcessing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "pricing" | "decision">(
    "info",
  );

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
      const response = await api.get(
        `/api/admin/cars/${carId}/process-auction`,
      );
      if (response.data.status === "success") {
        setCar(response.data.data.car);
        setAuction(response.data.data.pending_auction);
      }
    } catch (error: any) {
      console.error("Error fetching car data:", error);
      toast.error("فشل في تحميل بيانات السيارة");
      router.replace("/admin/cars");
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
        },
      );

      if (response.data.status === "success") {
        toast.success("تم قبول طلب المزاد بنجاح");
        router.replace("/admin/cars");
      }
    } catch (error: any) {
      console.error("Error approving auction:", error);
      toast.error(error.response?.data?.message || "فشل في قبول طلب المزاد");
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
        },
      );

      if (response.data.status === "success") {
        toast.success("تم رفض طلب المزاد");
        router.replace("/admin/cars");
      }
    } catch (error: any) {
      console.error("Error rejecting auction:", error);
      toast.error(error.response?.data?.message || "فشل في رفض طلب المزاد");
    } finally {
      setProcessing(false);
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case "excellent":
        return "ممتازة";
      case "good":
        return "جيدة";
      case "fair":
        return "متوسطة";
      case "poor":
        return "ضعيفة";
      default:
        return condition;
    }
  };

  const getTransmissionText = (transmission: string) => {
    switch (transmission) {
      case "automatic":
        return "أوتوماتيك";
      case "manual":
        return "عادي";
      default:
        return transmission;
    }
  };

  if (!car || !auction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-16 w-16 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-400">
            لم يتم العثور على البيانات
          </h3>
          <p className="text-gray-500 mt-1">
            لا يوجد طلب مزاد معلق لهذه السيارة
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-2 rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={() => router.replace("/admin/cars")}
            className="bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300 p-3 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              معالجة طلب المزاد
            </h1>
            <p className="text-gray-400 mt-2">
              مراجعة وموافقة على طلب مزاد السيارة
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center ${
              editMode
                ? "bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600"
                : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
            }`}
          >
            {editMode ? (
              <X className="w-4 h-4 ml-2" />
            ) : (
              <Edit3 className="w-4 h-4 ml-2" />
            )}
            {editMode ? "إلغاء التعديل" : "تعديل البيانات"}
          </button>
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-600/10 border border-purple-500/20 rounded-xl p-3">
            <Settings className="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Tabs Navigation */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
            <div className="border-b border-gray-700/50">
              <nav className="flex space-x-8 space-x-reverse px-6">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                    activeTab === "info"
                      ? "border-purple-500 text-purple-400"
                      : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
                  }`}
                >
                  معلومات السيارة
                </button>
                <button
                  onClick={() => setActiveTab("pricing")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                    activeTab === "pricing"
                      ? "border-purple-500 text-purple-400"
                      : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
                  }`}
                >
                  التسعير والعروض
                </button>
                <button
                  onClick={() => setActiveTab("decision")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                    activeTab === "decision"
                      ? "border-purple-500 text-purple-400"
                      : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
                  }`}
                >
                  قرار المعالجة
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "info" && (
                <div className="space-y-6">
                  {/* Car Images */}
                  {car.images && car.images.length > 0 && (
                    <div className="bg-gray-700/30 rounded-xl p-6">
                      <div className="flex items-center space-x-3 space-x-reverse mb-4">
                        <Camera className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-lg font-semibold text-white">
                          صور السيارة
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {car.images.slice(0, 4).map((image, index) => (
                          <div
                            key={index}
                            className="relative h-32 rounded-xl overflow-hidden border border-gray-600"
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

                  {/* Car Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
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
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-white bg-gray-700/30 rounded-xl py-3 px-4">
                            {car.make}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
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
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-white bg-gray-700/30 rounded-xl py-3 px-4">
                            {car.model}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
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
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-white bg-gray-700/30 rounded-xl py-3 px-4">
                            {car.year}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
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
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="excellent">ممتازة</option>
                            <option value="good">جيدة</option>
                            <option value="fair">متوسطة</option>
                            <option value="poor">ضعيفة</option>
                          </select>
                        ) : (
                          <p className="text-white bg-gray-700/30 rounded-xl py-3 px-4">
                            {getConditionText(car.condition)}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
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
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="automatic">أوتوماتيك</option>
                            <option value="manual">عادي</option>
                          </select>
                        ) : (
                          <p className="text-white bg-gray-700/30 rounded-xl py-3 px-4">
                            {getTransmissionText(car.transmission)}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          عداد الكيلومترات
                        </label>
                        {editMode ? (
                          <input
                            type="number"
                            value={formData.odometer}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                odometer: parseInt(e.target.value),
                              }))
                            }
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-white bg-gray-700/30 rounded-xl py-3 px-4">
                            {car.odometer?.toLocaleString()} كم
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                        rows={4}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      />
                    ) : (
                      <p className="text-white bg-gray-700/30 rounded-xl py-3 px-4 min-h-[100px]">
                        {car.description || "لا يوجد وصف"}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "pricing" && (
                <div className="space-y-6">
                  <div className="bg-gray-700/30 rounded-xl p-6">
                    <div className="flex items-center space-x-3 space-x-reverse mb-6">
                      <DollarSign className="w-5 h-5 text-amber-400" />
                      <h3 className="text-lg font-semibold text-white">
                        عروض المالك
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-600/30 rounded-xl p-4 text-center">
                        <div className="text-amber-400 text-sm mb-2">
                          الحد الأدنى
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {auction.minimum_bid?.toLocaleString()}
                        </div>
                        <div className="text-gray-400 text-sm">ريال</div>
                      </div>
                      <div className="bg-gray-600/30 rounded-xl p-4 text-center">
                        <div className="text-amber-400 text-sm mb-2">
                          الحد الأقصى
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {auction.maximum_bid?.toLocaleString()}
                        </div>
                        <div className="text-gray-400 text-sm">ريال</div>
                      </div>
                      <div className="bg-gray-600/30 rounded-xl p-4 text-center">
                        <div className="text-amber-400 text-sm mb-2">
                          السعر الاحتياطي
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {auction.reserve_price?.toLocaleString()}
                        </div>
                        <div className="text-gray-400 text-sm">ريال</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700/30 rounded-xl p-6">
                    <div className="flex items-center space-x-3 space-x-reverse mb-6">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <h3 className="text-lg font-semibold text-white">
                        التسعير المقترح
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          السعر الافتتاحي للمزاد *
                        </label>
                        <input
                          type="number"
                          value={formData.opening_price}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              opening_price: parseFloat(e.target.value),
                            }))
                          }
                          className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="أدخل السعر الافتتاحي"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          سعر التقييم *
                        </label>
                        <input
                          type="number"
                          value={formData.evaluation_price}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              evaluation_price: parseFloat(e.target.value),
                            }))
                          }
                          className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="أدخل سعر التقييم"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "decision" && (
                <div className="space-y-6">
                  <div className="bg-gray-700/30 rounded-xl p-6">
                    <div className="flex items-center space-x-3 space-x-reverse mb-6">
                      <Shield className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white">
                        قرار المعالجة النهائي
                      </h3>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
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
                        rows={4}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        placeholder="أدخل سبب رفض المزاد إذا كان القرار هو الرفض"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={handleApprove}
                        disabled={processing}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50"
                      >
                        {processing ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                        <span>قبول المزاد</span>
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={processing}
                        className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50"
                      >
                        {processing ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                        <span>رفض المزاد</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Information */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
            <div className="flex items-center space-x-3 space-x-reverse mb-6">
              <User className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">
                معلومات المالك
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">الاسم</span>
                <span className="text-white">
                  {car.dealer
                    ? `${car.dealer.user.first_name} ${car.dealer.user.last_name}`
                    : car.user
                      ? `${car.user.first_name} ${car.user.last_name}`
                      : "غير محدد"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">النوع</span>
                <span className="text-cyan-400">
                  {car.dealer ? "معرض" : "فرد"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">البريد الإلكتروني</span>
                <span className="text-white text-sm">
                  {car.dealer
                    ? car.dealer.user.email
                    : car.user?.email || "غير متوفر"}
                </span>
              </div>
            </div>
          </div>

          {/* Auction Summary */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
            <div className="flex items-center space-x-3 space-x-reverse mb-6">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-semibold text-white">ملخص المزاد</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">نوع المزاد</span>
                <span className="text-white">{auction.auction_type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">الحالة</span>
                <span className="text-amber-400">في انتظار الموافقة</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">تاريخ الطلب</span>
                <span className="text-white text-sm">
                  {new Date(car.created_at).toLocaleDateString("ar-SA")}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
            <div className="flex items-center space-x-3 space-x-reverse mb-6">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">
                إجراءات سريعة
              </h3>
            </div>
            <div className="space-y-3">
              <button className="w-full bg-gradient-to-r from-blue-500/10 to-cyan-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:text-white transition-all duration-300 py-3 px-4 rounded-xl text-right flex items-center justify-between">
                <span>عرض السيارة</span>
                <Eye className="w-4 h-4" />
              </button>
              <button className="w-full bg-gradient-to-r from-amber-500/10 to-orange-600/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:text-white transition-all duration-300 py-3 px-4 rounded-xl text-right flex items-center justify-between">
                <span>سجل المزادات</span>
                <FileText className="w-4 h-4" />
              </button>
              <button className="w-full bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-500/20 text-gray-400 hover:bg-gray-500/20 hover:text-white transition-all duration-300 py-3 px-4 rounded-xl text-right flex items-center justify-between">
                <span>تواصل مع المالك</span>
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
