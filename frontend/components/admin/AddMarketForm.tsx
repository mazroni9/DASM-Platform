"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";

interface AddMarketFormProps {
    isOpen: boolean;
    onClose: () => void;
    onMarketAdded: (market: any) => void;
}

interface MarketCategoryData {
    id: number;
    name: string;
}

interface LayoutType {
    value: string;
    label: string;
}

export default function AddMarketForm({ isOpen, onClose, onMarketAdded }: AddMarketFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<MarketCategoryData[]>([]);
    const [layoutTypes, setLayoutTypes] = useState<LayoutType[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        category_id: "",
        slug: "",
        description: "",
        icon: "",
        color: "",
        bg_color: "",
        layout_type: "",
    });

    useEffect(() => {
        if (isOpen) fetchCategoriesAndLayoutTypes();
    }, [isOpen]);

    const fetchCategoriesAndLayoutTypes = async () => {
        try {
            const response = await api.get("/api/markets");
            const data = response.data.data;
            
            // Extract categories from the nested structure
            if (data.categories) {
                setCategories(data.categories);
            } else if (Array.isArray(data)) {
                // If data is directly an array of categories
                setCategories(data);
            }
            
            // Extract layout types
            if (data.layoutTypes) {
                const layoutTypesArray = Object.entries(data.layoutTypes).map(([value, label]) => ({
                    value,
                    label: label as string
                }));
                setLayoutTypes(layoutTypesArray);
            } else {
                // Fallback layout types if not provided by API
                setLayoutTypes([
                    { value: "live_video", label: "بث مباشر" },
                    { value: "grid_with_filters", label: "شبكة مع فلاتر" },
                    { value: "showcase_cards", label: "بطاقات عرض" },
                    { value: "table", label: "جدول" },
                    { value: "default_grid", label: "شبكة افتراضية" }
                ]);
            }
        } catch (error) {
            toast.error("فشل في تحميل بيانات الأقسام");
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await api.post("/api/admin/markets", {
                name: formData.name,
                category_id: formData.category_id,
                slug: formData.slug,
                description: formData.description,
                icon: formData.icon,
                color: formData.color,
                bg_color: formData.bg_color,
                layout_type: formData.layout_type,
            });
            const newMarket = response.data.data || response.data;
            toast.success("تمت إضافة السوق بنجاح");
            onMarketAdded(newMarket);
            onClose();
            setFormData({ name: "", category_id: "", slug: "", description: "", icon: "", color: "", bg_color: "", layout_type: "" });
        } catch (error) {
            toast.error("حدث خطأ أثناء إضافة السوق");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">إضافة سوق جديد</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">اسم السوق</Label>
                            <Input
                                id="name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                                placeholder="اسم السوق"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="category_id">القسم</Label>
                            <select
                                id="category_id"
                                value={formData.category_id}
                                onChange={(e) => handleInputChange("category_id", e.target.value)}
                                className="w-full border rounded p-2"
                                required
                            >
                                <option value="">اختر القسم</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="slug">السلاج (Slug)</Label>
                            <Input
                                id="slug"
                                type="text"
                                value={formData.slug}
                                onChange={(e) => handleInputChange("slug", e.target.value)}
                                placeholder="مثال: cars, office-equipment"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">الوصف (اختياري)</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange("description", e.target.value)}
                                placeholder="وصف مختصر عن السوق"
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label htmlFor="icon">الأيقونة (اختياري)</Label>
                            <Input
                                id="icon"
                                type="text"
                                value={formData.icon}
                                onChange={(e) => handleInputChange("icon", e.target.value)}
                                placeholder="مثال: fa-car, fa-building"
                            />
                        </div>
                        <div>
                            <Label htmlFor="color">اللون (اختياري)</Label>
                            <Input
                                id="color"
                                type="text"
                                value={formData.color}
                                onChange={(e) => handleInputChange("color", e.target.value)}
                                placeholder="مثال: #ff0000"
                            />
                        </div>
                        <div>
                            <Label htmlFor="bg_color">لون الخلفية (اختياري)</Label>
                            <Input
                                id="bg_color"
                                type="text"
                                value={formData.bg_color}
                                onChange={(e) => handleInputChange("bg_color", e.target.value)}
                                placeholder="مثال: #f0f0f0"
                            />
                        </div>
                        <div>
                            <Label htmlFor="layout_type">نوع التخطيط (اختياري)</Label>
                            <select
                                id="layout_type"
                                value={formData.layout_type}
                                onChange={(e) => handleInputChange("layout_type", e.target.value)}
                                className="w-full border rounded p-2"
                            >
                                <option value="">اختر نوع التخطيط</option>
                                {layoutTypes.map((layout) => (
                                    <option key={layout.value} value={layout.value}>{layout.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            <X className="w-4 h-4 ml-2" />
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 ml-2" />
                            )}
                            {isSubmitting ? "جاري الحفظ..." : "إضافة السوق"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
