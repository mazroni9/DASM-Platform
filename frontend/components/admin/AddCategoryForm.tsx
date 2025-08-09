"use client";

import { useState } from "react";
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

interface AddCategoryFormProps {
    isOpen: boolean;
    onClose: () => void;
    onCategoryAdded: (category: MarketCategoryData) => void;
}

interface MarketCategoryData {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    description?: string;
    created_at: string;
}

export default function AddCategoryForm({
    isOpen,
    onClose,
    onCategoryAdded,
}: AddCategoryFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        is_active: true,
        description: "",
    });

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
            const response = await api.post("api/admin/categories", {
                name: formData.name,
                slug: formData.slug,
                is_active: formData.is_active,
                description: formData.description,
            });
            const newCategory = response.data.data || response.data;
            toast.success("تمت إضافة القسم بنجاح");
            onCategoryAdded(newCategory);
            onClose();
            setFormData({ name: "", slug: "", is_active: true, description: "" });
        } catch (error) {
            toast.error("حدث خطأ أثناء إضافة القسم");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        إضافة قسم جديد
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">اسم القسم</Label>
                            <Input
                                id="name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                                placeholder="اسم القسم"
                                required
                            />
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
                        <div className="flex items-center space-x-2 space-x-reverse pt-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => handleInputChange("is_active", e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <Label htmlFor="is_active">مفعل</Label>
                        </div>
                        <div>
                            <Label htmlFor="description">الوصف (اختياري)</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange("description", e.target.value)}
                                placeholder="وصف مختصر عن القسم"
                                rows={3}
                            />
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
                            {isSubmitting ? "جاري الحفظ..." : "إضافة القسم"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
