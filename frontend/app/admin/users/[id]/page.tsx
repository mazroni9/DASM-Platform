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
    MapPin,
    BadgeCheck,
    TrendingUp,
    Award,
    Activity,
    CreditCard,
    ShoppingCart,
    MessageSquare,
    Settings,
    MoreVertical,
    Download,
    Share
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";
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
    status: string;
    kyc_status: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    dealer?: {
        id: number;
        is_active: boolean;
        status: string;
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
    const [processingAction, setProcessingAction] = useState<string | null>(null);
    const [showEditForm, setShowEditForm] = useState(false);

    useEffect(() => {
        fetchUserDetails();
    }, []);

    const fetchUserDetails = async () => {
        try {
            const response = await api.get(`/api/admin/users/${params.id}`);
            if (response.data && response.data.status === "success") {
                let user = response.data.data.user;
                if (user.role == "admin") {
                    response.data.data.user.role = "user";
                }
                if (user.role == "dealer") {
                    let rating = response.data.data.dealer?.rating || 4.5;
                    response.data.data.dealer = {rating: rating};
                }
                setUser(response.data.data.user);
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
            toast.error("فشل في تحميل بيانات المستخدم");
        } finally {
            setLoading(false);
        }
    };

    const handleApproveUser = async () => {
        setProcessingAction("approve");
        try {
            const response = await api.post(
                `/api/admin/users/${params.id}/approve`
            );

            if (response.data && response.data.status === "success") {
                toast.success("تم تفعيل المستخدم بنجاح");
                setUser((prev) =>
                    prev ? { ...prev, is_active: true, status: "active" } : null
                );
            }
        } catch (error) {
            console.error("Error approving user:", error);
            toast.error("فشل في تفعيل المستخدم");
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
            const response = await api.post(
                `/api/admin/users/${params.id}/reject`
            );

            if (response.data && response.data.status === "success") {
                toast.success("تم رفض المستخدم بنجاح");
                setUser((prev) =>
                    prev
                        ? { ...prev, is_active: false, status: "rejected" }
                        : null
                );
            }
        } catch (error) {
            console.error("Error rejecting user:", error);
            toast.error("فشل في رفض المستخدم");
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
            const response = await api.post(
                `/api/admin/users/${params.id}/approve-verification`
            );

            if (response.data && response.data.status === "success") {
                toast.success("تمت الموافقة على طلب التحقق بنجاح");
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-500/20 text-green-400 border-green-500/30";
            case "pending":
                return "bg-amber-500/20 text-amber-400 border-amber-500/30";
            case "rejected":
                return "bg-red-500/20 text-red-400 border-red-500/30";
            default:
                return "bg-gray-500/20 text-gray-400 border-gray-500/30";
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "admin":
                return <Shield className="w-5 h-5 text-purple-400" />;
            case "moderator":
                return <Award className="w-5 h-5 text-orange-400" />;
            case "dealer":
                return <Building className="w-5 h-5 text-blue-400" />;
            default:
                return <UserIcon className="w-5 h-5 text-gray-400" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">جاري تحميل بيانات المستخدم...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex flex-col items-center justify-center p-6">
                <AlertTriangle className="w-20 h-20 text-amber-500 mb-6" />
                <h1 className="text-2xl font-bold text-white mb-4 text-center">
                    لم يتم العثور على المستخدم
                </h1>
                <p className="text-gray-400 mb-8 text-center">
                    المستخدم المطلوب غير موجود أو تم حذفه
                </p>
                <LoadingLink
                    href="/admin/users"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center"
                >
                    <ArrowLeft className="w-5 h-5 ml-2" />
                    العودة إلى قائمة المستخدمين
                </LoadingLink>
            </div>
        );
    }

    const handleUserUpdated = (updatedUser: any) => {
        setUser(updatedUser);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 md:p-6">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
                <div>
                    <LoadingLink
                        href="/admin/users"
                        className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors duration-300 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5 ml-2" />
                        العودة إلى قائمة المستخدمين
                    </LoadingLink>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        تفاصيل المستخدم
                    </h1>
                    <p className="text-gray-400 mt-2">
                        عرض وإدارة معلومات المستخدم بالتفصيل
                    </p>
                </div>

                <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
                    <Button
                        variant="outline"
                        className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300"
                    >
                        <Download className="w-4 h-4 ml-2" />
                        تصدير البيانات
                    </Button>
                    <Button
                        variant="outline"
                        className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300"
                    >
                        <Share className="w-4 h-4 ml-2" />
                        مشاركة
                    </Button>
                </div>
            </div>

            {/* User Header Card */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-xl p-6 mb-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    {/* User Info */}
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="relative">
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-3 rounded-2xl">
                                <span className="text-white font-bold text-xl">
                                    {user.first_name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            {user.is_active && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900"></div>
                            )}
                        </div>
                        
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {user.first_name} {user.last_name}
                            </h2>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {/* Role Badge */}
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                                    user.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                    user.role === 'moderator' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                    user.role === 'dealer' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                    'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                }`}>
                                    {getRoleIcon(user.role)}
                                    <span className="mr-2">
                                        {user.role === 'dealer' ? 'تاجر' :
                                         user.role === 'admin' ? 'مدير' :
                                         user.role === 'moderator' ? 'مشرف' : 'مستخدم'}
                                    </span>
                                </span>

                                {/* Status Badge */}
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(user.status)}`}>
                                    {user.status === "active" && <CheckCircle className="w-4 h-4 ml-1" />}
                                    {user.status === "pending" && <Clock className="w-4 h-4 ml-1" />}
                                    {user.status === "rejected" && <XCircle className="w-4 h-4 ml-1" />}
                                    <span className="mr-2">
                                        {user.status === "active" ? "مفعل" : 
                                         user.status === "pending" ? "في انتظار التفعيل" : "مرفوض"}
                                    </span>
                                </span>

                                {/* Email Verification Badge */}
                                {user.email_verified_at ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                        <BadgeCheck className="w-4 h-4 ml-1" />
                                        <span className="mr-2">البريد مؤكد</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                                        <XCircle className="w-4 h-4 ml-1" />
                                        <span className="mr-2">البريد غير مؤكد</span>
                                    </span>
                                )}

                                {/* Dealer Verification Badge */}
                                {user.role === "dealer" && user.dealer && (
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                                        user.dealer.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                                        user.dealer.status === "pending" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                                        "bg-red-500/20 text-red-400 border-red-500/30"
                                    }`}>
                                        {user.dealer.status === "active" ? <BadgeCheck className="w-4 h-4 ml-1" /> :
                                         user.dealer.status === "pending" ? <Clock className="w-4 h-4 ml-1" /> :
                                         <XCircle className="w-4 h-4 ml-1" />}
                                        <span className="mr-2">
                                            {user.dealer.status === "active" ? "تاجر مُصدّق" :
                                             user.dealer.status === "pending" ? "تحقق التاجر معلق" : "رُفض التحقق"}
                                        </span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <Button
                            onClick={() => setShowEditForm(true)}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-300"
                        >
                            <Edit className="w-4 h-4 ml-2" />
                            تعديل البيانات
                        </Button>

                        {user.status === "pending" && (
                            <>
                                <Button
                                    onClick={handleApproveUser}
                                    disabled={!!processingAction}
                                    className="bg-green-600 hover:bg-green-700 text-white transition-all duration-300"
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
                                    className="bg-red-600 hover:bg-red-700 text-white transition-all duration-300"
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
                                className="bg-green-600 hover:bg-green-700 text-white transition-all duration-300"
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
                                className="border-red-500 text-red-400 hover:bg-red-500/10 transition-all duration-300"
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
                                    className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
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

            {/* User Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Information */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Personal Information Card */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white flex items-center">
                                <UserIcon className="w-5 h-5 ml-2 text-cyan-400" />
                                المعلومات الشخصية
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="bg-gray-700/30 p-4 rounded-xl">
                                    <div className="text-sm font-medium text-gray-400 mb-2">الاسم الكامل</div>
                                    <div className="flex items-center text-white">
                                        <UserIcon className="w-4 h-4 ml-2 text-cyan-400" />
                                        {user.first_name} {user.last_name}
                                    </div>
                                </div>

                                <div className="bg-gray-700/30 p-4 rounded-xl">
                                    <div className="text-sm font-medium text-gray-400 mb-2">البريد الإلكتروني</div>
                                    <div className="flex items-center text-white">
                                        <Mail className="w-4 h-4 ml-2 text-cyan-400" />
                                        {user.email}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-gray-700/30 p-4 rounded-xl">
                                    <div className="text-sm font-medium text-gray-400 mb-2">رقم الهاتف</div>
                                    <div className="flex items-center text-white">
                                        <Phone className="w-4 h-4 ml-2 text-cyan-400" />
                                        {user.phone || "غير متوفر"}
                                    </div>
                                </div>

                                <div className="bg-gray-700/30 p-4 rounded-xl">
                                    <div className="text-sm font-medium text-gray-400 mb-2">تاريخ التسجيل</div>
                                    <div className="flex items-center text-white">
                                        <Calendar className="w-4 h-4 ml-2 text-cyan-400" />
                                        {formatDate(user.created_at)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {user.email_verified_at && (
                            <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                <div className="flex items-center text-green-400">
                                    <CheckCircle className="w-4 h-4 ml-2" />
                                    <span className="text-sm">تم تأكيد البريد الإلكتروني في {formatDate(user.email_verified_at)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dealer Information */}
                    {user.role === "dealer" && user.dealer && (
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-white flex items-center">
                                    <Building className="w-5 h-5 ml-2 text-blue-400" />
                                    معلومات التاجر
                                </h3>
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <div className="flex items-center bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                                        <Star className="w-4 h-4 ml-1 fill-current" />
                                        {user.dealer.rating || 0}/5
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="bg-gray-700/30 p-4 rounded-xl">
                                        <div className="text-sm font-medium text-gray-400 mb-2">اسم الشركة</div>
                                        <div className="flex items-center text-white">
                                            <Building className="w-4 h-4 ml-2 text-blue-400" />
                                            {user.dealer.company_name}
                                        </div>
                                    </div>

                                    <div className="bg-gray-700/30 p-4 rounded-xl">
                                        <div className="text-sm font-medium text-gray-400 mb-2">رقم السجل التجاري</div>
                                        <div className="flex items-center text-white">
                                            <FileText className="w-4 h-4 ml-2 text-blue-400" />
                                            {user.dealer.commercial_registry}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {user.dealer.address && (
                                        <div className="bg-gray-700/30 p-4 rounded-xl">
                                            <div className="text-sm font-medium text-gray-400 mb-2">العنوان</div>
                                            <div className="flex items-center text-white">
                                                <MapPin className="w-4 h-4 ml-2 text-blue-400" />
                                                {user.dealer.address}
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-gray-700/30 p-4 rounded-xl">
                                        <div className="text-sm font-medium text-gray-400 mb-2">حالة التحقق</div>
                                        <div className="flex items-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                user.dealer.status === "active" ? "bg-green-500/20 text-green-400" :
                                                user.dealer.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                                                "bg-red-500/20 text-red-400"
                                            }`}>
                                                {user.dealer.status === "active" ? "مُصدّق" :
                                                 user.dealer.status === "pending" ? "قيد المراجعة" : "مرفوض"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {user.dealer.description && (
                                <div className="mt-4 bg-gray-700/30 p-4 rounded-xl">
                                    <div className="text-sm font-medium text-gray-400 mb-2">وصف الشركة</div>
                                    <p className="text-white leading-relaxed">
                                        {user.dealer.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Stats & Actions Sidebar */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <Activity className="w-5 h-5 ml-2 text-cyan-400" />
                            الإحصائيات
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-xl">
                                <div className="text-gray-400 text-sm">المزادات المشارك بها</div>
                                <div className="text-white font-semibold">12</div>
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-xl">
                                <div className="text-gray-400 text-sm">المشتريات الناجحة</div>
                                <div className="text-white font-semibold">8</div>
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-xl">
                                <div className="text-gray-400 text-sm">المبيعات الناجحة</div>
                                <div className="text-white font-semibold">15</div>
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-xl">
                                <div className="text-gray-400 text-sm">التقييم العام</div>
                                <div className="flex items-center text-yellow-400">
                                    <Star className="w-4 h-4 ml-1 fill-current" />
                                    4.8
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">إجراءات سريعة</h3>
                        
                        <div className="space-y-3">
                            <Button 
                                variant="outline" 
                                className="w-full justify-start bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
                            >
                                <MessageSquare className="w-4 h-4 ml-2" />
                                إرسال رسالة
                            </Button>
                            
                            <Button 
                                variant="outline" 
                                className="w-full justify-start bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
                            >
                                <CreditCard className="w-4 h-4 ml-2" />
                                عرض المعاملات
                            </Button>
                            
                            <Button 
                                variant="outline" 
                                className="w-full justify-start bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
                            >
                                <ShoppingCart className="w-4 h-4 ml-2" />
                                عرض المزادات
                            </Button>
                            
                            <Button 
                                variant="outline" 
                                className="w-full justify-start bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
                            >
                                <Settings className="w-4 h-4 ml-2" />
                                إعدادات الحساب
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit User Form Modal */}
            {user && (
                <EditUserForm
                    user_id={user.id}
                    isOpen={showEditForm}
                    onClose={() => setShowEditForm(false)}
                    onUserUpdated={handleUserUpdated}
                />
            )}
        </div>
    );
}