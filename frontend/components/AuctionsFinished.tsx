"use client";

import api from "@/lib/axios";
import { useEffect, useState } from "react";
import LoadingLink from "@/components/LoadingLink";
import { formatCurrency } from "@/utils/formatCurrency";

const TABLE_HEADERS = [
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
];

export default function AuctionFinished() {
  const [auctionsFinished, setAuctionsFinished] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

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

  console.log(
    "auctionsFinished:",
    auctionsFinished,
    "Type:",
    typeof auctionsFinished,
    "Is Array:",
    Array.isArray(auctionsFinished)
  );

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-500/5 px-4 py-6 text-center text-sm text-red-600">
        حدث خطأ في تحميل البيانات
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card/80 backdrop-blur-sm">
        <table className="min-w-[1200px] divide-y divide-border text-xs md:text-sm">
          <thead className="bg-border/40">
            <tr>
              {TABLE_HEADERS.map((header, idx) => (
                <th
                  key={idx}
                  className="px-3 py-2 text-[11px] md:text-xs font-semibold text-foreground/70 text-center whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2].map((row) => (
              <tr key={row} className="animate-pulse">
                <td colSpan={TABLE_HEADERS.length} className="px-4 py-6">
                  <div className="h-3 w-full rounded bg-border/60 mb-2" />
                  <div className="h-3 w-3/4 rounded bg-border/40" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card/80 backdrop-blur-sm">
      <table className="min-w-[1200px] divide-y divide-border text-xs md:text-sm">
        <thead className="bg-border/50">
          <tr>
            {TABLE_HEADERS.map((header, idx) => (
              <th
                key={idx}
                className="px-3 py-2 text-[11px] md:text-xs font-semibold text-foreground/70 text-center whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {Array.isArray(auctionsFinished) && auctionsFinished.length > 0 ? (
            auctionsFinished.map((auction: any, idx: number) => {
              const car = auction.car || {};
              const bids = Array.isArray(auction.bids) ? auction.bids : [];
              const lastBid = bids[bids.length - 1];

              return (
                <tr
                  key={idx}
                  className="border-t border-border/60 hover:bg-background/70 transition-colors"
                >
                  <td className="px-3 py-2 text-[11px] md:text-xs text-foreground/90 whitespace-nowrap">
                    {car.province ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-[11px] md:text-xs text-foreground/90 whitespace-nowrap">
                    {car.city ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-[11px] md:text-xs text-foreground/90 whitespace-nowrap">
                    {car.make ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-[11px] md:text-xs text-foreground/90 whitespace-nowrap">
                    {car.model ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-[11px] md:text-xs text-foreground/90 whitespace-nowrap">
                    {car.year ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-[11px] md:text-xs text-foreground/90 whitespace-nowrap">
                    {car.plate ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-[11px] md:text-xs text-foreground/90 whitespace-nowrap">
                    {car.odometer ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-[11px] md:text-xs text-foreground/90 whitespace-nowrap">
                    {car.condition ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-[11px] md:text-xs text-foreground/90 whitespace-nowrap">
                    {car.color ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-[11px] md:text-xs text-foreground/90 whitespace-nowrap">
                    {car.engine ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-[11px] md:text-xs text-foreground/90 text-center whitespace-nowrap">
                    {bids.length}
                  </td>
                  <td className="px-3 py-2 text-[11px] md:text-xs text-foreground/90 whitespace-nowrap">
                    {formatCurrency(auction.opening_price || 0)}
                  </td>
                  <td className="px-3 py-2 text-[11px] md:text-xs text-foreground/90 whitespace-nowrap">
                    {formatCurrency(auction.minimum_bid || 0)}
                  </td>
                  <td className="px-3 py-2 text-[11px] md:text-xs text-foreground/90 whitespace-nowrap">
                    {formatCurrency(auction.maximum_bid || 0)}
                  </td>
                  <td className="px-3 py-2 text-[11px] md:text-xs text-foreground/90 whitespace-nowrap">
                    {formatCurrency(auction.current_bid || 0)}
                  </td>
                  <td className="px-3 py-2 text-[11px] md:text-xs bg-emerald-500/5 text-emerald-500 font-semibold text-center whitespace-nowrap">
                    {lastBid ? lastBid.increment : 0}
                  </td>
                  <td className="px-3 py-2 text-[11px] md:text-xs bg-emerald-500/5 text-emerald-500 font-semibold text-center whitespace-nowrap">
                    {lastBid
                      ? (
                          (lastBid.increment / lastBid.bid_amount) *
                          100
                        ).toFixed(2) + "%"
                      : "0%"}
                  </td>
                  <td className="px-3 py-2 text-[11px] md:text-xs text-center whitespace-nowrap">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-background/80 border border-border/70 text-[10px] md:text-xs text-foreground/90">
                      {auction.status_label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[11px] md:text-xs text-center whitespace-nowrap">
                    <LoadingLink
                      href={`/carDetails/${auction.car_id}`}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl border border-primary/60 text-primary text-[11px] md:text-xs font-semibold hover:bg-primary hover:text-white transition-colors"
                    >
                      عرض
                    </LoadingLink>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={TABLE_HEADERS.length}
                className="px-4 py-8 text-center text-foreground/50 text-sm"
              >
                لا توجد مزايدات منتهية
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
