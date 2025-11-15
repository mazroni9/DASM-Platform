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
    Users,
    Filter,
    Download,
    Eye,
    Mail,
    Phone,
    Calendar,
    Crown,
    BadgeCheck,
    XCircle,
    ChevronDown
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
                    color: '#22d3ee', // cyan-400
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#22d3ee', // cyan-400
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
    const [statusFilter, setStatusFilter] = useState("all");
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
            setLoading(true);
            const response = await api.get("/api/admin/moderators");

            if (response.data && response.data.status === "success") {
                console.log("Fetched moderators:", response.data);
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
        <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                        إدارة المشرفين
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        إدارة وتنظيم حسابات المشرفين في النظام
                    </p>
                </div>
                
                <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
                    <Button 
                        onClick={fetchModerators} 
                        variant="outline" 
                        size="sm"
                    >
                        <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                        تحديث البيانات
                    </Button>
                    <Button 
                        asChild 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        <Link href="/admin/moderators/add">
                            <Plus className="w-4 h-4 ml-2" />
                            إضافة مشرف جديد
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm">إجمالي المشرفين</p>
                            <p className="text-2xl font-bold text-foreground mt-1">{moderators.length}</p>
                        </div>
                        <div className="bg-blue-500/10 p-3 rounded-xl">
                            <Users className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm">المشرفين النشطين</p>
                            <p className="text-2xl font-bold text-foreground mt-1">
                                {moderators.filter(m => m.is_active).length}
                            </p>
                        </div>
                        <div className="bg-green-500/10 p-3 rounded-xl">
                            <UserCheck className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm">المشرفين المعطلين</p>
                            <p className="text-2xl font-bold text-foreground mt-1">
                                {moderators.filter(m => !m.is_active).length}
                            </p>
                        </div>
                        <div className="bg-red-500/10 p-3 rounded-xl">
                            <XCircle className="w-6 h-6 text-red-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm">البريد المؤكد</p>
                            <p className="text-2xl font-bold text-foreground mt-1">
                                {moderators.filter(m => m.email_verified_at).length}
                            </p>
                        </div>
                        <div className="bg-amber-500/10 p-3 rounded-xl">
                            <BadgeCheck className="w-6 h-6 text-amber-400" />
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
                            placeholder="ابحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
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
                            <option value="active">مفعل</option>
                            <option value="inactive">غير مفعل</option>
                        </select>

                        <Button 
                            variant="outline" 
                            size="sm"
                        >
                            <Filter className="w-4 h-4 ml-2" />
                            المزيد من الفلاتر
                            <ChevronDown className="w-4 h-4 mr-2" />
                        </Button>

                        <Button 
                            variant="outline" 
                            size="sm"
                        >
                            <Download className="w-4 h-4 ml-2" />
                            تصدير التقرير
                        </Button>
                    </div>
                </div>
            </div>

            {/* Moderators Table */}
            <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
                {/* Table Header */}
                <div className="p-6 border-b border-border">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-foreground">
                            قائمة المشرفين ({filteredModerators.length})
                        </h2>
                        <div className="text-sm text-muted-foreground">
                            إجمالي {moderators.length} مشرف
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted border-b border-border">
                                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">المشرف</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">معلومات الاتصال</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">الحالة</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">تاريخ الإنشاء</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredModerators.length > 0 ? (
                                filteredModerators.map((moderator) => (
                                    <tr
                                        key={moderator.id}
                                        className="hover:bg-muted/50 transition-colors duration-200 group"
                                    >
                                        {/* Moderator Info */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="bg-primary p-2 rounded-xl">
                                                    <span className="text-primary-foreground font-semibold text-sm">
                                                        {moderator.first_name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="mr-4">
                                                    <div className="text-sm font-medium text-foreground">
                                                        {moderator.first_name} {moderator.last_name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center mt-1">
                                                        <Shield className="w-3 h-3 ml-1" />
                                                        مشرف
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contact Info */}
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <div className="text-sm text-foreground flex items-center">
                                                    <Mail className="w-3 h-3 ml-1 text-muted-foreground" />
                                                    {moderator.email}
                                                </div>
                                                <div className="text-sm text-muted-foreground flex items-center">
                                                    <Phone className="w-3 h-3 ml-1" />
                                                    {moderator.phone}
                                                </div>
                                                {moderator.email_verified_at ? (
                                                    <div className="text-xs text-green-400 flex items-center">
                                                        <BadgeCheck className="w-3 h-3 ml-1" />
                                                        البريد مؤكد
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-red-400 flex items-center">
                                                        <XCircle className="w-3 h-3 ml-1" />
                                                        البريد غير مؤكد
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <ToggleSwitch
                                                    checked={moderator.is_active}
                                                    onChange={() => handleToggleStatus(moderator.id, moderator.is_active)}
                                                    disabled={processingId === moderator.id}
                                                />
                                                <div className="mr-3">
                                                    <span className={`text-sm block ${moderator.is_active ? 'text-green-400' : 'text-gray-400'}`}>
                                                        {moderator.is_active ? 'مفعل' : 'غير مفعل'}
                                                    </span>
                                                    {processingId === moderator.id && (
                                                        <Loader2 className="w-3 h-3 mt-1 animate-spin text-cyan-500" />
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Registration Date */}
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            <div className="flex items-center">
                                                <Calendar className="w-3 h-3 ml-1" />
                                                {formatDate(moderator.created_at)}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className="px-3"
                                                >
                                                    <Link href={`/admin/moderators/${moderator.id}`}>
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                </Button>

                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className="px-3"
                                                >
                                                    <Link href={`/admin/moderators/edit/${moderator.id}`}>
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                </Button>

                                                <Button
                                                    onClick={() => handleDeleteModerator(moderator.id)}
                                                    disabled={deletingId === moderator.id}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="px-3"
                                                >
                                                    {deletingId === moderator.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="px-3"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <Shield className="w-16 h-16 text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground text-lg mb-2">
                                                {searchTerm || statusFilter !== "all"
                                                    ? "لا توجد نتائج مطابقة للبحث"
                                                    : "لا يوجد مشرفين مسجلين"
                                                }
                                            </p>
                                            <p className="text-muted-foreground text-sm mb-6">
                                                {!searchTerm && statusFilter === "all" && "ابدأ بإضافة مشرفين جدد إلى النظام"}
                                            </p>
                                            {!searchTerm && statusFilter === "all" && (
                                                <Button 
                                                    asChild 
                                                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                                >
                                                    <Link href="/admin/moderators/add">
                                                        <Plus className="w-4 h-4 ml-2" />
                                                        إضافة مشرف جديد
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Stats Footer */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-card rounded-lg p-4 text-center">
                    <div className="text-primary font-semibold">{moderators.length}</div>
                    <div className="text-muted-foreground">إجمالي المشرفين</div>
                </div>
                <div className="bg-card rounded-lg p-4 text-center">
                    <div className="text-green-400 font-semibold">
                        {moderators.filter(m => m.is_active).length}
                    </div>
                    <div className="text-muted-foreground">مشرفين نشطين</div>
                </div>
                <div className="bg-card rounded-lg p-4 text-center">
                    <div className="text-amber-400 font-semibold">
                        {moderators.filter(m => m.email_verified_at).length}
                    </div>
                    <div className="text-muted-foreground">بريد مؤكد</div>
                </div>
            </div>
        </div>
    );
}