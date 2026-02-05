"use client";

import api from "@/lib/axios";
import { useEffect, useState } from "react";
import LoadingLink from "@/components/LoadingLink";
import { formatCurrency } from "@/utils/formatCurrency";
import { 
  MapPin, Car, Hash, Gauge, AlertCircle, 
  Droplets, Gavel, DollarSign, TrendingUp, 
  CheckCircle2, XCircle, Timer, Eye, ArrowUpRight, 
  Fuel, Palette
} from "lucide-react";
import { motion } from "framer-motion";

// تعريف الأعمدة الجديدة (المدمجة)
const TABLE_COLUMNS = [
  { header: "تفاصيل السيارة", icon: Car },
  { header: "الموقع", icon: MapPin },
  { header: "المواصفات", icon: Gauge },
  { header: "إحصائيات المزاد", icon: Gavel },
  { header: "السعر النهائي", icon: DollarSign },
  { header: "حالة المزاد", icon: AlertCircle },
  { header: "إجراء", icon: Eye },
];

export default function AuctionFinished() {
  const [auctionsFinished, setAuctionsFinished] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // تنسيق الحالة
  function getAuctionStatusStyle(status: string) {
    switch (status) {
      case "in_auction":
        return { label: "جاري المزايدة", className: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Timer };
      case "sold":
        return { label: "تم البيع", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 };
      case "closed":
        return { label: "انتهى", className: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: XCircle };
      default:
        return { label: "غير محدد", className: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: AlertCircle };
    }
  }

  useEffect(() => {
    const fetchAuctionsFinished = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/auctions-finished");
        const paginatedData = response.data.data;
        const data = paginatedData.data || paginatedData;
        
        if (Array.isArray(data)) {
          setAuctionsFinished(data);
        } else {
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-3xl border border-red-500/20 bg-red-500/5 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-red-400">فشل تحميل البيانات</h3>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full overflow-hidden rounded-3xl border border-white/5 bg-[#0f172a] shadow-xl p-6">
         <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                    <div className="h-16 w-1/4 bg-white/5 rounded-xl animate-pulse" />
                    <div className="h-16 w-1/4 bg-white/5 rounded-xl animate-pulse" />
                    <div className="h-16 w-1/4 bg-white/5 rounded-xl animate-pulse" />
                    <div className="h-16 w-1/4 bg-white/5 rounded-xl animate-pulse" />
                </div>
            ))}
         </div>
      </div>
    );
  }

  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
    >
      <div className="w-full overflow-hidden rounded-[1.5rem] border border-white/5 bg-[#0f172a] shadow-xl relative">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-emerald-500/50 via-blue-500/50 to-purple-500/50 opacity-20" />

        {/* تم إزالة overflow-x-auto لكي نمنع السكرول، واستخدمنا w-full لملء الشاشة */}
        <table className="w-full border-collapse text-right">
          
          {/* رأس الجدول */}
          <thead>
            <tr className="bg-black/20 border-b border-white/5">
              {TABLE_COLUMNS.map((col, idx) => {
                const Icon = col.icon;
                return (
                  <th
                    key={idx}
                    className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                      <span>{col.header}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {Array.isArray(auctionsFinished) && auctionsFinished.length > 0 ? (
              auctionsFinished.map((auction: any, idx: number) => {
                const car = auction.car || {};
                const bids = Array.isArray(auction.bids) ? auction.bids : [];
                const lastBid = bids[bids.length - 1];
                const statusInfo = getAuctionStatusStyle(auction.status);
                const StatusIcon = statusInfo.icon;
                const changePercentage = lastBid ? ((lastBid.increment / lastBid.bid_amount) * 100).toFixed(1) : "0";

                return (
                  <tr
                    key={idx}
                    className="group hover:bg-white/[0.02] transition-colors duration-200"
                  >
                    {/* 1. تفاصيل السيارة (دمج الماركة، الموديل، السنة، اللوحة) */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-white mb-1">
                          {car.make} {car.model}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                           <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10 font-mono text-slate-300">
                             {car.year}
                           </span>
                           <span className="flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              {car.plate || "-"}
                           </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. الموقع (دمج المدينة والمنطقة) */}
                    <td className="px-6 py-5">
                       <div className="flex flex-col gap-1">
                          <span className="text-sm text-slate-300 font-medium">{car.city || "-"}</span>
                          <span className="text-xs text-slate-500">{car.province || "-"}</span>
                       </div>
                    </td>

                    {/* 3. المواصفات (دمج العداد، اللون، الوقود، الحالة) */}
                    <td className="px-6 py-5">
                       <div className="flex flex-wrap gap-2 max-w-[200px]">
                          {/* العداد */}
                          <div className="flex items-center gap-1 text-xs text-slate-300 bg-slate-800/50 px-2 py-1 rounded">
                             <Gauge className="w-3 h-3 text-slate-500" />
                             <span dir="ltr">{car.odometer || "-"} km</span>
                          </div>
                          {/* اللون */}
                          <div className="flex items-center gap-1 text-xs text-slate-300 bg-slate-800/50 px-2 py-1 rounded">
                             <Palette className="w-3 h-3 text-slate-500" />
                             <span>{car.color || "-"}</span>
                          </div>
                          {/* الوقود */}
                          <div className="flex items-center gap-1 text-xs text-slate-300 bg-slate-800/50 px-2 py-1 rounded">
                             <Fuel className="w-3 h-3 text-slate-500" />
                             <span>{car.engine || "-"}</span>
                          </div>
                       </div>
                    </td>

                    {/* 4. إحصائيات المزاد */}
                    <td className="px-6 py-5">
                       <div className="flex flex-col gap-1.5">
                          <div className="text-xs text-slate-400 flex justify-between w-32">
                             <span>عدد المزايدات:</span>
                             <span className="text-white font-bold">{bids.length}</span>
                          </div>
                          <div className="text-xs text-slate-400 flex justify-between w-32">
                             <span>بداية من:</span>
                             <span className="text-slate-300 font-mono">{formatCurrency(auction.opening_price || 0)}</span>
                          </div>
                       </div>
                    </td>

                    {/* 5. السعر النهائي (دمج السعر الحالي، الزيادة، النسبة) */}
                    <td className="px-6 py-5">
                       <div className="flex flex-col items-start gap-1">
                          <span className="text-emerald-400 font-bold font-mono text-lg">
                            {formatCurrency(auction.current_bid || 0)}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] font-mono">
                             <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                +{lastBid ? lastBid.increment : 0}
                             </span>
                             <span className="text-emerald-500 flex items-center gap-0.5">
                                <TrendingUp className="w-3 h-3" />
                                {changePercentage}%
                             </span>
                          </div>
                       </div>
                    </td>

                    {/* 6. الحالة */}
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${statusInfo.className}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {auction.status_label || statusInfo.label}
                      </span>
                    </td>

                    {/* 7. إجراء */}
                    <td className="px-6 py-5">
                      <LoadingLink
                        href={`/carDetails/${auction.car_id}`}
                        className="group/btn inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:bg-primary hover:text-white transition-all duration-300 border border-white/10 hover:border-primary/50 shadow-sm"
                        title="عرض التفاصيل"
                      >
                        <ArrowUpRight className="w-5 h-5 transition-transform duration-300 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                      </LoadingLink>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={TABLE_COLUMNS.length}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
                          <AlertCircle className="w-8 h-8 opacity-50" />
                      </div>
                      <p className="text-lg font-medium">لا توجد بيانات للعرض</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
