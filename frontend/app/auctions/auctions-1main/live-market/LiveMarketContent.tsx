// Extracted content from LiveMarketPage for dynamic loading
'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { cachedApiRequest } from "@/lib/request-cache";
import api from "@/lib/axios";
import GlobalLoader from '@/components/GlobalLoader';
import BidForm from '@/components/BidForm';
import { formatCurrency } from '@/utils/formatCurrency';

// Dynamic imports for heavy components
const CountdownTimer = dynamic(() => import("@/components/CountdownTimer"), { 
  loading: () => <GlobalLoader />,
  ssr: false 
});
const LiveBidding = dynamic(() => import("@/components/LiveBidding"), { 
  loading: () => <GlobalLoader />,
  ssr: false 
});

async function isWithinAllowedTime(page: string): Promise<boolean> {
  try {
    const response = await cachedApiRequest(`/api/check-time/${page}`, undefined, 0); // 0 minute cache
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as any).data?.allowed || true;
    }
    return true; // Allow by default
  } catch (error) {
    console.error("Time check error:", error);
    return true; // Allow by default
  }
}

function getCurrentAuctionType(time: Date = new Date()): {
  label: string;
  isLive: boolean;
} {
  const hour = time.getHours();
  if (hour >= 16 && hour < 19) {
    return { label: "المزاد المباشر", isLive: true };
  } else if (hour >= 19 && hour < 22) {
    return { label: "المزاد الفوري", isLive: true };
  } else {
    return { label: "السوق الصامت", isLive: true };
  }
}

export default function LiveMarketContent() {
  const [isAllowed, setIsAllowed] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoggedIn } = useAuth();
  const router = useLoadingRouter();
  
  const [marketCars, setMarketCars] = useState([]);
  const [currentCar, setCurrentCar] = useState(null);
  const [marketCarsCompleted, setMarketCarsCompleted] = useState([]);
  const [showBid, setShowBid] = useState(false);
  const [bid, setBid] = useState("");
  const [status, setStatus] = useState("");
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { label: auctionType } = getCurrentAuctionType(currentTime);

  // Verify user is authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/dashboard/profile");
    }
  }, [isLoggedIn, router]);

  // Function to fetch auction data
  const fetchAuctions = async (forceRefresh = false) => {
    if (!isLoggedIn) return;
    try {
      setIsAllowed(await isWithinAllowedTime("live_auction"));
      setIsAllowed(true);
      
      // Use cached API request, but force refresh if needed
      const response = await cachedApiRequest("/api/approved-live-auctions", undefined, forceRefresh ? 0 : 30000);
      
      if (response && typeof response === 'object' && 'data' in response) {
        const carsData = (response as any).data?.data || (response as any).data;
        
        let current_car = carsData.current_live_car;
        let liveAuctions = carsData.pending_live_auctions;
        let completedAuctions = carsData.completed_live_auctions;

        if (current_car && current_car.car) {
          let car_user_id = current_car.car.user_id;
          let current_user_id = user.id;
          let dealer_user_id = current_car.car.dealer;
          if (current_car.car.dealer != null) {
            dealer_user_id = current_car.car.dealer.user_id;
          }

          if (current_user_id == car_user_id) {
            setIsOwner(true);
          } else if (dealer_user_id == current_user_id) {
            setIsOwner(true);
          } else {
            setIsOwner(false);
          }
        }

        setMarketCars(liveAuctions);
        setCurrentCar(current_car);
        setMarketCarsCompleted(completedAuctions);
      } else {
        setMarketCars([]);
        setCurrentCar(null);
        setMarketCarsCompleted([]);
        setError("تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.");
        setLoading(false);
      }
    } catch (error) {
      console.error("فشل تحميل بيانات المزاد الصامت", error);
      setMarketCars([]);
      setCurrentCar(null);
      setMarketCarsCompleted([]);
      setError("تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Fetch auction data with caching
  useEffect(() => {
    fetchAuctions(true);
  }, [isLoggedIn, user]);

  const submitBid = async () => {
    try {
      const res = await fetch("/api/submit-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: currentCar.id,
          bid_amount: parseFloat(bid),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("✅ تمت المزايدة بنجاح");
        setBid("");
        setShowBid(false);
      } else {
        setStatus(`❌ خطأ: ${data.error}`);
      }
    } catch (err) {
      setStatus("❌ فشل الاتصال بالخادم");
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/search-car", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate }),
      });

      const data = await res.json();
      if (res.ok) {
        setCurrentCar(data);
        setStatus("✅ تم البحث بنجاح");
      } else {
        setStatus(`❌ خطأ: ${data.error}`);
      }
    } catch (err) {
      setStatus("❌ فشل الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <GlobalLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">السوق المباشر</h1>
              <p className="text-gray-600 mt-1">{auctionType}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">الوقت الحالي</div>
              <div className="text-lg font-semibold text-gray-900">
                {currentTime.toLocaleTimeString('ar-SA')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Car */}
        <div className="lg:col-span-2">
          {currentCar ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">السيارة الحالية</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={currentCar.car?.images?.[0] || '/placeholder-car.jpg'}
                    alt={currentCar.car?.make}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {currentCar.car?.make} {currentCar.car?.model}
                  </h3>
                  <p className="text-gray-600">سنة: {currentCar.car?.year}</p>
                  <p className="text-gray-600">الرقم: {currentCar.car?.plate_number}</p>
                  <div className="mt-4">
                    <div className="text-2xl font-bold text-green-600">
                      {currentCar.current_bid?.toLocaleString()} ريال
                    </div>
                    <p className="text-sm text-gray-500">المزايدة الحالية</p>
                  </div>
                  
                  {!isOwner && (
                    <div className="mt-6">
                      <button
                        onClick={() => setShowBid(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        مزايدة
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <p className="text-gray-500">لا توجد سيارة في المزاد حالياً</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">البحث بالرقم</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="أدخل رقم السيارة"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'جاري البحث...' : 'بحث'}
              </button>
            </div>
            {status && (
              <div className="mt-3 p-3 bg-gray-100 rounded-lg text-sm">
                {status}
              </div>
            )}
          </div>

          {/* Live Bidding */}
          <Suspense fallback={<GlobalLoader />}>
            <LiveBidding data={currentCar} />
          </Suspense>
        </div>
      </div>

      {/* Bid Modal */}
      {showBid && currentCar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">مزايدة على السيارة</h3>
                <button 
                  onClick={() => setShowBid(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">السيارة: {currentCar.make} {currentCar.model}</p>
                <p className="text-sm text-gray-600 mb-2">السعر الحالي: {formatCurrency(currentCar.current_bid || 0)}</p>
              </div>

              <BidForm
                auction_id={parseInt(currentCar.id)}
                bid_amount={parseInt(
                  (currentCar.current_bid == 0
                    ? currentCar.opening_price
                    : currentCar.current_bid || 0
                  )
                    .toString()
                    .replace(/,/g, "")
                )}
                onSuccess={() => {
                  setShowBid(false);
                  setStatus("✅ تمت المزايدة بنجاح");
                  // Force refresh the auction data to show updated bid
                  fetchAuctions(true);
                }}
              />
              {status && (
                <p className="text-center text-sm mt-2">
                  {status}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
