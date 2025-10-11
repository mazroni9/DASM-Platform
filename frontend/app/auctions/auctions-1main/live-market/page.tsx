"use client";

import React, { useCallback, useEffect, useMemo, useState, ReactNode } from "react";
import {
  ChevronRight,
  Clock,
  Radio,
  AlertCircle,
  Search,
  Eye,
  Users,
  TrendingUp,
  Loader2,
  Bell,
} from "lucide-react";

// ===================== أدوات مساعدة/بدائل خفيفة للتجريب =====================
// ملاحظة: هذه بدائل مبسّطة حتى تعمل الصفحة ببيانات تجريبية دون أي API خارجي.
// عند الدمج مع مشروعك الحقيقي، استبدلها بالمكوّنات/الدوال الأصلية لديك.

const toast = {
  success: (msg: string) => {
    if (typeof window !== "undefined") alert("✅ " + msg);
    console.log("toast.success:", msg);
  },
  error: (msg: string) => {
    if (typeof window !== "undefined") alert("❌ " + msg);
    console.error("toast.error:", msg);
  },
  custom: (msg: any) => console.log("toast.custom:", msg),
};

const LoadingLink: React.FC<{
  href: string;
  className?: string;
  target?: string;
  children: ReactNode;
}> = ({ href, className, target, children }) => (
  <a href={href} className={className} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}>
    {children}
  </a>
);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(value || 0);

const useAuth = () => {
  // مستخدم وهمي لأغراض التجربة فقط.
  return { user: { id: 42, name: "Demo User" }, isLoggedIn: true } as const;
};

const useLoadingRouter = () => ({
  push: (url: string) => {
    console.log("[Router] navigate →", url);
  },
});

const BidTimer: React.FC<{ showLabel?: boolean; showProgress?: boolean } & React.ComponentProps<"div">> = ({ showLabel = false }) => {
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");
  const ss = now.getSeconds().toString().padStart(2, "0");
  return (
    <span className="font-mono">
      {showLabel && <span className="mr-1 text-xs opacity-70">الوقت</span>}
      {hh}:{mm}:{ss}
    </span>
  );
};

const BidForm: React.FC<{
  auction_id: number;
  bid_amount: number;
  onSuccess?: () => void;
}> = ({ auction_id, bid_amount, onSuccess }) => {
  const [amount, setAmount] = useState<number>(bid_amount + 1000);
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // محاكاة إرسال المزايدة
    setTimeout(() => {
      setSending(false);
      toast.success(`تم تقديم مزايدة على المزاد #${auction_id} بقيمة ${formatCurrency(amount)}`);
      onSuccess?.();
    }, 800);
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-3">
      <input
        type="number"
        min={bid_amount + 1}
        value={amount}
        onChange={(e) => setAmount(parseInt(e.target.value || "0", 10))}
        className="flex-1 px-3 py-2 rounded-lg bg-gray-900/70 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-600/40 text-gray-100"
      />
      <button
        type="submit"
        disabled={sending}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 disabled:opacity-60"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "زايد"}
      </button>
    </form>
  );
};

const BidNotifications: React.FC = () => (
  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/60 border border-gray-700/60">
    <div className="relative">
      <Bell className="w-4 h-4" />
      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
    </div>
    <span className="text-sm text-gray-300">التنبيهات</span>
  </div>
);

// ===================== الأنواع TypeScript =====================
interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  odometer: string;
  condition: string;
  vin: string;
  plate?: string; // مضافة للتجريب والبحث
  user_id?: number;
  dealer?: { user_id: number } | null;
}

interface BidItem {
  id: number;
  bidder_id: number;
  bidder_name: string;
  bid_amount: number;
  created_at: string; // ISO
}

interface LiveAuctionItem {
  id: number;
  car: Car;
  min_price: number;
  max_price: number;
  current_bid: number;
  opening_price: number;
  viewers: number;
  bids: BidItem[];
}

