"use client";

import api from "@/lib/axios";
import { useEffect, useState } from "react";
import LoadingLink from "@/components/LoadingLink";
import { formatCurrency } from "@/utils/formatCurrency";

export default function AuctionFinished() {
  const [auctionsFinished, setAuctionsFinished] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function getAuctionStatus(auction: any): string {
    console.log(auction);
    switch (auction) {
      case "in_auction":
        return "جاري المزايدة";
      case "sold":
        return "تم البيع";
      case "closed":
        return "انتهى";
      default:
        return "غير محدد";
    }
  }

  useEffect(() => {
    const fetchAuctionsFinished = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/auctions-finished");
        console.log("API Response:", response.data);
        
        // The API returns paginated data, so we need to access the nested data property
        const paginatedData = response.data.data;
        const data = paginatedData.data || paginatedData; // Handle both paginated and non-paginated responses
        
        if (Array.isArray(data)) {
          setAuctionsFinished(data);
        } else {
          console.warn("API response data is not an array:", data);
          setAuctionsFinished([]);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching auctions:", err);
        setError(err);
        setAuctionsFinished([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAuctionsFinished();
  }, []);

  console.log("auctionsFinished:", auctionsFinished, "Type:", typeof auctionsFinished, "Is Array:", Array.isArray(auctionsFinished));



  if (error) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg text-red-600">حدث خطأ في تحميل البيانات</div>
      </div>
    );
  }

  return (
    <>
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-border/50">
        <tr>
                  {[
                    "المنطقة",
                    "المدينة",
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
                    "مبلغ الزيادة",
                    "نسبة التغير",
                    "نتيجة المزايدة",
                    "تفاصيل",
                  ].map((header, idx) => (
                    <th key={idx} className="border p-2 text-sm text-foreground/70">
                      {header}
                    </th>
                  ))}
                </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {Array.isArray(auctionsFinished) && auctionsFinished.length > 0 ? (
            auctionsFinished.map((auction, idx) => (
            <tr key={idx} className="border-t hover:bg-background">
              {(
                  <>
                    <td className="p-2 text-sm text-foreground">{auction["car"].province}</td>
                    <td className="p-2 text-sm text-foreground">{auction["car"].city}</td>
                    <td className="p-2 text-sm text-foreground">{auction["car"].make}</td>
                    <td className="p-2 text-sm text-foreground">{auction["car"].model}</td>
                    <td className="p-2 text-sm text-foreground">{auction["car"].year}</td>
                    <td className="p-2 text-sm text-foreground">{auction["car"].plate}</td>
                    <td className="p-2 text-sm text-foreground">{auction["car"].odometer}</td>
                    <td className="p-2 text-sm text-foreground">{auction["car"].condition}</td>
                    <td className="p-2 text-sm text-foreground">{auction["car"].color}</td>
                    <td className="p-2 text-sm text-foreground">{auction["car"].engine}</td>
                    <td className="p-2 text-sm text-foreground">{auction["bids"].length}</td>
                    <td className="p-2 text-sm text-foreground">
                      {formatCurrency (auction["opening_price"] || 0)}
                    </td>
                    <td className="p-2 text-sm text-foreground">
                      {formatCurrency (auction["minimum_bid"] || 0)}
                    </td>
                    <td className="p-2 text-sm text-foreground">
                      {formatCurrency (auction["maximum_bid"] || 0)}
                    </td>
                    <td className="p-2 text-sm text-foreground">
                      {formatCurrency (auction["current_bid"] || 0)}
                    </td>
                    <td className="p-2 text-sm bg-green-500/10">
                      {auction["bids"][auction["bids"].length - 1]
                        ? auction["bids"][auction["bids"].length - 1].increment
                        : 0}
                    </td>
                    <td className="p-2 text-sm bg-green-500/10">
                      {auction["bids"][auction["bids"].length - 1]
                        ? (
                            (auction["bids"][auction["bids"].length - 1].increment /
                              auction["bids"][auction["bids"].length - 1].bid_amount) *
                            100
                          ).toFixed(2) + "%"
                        : "0%"}
                    </td>

                    <td className="p-2 text-sm text-foreground">
                      {(auction.status_label)}
                    </td>
                    <td className="p-2 text-sm text-primary underline">
                      <LoadingLink href={`/carDetails/${auction.car_id}`}>عرض</LoadingLink>
                    </td>
                  </>
                )}
            </tr>
          ))
          ) : (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center text-foreground/50">
                لا توجد مزايدات منتهية
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
