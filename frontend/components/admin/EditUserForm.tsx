"use client";

import { useEffect, useState } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { UserRole } from "@/types/types";
import api from "@/lib/axios";

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    is_active: boolean;
    dealer?: {
        id: number;
        company_name: string;
        commercial_registry: string;
        description: string;
        status: string;
        is_active: boolean;
    };
}

interface EditUserFormProps {
    user_id : string | number;
    isOpen: boolean;
    onClose: () => void;
    onUserUpdated: (updatedUser: User) => void;
}



export default function EditUserForm({
    user_id,
    isOpen,
    onClose,
    onUserUpdated,
}: EditUserFormProps) {
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({  
        id: "",
        first_name:"",
        last_name: "string",
        email:"",
        phone:"",
        role:"",
        status:"",
        is_active: false,
        dealer: {
                id: "",
            company_name: "",
            commercial_registry: "",
            description:"",
            status:"",
            is_active: false,
        },
    });
    const [formData, setFormData] = useState({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "user",
        status: user.status || "pending",
        is_active: user.is_active || false,
        // Dealer fields
        company_name: user.dealer?.company_name || "",
        commercial_registry: user.dealer?.commercial_registry || "",
        description: user.dealer?.description || "",
        dealer_status: user.dealer?.status || "pending",
    });

    const fetchUserDetails = async () => {
        try {
            // Fetch user details from backend
            const response = await api.get(`/api/admin/users/${user_id}`);
            if (response.data && response.data.status === "success") {
                let user = response.data.data.user;
                //check if user role
                if (user.role == "admin") {
                    response.data.data.user.role = "user";
                }
                if (user.role == "dealer") {
                    //check rating if it is null or assign default value
                    let rating = response.data.data.dealer?.rating || 4.5;
                    response.data.data.dealer = {rating:rating};
                    
                    
                }
                setUser(response.data.data.user);
                setFormData({
                    first_name: user.first_name || "",
                    last_name: user.last_name || "",
                    email: user.email || "",
                    phone: user.phone || "",
                    role: user.role || "user",
                    status: user.status || "pending",
                    is_active: user.is_active || false,
                    // Dealer fields
                    company_name: user.dealer?.company_name || "",
                    commercial_registry: user.dealer?.commercial_registry || "",
                    description: user.dealer?.description || "",
                    dealer_status: user.dealer?.status || "pending",
                });
                setLoading(false);
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
            toast.error("فشل في تحميل بيانات المستخدم");
            
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user_id) {
        fetchUserDetails();
        }
    }, [user_id]);

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
            // Prepare data based on role - only send relevant fields
            const dataToSend: any = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                role: formData.role,
                status: formData.status,
                is_active: formData.is_active,
            };

            // Only include dealer fields if the role is dealer
            if (formData.role === UserRole.DEALER) {
                dataToSend.company_name = formData.company_name;
                dataToSend.commercial_registry = formData.commercial_registry;
                dataToSend.description = formData.description;
                dataToSend.dealer_status = formData.dealer_status;
            }

            const response = await api.put(
                `/api/admin/users/${user_id}`,
                dataToSend
            );

            if (response.data.status === "success") {
                toast.success("تم تحديث بيانات المستخدم بنجاح");
                onUserUpdated(response.data.data.user);
                onClose();
            } else {
                toast.error(
                    response.data.message || "فشل في تحديث بيانات المستخدم"
                );
            }
        } catch (error: any) {
            console.error("Error updating user:", error);

            if (error.response?.data?.errors) {
                // Show validation errors
                const errors = error.response.data.errors;
                Object.keys(errors).forEach((key) => {
                    toast.error(errors[key][0]);
                });
            } else {
                toast.error(
                    error.response?.data?.message ||
                        "حدث خطأ أثناء تحديث بيانات المستخدم"
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        تعديل بيانات المستخدم
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
                            المعلومات الأساسية
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="first_name">الاسم الأول</Label>
                                <Input
                                    id="first_name"
                                    type="text"
                                    value={formData.first_name}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "first_name",
                                            e.target.value
                                        )
                                    }
                                    placeholder="الاسم الأول"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="last_name">الاسم الأخير</Label>
                                <Input
                                    id="last_name"
                                    type="text"
                                    value={formData.last_name}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "last_name",
                                            e.target.value
                                        )
                                    }
                                    placeholder="الاسم الأخير"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="email">البريد الإلكتروني</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "email",
                                            e.target.value
                                        )
                                    }
                                    placeholder="البريد الإلكتروني"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="phone">رقم الهاتف</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "phone",
                                            e.target.value
                                        )
                                    }
                                    placeholder="رقم الهاتف"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Role and Status */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
                            الدور والحالة
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="role">الدور</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) =>
                                        handleInputChange("role", value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر الدور" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">
                                            مستخدم
                                        </SelectItem>
                                        <SelectItem value="dealer">
                                            تاجر
                                        </SelectItem>
                                        <SelectItem value="moderator">
                                            مشرف
                                        </SelectItem>
                                        <SelectItem value="venue_owner">
                                            مالك المعرض
                                        </SelectItem>
                                        <SelectItem value="investor">
                                            مستثمر
                                        </SelectItem>
                                        {(user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR || user.role === UserRole.USER) && (
                                            <SelectItem value="admin">
                                                مدير
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="status">حالة الحساب</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) =>
                                        handleInputChange("status", value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر الحالة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">
                                            في الانتظار
                                        </SelectItem>
                                        <SelectItem value="active">
                                            مفعل
                                        </SelectItem>
                                        <SelectItem value="rejected">
                                            مرفوض
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2 space-x-reverse pt-6">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "is_active",
                                            e.target.checked
                                        )
                                    }
                                    className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                                />
                                <Label htmlFor="is_active" className="text-sm">
                                    حساب نشط
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Dealer Information - Only show if role is dealer */}
                    {(formData.role === UserRole.DEALER || user.dealer) && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
                                معلومات التاجر
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="company_name">
                                        اسم الشركة
                                    </Label>
                                    <Input
                                        id="company_name"
                                        type="text"
                                        value={formData.company_name}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "company_name",
                                                e.target.value
                                            )
                                        }
                                        placeholder="اسم الشركة"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="commercial_registry">
                                        رقم السجل التجاري
                                    </Label>
                                    <Input
                                        id="commercial_registry"
                                        type="text"
                                        value={formData.commercial_registry}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "commercial_registry",
                                                e.target.value
                                            )
                                        }
                                        placeholder="رقم السجل التجاري"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="dealer_status">
                                        حالة التاجر
                                    </Label>
                                    <Select
                                        value={formData.dealer_status}
                                        onValueChange={(value) =>
                                            handleInputChange(
                                                "dealer_status",
                                                value
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر حالة التاجر" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">
                                                في انتظار التحقق
                                            </SelectItem>
                                            <SelectItem value="active">
                                                مُصدّق
                                            </SelectItem>
                                            <SelectItem value="rejected">
                                                مرفوض
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">وصف الشركة</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "description",
                                            e.target.value
                                        )
                                    }
                                    placeholder="وصف مختصر عن الشركة وأنشطتها"
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

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
                            {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
