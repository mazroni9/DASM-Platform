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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";
import Switch from '@mui/material/Switch';
import EditUserForm from "@/components/admin/EditUserForm";
import Pagination from '@components/Pagination';
import PaginationItem from '@mui/material/PaginationItem';

import { log } from "console";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
// Toggle Switch Component using Material UI
const ToggleSwitch = ({ 
    checked, 
    onChange, 
    disabled = false 
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
                '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#2563eb', // blue-600
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#2563eb', // blue-600
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
    role: string;
    is_active: boolean;
    email_verified_at: string | null;
    created_at: string;
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
    const [statusFilter, setStatusFilter] = useState("all"); // all, pending, active, rejected
    const [roleFilter, setRoleFilter] = useState("all"); // all, user, dealer
    const [processingUserId, setProcessingUserId] = useState<number | null>(
        null
    );
    const [initialLoad, setInitialLoad] = useState(true);
    const [showEditForm, setShowEditForm] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10; // or allow user to change it
    const handleUserUpdated = (updatedUser: any) => {
        setProcessingUserId(null);
        setShowEditForm(false);
        //setUser(updatedUser);
    };

    useEffect(() => {
        if (initialLoad) {
            fetchUsers();
            setInitialLoad(false);
        }
    }, [currentPage]);

    useEffect(() => {
        // Apply filters whenever filter settings or search term changes
        if (!initialLoad) {
            filterUsers();
        }
    }, [users, searchTerm, statusFilter, roleFilter, initialLoad]);

    const fetchUsers = async () => {
        try {
            const response = await api.get(`/api/admin/users?page=${currentPage}`);

            if (response.data && response.data.status === "success") {
                console.log("Fetched users:", response.data);
                // Check if data is paginated
                if (response.data.data && response.data.data.data) {
                    // Handle paginated data
                    setUsers(response.data.data.data);
                    setFilteredUsers(response.data.data.data);
                    setTotalCount(response.data.data.last_page)
                } else {
                    // Handle non-paginated data
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
        // Guard against users not being an array
        if (!Array.isArray(users)) {
            console.warn("Users data is not an array:", users);
            setFilteredUsers([]);
            return;
        }

        let result = [...users];

        // Apply search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(
                (user) =>
                    user.first_name.toLowerCase().includes(searchLower) ||
                    user.last_name.toLowerCase().includes(searchLower) ||
                    user.email.toLowerCase().includes(searchLower) ||
                    (user.dealer?.company_name &&
                        user.dealer.company_name
                            .toLowerCase()
                            .includes(searchLower))
            );
        }

        // Apply role filter
        if (roleFilter !== "all") {
            result = result.filter((user) => user.role === roleFilter);
        }

        // Apply status filter
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
                        user.role === "dealer" &&
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
            // Call the API to approve the user
            const response = await api.post(
                `/api/admin/users/${userId}/activate`
            );

            if (response.data && response.data.status === "success") {
                toast.success("تم تفعيل المستخدم بنجاح");

                // Update user in the local state
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

            // For development, update the state anyway
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === userId
                        ? { ...user, is_active: true, status: "active" }
                        : user
                )
            );
        } finally {
            setProcessingUserId(null);
        }
    };

    const handleRejectUser = async (userId: number) => {
        setProcessingUserId(userId);
        try {
            // Call the API to reject the user
            const response = await api.post(
                `/api/admin/users/${userId}/deactivate`
            );

            if (response.data && response.data.status === "success") {
                toast.success("تم رفض المستخدم بنجاح");

                // Update user in the local state with rejected status
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

            // For development, update the state anyway
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === userId
                        ? { ...user, is_active: false, status: "rejected" }
                        : user
                )
            );
        } finally {
            setProcessingUserId(null);
        }
    };

    const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
        setProcessingUserId(userId);
        try {
            const response = await api.post(`api/admin/users/${userId}/toggle-status`, {
                is_active: !currentStatus,
            });

            if (response.data && response.data.status === "success") {
                
                toast.success(response.data.message);

                // Update user in the local state
                setUsers((prevUsers) =>
                    prevUsers.map((user) =>
                        user.id === userId
                            ? { ...user, is_active: !currentStatus,status:response.data.data.status}
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
            // Call the API to approve dealer verification
            const response = await api.post(
                `/api/admin/dealers/${userId}/approve-verification`
            );

            if (response.data && response.data.status === "success") {
                toast.success("تمت الموافقة على طلب التحقق بنجاح");

                // Update dealer status in the local state
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

            // For development, update the state anyway
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

    const handleOpenEditFrom = (user_id:number) => {
        setShowEditForm(true)
        setProcessingUserId(user_id)
    }
    // Format date to a readable string
    const formatDate = (dateString) => {
        if (!dateString) return "غير متوفر";
        const date = new Date(dateString);
        return date.toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">
                    إدارة المستخدمين
                </h1>
                <Button onClick={fetchUsers} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 ml-2" />
                    تحديث
                </Button>
            </div>

            {/* Filters and search */}
            <div className="bg-white p-4 rounded-lg shadow border flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                    <Input
                        type="text"
                        placeholder="بحث بالاسم، البريد الإلكتروني، أو اسم الشركة"
                        className="pr-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 flex-wrap">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md bg-white text-sm"
                    >
                        <option value="all">جميع الحالات</option>
                        <option value="pending">في انتظار التفعيل</option>
                        <option value="active">مفعل</option>
                        <option value="dealer_pending">
                            تجار في انتظار التحقق
                        </option>
                    </select>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md bg-white text-sm"
                    >
                        <option value="all">جميع الأدوار</option>
                        <option value="user">مستخدم</option>
                        <option value="dealer">تاجر</option>
                        <option value="moderator">مشرف</option>
                        <option value="admin">مدير</option>
                    </select>
                </div>
            </div>

            {/* Users table */}
            <div className="bg-white rounded-lg shadow border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    المستخدم
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    معلومات الاتصال
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    الدور
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    الحالة
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    تاريخ التسجيل
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    الإجراءات
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 font-semibold text-lg">
                                                        {user.first_name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="mr-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.first_name}{" "}
                                                        {user.last_name}
                                                    </div>
                                                    {user.dealer && (
                                                        <div className="text-xs text-gray-500">
                                                            {
                                                                user.dealer
                                                                    .company_name
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {user.email}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {user.phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.role === "dealer" ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    <Building className="w-3 h-3 ml-1" />
                                                    تاجر
                                                </span>
                                            ) : user.role === "admin" ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                    <Users className="w-3 h-3 ml-1" />
                                                    مدير
                                                </span>
                                            ) : user.role === "moderator" ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                                    <Filter className="w-3 h-3 ml-1" />
                                                    مشرف
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    <User className="w-3 h-3 ml-1" />
                                                    مستخدم
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {user.status === "active" ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3 ml-1" />
                                                    مفعل
                                                </span>
                                            ) : user.status === "rejected" ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    <XCircle className="w-3 h-3 ml-1" />
                                                    مرفوض
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                                                    <Clock className="w-3 h-3 ml-1" />
                                                    في الانتظار
                                                </span>
                                            )}

                                            {user.role === "dealer" &&
                                                user.dealer && (
                                                    <div className="mt-1">
                                                        {user.dealer
                                                            .is_active ? (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                <CheckCircle className="w-3 h-3 ml-1" />
                                                                تاجر مُصدّق
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                                                                <Clock className="w-3 h-3 ml-1" />
                                                                التحقق في
                                                                الانتظار
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center">
                                            {user.status === "pending" && (
                                                <div className="flex space-x-2 space-x-reverse">
                                                    <Button
                                                        onClick={() =>
                                                            handleApproveUser(
                                                                user.id
                                                            )
                                                        }
                                                        disabled={
                                                            processingUserId ===
                                                            user.id
                                                        }
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        {processingUserId ===
                                                        user.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Check className="w-4 h-4 ml-1" />
                                                                تفعيل
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        onClick={() =>
                                                            handleRejectUser(
                                                                user.id
                                                            )
                                                        }
                                                        disabled={
                                                            processingUserId ===
                                                            user.id
                                                        }
                                                        size="sm"
                                                        variant="destructive"
                                                    >
                                                        <X className="w-4 h-4 ml-1" />
                                                        رفض
                                                    </Button>
                                                </div>
                                            )}

                                           {(user.status === "active" || user.status === "rejected" ) &&( <div className="flex items-center">
                                                <ToggleSwitch
                                                    checked={user.is_active}
                                                    onChange={() => handleToggleStatus(user.id, user.is_active)}
                                                    disabled={processingUserId === user.id}
                                                />
                                                <span className={`mr-2 text-sm ${user.is_active ? 'text-green-600' : 'text-gray-600'}`}>
                                                    {user.is_active ? 'مفعل' : 'غير مفعل'}
                                                </span>
                                                {processingUserId === user.id && (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-500" />
                                                )}
                                            </div>)}

                                            {user.role === "dealer" &&
                                                user.dealer &&
                                                user.dealer.status ===
                                                    "pending" && (
                                                    <Button
                                                        onClick={() =>
                                                            handleApproveDealerVerification(
                                                                user.id
                                                            )
                                                        }
                                                        disabled={
                                                            processingUserId ===
                                                            user.id
                                                        }
                                                        size="sm"
                                                        className="bg-blue-600 hover:bg-blue-700 text-white mt-2"
                                                    >
                                                        {processingUserId ===
                                                        user.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="w-4 h-4 ml-1" />
                                                                تصديق التاجر
                                                            </>
                                                        )}
                                                    </Button>
                                                )}

                                            <Button
                                                onClick={() => handleOpenEditFrom(user.id)}
                                                variant="ghost"
                                                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                            >
                                                <Edit className="w-4 h-4 ml-2" />
                                                تعديل
                                            </Button>    
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                                className="border-blue-500 text-blue-500 hover:bg-blue-50"
                                            >
                                                <LoadingLink
                                                    href={`/admin/users/${user.id}`}
                                                >
                                                    <Eye className="w-4 h-4 ml-1" />
                                                    عرض 
                                                </LoadingLink>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-4 text-center text-gray-500"
                                    >
                                        لا توجد نتائج مطابقة للبحث
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                   
                </div>
                <Pagination
                    totalPages={totalCount}
                    page={currentPage}
                    onPageChange={(event,page) => {
                        setInitialLoad(true);
                        setCurrentPage(page)
                    }}
                />
            </div>
            <EditUserForm
                    user_id={processingUserId}
                    isOpen={showEditForm}
                    onClose={() => {setShowEditForm(false);  setProcessingUserId(null)}}
                    onUserUpdated={handleUserUpdated}
                />
        </div>
    );
}
