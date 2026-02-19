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
  Share,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";
import EditUserForm from "@/components/admin/EditUserForm";
import { useParams } from "next/navigation";

// Types
interface UserDetail {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  type: string;
  is_active: boolean;
  status: string;
  kyc_status: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function UserDetailPage({}: { params: { id: string } }) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const params = useParams<{ id: string }>();
  const userId = params["id"];
  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const response = await api.get(`/api/admin/users/${params.id}`);
      if (response.data && response.data.status === "success") {
        let user = response.data.data;
        if (user.type == "admin") {
          response.data.data.type = "user";
        }
        setUser(response.data.data);
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
        `/api/admin/users/${params.id}/toggle-status`,
        { status: "active", is_active: true },
      );

      if (response.data && response.data.status === "success") {
        toast.success("تم تفعيل المستخدم بنجاح");
        setUser((prev) =>
          prev ? { ...prev, is_active: true, status: "active" } : null,
        );
      }
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("فشل في تفعيل المستخدم");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRejectUser = async () => {
    setProcessingAction("reject");
    try {
      const response = await api.post(
        `/api/admin/users/${params.id}/toggle-status`,
        { status: "rejected", is_active: false },
      );

      if (response.data && response.data.status === "success") {
        toast.success("تم رفض المستخدم بنجاح");
        setUser((prev) =>
          prev ? { ...prev, is_active: false, status: "rejected" } : null,
        );
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast.error("فشل في رفض المستخدم");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleApproveDealerVerification = async () => {
    setProcessingAction("verify");
    try {
      const response = await api.post(
        `/api/admin/dealers/${params.id}/approve-verification`,
      );

      if (response.data && response.data.status === "success") {
        toast.success("تمت الموافقة على طلب التحقق بنجاح");
        setUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            is_active: true,
            status: "active",
          };
        });
      }
    } catch (error) {
      console.error("Error approving dealer verification:", error);
      toast.error("فشل في الموافقة على طلب التحقق");
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          is_active: true,
          status: "active",
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل بيانات المستخدم...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <AlertTriangle className="w-20 h-20 text-amber-500 mb-6" />
        <h1 className="text-2xl font-bold text-foreground mb-4 text-center">
          لم يتم العثور على المستخدم
        </h1>
        <p className="text-muted-foreground mb-8 text-center">
          المستخدم المطلوب غير موجود أو تم حذفه
        </p>
        <LoadingLink
          href="/admin/users"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl transition-all duration-300 flex items-center"
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
    <div className="min-h-screen bg-background text-foreground p-2">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <LoadingLink
            href="/admin/users"
            className="inline-flex items-center text-primary hover:text-primary/80 transition-colors duration-300 mb-4"
          >
            <ArrowLeft className="w-5 h-5 ml-2" />
            العودة إلى قائمة المستخدمين
          </LoadingLink>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            تفاصيل المستخدم
          </h1>
          <p className="text-muted-foreground mt-2">
            عرض وإدارة معلومات المستخدم بالتفصيل
          </p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <Button variant="outline">
            <Download className="w-4 h-4 ml-2" />
            تصدير البيانات
          </Button>
          <Button variant="outline">
            <Share className="w-4 h-4 ml-2" />
            مشاركة
          </Button>
        </div>
      </div>

      {/* User Header Card */}
      <div className="bg-card rounded-2xl border border-border shadow-xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* User Info */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="relative">
              <div className="bg-primary text-primary-foreground p-3 rounded-2xl">
                <span className="font-bold text-xl">
                  {user.first_name.charAt(0).toUpperCase()}
                </span>
              </div>
              {user.is_active && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-background"></div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground">
                {user.first_name} {user.last_name}
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {/* Role Badge */}
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                    user.type === "admin"
                      ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                      : user.type === "moderator"
                        ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                        : user.type === "dealer"
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                  }`}
                >
                  {getRoleIcon(user.type)}
                  <span className="mr-2">
                    {user.type === "dealer"
                      ? "تاجر"
                      : user.type === "admin"
                        ? "مدير"
                        : user.type === "moderator"
                          ? "مشرف"
                          : "مستخدم"}
                  </span>
                </span>

                {/* Status Badge */}
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                    user.status,
                  )}`}
                >
                  {user.status === "active" && (
                    <CheckCircle className="w-4 h-4 ml-1" />
                  )}
                  {user.status === "pending" && (
                    <Clock className="w-4 h-4 ml-1" />
                  )}
                  {user.status === "rejected" && (
                    <XCircle className="w-4 h-4 ml-1" />
                  )}
                  <span className="mr-2">
                    {user.status === "active"
                      ? "مفعل"
                      : user.status === "pending"
                        ? "في انتظار التفعيل"
                        : "مرفوض"}
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

                {/* Dealer badge removed - dealers no longer have separate status */}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowEditForm(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Edit className="w-4 h-4 ml-2" />
              تعديل البيانات
            </Button>

            {user.status === "pending" && (
              <>
                <Button
                  onClick={handleApproveUser}
                  disabled={!!processingAction}
                  className="bg-green-600 hover:bg-green-700 text-white"
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
                  className="bg-red-600 hover:bg-red-700 text-white"
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
                className="bg-green-600 hover:bg-green-700 text-white"
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
                className="border-destructive text-destructive hover:bg-destructive/10"
              >
                {processingAction === "reject" ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 ml-2" />
                )}
                إلغاء التفعيل
              </Button>
            )}

            {user.type === "dealer" && user.status === "pending" && (
              <Button
                onClick={handleApproveDealerVerification}
                disabled={!!processingAction}
                className="bg-blue-600 hover:bg-blue-700 text-white"
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
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <UserIcon className="w-5 h-5 ml-2 text-primary" />
                المعلومات الشخصية
              </h3>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-xl">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    الاسم الكامل
                  </div>
                  <div className="flex items-center text-foreground">
                    <UserIcon className="w-4 h-4 ml-2 text-primary" />
                    {user.first_name} {user.last_name}
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-xl">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    البريد الإلكتروني
                  </div>
                  <div className="flex items-center text-foreground">
                    <Mail className="w-4 h-4 ml-2 text-primary" />
                    {user.email}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-xl">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    رقم الهاتف
                  </div>
                  <div className="flex items-center text-foreground">
                    <Phone className="w-4 h-4 ml-2 text-primary" />
                    {user.phone || "غير متوفر"}
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-xl">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    تاريخ التسجيل
                  </div>
                  <div className="flex items-center text-foreground">
                    <Calendar className="w-4 h-4 ml-2 text-primary" />
                    {formatDate(user.created_at)}
                  </div>
                </div>
              </div>
            </div>

            {user.email_verified_at && (
              <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center text-green-400">
                  <CheckCircle className="w-4 h-4 ml-2" />
                  <span className="text-sm">
                    تم تأكيد البريد الإلكتروني في{" "}
                    {formatDate(user.email_verified_at)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dealer Information section removed - dealers no longer have separate data */}
        </div>

        {/* Stats & Actions Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <Activity className="w-5 h-5 ml-2 text-primary" />
              الإحصائيات
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                <div className="text-muted-foreground text-sm">
                  المزادات المشارك بها
                </div>
                <div className="text-foreground font-semibold">12</div>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                <div className="text-muted-foreground text-sm">
                  المشتريات الناجحة
                </div>
                <div className="text-foreground font-semibold">8</div>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                <div className="text-muted-foreground text-sm">
                  المبيعات الناجحة
                </div>
                <div className="text-foreground font-semibold">15</div>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                <div className="text-muted-foreground text-sm">
                  التقييم العام
                </div>
                <div className="flex items-center text-yellow-400">
                  <Star className="w-4 h-4 ml-1 fill-current" />
                  4.8
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              إجراءات سريعة
            </h3>

            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 ml-2" />
                إرسال رسالة
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <CreditCard className="w-4 h-4 ml-2" />
                عرض المعاملات
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="w-4 h-4 ml-2" />
                عرض المزادات
              </Button>

              <Button variant="outline" className="w-full justify-start">
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
