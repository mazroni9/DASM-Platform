'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import LoadingLink from '@/components/LoadingLink';
import { 
    Trash2, 
    Edit, 
    Plus, 
    Calendar, 
    Users, 
    Eye, 
    RefreshCw,
    Search,
    Filter,
    Download,
    Clock,
    Zap,
    Volume2,
    MoreVertical,
    AlertTriangle,
    CheckCircle,
    XCircle,
    PlayCircle,
    ChevronDown,
    Sparkles
} from 'lucide-react';

import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AuctionSession {
  id: number;
  name: string;
  session_date: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  type: 'live' | 'instant' | 'silent';
  auctions_count: number;
  created_at: string;
  updated_at: string;
}

const statusColors = {
  scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusLabels = {
  scheduled: 'مجدولة',
  active: 'نشطة',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
};

const typeLabels = {
  live: 'مباشر',
  instant: 'فوري',
  silent: 'صامت',
};

const typeIcons = {
  live: Volume2,
  instant: Zap,
  silent: Clock,
};

export default function SessionsListPage() {
  const [sessions, setSessions] = useState<AuctionSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<AuctionSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/sessions');
      if (response.data.success) {
        setSessions(response.data.data);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء جلب الجلسات');
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!sessionToDelete) return;

    try {
      const response = await api.delete(`/api/admin/sessions/${sessionToDelete.id}`);
      if (response.data.success) {
        toast.success('تم حذف الجلسة بنجاح');
        fetchSessions();
        setDeleteModalOpen(false);
        setSessionToDelete(null);
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('حدث خطأ أثناء حذف الجلسة');
      }
    }
  };

  const openDeleteModal = (session: AuctionSession) => {
    setSessionToDelete(session);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSessionToDelete(null);
  };

  // Filter sessions based on search and filters
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    const matchesType = typeFilter === 'all' || session.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate statistics
  const stats = {
    total: sessions.length,
    scheduled: sessions.filter(s => s.status === 'scheduled').length,
    active: sessions.filter(s => s.status === 'active').length,
    completed: sessions.filter(s => s.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            إدارة جلسات المزاد
          </h1>
          <p className="text-foreground/70 mt-2">
            إدارة وتنظيم جلسات المزادات المختلفة في النظام
          </p>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <button 
            onClick={fetchSessions}
            className="bg-card border border-border text-foreground/80 hover:bg-border hover:text-foreground transition-all duration-300 px-4 py-2 rounded-xl flex items-center"
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
          <LoadingLink
            href="/admin/sessions/new"
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة جلسة جديدة
          </LoadingLink>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground/70 text-sm">إجمالي الجلسات</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground/70 text-sm">جلسات مجدولة</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.scheduled}</p>
            </div>
            <div className="bg-amber-500/10 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground/70 text-sm">جلسات نشطة</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.active}</p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-xl">
              <PlayCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground/70 text-sm">جلسات مكتملة</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.completed}</p>
            </div>
            <div className="bg-border p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-foreground/70" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search Section */}
      <div className="bg-card rounded-xl p-6 border border-border shadow-lg mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search Input */}
          <div className="relative flex-grow">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/70 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث باسم الجلسة..."
              className="w-full bg-background/50 border border-border rounded-xl py-2 pr-10 pl-4 text-foreground placeholder-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">كل الحالات</option>
              <option value="scheduled">مجدولة</option>
              <option value="active">نشطة</option>
              <option value="completed">مكتملة</option>
              <option value="cancelled">ملغاة</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="p-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">كل الأنواع</option>
              <option value="live">مباشر</option>
              <option value="instant">فوري</option>
              <option value="silent">صامت</option>
            </select>

            <button className="bg-background border border-border text-foreground/80 hover:bg-border hover:text-foreground transition-all duration-300 px-3 py-2 rounded-lg flex items-center text-sm">
              <Filter className="w-4 h-4 ml-2" />
              المزيد من الفلاتر
              <ChevronDown className="w-4 h-4 mr-2" />
            </button>

            <button className="bg-background border border-border text-foreground/80 hover:bg-border hover:text-foreground transition-all duration-300 px-3 py-2 rounded-lg flex items-center text-sm">
              <Download className="w-4 h-4 ml-2" />
              تصدير التقرير
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">
              قائمة جلسات المزاد ({filteredSessions.length})
            </h2>
            <div className="text-sm text-foreground/70">
              إجمالي {sessions.length} جلسة
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-foreground/70">جاري تحميل الجلسات...</p>
            </div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Calendar className="w-16 h-16 text-foreground/50 mb-4" />
            <p className="text-foreground/70 text-lg mb-2">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? "لا توجد نتائج مطابقة للبحث"
                : "لا توجد جلسات مزاد حتى الآن"
              }
            </p>
            <p className="text-foreground/50 text-sm mb-6">
              {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && 
               "ابدأ بإضافة جلسات مزاد جديدة إلى النظام"}
            </p>
            {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
              <LoadingLink
                href="/admin/sessions/new"
                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة أول جلسة
              </LoadingLink>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-border/50 border-b border-border">
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">الجلسة</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">التاريخ</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">الحالة</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">النوع</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">عدد المزادات</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSessions.map((session) => {
                  const TypeIcon = typeIcons[session.type];
                  return (
                    <tr
                      key={session.id}
                      className="hover:bg-border/50 transition-colors duration-200 group"
                    >
                      {/* Session Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="bg-primary p-2 rounded-xl">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-foreground">
                              {session.name}
                            </div>
                            <div className="text-xs text-foreground/70 mt-1">
                              ID: {session.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-foreground/80">
                        {format(new Date(session.session_date), 'dd MMMM yyyy', { locale: ar })}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[session.status]}`}>
                          {session.status === 'active' && <PlayCircle className="w-3 h-3 ml-1" />}
                          {session.status === 'scheduled' && <Clock className="w-3 h-3 ml-1" />}
                          {session.status === 'completed' && <CheckCircle className="w-3 h-3 ml-1" />}
                          {session.status === 'cancelled' && <XCircle className="w-3 h-3 ml-1" />}
                          {statusLabels[session.status]}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-foreground/80">
                          <TypeIcon className="w-4 h-4 ml-1" />
                          {typeLabels[session.type]}
                        </div>
                      </td>

                      {/* Auctions Count */}
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-primary">
                          <Users className="w-4 h-4 ml-1" />
                          {session.auctions_count}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <LoadingLink 
                            href={`/admin/sessions/view/${session.id}`}
                            className="text-primary hover:text-primary/80 hover:bg-primary/10 p-2 rounded-lg transition-all duration-300"
                          >
                            <Eye size={16} />
                          </LoadingLink>

                          <LoadingLink
                            href={`/admin/sessions/edit/${session.id}`}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-2 rounded-lg transition-all duration-300"
                          >
                            <Edit size={16} />
                          </LoadingLink>

                          <button
                            onClick={() => openDeleteModal(session)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={session.auctions_count > 0}
                            title={session.auctions_count > 0 ? "لا يمكن حذف جلسة تحتوي على مزادات" : "حذف الجلسة"}
                          >
                            <Trash2 size={16} />
                          </button>

                          <button className="text-foreground/70 hover:text-foreground hover:bg-border/50 p-2 rounded-lg transition-all duration-300">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && sessionToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className="bg-red-500/20 p-2 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">تأكيد حذف الجلسة</h2>
                <p className="text-foreground/70 text-sm">هل أنت متأكد من حذف هذه الجلسة؟</p>
              </div>
            </div>
            
            <div className="bg-background/50 rounded-xl p-4 mb-6">
              <div className="text-foreground font-medium">{sessionToDelete.name}</div>
              <div className="text-foreground/70 text-sm mt-1">
                التاريخ: {format(new Date(sessionToDelete.session_date), 'dd MMMM yyyy', { locale: ar })}
              </div>
              <div className="text-foreground/70 text-sm">
                النوع: {typeLabels[sessionToDelete.type]}
              </div>
              {sessionToDelete.auctions_count > 0 && (
                <div className="text-amber-400 text-sm mt-2 flex items-center">
                  <AlertTriangle className="w-3 h-3 ml-1" />
                  تحتوي على {sessionToDelete.auctions_count} مزاد
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 space-x-reverse">
              <button
                onClick={closeDeleteModal}
                className="bg-border border border-border text-foreground/80 hover:bg-border/80 hover:text-foreground transition-all duration-300 px-4 py-2 rounded-xl"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                disabled={sessionToDelete.auctions_count > 0}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف الجلسة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}