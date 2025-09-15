"use client";

import { useState, useEffect } from "react";
import {
    User as UserIcon,
    Mail,
    Phone,
    Calendar,
    Building,
    Shield,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    Eye,
    Loader2,
    ArrowLeft,
    Edit,
    FileText,
    Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import Link from "next/link";
import EditUserForm from "@/components/admin/EditUserForm";

// Types
interface UserDetail {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
    is_active: boolean;
    status: string; // 'active', 'pending', 'rejected'
    kyc_status: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    dealer?: {
        id: number;
        is_active: string;
        status: string; // 'active', 'pending', 'rejected'
        company_name: string;
        commercial_registry: string;
        description: string;
        address: string;
        rating: number;
    } | null;
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingAction, setProcessingAction] = useState<string | null>(
        null
    );
    const [showEditForm, setShowEditForm] = useState(false);

    useEffect(() => {
        fetchUserDetails();
    }, []);

    const fetchUserDetails = async () => {
        try {
            // Fetch user details from backend
            const response = await api.get(`/api/admin/users/${params.id}`);
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
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
            toast.error("فشل في تحميل بيانات المستخدم");
            // Set demo data for development
            /*
            setUser({
                id: parseInt(params.id),
                first_name: "خالد",
                last_name: "المنصور",
                email: "khalid@example.com",
                phone: "0534567890",
                role: "dealer",
                is_active: false,
                kyc_status: "pending",
                email_verified_at: "2025-05-18T09:45:00",
                created_at: "2025-05-18T09:45:00",
                updated_at: "2025-05-18T09:45:00",
                dealer: {
                    id: 1,
                    company_name: "شركة المنصور للسيارات",
                    commercial_registry: "CR-123456789",
                    description:
                        "متخصصون في بيع وشراء السيارات الفاخرة المستعملة",
                    address: "الرياض، حي الملز، شارع الأمير ماجد",
                    rating: 4.5,
                },
            });
            */
        } finally {
            setLoading(false);
        }
    };

    const handleApproveUser = async () => {
        setProcessingAction("approve");
        try {
            // Call the API to approve the user
            const response = await api.post(
                `/api/admin/users/${params.id}/approve`
            );

            if (response.data && response.data.status === "success") {
                toast.success("تم تفعيل المستخدم بنجاح");

                // Update user in the local state
                setUser((prev) =>
                    prev ? { ...prev, is_active: true, status: "active" } : null
                );
            }
        } catch (error) {
            console.error("Error approving user:", error);
            toast.error("فشل في تفعيل المستخدم");

            // For development, update the state anyway
            setUser((prev) =>
                prev ? { ...prev, is_active: true, status: "active" } : null
            );
        } finally {
            setProcessingAction(null);
        }
    };

    const handleRejectUser = async () => {
        setProcessingAction("reject");
        try {
            // Call the API to reject the user
            const response = await api.post(
                `/api/admin/users/${params.id}/reject`
            );

            if (response.data && response.data.status === "success") {
                toast.success("تم رفض المستخدم بنجاح");

                // Update user in the local state
                setUser((prev) =>
                    prev
                        ? { ...prev, is_active: false, status: "rejected" }
                        : null
                );
            }
        } catch (error) {
            console.error("Error rejecting user:", error);
            toast.error("فشل في رفض المستخدم");

            // For development, update the state anyway
            setUser((prev) =>
                prev ? { ...prev, is_active: false, status: "rejected" } : null
            );
        } finally {
            setProcessingAction(null);
        }
    };

    const handleApproveDealerVerification = async () => {
        if (!user?.dealer) return;

        setProcessingAction("verify");
        try {
            // Call the API to approve dealer verification
            const response = await api.post(
                `/api/admin/users/${params.id}/approve-verification`
            );

            if (response.data && response.data.status === "success") {
                toast.success("تمت الموافقة على طلب التحقق بنجاح");

                // Update dealer status in the local state
                setUser((prev) => {
                    if (!prev || !prev.dealer) return prev;
                    return {
                        ...prev,
                        is_active: true,
                        status: "active",
                        dealer: {
                            ...prev.dealer,
                            is_active: true,
                            status: "active",
                        },
                    };
                });
            }
        } catch (error) {
            console.error("Error approving dealer verification:", error);
            toast.error("فشل في الموافقة على طلب التحقق");

            // For development, update the state anyway
            setUser((prev) => {
                if (!prev || !prev.dealer) return prev;
                return {
                    ...prev,
                    is_active: true,
                    status: "active",
                    dealer: {
                        ...prev.dealer,
                        is_active: true,
                        status: "active",
                    },
                };
            });
        } finally {
            setProcessingAction(null);
        }
    };

    // Format date to a readable string
    const formatDate = (dateString) => {
        if (!dateString) return "غير متوفر";
        const date = new Date(dateString);
        return date.toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <span className="mr-2 text-xl">
                    جاري تحميل بيانات المستخدم...
                </span>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    لم يتم العثور على المستخدم
                </h1>
                <p className="text-gray-600 mb-6">
                    المستخدم المطلوب غير موجود أو تم حذفه
                </p>
                <Link
                    href="/admin/users"
                    className="text-blue-600 hover:underline"
                >
                    <ArrowLeft className="w-4 h-4 inline ml-1" />
                    العودة إلى قائمة المستخدمين
                </Link>
            </div>
        );
    }

    const handleUserUpdated = (updatedUser: any) => {
        setUser(updatedUser);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">
                    تفاصيل المستخدم
                </h1>
                <Link
                    href="/admin/users"
                    className="text-blue-600 hover:underline flex items-center"
                >
                    <ArrowLeft className="w-4 h-4 ml-1" />
                    العودة إلى قائمة المستخدمين
                </Link>
            </div>

            {/* User status and actions */}
            <div className="bg-white rounded-lg shadow-md border p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-2xl">
                                {user.first_name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                {user.first_name} {user.last_name}
                            </h2>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {user.role === "dealer" ? (
                                    <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                        <Building className="w-3 h-3 ml-1" />
                                        تاجر
                                    </span>
                                ) : user.role === "admin" ? (
                                    <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                        <Shield className="w-3 h-3 ml-1" />
                                        مدير
                                    </span>
                                ) : user.role === "moderator" ? (
                                    <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                        <Shield className="w-3 h-3 ml-1" />
                                        مشرف
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                        <UserIcon className="w-3 h-3 ml-1" />
                                        مستخدم
                                    </span>
                                )}

                                {user.status === "active" ? (
                                    <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-green-100 text-green-800">
                                        <CheckCircle className="w-3 h-3 ml-1" />
                                        مفعل
                                    </span>
                                ) : user.status === "rejected" ? (
                                    <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-red-100 text-red-800">
                                        <XCircle className="w-3 h-3 ml-1" />
                                        مرفوض
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                                        <Clock className="w-3 h-3 ml-1" />
                                        في انتظار التفعيل
                                    </span>
                                )}

                                {user.email_verified_at ? (
                                    <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-green-100 text-green-800">
                                        <CheckCircle className="w-3 h-3 ml-1" />
                                        البريد مؤكد
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-red-100 text-red-800">
                                        <XCircle className="w-3 h-3 ml-1" />
                                        البريد غير مؤكد
                                    </span>
                                )}

                                {user.role === "dealer" && user.dealer && (
                                    <>
                                        {user.dealer.status === "active" ? (
                                            <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                <CheckCircle className="w-3 h-3 ml-1" />
                                                تاجر مُصدّق
                                            </span>
                                        ) : user.dealer.status === "pending" ? (
                                            <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                                                <Clock className="w-3 h-3 ml-1" />
                                                تحقق التاجر معلق
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-red-100 text-red-800">
                                                <XCircle className="w-3 h-3 ml-1" />
                                                رُفض التحقق
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {/* Edit Button - Always visible for admins */}
                        <Button
                            onClick={() => setShowEditForm(true)}
                            variant="outline"
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                            <Edit className="w-4 h-4 ml-2" />
                            تعديل البيانات
                        </Button>

                        {user.status === "pending" && (
                            <>
                                <Button
                                    onClick={handleApproveUser}
                                    disabled={!!processingAction}
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {processingAction === "approve" ? (
                                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4 ml-2" />
                                    )}
                                    تفعيل المستخدم
                                </Button>
                                <Button
                                    onClick={handleRejectUser}
                                    disabled={!!processingAction}
                                    variant="destructive"
                                >
                                    {processingAction === "reject" ? (
                                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    ) : (
                                        <XCircle className="w-4 h-4 ml-2" />
                                    )}
                                    رفض المستخدم
                                </Button>
                            </>
                        )}

                        {user.status === "rejected" && (
                            <Button
                                onClick={handleApproveUser}
                                disabled={!!processingAction}
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {processingAction === "approve" ? (
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                ) : (
                                    <CheckCircle className="w-4 h-4 ml-2" />
                                )}
                                تفعيل المستخدم
                            </Button>
                        )}

                        {user.status === "active" && (
                            <Button
                                onClick={handleRejectUser}
                                disabled={!!processingAction}
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                                {processingAction === "reject" ? (
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                ) : (
                                    <XCircle className="w-4 h-4 ml-2" />
                                )}
                                إلغاء التفعيل
                            </Button>
                        )}

                        {user.role === "dealer" &&
                            user.dealer &&
                            user.dealer.status === "pending" && (
                                <Button
                                    onClick={handleApproveDealerVerification}
                                    disabled={!!processingAction}
                                    variant="outline"
                                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                >
                                    {processingAction === "verify" ? (
                                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    ) : (
                                        <Shield className="w-4 h-4 ml-2" />
                                    )}
                                    تصديق التاجر
                                </Button>
                            )}
                    </div>
                </div>
            </div>

            {/* User details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md border p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        معلومات المستخدم الأساسية
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">
                                الاسم الكامل
                            </div>
                            <div className="flex items-center">
                                <UserIcon className="w-5 h-5 text-gray-400 ml-2" />
                                <span className="text-gray-800">
                                    {user.first_name} {user.last_name}
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">
                                البريد الإلكتروني
                            </div>
                            <div className="flex items-center">
                                <Mail className="w-5 h-5 text-gray-400 ml-2" />
                                <span className="text-gray-800">
                                    {user.email}
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">
                                رقم الهاتف
                            </div>
                            <div className="flex items-center">
                                <Phone className="w-5 h-5 text-gray-400 ml-2" />
                                <span className="text-gray-800">
                                    {user.phone}
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">
                                تاريخ التسجيل
                            </div>
                            <div className="flex items-center">
                                <Calendar className="w-5 h-5 text-gray-400 ml-2" />
                                <span className="text-gray-800">
                                    {formatDate(user.created_at)}
                                </span>
                            </div>
                        </div>

                        {user.email_verified_at && (
                            <div>
                                <div className="text-sm font-medium text-gray-500 mb-1">
                                    تاريخ تأكيد البريد الإلكتروني
                                </div>
                                <div className="flex items-center">
                                    <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
                                    <span className="text-gray-800">
                                        {formatDate(user.email_verified_at)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Dealer Information Section */}
                {user.role === "dealer" && user.dealer && (
                    <div className="bg-white rounded-lg shadow-md border p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            معلومات التاجر
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-gray-500 mb-1">
                                    اسم الشركة
                                </div>
                                <div className="flex items-center">
                                    <Building className="w-5 h-5 text-gray-400 ml-2" />
                                    <span className="text-gray-800">
                                        {user.dealer.company_name}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-medium text-gray-500 mb-1">
                                    رقم السجل التجاري
                                </div>
                                <div className="flex items-center">
                                    <Shield className="w-5 h-5 text-gray-400 ml-2" />
                                    <span className="text-gray-800">
                                        {user.dealer.commercial_registry}
                                    </span>
                                </div>
                            </div>

                            {user.dealer.description && (
                                <div>
                                    <div className="text-sm font-medium text-gray-500 mb-1">
                                        وصف الشركة
                                    </div>
                                    <p className="text-gray-800 bg-gray-50 p-3 rounded-md">
                                        {user.dealer.description}
                                    </p>
                                </div>
                            )}

                            <div>
                                <div className="text-sm font-medium text-gray-500 mb-1">
                                    تقييم التاجر
                                </div>
                                <div className="flex items-center">
                                    <Star className="w-5 h-5 text-yellow-400 ml-2" />
                                    <span className="text-gray-800">
                                        {user.dealer.rating || 0} / 5
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit User Form Modal */}
            {user && (
                <EditUserForm
                    user={user}
                    isOpen={showEditForm}
                    onClose={() => setShowEditForm(false)}
                    onUserUpdated={handleUserUpdated}
                />
            )}
        </div>
    );
}