// ===================== منطق الوقت/النوع =====================
function isWithinAllowedTime(_page: string): boolean {
  // للعرض فقط: يمكن فتح السوق دائمًا. إن أردت الالتزام بالوقت، أزل التعليق أدناه.
  return true;
  // const h = new Date().getHours();
  // return h >= 16 && h < 19; // من 4 إلى 7 مساءً
}

function getCurrentAuctionType(time: Date = new Date()): { label: string; isLive: boolean } {
  const h = time.getHours();
  if (h >= 16 && h < 19) return { label: "الحراج المباشر", isLive: true };
  if (h >= 19 && h < 22) return { label: "السوق الفوري المباشر", isLive: true };
  return { label: "السوق الصامت", isLive: true };
}

// ===================== بيانات تجريبية =====================
function buildMockData() {
  const cars: Car[] = [
    {
      id: 1001,
      make: "Toyota",
      model: "Camry",
      year: 2021,
      odometer: "45,200",
      condition: "ممتازة",
      vin: "JTNB11HKXMR123456",
      plate: "XYZ987",
      user_id: 42, // نفس مستخدمنا التجريبي ⇒ سيظهر تحذير "أنت مالك السيارة"
      dealer: null,
    },
    {
      id: 1002,
      make: "Hyundai",
      model: "Sonata",
      year: 2020,
      odometer: "58,400",
      condition: "جيدة جدًا",
      vin: "KMHE54L12LA654321",
      plate: "ABC123",
      user_id: 7,
      dealer: { user_id: 77 },
    },
    {
      id: 1003,
      make: "Ford",
      model: "F-150",
      year: 2019,
      odometer: "82,100",
      condition: "جيدة",
      vin: "1FTFW1EG0KFA11223",
      plate: "FORD19",
      user_id: 19,
      dealer: null,
    },
    {
      id: 1004,
      make: "BMW",
      model: "530i",
      year: 2018,
      odometer: "73,050",
      condition: "ممتازة",
      vin: "WBAJA7C57JG998877",
      plate: "BM-530",
      user_id: 3,
      dealer: null,
    },
  ];

  const bidsFor = (base: number): BidItem[] => [
    { id: 1, bidder_id: 2, bidder_name: "أبو مازن", bid_amount: base + 2000, created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { id: 2, bidder_id: 9, bidder_name: "سالم", bid_amount: base + 4000, created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString() },
    { id: 3, bidder_id: 13, bidder_name: "غازي", bid_amount: base + 6000, created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
  ];

  const current: LiveAuctionItem = {
    id: 5001,
    car: cars[0],
    min_price: 65000,
    max_price: 92000,
    opening_price: 64000,
    current_bid: 70000,
    viewers: 37,
    bids: bidsFor(64000),
  };

  const live: LiveAuctionItem[] = [
    current,
    {
      id: 5002,
      car: cars[1],
      min_price: 52000,
      max_price: 78000,
      opening_price: 50000,
      current_bid: 56000,
      viewers: 21,
      bids: bidsFor(50000),
    },
    {
      id: 5003,
      car: cars[2],
      min_price: 85000,
      max_price: 130000,
      opening_price: 82000,
      current_bid: 0, // لم تبدأ فعليًا بعد
      viewers: 12,
      bids: [],
    },
  ];

  const completed: LiveAuctionItem[] = [
    {
      id: 4991,
      car: cars[3],
      min_price: 90000,
      max_price: 135000,
      opening_price: 88000,
      current_bid: 120000,
      viewers: 55,
      bids: bidsFor(88000),
    },
  ];

  return { current, live, completed };
}

// ===================== الصفحة الرئيسية =====================
export default function LiveMarketPage() {
  const [isAllowed, setIsAllowed] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoggedIn } = useAuth();
  const router = useLoadingRouter();

  const [marketCars, setMarketCars] = useState<LiveAuctionItem[]>([]);
  const [currentCar, setCurrentCar] = useState<LiveAuctionItem | null>(null);
  const [marketCarsCompleted, setMarketCarsCompleted] = useState<LiveAuctionItem[]>([]);
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { label: auctionType } = getCurrentAuctionType(currentTime);

  // تحديث الساعة
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // توجيه (اختياري) لو كان غير مسجّل
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/auctions/auctions-1main/live-market");
    }
  }, [isLoggedIn, router]);

  // جلب/تهيئة البيانات التجريبية
  const fetchAuctions = useCallback(async () => {
    try {
      setLoading(true);
      const allowed = isWithinAllowedTime("live_auction");
      setIsAllowed(allowed);

      const mock = buildMockData();
      setCurrentCar(mock.current);
      setMarketCars(mock.live);
      setMarketCarsCompleted(mock.completed);

      if (mock.current?.car) {
        const carUserId = mock.current.car.user_id;
        const dealerUserId = mock.current.car.dealer?.user_id;
        const currentUserId = user?.id;
        setIsOwner(currentUserId === carUserId || currentUserId === dealerUserId);
      }
      setError(null);
    } catch (e) {
      console.error(e);
      setError("تعذر تحميل البيانات التجريبية.");
      setMarketCars([]);
      setCurrentCar(null);
      setMarketCarsCompleted([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  // محاكاة مزايدة حية كل فترة قصيرة على السيارة الحالية
  useEffect(() => {
    if (!currentCar) return;
    const id = setInterval(() => {
      setCurrentCar((prev) => {
        if (!prev) return prev;
        const inc = Math.floor(1000 + Math.random() * 4000);
        const nextBid = (prev.current_bid === 0 ? prev.opening_price : prev.current_bid) + inc;
        const newBid: BidItem = {
          id: (prev.bids.at(-1)?.id || 0) + 1,
          bidder_id: Math.floor(Math.random() * 1000),
          bidder_name: ["سامي", "وليد", "تركي", "ناصر", "أحمد"][Math.floor(Math.random() * 5)],
          bid_amount: nextBid,
          created_at: new Date().toISOString(),
        };
        return { ...prev, current_bid: nextBid, bids: [...prev.bids, newBid], viewers: prev.viewers + (Math.random() > 0.5 ? 1 : 0) };
      });
    }, 12000);
    return () => clearInterval(id);
  }, [currentCar]);

  const allCars = useMemo(() => [...marketCars, ...marketCarsCompleted], [marketCars, marketCarsCompleted]);

  const handleSearch = async () => {
    const q = plate.trim().toUpperCase();
    if (!q) return;
    setLoading(true);
    try {
      const found = allCars.find((a) => a.car.plate?.toUpperCase() === q || a.car.vin.toUpperCase().includes(q));
      if (found) {
        setCurrentCar(found);
        toast.success(`تم العثور على السيارة: ${found.car.make} ${found.car.model}`);
      } else {
        toast.error("لم يتم العثور على سيارة مطابقة للوحة/الشاصي المدخل");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* التنقل العلوي */}
        <div className="flex justify-between items-center mb-6">
          <BidNotifications />
          <LoadingLink
            href="/auctions/auctions-1main"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors px-4 py-2.5 text-sm rounded-xl border border-blue-800/50 hover:border-blue-700 bg-gray-800/50 hover:bg-gray-800 backdrop-blur-sm"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            العودة
          </LoadingLink>
        </div>

        {/* رأس الصفحة */}
        <div className="grid grid-cols-12 items-center mb-8 gap-4">
          <div className="col-span-12 md:col-span-3">
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center justify-between border border-teal-800/30">
              <div className="text-sm font-medium text-teal-300">{auctionType} - جارٍ الآن</div>
              <div className="flex items-center gap-2">
                <Clock className="text-teal-400 w-4 h-4" />
                <div className="font-mono font-semibold text-teal-300">
                  <BidTimer showLabel={false} />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-6 text-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">الحراج المباشر</h1>
            <div className="mt-2 text-sm text-teal-400/80">وقت السوق من 4 عصراً إلى 7 مساءً كل يوم</div>
          </div>

          <div className="col-span-12 md:col-span-3" />
        </div>

        {/* المحتوى الرئيسي */}
        {!isAllowed ? (
          <div className="bg-amber-900/20 border border-amber-800/40 text-amber-300 rounded-2xl p-5 flex items-center gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>السوق غير مفتوح حاليًا. يفتح يوميًا من 4 عصراً إلى 7 مساءً.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* القسم الأيسر - البث والجداول */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* البث المباشر */}
              <div className="relative w-full pb-[56.25%] bg-black rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0">
                  <img
                    src="https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=1470&auto=format&fit=crop"
                    alt="صورة سيارة - الحراج المباشر"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-4 right-4 bg-white/90 rounded-full p-1.5 z-20">
                  <img
                    src="https://images.unsplash.com/photo-1542435503-956c469947f6?q=80&w=120&auto=format&fit=crop"
                    alt="معلق المزاد"
                    className="w-10 h-10 rounded-full object-cover border-2 border-teal-500"
                  />
                </div>
              </div>

              <p className="text-center text-xs text-gray-500 italic">(بث مباشر من قاعة المزاد - الحراج المباشر)</p>

              {/* جدول السيارات الحالية */}
              <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-5 shadow-2xl">
                <h2 className="text-xl font-bold mb-4 text-teal-300">سيارات جلسة الحراج الحالية</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-700/50">
                        {["#", "الماركة", "الموديل", "السنة", "أقل سعر", "أعلى سعر", "آخر سعر", "عرض"].map((header, i) => (
                          <th key={i} className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {marketCars.length > 0 ? (
                        marketCars.map((car, index) => (
                          <tr key={car.id} className={`hover:bg-gray-800/60 transition-colors ${currentCar?.id === car.id ? "bg-blue-900/30" : ""}`}>
                            <td className="px-4 py-3 text-sm text-gray-300">{index + 1}</td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                {currentCar?.id === car.id && <Radio className="text-red-400 w-4 h-4 flex-shrink-0" />}
                                <span className="text-white">{car.car.make}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">{car.car.model}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{car.car.year}</td>
                            <td className="px-4 py-3 text-sm text-amber-300">{formatCurrency(car.min_price)}</td>
                            <td className="px-4 py-3 text-sm text-rose-300">{formatCurrency(car.max_price)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-emerald-300">{formatCurrency(car.current_bid === 0 ? car.opening_price : car.current_bid)}</td>
                            <td className="px-4 py-3 text-sm">
                              <LoadingLink target="_blank" href={`/carDetails/${car.id}`} className="text-blue-400 hover:text-blue-300 hover:underline">
                                <Eye className="w-4 h-4 inline" />
                              </LoadingLink>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-6 text-center text-gray-500">لا توجد سيارات متاحة حاليًا في الحراج المباشر</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* جدول السيارات المنتهية */}
              <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-5 shadow-2xl">
                <h2 className="text-xl font-bold mb-4 text-teal-300">سيارات جلسة الحراج المنتهية</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-700/50">
                        {["#", "الماركة", "الموديل", "السنة", "أقل سعر", "أعلى سعر", "آخر سعر", "عرض"].map((header, i) => (
                          <th key={i} className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {marketCarsCompleted.length > 0 ? (
                        marketCarsCompleted.map((car, index) => (
                          <tr key={car.id} className="hover:bg-gray-800/60 transition-colors">
                            <td className="px-4 py-3 text-sm text-gray-300">{index + 1}</td>
                            <td className="px-4 py-3 text-sm text-white">{car.car.make}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{car.car.model}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{car.car.year}</td>
                            <td className="px-4 py-3 text-sm text-amber-300">{formatCurrency(car.min_price)}</td>
                            <td className="px-4 py-3 text-sm text-rose-300">{formatCurrency(car.max_price)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-emerald-300">{formatCurrency(car.current_bid)}</td>
                            <td className="px-4 py-3 text-sm">
                              <LoadingLink target="_blank" href={`/carDetails/${car.id}`} className="text-blue-400 hover:text-blue-300 hover:underline">
                                <Eye className="w-4 h-4 inline" />
                              </LoadingLink>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-6 text-center text-gray-500">لا توجد سيارات مكتملة في الحراج المباشر</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* (اختياري) لوحة مدمجة تعرض آخر المزايدات للسيارة الحالية */}
              {currentCar && (
                <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-5 shadow-2xl">
                  <h2 className="text-xl font-bold mb-4 text-teal-300">المزايدات الحية — {currentCar.car.make} {currentCar.car.model}</h2>
                  {currentCar.bids.length ? (
                    <ul className="space-y-2 max-h-56 overflow-auto pr-2">
                      {[...currentCar.bids].reverse().map((b) => (
                        <li key={b.id} className="flex items-center justify-between bg-gray-900/40 border border-gray-700/50 rounded-lg px-3 py-2">
                          <span className="text-gray-200 text-sm">{b.bidder_name}</span>
                          <span className="text-emerald-300 text-sm font-semibold">{formatCurrency(b.bid_amount)}</span>
                          <span className="text-xs text-gray-500">{new Date(b.created_at).toLocaleTimeString("ar-SA")}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-500">لا توجد مزايدات بعد</div>
                  )}
                </div>
              )}
            </div>

            {/* القسم الأيمن - السيارة الحالية */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* معلومات السيارة الحالية */}
              <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-5 shadow-2xl">
                <h2 className="text-xl font-bold mb-4 text-center text-teal-300 border-b border-gray-700/50 pb-3">السيارة الحالية في الحراج</h2>

                {currentCar && currentCar.car ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                      {[
                        ["الماركة", currentCar.car.make],
                        ["الموديل", currentCar.car.model],
                        ["السنة", currentCar.car.year.toString()],
                        ["العداد", `${currentCar.car.odometer} كم`],
                        ["الحالة", currentCar.car.condition],
                        ["رقم الشاصي", currentCar.car.vin],
                        ["رقم اللوحة", currentCar.car.plate || "—"],
                      ].map(([label, value], i) => (
                        <div key={i} className="col-span-1">
                          <span className="font-semibold text-teal-300">{label}:</span>{" "}
                          <span className="text-gray-200">{value as string}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border border-gray-700/50 rounded-xl bg-gray-900/50 p-4">
                      <div className="text-center text-gray-400 text-sm mb-3 flex items-center justify-center gap-3">
                        <Users className="w-4 h-4" />
                        <span>مشاهدون: {currentCar.viewers || "0"}</span>
                        <TrendingUp className="w-4 h-4" />
                        <span>مزايدون: {currentCar.bids?.length || "0"}</span>
                      </div>

                      <div className="text-center mb-4">
                        <h3 className="font-semibold text-teal-300">آخر سعر</h3>
                        <div className="text-2xl font-bold text-emerald-400 my-3 py-3 rounded-xl border border-emerald-500/30 bg-emerald-900/20">
                          {formatCurrency(currentCar.current_bid === 0 ? currentCar.opening_price : currentCar.current_bid || 0)}
                        </div>
                      </div>

                      {!isOwner ? (
                        <BidForm
                          auction_id={currentCar.id}
                          bid_amount={currentCar.current_bid === 0 ? currentCar.opening_price : currentCar.current_bid || 0}
                          onSuccess={() => toast.success("تم تقديم مزايدتك بنجاح!")}
                        />
                      ) : (
                        <div className="text-center py-3 bg-amber-900/20 text-amber-300 rounded-lg">أنت مالك هذه السيارة - لا يمكنك المزايدة عليها</div>
                      )}
                    </div>

                    {/* بحث برقم اللوحة */}
                    <div className="pt-4 border-t border-gray-700/50">
                      <h3 className="text-sm font-semibold text-teal-300 mb-2">ابحث برقم اللوحة أو جزء من الشاصي</h3>
                      <div className="relative">
                        <input
                          type="text"
                          value={plate}
                          onChange={(e) => setPlate(e.target.value)}
                          placeholder="مثال: XYZ987 أو 998877"
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-900/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-gray-100 placeholder-gray-500"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <button
                          onClick={handleSearch}
                          disabled={loading}
                          className="absolute right-1 top-1 bottom-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-3 rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "بحث"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                    <AlertCircle className="w-12 h-12 mb-3" />
                    <p className="text-center">لا توجد سيارة معروضة حاليًا في الحراج المباشر</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
