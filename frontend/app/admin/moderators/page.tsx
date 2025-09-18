"use client";

import { useState, useEffect } from "react";
import {
    UserCheck,
    Search,
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    Loader2,
    Shield,
    MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import Link from "next/link";
import Switch from '@mui/material/Switch';
// Types
interface ModeratorData {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    is_active: boolean;
    created_at: string;
    email_verified_at: string | null;
}

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

export default function ModeratorsPage() {
    const [moderators, setModerators] = useState<ModeratorData[]>([]);
    const [filteredModerators, setFilteredModerators] = useState<ModeratorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        fetchModerators();
    }, []);

    useEffect(() => {
        filterModerators();
    }, [moderators, searchTerm, statusFilter]);

    const fetchModerators = async () => {
        try {
            const response = await api.get("/api/admin/moderators");

            if (response.data && response.data.status === "success") {
                console.log("Fetched moderators:", response.data);
                // Handle paginated data
                if (response.data.data && response.data.data.data) {
                    setModerators(response.data.data.data);
                    setFilteredModerators(response.data.data.data);
                } else {
                    setModerators(response.data.data);
                    setFilteredModerators(response.data.data);
                }
            }
        } catch (error) {
            console.error("Error fetching moderators:", error);
            toast.error("فشل في تحميل بيانات المشرفين");
            setModerators([]);
            setFilteredModerators([]);
        } finally {
            setLoading(false);
        }
    };

    const filterModerators = () => {
        if (!Array.isArray(moderators)) {
            console.warn("Moderators data is not an array:", moderators);
            setFilteredModerators([]);
            return;
        }

        let result = [...moderators];

        // Apply search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(
                (moderator) =>
                    moderator.first_name.toLowerCase().includes(searchLower) ||
                    moderator.last_name.toLowerCase().includes(searchLower) ||
                    moderator.email.toLowerCase().includes(searchLower) ||
                    moderator.phone.toLowerCase().includes(searchLower)
            );
        }

        // Apply status filter
        if (statusFilter !== "all") {
            if (statusFilter === "active") {
                result = result.filter((moderator) => moderator.is_active);
            } else if (statusFilter === "inactive") {
                result = result.filter((moderator) => !moderator.is_active);
            }
        }

        setFilteredModerators(result);
    };

    const handleToggleStatus = async (moderatorId: number, currentStatus: boolean) => {
        setProcessingId(moderatorId);
        try {
            const response = await api.patch(`/api/admin/moderators/${moderatorId}/status`, {
                is_active: !currentStatus,
            });

            if (response.data && response.data.status === "success") {
                toast.success(response.data.message);

                // Update moderator in the local state
                setModerators((prevModerators) =>
                    prevModerators.map((moderator) =>
                        moderator.id === moderatorId
                            ? { ...moderator, is_active: !currentStatus }
                            : moderator
                    )
                );
            }
        } catch (error) {
            console.error("Error toggling moderator status:", error);
            toast.error("فشل في تحديث حالة المشرف");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeleteModerator = async (moderatorId: number) => {
        if (!confirm("هل أنت متأكد من حذف هذا المشرف؟ لا يمكن التراجع عن هذا الإجراء.")) {
            return;
        }

        setDeletingId(moderatorId);
        try {
            const response = await api.delete(`/api/admin/moderators/${moderatorId}`);

            if (response.data && response.data.status === "success") {
                toast.success(response.data.message);

                // Remove moderator from the local state
                setModerators((prevModerators) =>
                    prevModerators.filter((moderator) => moderator.id !== moderatorId)
                );
            }
        } catch (error: any) {
            console.error("Error deleting moderator:", error);
            const errorMessage = error.response?.data?.message || "فشل في حذف المشرف";
            toast.error(errorMessage);
        } finally {
            setDeletingId(null);
        }
    };

    // Format date to a readable string
    const formatDate = (dateString: string) => {
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
                    إدارة المشرفين
                </h1>
                <div className="flex gap-2">
                    <Button onClick={fetchModerators} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 ml-2" />
                        تحديث
                    </Button>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                        <Link href="/admin/moderators/add">
                            <Plus className="w-4 h-4 ml-2" />
                            إضافة مشرف جديد
                        </Link>
                    </Button>
                </div>
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
                        placeholder="بحث بالاسم، البريد الإلكتروني، أو رقم الهاتف"
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
                        <option value="active">مفعل</option>
                        <option value="inactive">غير مفعل</option>
                    </select>
                </div>
            </div>

            {/* Moderators table */}
            <div className="bg-white rounded-lg shadow border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    الاسم
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    البريد الإلكتروني
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    رقم الهاتف
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
                                    تاريخ الإنشاء
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
                            {filteredModerators.length > 0 ? (
                                filteredModerators.map((moderator) => (
                                    <tr
                                        key={moderator.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                                                    <span className="text-orange-600 font-semibold text-lg">
                                                        {moderator.first_name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="mr-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {moderator.first_name}{" "}
                                                        {moderator.last_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex items-center">
                                                        <Shield className="w-3 h-3 ml-1" />
                                                        مشرف
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {moderator.email}
                                            </div>
                                            {moderator.email_verified_at ? (
                                                <div className="text-xs text-green-600">
                                                    ✓ مؤكد
                                                </div>
                                            ) : (
                                                <div className="text-xs text-red-600">
                                                    ✗ غير مؤكد
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {moderator.phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <ToggleSwitch
                                                    checked={moderator.is_active}
                                                    onChange={() => handleToggleStatus(moderator.id, moderator.is_active)}
                                                    disabled={processingId === moderator.id}
                                                />
                                                <span className={`mr-2 text-sm ${moderator.is_active ? 'text-green-600' : 'text-gray-600'}`}>
                                                    {moderator.is_active ? 'مفعل' : 'غير مفعل'}
                                                </span>
                                                {processingId === moderator.id && (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-500" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(moderator.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2 space-x-reverse">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                                >
                                                    <Link href={`/admin/moderators/edit/${moderator.id}`}>
                                                        <Edit className="w-4 h-4 ml-1" />
                                                        تعديل
                                                    </Link>
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeleteModerator(moderator.id)}
                                                    disabled={deletingId === moderator.id}
                                                    size="sm"
                                                    variant="destructive"
                                                >
                                                    {deletingId === moderator.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Trash2 className="w-4 h-4 ml-1" />
                                                            حذف
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-4 text-center text-gray-500"
                                    >
                                        {searchTerm || statusFilter !== "all"
                                            ? "لا توجد نتائج مطابقة للبحث"
                                            : "لا يوجد مشرفين مسجلين"}
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
