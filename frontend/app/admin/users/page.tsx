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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import Link from "next/link";

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
    dealer?: {
        id: number;
        is_active: boolean;
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

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        // Apply filters whenever filter settings or search term changes
        filterUsers();
    }, [users, searchTerm, statusFilter, roleFilter]);

    const fetchUsers = async () => {
        try {
            const response = await api.get("/api/admin/users");

            if (response.data && response.data.status === "success") {
                console.log("Fetched users:", response.data);
                // Check if data is paginated
                if (response.data.data && response.data.data.data) {
                    // Handle paginated data
                    setUsers(response.data.data.data);
                    setFilteredUsers(response.data.data.data);
                } else {
                    // Handle non-paginated data
                    setUsers(response.data.data);
                    setFilteredUsers(response.data.data);
                }
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("فشل في تحميل بيانات المستخدمين");

            // Set demo data for development
            const demoUsers = [
                {
                    id: 1,
                    first_name: "محمد",
                    last_name: "أحمد",
                    email: "mohammed@example.com",
                    phone: "0512345678",
                    role: "user",
                    is_active: false,
                    email_verified_at: "2025-05-20T10:30:00",
                    created_at: "2025-05-20T10:30:00",
                    dealer: null,
                },
                {
                    id: 2,
                    first_name: "فاطمة",
                    last_name: "الزهراء",
                    email: "fatima@example.com",
                    phone: "0523456789",
                    role: "user",
                    is_active: true,
                    email_verified_at: "2025-05-19T14:15:00",
                    created_at: "2025-05-19T14:15:00",
                    dealer: null,
                },
                {
                    id: 3,
                    first_name: "خالد",
                    last_name: "المنصور",
                    email: "khalid@example.com",
                    phone: "0534567890",
                    role: "dealer",
                    is_active: false,
                    email_verified_at: "2025-05-18T09:45:00",
                    created_at: "2025-05-18T09:45:00",
                    dealer: {
                        id: 1,
                        is_active: false,
                        company_name: "شركة المنصور للسيارات",
                    },
                },
                {
                    id: 4,
                    first_name: "سارة",
                    last_name: "العتيبي",
                    email: "sarah@example.com",
                    phone: "0545678901",
                    role: "dealer",
                    is_active: true,
                    email_verified_at: "2025-05-17T11:20:00",
                    created_at: "2025-05-17T11:20:00",
                    dealer: {
                        id: 2,
                        is_active: true,
                        company_name: "معرض العتيبي",
                    },
                },
            ];

            setUsers(demoUsers);
            setFilteredUsers(demoUsers);
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

        // Apply status filter
        if (statusFilter !== "all") {
            if (statusFilter === "pending") {
                result = result.filter((user) => !user.is_active);
            } else if (statusFilter === "active") {
                result = result.filter((user) => user.is_active);
            } else if (statusFilter === "dealer_pending") {
                result = result.filter(
                    (user) =>
                        user.role === "dealer" &&
                        user.dealer &&
                        user.dealer.is_active === false
                );
            }
        }

        // Apply role filter
        if (roleFilter !== "all") {
            result = result.filter((user) => user.role === roleFilter);
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
                        user.id === userId ? { ...user, is_active: true } : user
                    )
                );
            }
        } catch (error) {
            console.error("Error approving user:", error);
            toast.error("فشل في تفعيل المستخدم");

            // For development, update the state anyway
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === userId ? { ...user, is_active: true } : user
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

                // Update user in the local state (in a real app, you might want to remove them or mark as rejected)
                // For this example, we'll just keep them with is_active=false
            }
        } catch (error) {
            console.error("Error rejecting user:", error);
            toast.error("فشل في رفض المستخدم");
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

                // Update dealer status in the local state using the new is_active field
                setUsers((prevUsers) =>
                    prevUsers.map((user) =>
                        user.id === userId && user.dealer
                            ? {
                                  ...user,
                                  dealer: {
                                      ...user.dealer,
                                      is_active: true,
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
                              dealer: {
                                  ...user.dealer,
                                  is_active: true,
                              },
                          }
                        : user
                )
            );
        } finally {
            setProcessingUserId(null);
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
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <span className="mr-2 text-xl">
                    جاري تحميل بيانات المستخدمين...
                </span>
            </div>
        );
    }

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
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    <User className="w-3 h-3 ml-1" />
                                                    مستخدم
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {user.is_active ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3 ml-1" />
                                                    مفعل
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {!user.is_active && (
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

                                            {user.is_active && (
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
                                                    variant="outline"
                                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                                >
                                                    {processingUserId ===
                                                    user.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <X className="w-4 h-4 ml-1" />
                                                            إلغاء التفعيل
                                                        </>
                                                    )}
                                                </Button>
                                            )}

                                            {user.role === "dealer" &&
                                                user.dealer &&
                                                !user.dealer.is_active && (
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
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                                className="mt-2"
                                            >
                                                <Link
                                                    href={`/admin/users/${user.id}`}
                                                >
                                                    عرض التفاصيل
                                                </Link>
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
            </div>
        </div>
    );
}
