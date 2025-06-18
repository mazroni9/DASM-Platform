"use client";

import { BackToDashboard } from "@/components/dashboard/BackToDashboard";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Edit, Save, X, Upload, Trash2 } from "lucide-react";
import Link from "next/link";
import { Car } from "@/types/types";

export default function CarDetailsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [car, setCar] = useState<Car | null>(null);
    const [editedCar, setEditedCar] = useState<Partial<Car>>({});
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const { user, isLoggedIn } = useAuth();
    const router = useRouter();
    const params = useParams();
    const carId = params.id as string;

    const getAuctionStatusTextAndColor = (status: string) => {
        switch (status) {
            case "pending":
                return {
                    text: "في انتظار المراجعة",
                    color: "text-yellow-600 bg-yellow-100",
                };
            case "approved":
                return { text: "معتمد", color: "text-green-600 bg-green-100" };
            case "rejected":
                return { text: "مرفوض", color: "text-red-600 bg-red-100" };
            case "available":
                return {
                    text: "متوفر للمزاد",
                    color: "text-blue-600 bg-blue-100",
                };
            case "in_auction":
                return {
                    text: "في المزاد",
                    color: "text-orange-600 bg-orange-100",
                };
            case "sold":
                return { text: "مباع", color: "text-gray-600 bg-gray-100" };
            default:
                return { text: status, color: "text-gray-500 bg-gray-100" };
        }
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

    const handleInputChange = (field: keyof Car, value: any) => {
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
                    editedCar[key as keyof Car] !== undefined
                ) {
                    formData.append(key, String(editedCar[key as keyof Car]));
                }
            }); // Add images if selected
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
        setEditing(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <span className="mr-2 text-xl">جاري تحميل البيانات...</span>
            </div>
        );
    }

    if (!car) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        السيارة غير موجودة
                    </h2>
                    <Link
                        href="/dashboard/mycars"
                        className="text-blue-600 hover:underline"
                    >
                        العودة إلى قائمة السيارات
                    </Link>
                </div>
            </div>
        );
    }

    const statusInfo = getAuctionStatusTextAndColor(car.auction_status);
    const canEdit = !["scheduled", "active", "in_auction"].includes(
        car.auction_status
    );

    return (
        <main
            className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen"
            dir="rtl"
        >
            <BackToDashboard />

            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        تفاصيل السيارة - {car.make} {car.model} {car.year}
                    </h1>

                    <div className="flex gap-2">
                        {canEdit && !editing && (
                            <Button
                                onClick={() => setEditing(true)}
                                className="flex items-center gap-2"
                            >
                                <Edit size={16} />
                                تعديل
                            </Button>
                        )}

                        {editing && (
                            <>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2"
                                >
                                    {saving ? (
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    حفظ
                                </Button>
                                <Button
                                    onClick={handleCancel}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <X size={16} />
                                    إلغاء
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Car Images */}
                    <Card>
                        <CardHeader>
                            <CardTitle>صور السيارة</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4">
                                {car.images && car.images.length > 0 ? (
                                    car.images.map((image, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={image}
                                                alt={`${car.make} ${
                                                    car.model
                                                } - صورة ${index + 1}`}
                                                className="w-full h-64 object-cover rounded-lg"
                                                onError={(e) => {
                                                    e.currentTarget.onerror =
                                                        null;
                                                    e.currentTarget.src =
                                                        "https://via.placeholder.com/400x300?text=No+Image";
                                                }}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <span className="text-gray-500">
                                            لا توجد صور متاحة
                                        </span>
                                    </div>
                                )}

                                {editing && (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                        <label
                                            htmlFor="images"
                                            className="cursor-pointer flex flex-col items-center"
                                        >
                                            <Upload
                                                size={32}
                                                className="text-gray-400 mb-2"
                                            />
                                            <span className="text-sm text-gray-600">
                                                اختر صور جديدة للسيارة
                                            </span>
                                            <input
                                                id="images"
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageSelect}
                                            />
                                        </label>
                                        {selectedImages.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-600">
                                                    تم اختيار{" "}
                                                    {selectedImages.length} صورة
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Car Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>تفاصيل السيارة</span>
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
                                >
                                    {statusInfo.text}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="make">الماركة</Label>
                                    {editing ? (
                                        <Input
                                            id="make"
                                            value={editedCar.make || ""}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "make",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-medium">
                                            {car.make}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="model">الموديل</Label>
                                    {editing ? (
                                        <Input
                                            id="model"
                                            value={editedCar.model || ""}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "model",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-medium">
                                            {car.model}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="year">سنة الصنع</Label>
                                    {editing ? (
                                        <Input
                                            id="year"
                                            type="number"
                                            value={editedCar.year || ""}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "year",
                                                    parseInt(e.target.value)
                                                )
                                            }
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-medium">
                                            {car.year}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="color">اللون</Label>
                                    {editing ? (
                                        <Input
                                            id="color"
                                            value={editedCar.color || ""}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "color",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-medium">
                                            {car.color || "غير محدد"}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="odometer">
                                        العداد (كم)
                                    </Label>
                                    {editing ? (
                                        <Input
                                            id="odometer"
                                            type="number"
                                            value={editedCar.odometer || ""}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "odometer",
                                                    parseInt(e.target.value)
                                                )
                                            }
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-medium">
                                            {car.odometer?.toLocaleString(
                                                "ar-EG"
                                            )}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="engine">المحرك</Label>
                                    {editing ? (
                                        <Input
                                            id="engine"
                                            value={editedCar.engine || ""}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "engine",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-medium">
                                            {car.engine || "غير محدد"}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="transmission">
                                        ناقل الحركة
                                    </Label>
                                    {editing ? (
                                        <Select
                                            value={editedCar.transmission || ""}
                                            onValueChange={(value) =>
                                                handleInputChange(
                                                    "transmission",
                                                    value
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر نوع ناقل الحركة" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="automatic">
                                                    أوتوماتيك
                                                </SelectItem>
                                                <SelectItem value="manual">
                                                    يدوي
                                                </SelectItem>
                                                <SelectItem value="cvt">
                                                    CVT
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <p className="text-gray-800 font-medium">
                                            {car.transmission === "automatic"
                                                ? "أوتوماتيك"
                                                : car.transmission === "manual"
                                                ? "يدوي"
                                                : car.transmission === "cvt"
                                                ? "CVT"
                                                : "غير محدد"}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="condition">الحالة</Label>
                                    {editing ? (
                                        <Select
                                            value={editedCar.condition || ""}
                                            onValueChange={(value) =>
                                                handleInputChange(
                                                    "condition",
                                                    value
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر حالة السيارة" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="excellent">
                                                    ممتازة
                                                </SelectItem>
                                                <SelectItem value="good">
                                                    جيدة
                                                </SelectItem>
                                                <SelectItem value="fair">
                                                    متوسطة
                                                </SelectItem>
                                                <SelectItem value="poor">
                                                    ضعيفة
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <p className="text-gray-800 font-medium">
                                            {car.condition === "excellent"
                                                ? "ممتازة"
                                                : car.condition === "good"
                                                ? "جيدة"
                                                : car.condition === "fair"
                                                ? "متوسطة"
                                                : car.condition === "poor"
                                                ? "ضعيفة"
                                                : "غير محدد"}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="vin">
                                        رقم الهيكل (VIN)
                                    </Label>
                                    {editing ? (
                                        <Input
                                            id="vin"
                                            value={editedCar.vin || ""}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "vin",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-medium">
                                            {car.vin}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="evaluation_price">
                                        سعر التقييم (ريال)
                                    </Label>
                                    {editing ? (
                                        <Input
                                            id="evaluation_price"
                                            type="number"
                                            step="0.01"
                                            value={
                                                editedCar.evaluation_price || ""
                                            }
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "evaluation_price",
                                                    parseFloat(e.target.value)
                                                )
                                            }
                                        />
                                    ) : (
                                        <p className="font-medium text-blue-600">
                                            {car.evaluation_price?.toLocaleString(
                                                "ar-EG"
                                            )}{" "}
                                            ريال
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">الوصف</Label>
                                {editing ? (
                                    <Textarea
                                        id="description"
                                        rows={4}
                                        value={editedCar.description || ""}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "description",
                                                e.target.value
                                            )
                                        }
                                        placeholder="اكتب وصفاً مفصلاً للسيارة..."
                                    />
                                ) : (
                                    <p className="text-gray-800 leading-relaxed">
                                        {car.description || "لا يوجد وصف متاح"}
                                    </p>
                                )}
                            </div>

                            {!canEdit && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-yellow-800 text-sm">
                                        لا يمكن تعديل بيانات السيارة لأنها في
                                        حالة مزاد نشط أو مجدول
                                    </p>
                                </div>
                            )}

                            {car.auction_status === "available" && (
                                <div className="pt-4 border-t">
                                    <Link
                                        href={`/add/auction/${car.id}`}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
                                    >
                                        إضافة للمزاد
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Creation and Update Info */}
                <Card className="mt-6">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                                <strong>تاريخ الإضافة:</strong>{" "}
                                {new Date(car.created_at).toLocaleDateString(
                                    "ar-EG",
                                    {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    }
                                )}
                            </div>
                            <div>
                                <strong>آخر تحديث:</strong>{" "}
                                {new Date(car.updated_at).toLocaleDateString(
                                    "ar-EG",
                                    {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    }
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
