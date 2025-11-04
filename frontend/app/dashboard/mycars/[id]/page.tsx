'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    Loader2, 
    Edit, 
    Save, 
    X, 
    Upload, 
    Trash2,
    ArrowRight,
    Car,
    Calendar,
    Gauge,
    Settings,
    Palette,
    FileText,
    DollarSign,
    CheckCircle,
    Clock,
    AlertCircle,
    Image as ImageIcon
} from "lucide-react";
import LoadingLink from "@/components/LoadingLink";
import { Car as CarType } from "@/types/types";

export default function CarDetailsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [car, setCar] = useState<CarType | null>(null);
    const [editedCar, setEditedCar] = useState<Partial<CarType>>({});
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const { user, isLoggedIn } = useAuth();
    const router = useLoadingRouter();
    
    const params = useParams();
    const carId = params.id as string;

    const getAuctionStatusConfig = (status: string) => {
        const statusMap = {
            "pending": {
                text: "في انتظار المراجعة",
                color: "text-amber-400",
                bg: "bg-amber-500/20",
                border: "border-amber-500/30",
                icon: Clock
            },
            "approved": { 
                text: "معتمد", 
                color: "text-emerald-400",
                bg: "bg-emerald-500/20", 
                border: "border-emerald-500/30",
                icon: CheckCircle
            },
            "rejected": { 
                text: "مرفوض", 
                color: "text-rose-400",
                bg: "bg-rose-500/20", 
                border: "border-rose-500/30",
                icon: AlertCircle
            },
            "available": {
                text: "متوفر للمزاد",
                color: "text-blue-400",
                bg: "bg-blue-500/20",
                border: "border-blue-500/30",
                icon: DollarSign
            },
            "in_auction": {
                text: "في المزاد",
                color: "text-purple-400",
                bg: "bg-purple-500/20",
                border: "border-purple-500/30",
                icon: Gauge
            },
            "sold": { 
                text: "مباع", 
                color: "text-gray-400",
                bg: "bg-gray-500/20", 
                border: "border-gray-500/30",
                icon: CheckCircle
            }
        };
        
        return statusMap[status] || { 
            text: status, 
            color: "text-gray-400",
            bg: "bg-gray-500/20", 
            border: "border-gray-500/30",
            icon: FileText
        };
    };

    // Verify user is authenticated
    useEffect(() => {
        if (!isLoggedIn) {
            router.push("/auth/login?returnUrl=/dashboard/mycars");
        }
    }, [isLoggedIn, router]);

    // Fetch car details
    useEffect(() => {
        async function fetchCarDetails() {
            if (!isLoggedIn || !carId) return;

            try {
                const response = await api.get(`/api/cars/${carId}`);
                if (response.data.status === "success") {
                    setCar(response.data.data.car);
                    setEditedCar(response.data.data.car);
                } else {
                    toast.error("السيارة غير موجودة أو ليس لديك صلاحية لعرضها");
                    router.push("/dashboard/mycars");
                }
            } catch (error: any) {
                console.error("Error fetching car details:", error);
                if (error.response?.status === 404) {
                    toast.error("السيارة غير موجودة");
                    router.push("/dashboard/mycars");
                } else {
                    toast.error("حدث خطأ أثناء تحميل بيانات السيارة");
                }
            } finally {
                setLoading(false);
            }
        }

        fetchCarDetails();
    }, [isLoggedIn, carId, router]);

    // Handle image previews
    useEffect(() => {
        if (selectedImages.length > 0) {
            const previews = selectedImages.map(file => URL.createObjectURL(file));
            setImagePreviews(previews);
            
            return () => {
                previews.forEach(url => URL.revokeObjectURL(url));
            };
        }
    }, [selectedImages]);

    const handleInputChange = (field: keyof CarType, value: any) => {
        setEditedCar((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setSelectedImages(filesArray);
        }
    };

    const removeSelectedImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!car) return;

        setSaving(true);
        try {
            const formData = new FormData();

            // Add car data
            Object.keys(editedCar).forEach((key) => {
                if (
                    key !== "images" &&
                    key !== "id" &&
                    key !== "created_at" &&
                    key !== "updated_at" &&
                    editedCar[key as keyof CarType] !== undefined
                ) {
                    formData.append(key, String(editedCar[key as keyof CarType]));
                }
            });

            // Add images if selected
            if (selectedImages.length > 0) {
                selectedImages.forEach((image) => {
                    formData.append("images[]", image);
                });
            }

            // Laravel requires _method field for PUT requests with FormData
            formData.append("_method", "PUT");

            const response = await api.post(`/api/cars/${car.id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.status === "success") {
                setCar(response.data.data);
                setEditedCar(response.data.data);
                setEditing(false);
                setSelectedImages([]);
                setImagePreviews([]);
                toast.success("تم تحديث بيانات السيارة بنجاح");
            }
        } catch (error: any) {
            console.error("Error updating car:", error);
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                Object.keys(errors).forEach((key) => {
                    toast.error(errors[key][0]);
                });
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("حدث خطأ أثناء تحديث بيانات السيارة");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditedCar(car || {});
        setSelectedImages([]);
        setImagePreviews([]);
        setEditing(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <Loader2 className="absolute inset-0 w-full h-full animate-spin text-purple-500" />
                        <div className="absolute inset-0 w-full h-full rounded-full border-4 border-transparent border-t-purple-500 animate-spin opacity-60"></div>
                    </div>
                    <p className="text-lg text-gray-400 font-medium">جاري تحميل بيانات السيارة...</p>
                </div>
            </div>
        );
    }

    if (!car) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="p-6 bg-gray-800/30 rounded-2xl border border-gray-700/50 max-w-md">
                        <AlertCircle className="w-16 h-16 text-rose-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-4">السيارة غير موجودة</h2>
                        <LoadingLink
                            href="/dashboard/mycars"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white hover:scale-105 transition-all duration-300"
                        >
                            العودة إلى قائمة السيارات
                            <ArrowRight className="w-4 h-4" />
                        </LoadingLink>
                    </div>
                </div>
            </div>
        );
    }

    const statusConfig = getAuctionStatusConfig(car.auction_status);
    const StatusIcon = statusConfig.icon;
    const canEdit = !["scheduled", "active", "in_auction"].includes(car.auction_status);

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card backdrop-blur-2xl border border-border rounded-2xl p-6 shadow-2xl"
            >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary rounded-xl">
                                <Car className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">
                                    {car.make} {car.model} - {car.year}
                                </h1>
                                <p className="text-foreground/70 text-sm mt-1">تفاصيل السيارة المعروضة</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm",
                                statusConfig.bg,
                                statusConfig.border,
                                statusConfig.color
                            )}>
                                <StatusIcon className="w-4 h-4" />
                                <span className="text-sm font-medium">{statusConfig.text}</span>
                            </div>
                            
                            {car.auctions?.[0]?.control_room_approved && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30 backdrop-blur-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">معتمدة للمزاد</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {canEdit && !editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="flex items-center gap-2 px-4 py-3 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 hover:bg-amber-500/30 hover:scale-105 transition-all duration-300"
                            >
                                <Edit className="w-4 h-4" />
                                <span className="font-medium">تعديل البيانات</span>
                            </button>
                        )}

                        {editing && (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-3 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 hover:scale-105 transition-all duration-300 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    <span className="font-medium">حفظ التغييرات</span>
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 px-4 py-3 bg-gray-500/20 text-gray-300 rounded-xl border border-gray-500/30 hover:bg-gray-500/30 hover:scale-105 transition-all duration-300"
                                >
                                    <X className="w-4 h-4" />
                                    <span className="font-medium">إلغاء</span>
                                </button>
                            </>
                        )}

                        <LoadingLink
                            href="/dashboard/mycars"
                            className="flex items-center gap-2 px-4 py-3 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/30 hover:bg-blue-500/30 hover:scale-105 transition-all duration-300"
                        >
                            <ArrowRight className="w-4 h-4" />
                            <span className="font-medium">العودة للقائمة</span>
                        </LoadingLink>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Car Images Section */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6"
                >
                    <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-purple-400" />
                        معرض الصور
                    </h2>

                    <div className="space-y-4">
                        {car.images && car.images.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {car.images.map((image, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={image}
                                            alt={`${car.make} ${car.model} - صورة ${index + 1}`}
                                            className="w-full h-64 object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = "https://cdn.pixabay.com/photo/2012/05/29/00/43/car-49278_1280.jpg";
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
                                            <span className="text-white text-sm">صورة {index + 1}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <ImageIcon className="w-16 h-16 text-foreground/50 mx-auto mb-4" />
                                <p className="text-foreground/70">لا توجد صور متاحة للسيارة</p>
                            </div>
                        )}

                        {editing && (
                            <div className="border-2 border-dashed border-border/50 rounded-xl p-6 transition-all duration-300 hover:border-primary/50">
                                <label className="cursor-pointer flex flex-col items-center">
                                    <Upload className="w-8 h-8 text-foreground/70 mb-3" />
                                    <span className="text-foreground/80 font-medium mb-2">اختر صور جديدة</span>
                                    <span className="text-foreground/50 text-sm text-center">
                                        يمكنك اختيار عدة صور مرة واحدة
                                        <br />
                                        الصور المدعومة: JPG, PNG, GIF
                                    </span>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageSelect}
                                    />
                                </label>

                                {selectedImages.length > 0 && (
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-foreground/80 font-medium">
                                                الصور المختارة ({selectedImages.length})
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setSelectedImages([]);
                                                    setImagePreviews([]);
                                                }}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {imagePreviews.map((preview, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={preview}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-20 object-cover rounded-lg"
                                                    />
                                                    <button
                                                        onClick={() => removeSelectedImage(index)}
                                                        className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                    >
                                                        <X className="w-3 h-3 text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Car Details Section */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    {/* Basic Information */}
                    <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-400" />
                            المعلومات الأساسية
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Make */}
                            <div>
                                <label className="text-sm text-foreground/70 mb-2 block">الماركة</label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editedCar.make || ""}
                                        onChange={(e) => handleInputChange("make", e.target.value)}
                                        className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                ) : (
                                    <p className="text-foreground font-medium">{car.make}</p>
                                )}
                            </div>

                            {/* Model */}
                            <div>
                                <label className="text-sm text-foreground/70 mb-2 block">الموديل</label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editedCar.model || ""}
                                        onChange={(e) => handleInputChange("model", e.target.value)}
                                        className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                ) : (
                                    <p className="text-foreground font-medium">{car.model}</p>
                                )}
                            </div>

                            {/* Year */}
                            <div>
                                <label className="text-sm text-foreground/70 mb-2 block">سنة الصنع</label>
                                {editing ? (
                                    <input
                                        type="number"
                                        value={editedCar.year || ""}
                                        onChange={(e) => handleInputChange("year", parseInt(e.target.value))}
                                        className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                ) : (
                                    <p className="text-foreground font-medium">{car.year}</p>
                                )}
                            </div>

                            {/* Color */}
                            <div>
                                <label className="text-sm text-foreground/70 mb-2 block">اللون</label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editedCar.color || ""}
                                        onChange={(e) => handleInputChange("color", e.target.value)}
                                        className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                ) : (
                                    <p className="text-foreground font-medium">{car.color || "غير محدد"}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Technical Specifications */}
                    <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-purple-400" />
                            المواصفات الفنية
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Odometer */}
                            <div>
                                <label className="text-sm text-foreground/70 mb-2 block">العداد (كم)</label>
                                {editing ? (
                                    <input
                                        type="number"
                                        value={editedCar.odometer || ""}
                                        onChange={(e) => handleInputChange("odometer", parseInt(e.target.value))}
                                        className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                ) : (
                                    <p className="text-foreground font-medium">{car.odometer?.toLocaleString("ar-EG")}</p>
                                )}
                            </div>

                            {/* Engine */}
                            <div>
                                <label className="text-sm text-foreground/70 mb-2 block">المحرك</label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editedCar.engine || ""}
                                        onChange={(e) => handleInputChange("engine", e.target.value)}
                                        className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                ) : (
                                    <p className="text-foreground font-medium">{car.engine || "غير محدد"}</p>
                                )}
                            </div>

                            {/* Transmission */}
                            <div>
                                <label className="text-sm text-foreground/70 mb-2 block">ناقل الحركة</label>
                                {editing ? (
                                    <select
                                        value={editedCar.transmission || ""}
                                        onChange={(e) => handleInputChange("transmission", e.target.value)}
                                        className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                    >
                                        <option value="">اختر نوع ناقل الحركة</option>
                                        <option value="automatic">أوتوماتيك</option>
                                        <option value="manual">يدوي</option>
                                        <option value="cvt">CVT</option>
                                    </select>
                                ) : (
                                    <p className="text-foreground font-medium">
                                        {car.transmission === "automatic" ? "أوتوماتيك" :
                                         car.transmission === "manual" ? "يدوي" :
                                         car.transmission === "cvt" ? "CVT" : "غير محدد"}
                                    </p>
                                )}
                            </div>

                            {/* Condition */}
                            <div>
                                <label className="text-sm text-foreground/70 mb-2 block">الحالة</label>
                                {editing ? (
                                    <select
                                        value={editedCar.condition || ""}
                                        onChange={(e) => handleInputChange("condition", e.target.value)}
                                        className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                    >
                                        <option value="">اختر حالة السيارة</option>
                                        <option value="excellent">ممتازة</option>
                                        <option value="good">جيدة</option>
                                        <option value="fair">متوسطة</option>
                                        <option value="poor">ضعيفة</option>
                                    </select>
                                ) : (
                                    <p className="text-foreground font-medium">
                                        {car.condition === "excellent" ? "ممتازة" :
                                         car.condition === "good" ? "جيدة" :
                                         car.condition === "fair" ? "متوسطة" :
                                         car.condition === "poor" ? "ضعيفة" : "غير محدد"}
                                    </p>
                                )}
                            </div>

                            {/* VIN */}
                            <div className="md:col-span-2">
                                <label className="text-sm text-foreground/70 mb-2 block">رقم الهيكل (VIN)</label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editedCar.vin || ""}
                                        onChange={(e) => handleInputChange("vin", e.target.value)}
                                        className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                ) : (
                                    <p className="text-foreground font-medium">{car.vin}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Price & Description */}
                    <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-amber-400" />
                            السعر والوصف
                        </h2>

                        <div className="space-y-4">
                            {/* Evaluation Price */}
                            <div>
                                <label className="text-sm text-foreground/70 mb-2 block">سعر التقييم (ريال)</label>
                                {editing ? (
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editedCar.evaluation_price || ""}
                                        onChange={(e) => handleInputChange("evaluation_price", parseFloat(e.target.value))}
                                        className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                ) : (
                                    <p className="text-2xl font-bold text-secondary">
                                        {car.evaluation_price?.toLocaleString("ar-EG")} ريال
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-sm text-foreground/70 mb-2 block">الوصف</label>
                                {editing ? (
                                    <textarea
                                        rows={4}
                                        value={editedCar.description || ""}
                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                        className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-foreground placeholder-foreground/70 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                                        placeholder="اكتب وصفاً مفصلاً للسيارة..."
                                    />
                                ) : (
                                    <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                        {car.description || "لا يوجد وصف متاح"}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Timestamps */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-foreground/70">
                        <Calendar className="w-4 h-4" />
                        <span>
                            <strong>تاريخ الإضافة:</strong>{" "}
                            {new Date(car.created_at).toLocaleDateString("ar-EG", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground/70">
                        <Calendar className="w-4 h-4" />
                        <span>
                            <strong>آخر تحديث:</strong>{" "}
                            {new Date(car.updated_at).toLocaleDateString("ar-EG", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    </div>
                </div>
            </motion.div>

            {!canEdit && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-500/20 border border-amber-500/30 rounded-2xl p-4 backdrop-blur-sm"
                >
                    <div className="flex items-center gap-2 text-amber-300">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm">
                            لا يمكن تعديل بيانات السيارة لأنها في حالة مزاد نشط أو مجدول
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}