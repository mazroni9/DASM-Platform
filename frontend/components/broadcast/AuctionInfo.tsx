import React, { useState, useEffect } from "react";
import { Car, Gavel, ArrowRight, Clock, Tag, Info } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

// واجهة السيارة الحالية في المزاد
interface AuctionCar {
    id: number;
    title: string;
    make: string;
    model: string;
    year: number;
    mileage: number;
    color: string;
    images: string[];
    minPrice: number;
    currentPrice: number;
    nextIncrement: number;
    endTime: string;
}

// واجهة المزايدة
interface Bid {
    id: string;
    bidderName: string;
    amount: number;
    timestamp: string;
    isOnline: boolean;
}

interface AuctionInfoProps {
    venueId: string;
}

export default function AuctionInfo({ venueId }: AuctionInfoProps) {
    const [currentCar, setCurrentCar] = useState<AuctionCar | null>(null);
    const [bids, setBids] = useState<Bid[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [showBidForm, setShowBidForm] = useState(false);
    const [isBidding, setIsBidding] = useState(false);
    const [currentTab, setCurrentTab] = useState<"info" | "bids">("info");

    // جلب بيانات المزاد والسيارة الحالية
    useEffect(() => {
        const fetchAuctionData = async () => {
            setIsLoading(true);
            try {
                // في بيئة الإنتاج، سنستخدم طلب API
                // لكن هنا نستخدم بيانات تجريبية

                // محاكاة تأخير الشبكة
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // محاكاة بيانات السيارة
                const mockCar: AuctionCar = {
                    id: 12345,
                    title: "تويوتا لاندكروزر GXR 2022",
                    make: "تويوتا",
                    model: "لاندكروزر GXR",
                    year: 2022,
                    mileage: 25000,
                    color: "أبيض لؤلؤي",
                    images: [
                        "/images/cars/landcruiser1.jpg",
                        "/images/cars/landcruiser2.jpg",
                    ],
                    minPrice: 320000,
                    currentPrice: 358000,
                    nextIncrement: 2000,
                    endTime: new Date(
                        Date.now() + 20 * 60 * 1000
                    ).toISOString(), // 20 دقيقة من الآن
                };

                // محاكاة المزايدات
                const mockBids: Bid[] = [
                    {
                        id: "bid1",
                        bidderName: "محمد أحمد",
                        amount: 358000,
                        timestamp: new Date(
                            Date.now() - 2 * 60 * 1000
                        ).toISOString(),
                        isOnline: true,
                    },
                    {
                        id: "bid2",
                        bidderName: "فهد العبدالله",
                        amount: 356000,
                        timestamp: new Date(
                            Date.now() - 3 * 60 * 1000
                        ).toISOString(),
                        isOnline: false,
                    },
                    {
                        id: "bid3",
                        bidderName: "خالد سعود",
                        amount: 354000,
                        timestamp: new Date(
                            Date.now() - 5 * 60 * 1000
                        ).toISOString(),
                        isOnline: true,
                    },
                    {
                        id: "bid4",
                        bidderName: "عبدالله فهد",
                        amount: 352000,
                        timestamp: new Date(
                            Date.now() - 7 * 60 * 1000
                        ).toISOString(),
                        isOnline: true,
                    },
                    {
                        id: "bid5",
                        bidderName: "سلطان ناصر",
                        amount: 350000,
                        timestamp: new Date(
                            Date.now() - 8 * 60 * 1000
                        ).toISOString(),
                        isOnline: false,
                    },
                ];

                setCurrentCar(mockCar);
                setBids(mockBids);
            } catch (error) {
                console.error("خطأ في جلب بيانات المزاد:", error);
                setError(
                    "حدث خطأ أثناء جلب بيانات المزاد. يرجى المحاولة مرة أخرى."
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchAuctionData();

        // محاكاة استلام المزايدات الجديدة كل 30 ثانية
        const bidInterval = setInterval(() => {
            if (currentCar) {
                const randomAmount =
                    currentCar.currentPrice + currentCar.nextIncrement;
                const newBid: Bid = {
                    id: `bid-${Date.now()}`,
                    bidderName: `مزايد ${Math.floor(Math.random() * 100) + 1}`,
                    amount: randomAmount,
                    timestamp: new Date().toISOString(),
                    isOnline: Math.random() > 0.3, // 70% من المزايدات عبر الإنترنت
                };

                setBids((prev) => [newBid, ...prev.slice(0, 9)]); // الاحتفاظ بآخر 10 مزايدات
                setCurrentCar((prev) =>
                    prev
                        ? {
                              ...prev,
                              currentPrice: randomAmount,
                              nextIncrement: prev.nextIncrement,
                          }
                        : null
                );
            }
        }, 30000);

        return () => clearInterval(bidInterval);
    }, [venueId]);

    // تحديث العد التنازلي
    useEffect(() => {
        if (!currentCar) return;

        const updateTimeLeft = () => {
            const now = new Date();
            const end = new Date(currentCar.endTime);
            const diffMs = end.getTime() - now.getTime();

            if (diffMs <= 0) {
                setTimeLeft("انتهى المزاد");
                return;
            }

            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

            setTimeLeft(
                `${diffMins.toString().padStart(2, "0")}:${diffSecs
                    .toString()
                    .padStart(2, "0")}`
            );
        };

        updateTimeLeft();
        const interval = setInterval(updateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [currentCar]);

    // تقديم مزايدة جديدة
    const handlePlaceBid = async () => {
        if (!currentCar) return;

        setIsBidding(true);

        try {
            // في بيئة الإنتاج، سنستخدم طلب API
            // لكن هنا نحاكي عملية المزايدة

            // محاكاة تأخير الشبكة
            await new Promise((resolve) => setTimeout(resolve, 1500));

            const newBidAmount =
                currentCar.currentPrice + currentCar.nextIncrement;

            // إنشاء مزايدة جديدة
            const newBid: Bid = {
                id: `bid-${Date.now()}`,
                bidderName: "أنت", // اسم المستخدم الحالي
                amount: newBidAmount,
                timestamp: new Date().toISOString(),
                isOnline: true,
            };

            // تحديث قائمة المزايدات
            setBids((prev) => [newBid, ...prev.slice(0, 9)]);

            // تحديث سعر السيارة الحالي
            setCurrentCar((prev) =>
                prev
                    ? {
                          ...prev,
                          currentPrice: newBidAmount,
                          nextIncrement: prev.nextIncrement,
                      }
                    : null
            );

            // إغلاق نموذج المزايدة
            setShowBidForm(false);
        } catch (error) {
            console.error("خطأ في تقديم المزايدة:", error);
            setError("حدث خطأ أثناء تقديم المزايدة. يرجى المحاولة مرة أخرى.");
        } finally {
            setIsBidding(false);
        }
    };

    // تنسيق التاريخ
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("ar-SA", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="p-4 bg-red-50 text-red-700 rounded-md">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!currentCar) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="text-center p-6">
                    <Car className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                        لا توجد سيارة في المزاد حالياً
                    </h3>
                    <p className="text-gray-500">
                        قد يكون المزاد في فترة استراحة أو لم يبدأ بعد
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm">
            {/* عنوان المزاد والتبويبات */}
            <div className="border-b">
                <div className="flex border-b">
                    <button
                        className={`py-3 px-6 ${
                            currentTab === "info"
                                ? "border-b-2 border-teal-500 text-teal-600 font-medium"
                                : "text-gray-500"
                        }`}
                        onClick={() => setCurrentTab("info")}
                    >
                        معلومات السيارة
                    </button>
                    <button
                        className={`py-3 px-6 ${
                            currentTab === "bids"
                                ? "border-b-2 border-teal-500 text-teal-600 font-medium"
                                : "text-gray-500"
                        }`}
                        onClick={() => setCurrentTab("bids")}
                    >
                        المزايدات ({bids.length})
                    </button>
                </div>
            </div>

            {/* معلومات السيارة */}
            {currentTab === "info" && (
                <div className="p-4">
                    <h2 className="text-lg font-bold text-gray-800 mb-1">
                        {currentCar.title}
                    </h2>
                    <p className="text-gray-600 text-sm mb-4">
                        {currentCar.make} {currentCar.model} {currentCar.year}
                    </p>

                    {/* معلومات السيارة */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded-md">
                            <div className="text-xs text-gray-500 mb-1">
                                اللون
                            </div>
                            <div className="font-medium">
                                {currentCar.color}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md">
                            <div className="text-xs text-gray-500 mb-1">
                                العداد
                            </div>
                            <div className="font-medium">
                                {currentCar.mileage.toLocaleString()} كم
                            </div>
                        </div>
                    </div>

                    {/* سعر المزايدة الحالي */}
                    <div className="bg-teal-50 p-4 rounded-md mb-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-teal-700 text-sm">
                                    السعر الحالي
                                </p>
                                <p className="text-2xl font-bold text-teal-800">
                                    {formatCurrency (currentCar.currentPrice)} ريال
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="text-teal-700 text-sm">
                                    الوقت المتبقي
                                </div>
                                <div className="bg-teal-100 px-3 py-1.5 rounded font-mono text-lg font-bold text-teal-800">
                                    {timeLeft}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* زر المزايدة */}
                    {!showBidForm ? (
                        <button
                            onClick={() => setShowBidForm(true)}
                            className="w-full py-3 bg-teal-600 text-white rounded-md font-medium hover:bg-teal-700 transition-colors flex items-center justify-center"
                        >
                            <Gavel className="h-5 w-5 mr-2" />
                            <span>
                                المزايدة بمبلغ{" "}
                                {formatCurrency (
                                    currentCar.currentPrice +
                                        currentCar.nextIncrement
                                )}{" "}
                                ريال
                            </span>
                        </button>
                    ) : (
                        <div className="space-y-3 border p-4 rounded-md bg-gray-50">
                            <p className="text-gray-700">
                                هل أنت متأكد من المزايدة بمبلغ؟
                            </p>
                            <p className="text-xl font-bold text-gray-800 text-center">
                                {formatCurrency (
                                    currentCar.currentPrice +
                                        currentCar.nextIncrement
                                )}{" "}
                                ريال
                            </p>
                            <div className="flex space-x-3 rtl:space-x-reverse">
                                <button
                                    onClick={handlePlaceBid}
                                    disabled={isBidding}
                                    className={`flex-1 py-2 bg-teal-600 text-white rounded-md font-medium hover:bg-teal-700 transition-colors ${
                                        isBidding
                                            ? "opacity-75 cursor-not-allowed"
                                            : ""
                                    }`}
                                >
                                    {isBidding
                                        ? "جارٍ المزايدة..."
                                        : "تأكيد المزايدة"}
                                </button>
                                <button
                                    onClick={() => setShowBidForm(false)}
                                    disabled={isBidding}
                                    className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300 transition-colors"
                                >
                                    إلغاء
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 text-center">
                                بمجرد النقر على "تأكيد المزايدة"، يتم الالتزام
                                بالمبلغ المحدد
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* تاريخ المزايدات */}
            {currentTab === "bids" && (
                <div className="p-4">
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {bids.length > 0 ? (
                            bids.map((bid) => (
                                <div
                                    key={bid.id}
                                    className="flex justify-between items-center border-b pb-3"
                                >
                                    <div className="flex items-start">
                                        <div
                                            className={`h-2 w-2 rounded-full mt-2 ml-2 ${
                                                bid.isOnline
                                                    ? "bg-blue-500"
                                                    : "bg-green-500"
                                            }`}
                                        ></div>
                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {bid.bidderName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatTime(bid.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-teal-700">
                                            {formatCurrency (bid.amount)} ريال
                                        </p>
                                        {bid.bidderName === "أنت" && (
                                            <span className="inline-block px-2 py-0.5 bg-teal-100 text-teal-800 text-xs rounded">
                                                مزايدتك
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-6 text-gray-500">
                                لا توجد مزايدات بعد
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
