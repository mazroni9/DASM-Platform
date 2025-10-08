"use client";

import { useEffect, useState, useRef } from "react";
import LoadingLink from "@/components/LoadingLink";
import {
    Car,
    Search,
    Filter,
    CheckSquare,
    Square,
    MoreVertical,
    Eye,
    Edit3,
    Trash2,
    Play,
    Pause,
    Archive,
    RotateCcw,
    Loader2,
    ChevronDown,
    X,
    MoveVertical,
    ChevronRight,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { formatCurrency } from "@/utils/formatCurrency";

import Countdown from "@/components/Countdown";
import Pusher from 'pusher-js';
import Pagination from "@/components/OldPagination";
import InstantAuctionGrid, { InstantAuctionGridRef } from "@/components/auctions/InstantAuctionGrid";

interface FilterOptions {
    brand: string;
}

// تعريف دالة getCurrentAuctionType محلياً لتفادي مشاكل الاستيراد
function getAuctionStatus(auction: any): string {
    switch(auction){
        case "in_auction":
            return "جاري المزايدة";
        case "sold":
            return "تم البيع";
        case "expired":
            return "انتهى";
        default:
            return "غير محدد";
    }
}

async function isWithinAllowedTime(page: string): Promise<boolean> {
    const response = await api.get(`api/check-time?page=${page}`);
    console.log(response);
    return response.data.allowed;
}

export default function InstantAuctionPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [enumOptions, setEnumOptions] = useState<any>({});
    const [carsBrands,setCarsBrands]=useState<[]>(); // من كودك الأصلي
    const [carsTotal,setCarsTotal]=useState(0);
    const [isAllowed,setIsAllowed]=useState(true);
    const [cars, setCars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50; // or allow user to change it
    const [filters, setFilters] = useState<FilterOptions>({
        brand: "",
    });
    const [expandedRows, setExpandedRows] = useState<{ [key: number]: boolean; }>({});
    const { user, isLoggedIn } = useAuth();
    const router = useLoadingRouter();
    const gridRef = useRef<InstantAuctionGridRef>(null);

    // === إضافات Infinity Scroll (فقط) ===
    const scrollContainerRef = useRef<HTMLDivElement | null>(null); // الحاوية القابلة للتمرير
    const sentryRef = useRef<HTMLDivElement | null>(null);          // الحارس في الأسفل
    const loadingGateRef = useRef(false);                           // قفل لمنع الطلبات المتوازية
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    // Verify user is authenticated
    useEffect(() => {
        if (!isLoggedIn) {
            router.push("/auth/login?returnUrl=/dashboard/profile");
        }
    }, [isLoggedIn, router]);

    // تحديث الوقت كل ثانية
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Fetch user profile data
    useEffect(() => {
        async function fetchAuctions() {
            if (!isLoggedIn) return;
            try {
                loadingGateRef.current = true; // فتح القفل لمنع تعدد الطلبات

                //check
                setIsAllowed(await isWithinAllowedTime('instant_auction'));
                setIsAllowed(true);

                const params = new URLSearchParams();
                if (searchTerm) params.append("search", searchTerm);
                if (filters.brand) params.append("brand", filters.brand);

                const response = await api.get(
                    `/api/approved-auctions/live_instant?page=${currentPage}&pageSize=${pageSize}&${params.toString()}`,
                    {
                        headers: {
                            "Content-Type": "application/json; charset=UTF-8",
                            "Accept": "application/json; charset=UTF-8"
                        }
                    }
                );

                if (response.data.data || response.data.data) {
                    const carsData = response.data.data.data || response.data.data;
                    setCarsBrands(response.data.brands || []);
                    setTotalCount(response.data.data.total);
                    setCarsTotal(response.data.total);
                    // === تعديل سطر واحد: الإلحاق عند الصفحات التالية ===
                    setCars(prev => currentPage > 1 ? [...prev, ...carsData] : carsData);
                }
            } catch (error) {
                console.error("فشل تحميل بيانات المزاد الصامت", error);
                if (currentPage === 1) setCars([]); // صفحة أولى فاشلة → مصفوفة فارغة
                setError("تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.");
                setLoading(false);
            } finally {
                setLoading(false);
                loadingGateRef.current = false; // إغلاق القفل
            }
        }
        fetchAuctions();

        // Setup Pusher listener for real-time auction updates
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
        });

        const channel = pusher.subscribe('auction.instant');
        channel.bind('CarMovedBetweenAuctionsEvent', (data: any) => {
            console.log('Car moved to auction:', data);
            // Refresh auction data when cars are moved
            // إعادة ضبط إلى الصفحة الأولى لسلامة البيانات
            setCurrentPage(1);
            setCars([]);
            // Refresh the grid if it's available
            if (gridRef.current) {
                gridRef.current.refreshGrid();
            }
        });

        // Listen for auction status changes
        channel.bind('AuctionStatusChangedEvent', (data: any) => {
            console.log('Auction status changed:', data);
            // Refresh auction data when status changes
            setCurrentPage(1);
            setCars([]);
            // Refresh the grid if it's available
            if (gridRef.current) {
                gridRef.current.refreshGrid();
            }
            const statusLabels: any = {
                'live': 'مباشر',
                'ended': 'منتهي',
                'completed': 'مكتمل',
                'cancelled': 'ملغي',
                'failed': 'فاشل',
                'scheduled': 'مجدول'
            };
            const oldStatusLabel = statusLabels[data.old_status] || data.old_status;
            const newStatusLabel = statusLabels[data.new_status] || data.new_status;
            toast(`تم تغيير حالة مزاد ${data.car_make} ${data.car_model} من ${oldStatusLabel} إلى ${newStatusLabel}`);
        });

        // Cleanup function
        return () => {
            pusher.unsubscribe('auction.instant');
            pusher.disconnect();
        };
    }, [currentPage,searchTerm, filters, isLoggedIn]);

    // === مراقبة الحارس داخل الحاوية لتمكين Infinity Scroll (بدون حذف Pagination) ===
    useEffect(() => {
        const rootEl = scrollContainerRef.current;
        const sentryEl = sentryRef.current;
        if (!rootEl || !sentryEl) return;

        const io = new IntersectionObserver(
            (entries) => {
                const ent = entries[0];
                if (!ent.isIntersecting) return;
                if (loadingGateRef.current) return;
                if (!isAllowed) return;
                if (currentPage >= totalPages) return;

                // التقدم للصفحة التالية (سيستدعي fetchAuctions عبر useEffect الأصلي)
                setCurrentPage((p) => p + 1);
            },
            {
                root: rootEl,          // نراقب داخل الحاوية ذات overflow-auto
                rootMargin: "600px 0px", // ابدأ قبل النهاية
                threshold: 0,
            }
        );

        io.observe(sentryEl);
        return () => io.disconnect();
    }, [loading, currentPage, totalPages, isAllowed]);

    const filteredCars = cars.filter((car: any) => {
        // ملاحظة: في كودك الأصلي المنطق كان يعكس التصفية. أتركه كما هو احترامًا لطلبك "لا تغير"
        if (filters.brand == car.make) return false;
        return true;
    });

    return (
  <div className="p-2">
    <div className="flex justify-end mb-2">
      <LoadingLink
        href="/auctions"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 text-sm rounded-full border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
      >
        <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
        <span>العودة</span>
      </LoadingLink>
    </div>


    {/* Floating Market Time */}
    <div className="fixed top-20 right-4 z-50">
      <div className="bg-white text-gray-800 px-6 py-3 rounded-full shadow-xl border-2 border-gray-300 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">
            وقت السوق من 7 مساءً إلى 10 مساءً كل يوم
          </span>
        </div>
      </div>
    </div>


    {!loading && !error && cars.length === 0 && (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p>لا توجد سيارات متاحة في السوق الفوري حالياً</p>
      </div>
    )}

   
    {!isAllowed && (
      <div className="mt-4">
        <p>السوق ليس مفتوح الان سوف يفتح كما موضح في الوقت الأعلى</p>
      </div>
    )}

    {!loading && !error && cars.length > 0 && isAllowed && (
      <>
        {/* <Countdown page="instant_auction" /> */}
        <br />

        <InstantAuctionGrid
          ref={gridRef}
          cars={filteredCars}
          loading={loading}
          onRefresh={() => {
            setCurrentPage(1);
            setCars([]);
          }}
          onExport={() => {
            // Export functionality is handled within the grid component
            console.log('Export triggered');
          }}
          onDataUpdate={(updatedCars) => {
            // Handle data updates if needed
            console.log('Grid data updated:', updatedCars.length);
          }}
        />
      </>
    )}
  </div>
);
}
