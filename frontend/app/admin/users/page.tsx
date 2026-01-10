"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Check,
  X,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building,
  Loader2,
  Eye,
  Edit,
  MoreVertical,
  Download,
  Mail,
  Phone,
  Calendar,
  Shield,
  Crown,
  BadgeCheck,
  AlertCircle,
  ChevronDown,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";
import Switch from "@mui/material/Switch";
import EditUserForm from "@/components/admin/EditUserForm";
import Pagination from "@components/Pagination";
import PaginationItem from "@mui/material/PaginationItem";

import { log } from "console";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

// Toggle Switch Component using Material UI
const ToggleSwitch = ({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) => {
  return (
    <Switch
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      disabled={disabled}
      color="primary"
      size="small"
      sx={{
        "& .MuiSwitch-switchBase.Mui-checked": {
          color: "#22d3ee", // cyan-400
        },
        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
          backgroundColor: "#22d3ee", // cyan-400
        },
      }}
    />
  );
};

// Types
interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  type: string;
  is_active: boolean;
  email_verified_at: string | null;
  created_at: string;
  user_code: string;
  status: "pending" | "active" | "rejected";
  dealer?: {
    id: number;
    is_active: boolean;
    status: "pending" | "active" | "rejected";
    company_name: string;
  } | null;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const pageSize = 10;

  useEffect(() => {
    if (initialLoad) {
      fetchUsers();
      setInitialLoad(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (!initialLoad) {
      filterUsers();
    }
  }, [users, searchTerm, statusFilter, roleFilter, initialLoad]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/users?page=${currentPage}`);

      if (response.data && response.data.status === "success") {
        if (response.data.data && response.data.data.data) {
          setUsers(response.data.data.data);
          setFilteredUsers(response.data.data.data);
          setTotalCount(response.data.data.last_page);
        } else {
          setUsers(response.data.data);
          setFilteredUsers(response.data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("فشل في تحميل بيانات المستخدمين");
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!Array.isArray(users)) {
      console.warn("Users data is not an array:", users);
      setFilteredUsers([]);
      return;
    }

    let result = [...users];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.first_name.toLowerCase().includes(searchLower) ||
          user.last_name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          (user.dealer?.company_name &&
            user.dealer.company_name.toLowerCase().includes(searchLower))
      );
    }

    if (roleFilter !== "all") {
      result = result.filter((user) => user.type === roleFilter);
    }

    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        result = result.filter((user) => user.status === "pending");
      } else if (statusFilter === "active") {
        result = result.filter((user) => user.status === "active");
      } else if (statusFilter === "rejected") {
        result = result.filter((user) => user.status === "rejected");
      } else if (statusFilter === "dealer_pending") {
        result = result.filter(
          (user) =>
            user.type === "dealer" &&
            user.dealer &&
            user.dealer.status === "pending"
        );
      }
    }

    setFilteredUsers(result);
  };

  const handleApproveUser = async (userId: number) => {
    setProcessingUserId(userId);
    try {
      const response = await api.post(
        `/api/admin/users/${userId}/toggle-status`,
        {
          status: "active",
          is_active: true,
        }
      );

      if (response.data && response.data.status === "success") {
        toast.success("تم تفعيل المستخدم بنجاح");
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId
              ? { ...user, is_active: true, status: "active" }
              : user
          )
        );
      }
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("فشل في تفعيل المستخدم");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleRejectUser = async (userId: number) => {
    setProcessingUserId(userId);
    try {
      const response = await api.post(
        `/api/admin/users/${userId}/toggle-status`,
        {
          status: "rejected",
          is_active: false,
        }
      );

      if (response.data && response.data.status === "success") {
        toast.success("تم رفض المستخدم بنجاح");
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId
              ? { ...user, is_active: false, status: "rejected" }
              : user
          )
        );
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast.error("فشل في رفض المستخدم");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    setProcessingUserId(userId);
    try {
      const response = await api.post(
        `api/admin/users/${userId}/toggle-status`,
        {
          is_active: !currentStatus,
        }
      );

      if (response.data && response.data.status === "success") {
        toast.success(response.data.message);
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  is_active: !currentStatus,
                  status: response.data.data.status,
                }
              : user
          )
        );
      }
    } catch (error) {
      console.error("Error toggling moderator status:", error);
      toast.error("فشل في تحديث حالة المشرف");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleApproveDealerVerification = async (userId: number) => {
    setProcessingUserId(userId);
    try {
      const response = await api.post(
        `/api/admin/dealers/${userId}/approve-verification`
      );

      if (response.data && response.data.status === "success") {
        toast.success("تمت الموافقة على طلب التحقق بنجاح");
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId && user.dealer
              ? {
                  ...user,
                  is_active: true,
                  status: "active",
                  dealer: {
                    ...user.dealer,
                    is_active: true,
                    status: "active",
                  },
                }
              : user
          )
        );
      }
    } catch (error) {
      console.error("Error approving dealer verification:", error);
      toast.error("فشل في الموافقة على طلب التحقق");
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId && user.dealer
            ? {
                ...user,
                is_active: true,
                status: "active",
                dealer: {
                  ...user.dealer,
                  is_active: true,
                  status: "active",
                },
              }
            : user
        )
      );
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleOpenEditFrom = (user: UserData) => {
    setSelectedUser(user);
    setShowEditForm(true);
    setProcessingUserId(user.id);
  };

  const handleUserUpdated = (updatedUser: any) => {
    setProcessingUserId(null);
    setShowEditForm(false);
    setSelectedUser(null);
    fetchUsers(); // Refresh the list
  };

  const formatDate = (dateString) => {
    if (!dateString) return "غير متوفر";
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-4 h-4 text-purple-400" />;
      case "moderator":
        return <Shield className="w-4 h-4 text-orange-400" />;
      case "dealer":
        return <Building className="w-4 h-4 text-blue-400" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
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

  return (
    <div className="min-h-screen bg-background text-foreground p-2">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            إدارة المستخدمين
          </h1>
          <p className="text-muted-foreground mt-2">
            إدارة وتنظيم حسابات المستخدمين في النظام
          </p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw
              className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`}
            />
            تحديث البيانات
          </Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <UserPlus className="w-4 h-4 ml-2" />
            إضافة مستخدم
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {users.length}
              </p>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-xl">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">
                المستخدمين النشطين
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {users.filter((u) => u.status === "active").length}
              </p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">في انتظار التفعيل</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {users.filter((u) => u.status === "pending").length}
              </p>
            </div>
            <div className="bg-amber-500/10 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">
                المستخدمين المرفوضين
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {users.filter((u) => u.status === "rejected").length}
              </p>
            </div>
            <div className="bg-red-500/10 p-3 rounded-xl">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search Section */}
      <div className="bg-card rounded-xl p-6 border border-border shadow-lg mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search Input */}
          <div className="relative flex-grow">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="ابحث بالاسم، البريد الإلكتروني، أو اسم الشركة..."
              className="pr-12 w-full bg-background border-border text-foreground placeholder:text-muted-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border border-border rounded-lg bg-background text-foreground text-sm"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">في انتظار التفعيل</option>
              <option value="active">مفعل</option>
              <option value="dealer_pending">تجار في انتظار التحقق</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="p-2 border border-border rounded-lg bg-background text-foreground text-sm"
            >
              <option value="all">جميع الأدوار</option>
              <option value="user">مستخدم</option>
              <option value="dealer">تاجر</option>
              <option value="moderator">مشرف</option>
              <option value="admin">مدير</option>
            </select>

            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 ml-2" />
              المزيد من الفلاتر
              <ChevronDown className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">
              قائمة المستخدمين ({filteredUsers.length})
            </h2>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 ml-2" />
              تصدير التقرير
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                  المستخدم
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                  معلومات الاتصال
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                  الدور
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                  الحالة
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                  تاريخ التسجيل
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-muted/50 transition-colors duration-200 group"
                  >
                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="bg-primary p-2 rounded-xl">
                          <span className="text-primary-foreground font-semibold text-sm">
                            {user.first_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-foreground">
                            {user.first_name} {user.last_name}
                          </div>
                          {user.dealer && (
                            <div className="text-xs text-muted-foreground flex items-center mt-1">
                              <Building className="w-3 h-3 ml-1" />
                              {user.dealer.company_name}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground flex items-center mt-1">
                            {user.user_code}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground flex items-center">
                        <Mail className="w-3 h-3 ml-1 text-muted-foreground" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="text-sm text-muted-foreground flex items-center mt-1">
                          <Phone className="w-3 h-3 ml-1" />
                          {user.phone}
                        </div>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getRoleIcon(user.type)}
                        <span
                          className={`text-sm mr-2 ${
                            user.type === "admin"
                              ? "text-purple-400"
                              : user.type === "moderator"
                              ? "text-orange-400"
                              : user.type === "dealer"
                              ? "text-blue-400"
                              : user.type === "venue_owner"
                              ? "text-cyan-400"
                              : "text-gray-400"
                          }`}
                        >
                          {user.type === "dealer"
                            ? "تاجر"
                            : user.type === "admin"
                            ? "مدير"
                            : user.type === "moderator"
                            ? "مشرف"
                            : user.type === "venue_owner"
                            ? "صاحب معرض"
                            : "مستخدم"}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            user.status
                          )}`}
                        >
                          {user.status === "active" && (
                            <CheckCircle className="w-3 h-3 ml-1" />
                          )}
                          {user.status === "pending" && (
                            <Clock className="w-3 h-3 ml-1" />
                          )}
                          {user.status === "rejected" && (
                            <XCircle className="w-3 h-3 ml-1" />
                          )}
                          {user.status === "active"
                            ? "مفعل"
                            : user.status === "pending"
                            ? "في الانتظار"
                            : "مرفوض"}
                        </span>

                        {user.type === "dealer" && user.dealer && (
                          <div>
                            {user.dealer.is_active ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                <BadgeCheck className="w-3 h-3 ml-1" />
                                تاجر مُصدّق
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                <AlertCircle className="w-3 h-3 ml-1" />
                                التحقق في الانتظار
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Registration Date */}
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 ml-1" />
                        {formatDate(user.created_at)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {/* Status Toggle */}
                        {(user.status === "active" ||
                          user.status === "rejected") && (
                          <div className="flex items-center">
                            <ToggleSwitch
                              checked={user.is_active}
                              onChange={() =>
                                handleToggleStatus(user.id, user.is_active)
                              }
                              disabled={processingUserId === user.id}
                            />
                            {processingUserId === user.id && (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin text-cyan-500" />
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-1 space-x-reverse">
                          {user.status === "pending" && (
                            <>
                              <Button
                                onClick={() => handleApproveUser(user.id)}
                                disabled={processingUserId === user.id}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white px-3"
                              >
                                {processingUserId === user.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                onClick={() => handleRejectUser(user.id)}
                                disabled={processingUserId === user.id}
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white px-3"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}

                          {user.type === "dealer" &&
                            user.dealer &&
                            user.dealer.status === "pending" && (
                              <Button
                                onClick={() =>
                                  handleApproveDealerVerification(user.id)
                                }
                                disabled={processingUserId === user.id}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3"
                              >
                                {processingUserId === user.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <BadgeCheck className="w-4 h-4" />
                                )}
                              </Button>
                            )}

                          <Button
                            onClick={() => handleOpenEditFrom(user)}
                            variant="ghost"
                            size="sm"
                            className="px-3"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="px-3"
                          >
                            <LoadingLink href={`/admin/users/${user.id}`}>
                              <Eye className="w-4 h-4" />
                            </LoadingLink>
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p>لا توجد نتائج مطابقة للبحث</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-border">
          <Pagination
            totalPages={totalCount}
            page={currentPage}
            onPageChange={(event, page) => {
              setInitialLoad(true);
              setCurrentPage(page);
            }}
          />
        </div>
      </div>

      {/* Edit User Form Modal */}
      <EditUserForm
        user_id={processingUserId}
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setProcessingUserId(null);
          setSelectedUser(null);
        }}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
}
