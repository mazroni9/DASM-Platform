'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  CheckCircle,
  Loader2,
  Route,
  Car as CarIcon,
  Edit,
  Eye,
  Plus,
  Filter,
  Search,
  Gauge,
  Settings,
} from 'lucide-react';

import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Pagination } from 'react-laravel-paginex';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import LoadingLink from "@/components/LoadingLink";
import { Car } from "@/types/types";

type LaravelPaginator<T> = {
  current_page: number;
  data: T[];
  from?: number | null;
  last_page: number;
  per_page: number;
  to?: number | null;
  total: number;
  links?: any[];
};

export default function MyCarsPage() {
  const [loading, setLoading] = useState(true);
  const [paginationData, setPagination] = useState<LaravelPaginator<Car> | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { isLoggedIn } = useAuth();
  const router = useLoadingRouter();

  const options = {
    containerClass: "pagination-container",
    prevButtonClass: "prev-button-class",
    nextButtonText: "التالي",
    prevButtonText: "السابق"
  };

  // ✅ status موحّد للواجهة: يجمع بين status و auction_status
  const getUiStatus = useCallback((car: any) => {
    const raw = (car?.status ?? car?.auction_status ?? '').toString().toLowerCase();

    // تطبيع شائع حسب منطق الباك (auction_status)
    // active => في المزاد
    if (raw === 'active') return 'auction';

    // scheduled ممكن تعتبرها pending (بانتظار/مجدولة)
    if (raw === 'scheduled') return 'pending';

    // available لو موجودة عندك اعتبرها pending/processing حسب نظامكم
    if (raw === 'available') return 'pending';

    return raw || 'unknown';
  }, []);

  const loadCars = useCallback(async (page = 1) => {
    try {
      const response = await api.get(`/api/cars?page=${page}`);

      if (response?.data?.status !== 'success') {
        throw new Error('Bad response');
      }

      const paginator: LaravelPaginator<Car> | Car[] = response.data.data;

      // ✅ في باكك الحالي: data = paginator
      if (paginator && typeof paginator === 'object' && 'data' in paginator) {
        setPagination(paginator as LaravelPaginator<Car>);
        setCars((paginator as LaravelPaginator<Car>).data ?? []);
      } else {
        // fallback احتياطي لو رجعت array مباشرة
        setPagination(null);
        setCars(Array.isArray(paginator) ? paginator : []);
      }
    } catch (error: any) {
      // لو 401 عادة معناه session/token راح
      if (error?.response?.status === 401) {
        router.push("/auth/login?returnUrl=/dashboard/mycars");
        return;
      }

      console.error("Error fetching cars:", error);
      toast.error("حدث خطأ أثناء تحميل بيانات السيارات");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Verify user is authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/dashboard/mycars");
    }
  }, [isLoggedIn, router]);

  // Fetch user cars data (page 1)
  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    loadCars(1);
  }, [isLoggedIn, loadCars]);

  const getData = async (p: any) => {
    const page = typeof p === 'number' ? p : (p?.page ?? 1);
    setLoading(true);
    await loadCars(page);
  };

  // دالة حالة السيارة (UI)
  const getStatusLabel = (car: any) => {
    const status = getUiStatus(car);

    const statusMap: Record<string, { text: string; color: string; bg: string; border: string }> = {
      pending: { text: 'بانتظار الموافقة', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
      processing: { text: 'تحت المعالجة', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
      approved: { text: 'تم الاعتماد', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
      rejected: { text: 'مرفوضة', color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30' },
      auction: { text: 'في المزاد', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
      sold: { text: 'مباعة', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
      withdrawn: { text: 'مسحوبة', color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30' },
      archived: { text: 'مؤرشفة', color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30' },
      unknown: { text: 'غير معروف', color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30' },
    };

    return statusMap[status] || statusMap.unknown;
  };

  // فلترة السيارات (على بيانات الصفحة الحالية فقط)
  const filteredCars = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return cars.filter((car: any) => {
      const matchesSearch =
        (car.make?.toLowerCase().includes(term) ?? false) ||
        (car.model?.toLowerCase().includes(term) ?? false);

      const uiStatus = getUiStatus(car);
      const matchesStatus = statusFilter === 'all' || uiStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [cars, searchTerm, statusFilter, getUiStatus]);

  // إحصائيات سريعة (على بيانات الصفحة الحالية)
  const stats = useMemo(() => {
    return {
      total: paginationData?.total ?? cars.length,
      inAuction: cars.filter((car: any) => getUiStatus(car) === 'auction').length,
      pending: cars.filter((car: any) => getUiStatus(car) === 'pending').length,
      approved: cars.filter((car: any) => getUiStatus(car) === 'approved').length,
    };
  }, [cars, paginationData, getUiStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Loader2 className="absolute inset-0 w-full h-full animate-spin text-purple-500" />
            <div className="absolute inset-0 w-full h-full rounded-full border-4 border-transparent border-t-purple-500 animate-spin opacity-60"></div>
          </div>
          <p className="text-lg text-gray-400 font-medium">جاري تحميل سياراتك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card backdrop-blur-2xl border border-border rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary rounded-xl">
                <CarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  سياراتي <span className="text-primary">({stats.total})</span>
                </h1>
                <p className="text-foreground/70 text-sm mt-1">إدارة وعرض جميع سياراتك المعروضة</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-background/40 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-blue-500/20 rounded">
                    <CarIcon className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-xs text-foreground/70">المجموع</span>
                </div>
                <p className="text-lg font-bold text-foreground mt-1">{stats.total}</p>
              </div>

              <div className="bg-background/40 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-purple-500/20 rounded">
                    <Gauge className="w-3 h-3 text-purple-400" />
                  </div>
                  <span className="text-xs text-foreground/70">في المزاد</span>
                </div>
                <p className="text-lg font-bold text-purple-400 mt-1">{stats.inAuction}</p>
              </div>

              <div className="bg-background/40 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-amber-500/20 rounded">
                    <Loader2 className="w-3 h-3 text-amber-400" />
                  </div>
                  <span className="text-xs text-foreground/70">بانتظار الموافقة</span>
                </div>
                <p className="text-lg font-bold text-amber-400 mt-1">{stats.pending}</p>
              </div>

              <div className="bg-background/40 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-emerald-500/20 rounded">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-xs text-foreground/70">معتمدة</span>
                </div>
                <p className="text-lg font-bold text-emerald-400 mt-1">{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <LoadingLink
              href="/add/Car"
              className="flex items-center gap-2 px-4 py-3 bg-secondary text-white rounded-xl border border-secondary/30 hover:scale-105 transition-all duration-300 group"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              <span className="font-medium">إضافة سيارة جديدة</span>
            </LoadingLink>
          </div>
        </div>
      </motion.div>

      {/* Filters and Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/70" />
              <input
                type="text"
                placeholder="ابحث عن سيارة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background/50 border border-border rounded-xl pl-4 pr-10 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">بانتظار الموافقة</option>
              <option value="processing">تحت المعالجة</option>
              <option value="approved">معتمدة</option>
              <option value="auction">في المزاد</option>
              <option value="sold">مباعة</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <Filter className="w-4 h-4" />
            <span>عرض {filteredCars.length} من {cars.length} سيارة</span>
          </div>
        </div>
      </motion.div>

      {/* Cars Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {filteredCars.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="p-4 bg-card/30 rounded-2xl border border-border max-w-md mx-auto">
              <CarIcon className="w-12 h-12 text-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground/70 mb-2">لا توجد سيارات</h3>
              <p className="text-foreground/50 text-sm mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'لم نتمكن من العثور على سيارات تطابق معايير البحث'
                  : 'لم تقم بإضافة أي سيارات بعد'
                }
              </p>
              {(searchTerm || statusFilter !== 'all') ? (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="px-4 py-2 bg-primary/20 text-primary rounded-lg border border-primary/30 hover:bg-primary/30 transition-colors"
                >
                  إعادة تعيين الفلتر
                </button>
              ) : (
                <LoadingLink
                  href="/add/Car"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:scale-105 transition-all duration-300"
                >
                  <Plus className="w-4 h-4" />
                  إضافة أول سيارة
                </LoadingLink>
              )}
            </div>
          </div>
        ) : (
          filteredCars.map((car: any, index: number) => {
            const statusInfo = getStatusLabel(car);
            const isApproved = Boolean(car?.auctions?.[0]?.control_room_approved);

            const uiStatus = getUiStatus(car);
            const canEdit = uiStatus === 'pending' || uiStatus === 'processing';

            return (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => router.push(`/dashboard/mycars/${car.id}`)}
              >
                <div className="bg-card backdrop-blur-xl border border-border rounded-2xl overflow-hidden hover:border-border/70 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  {/* Car Image */}
                  <div className="relative h-48 bg-background overflow-hidden">
                    <img
                      src={
                        (Array.isArray(car.images) && car.images.length > 0)
                          ? car.images[0]
                          : "https://cdn.pixabay.com/photo/2012/05/29/00/43/car-49278_1280.jpg"
                      }
                      alt={`${car.make ?? ''} ${car.year ?? ''}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://cdn.pixabay.com/photo/2012/05/29/00/43/car-49278_1280.jpg";
                      }}
                    />

                    {/* Status Badge */}
                    <div
                      className={cn(
                        "absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm",
                        statusInfo.bg,
                        statusInfo.border,
                        statusInfo.color
                      )}
                    >
                      {statusInfo.text}
                    </div>

                    {/* Approval Badge */}
                    {isApproved && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-500 text-white rounded-full text-xs font-medium border border-emerald-500/30 backdrop-blur-sm">
                        <CheckCircle className="w-3 h-3 inline ml-1" />
                        معتمدة
                      </div>
                    )}
                  </div>

                  {/* Car Details */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-foreground/80 transition-colors">
                        {car.make} {car.model} - {car.year}
                      </h3>
                      <div className="text-2xl font-bold text-secondary">
                        {car.evaluation_price?.toLocaleString?.('ar-EG') ?? car.evaluation_price}
                      </div>
                    </div>

                    {/* Car Specs */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-foreground/70">
                        <Gauge className="w-4 h-4 text-blue-400" />
                        <span>العداد: {car.odometer} كم</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground/70">
                        <Settings className="w-4 h-4 text-purple-400" />
                        <span>المحرك: {car.engine}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground/70">
                        <Route className="w-4 h-4 text-emerald-400" />
                        <span>القير: {car.transmission}</span>
                      </div>
                    </div>

                    {/* Description */}
                    {car.description && (
                      <p className="text-sm text-foreground/50 mb-4 line-clamp-2 leading-relaxed">
                        {car.description}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-border">
                      {canEdit && (
                        <LoadingLink
                          href={`/dashboard/mycars/${car.id}?edit=1`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 hover:bg-amber-500/30 transition-all duration-300 group/edit"
                        >
                          <Edit className="w-3 h-3 transition-transform group-hover/edit:scale-110" />
                          <span className="text-xs font-medium">تعديل</span>
                        </LoadingLink>
                      )}

                      <LoadingLink
                        target="_blank"
                        href={`/carDetails/${car.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg border border-primary/30 hover:bg-primary/30 transition-all duration-300 group/view"
                      >
                        <Eye className="w-3 h-3 transition-transform group-hover/view:scale-110" />
                        <span className="text-xs font-medium">عرض</span>
                      </LoadingLink>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Pagination */}
      {paginationData && (paginationData.last_page ?? 1) > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center"
        >
          <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-4">
            <Pagination
              data={paginationData as any}
              options={options}
              changePage={getData}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
