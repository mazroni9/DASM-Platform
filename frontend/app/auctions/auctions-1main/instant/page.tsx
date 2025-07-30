"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/utils";

export default function InstantAuctionPage() {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [expandedRows, setExpandedRows] = useState<{
        [key: number]: boolean;
    }>({});
    const { user, isLoggedIn } = useAuth();
    const router = useRouter();

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
                const response = await api.get("/api/approved-auctions");
                if (response.data.data || response.data.data) {
                    const carsData =
                        response.data.data.data || response.data.data;
                    // تعامل مع هيكل البيانات من API
                    setCars(carsData);
                }
            } catch (error) {
                console.error("فشل تحميل بيانات المزاد الصامت", error);
                setCars([]); // مصفوفة فارغة في حالة الفشل
                setError(
                    "تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً."
                );
                setLoading(false);
            } finally {
                setLoading(false);
            }
        }
        fetchAuctions();
    }, []);
    return (
        <div className="p-4">
            <div className="flex justify-end mb-4">
                <Link
                    href="/auctions"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 text-sm rounded-full border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
                >
                    <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
                    <span>العودة</span>
                </Link>
            </div>

            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">
                    السوق الفوري المباشر - جميع السيارات
                </h1>
                <div className="text-sm text-purple-600 mt-1">
                    وقت السوق من 7 مساءً إلى 10 مساءً كل يوم
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            {[
                                "الماركة",
                                "الموديل",
                                "سنة الصنع",
                                "رقم اللوحة",
                                "العداد",
                                "حالة السيارة",
                                "لون السيارة",
                                "نوع الوقود",
                                "المزايدات المقدمة",
                                "سعر الافتتاح",
                                "اقل سعر",
                                "اعلى سعر",
                                "اخر سعر",
                                "التغير",
                                "نسبة التغير",
                                "نتيجة المزايدة",
                                "تفاصيل",
                            ].map((header, idx) => (
                                <th key={idx} className="border p-2 text-sm">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {cars.map((car, idx) => (
                            <tr key={idx} className="border-t hover:bg-gray-50">
                                {car.auction_type != "live" &&
                                    car["car"].auction_status ==
                                        "in_auction" && (
                                        <>
                                            <td className="p-2 text-sm">
                                                {car["car"].make}
                                            </td>
                                            <td className="p-2 text-sm">
                                                {car["car"].model}
                                            </td>
                                            <td className="p-2 text-sm">
                                                {car["car"].year}
                                            </td>
                                            <td className="p-2 text-sm">
                                                {car["car"].plate}
                                            </td>
                                            <td className="p-2 text-sm">
                                                {car["car"].odometer}
                                            </td>
                                            <td className="p-2 text-sm">
                                                {car["car"].condition}
                                            </td>
                                            <td className="p-2 text-sm">
                                                {car["car"].color}
                                            </td>
                                            <td className="p-2 text-sm">
                                                {car["car"].engine}
                                            </td>
                                            <td className="p-2 text-sm">
                                                {car["bids"].length}
                                            </td>
                                            <td className="p-2 text-sm">
                                                {formatMoney(car["evaluation_price"] || 0)}
                                            </td>
                                            <td className="p-2 text-sm">
                                                {formatMoney(car["minimum_bid"] || 0)}
                                            </td>
                                            <td className="p-2 text-sm">
                                                {formatMoney(car["maximum_bid"] || 0)}
                                            </td>
                                            <td className="p-2 text-sm">
                                                {formatMoney(car["current_bid"] || 0)}
                                                
                                            </td>
                                            <td className="p-2 text-sm">
                                                {car["التغير"]}
                                            </td>
                                            <td className="p-2 text-sm">
                                                {car["نسبة التغير"]}
                                            </td>
                                            <td className="p-2 text-sm">
                                                {car["نتيجة المزايدة"]}
                                            </td>
                                            <td className="p-2 text-sm text-blue-600 underline">
                                                <Link
                                                    href={`/carDetails/${car.car_id}`}
                                                >
                                                    عرض
                                                </Link>
                                            </td>
                                        </>
                                    )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
