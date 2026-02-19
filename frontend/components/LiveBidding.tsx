"use client";

import { useMemo } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { User, Clock, Users } from "lucide-react";

type RawBid = {
  bid_amount?: number | string;
  created_at?: string;
  bidder_name?: string;
  source?: "online" | "onsite";
};

type Bid = {
  id: string;
  amount: number;
  timestamp: string;
  bidder_name: string;
  source: "online" | "onsite";
  is_winning: boolean;
};

interface LiveBiddingProps {
  data?: {
    bids?: RawBid[];
  };
}

function formatTimeAgo(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  return `${Math.floor(diffInSeconds / 3600)}h ago`;
}

export default function LiveBidding({ data }: LiveBiddingProps) {
  const bids = useMemo<Bid[]>(() => {
    const source = Array.isArray(data?.bids) ? data.bids : [];

    const normalized = source
      .map((item, index) => {
        const amount = Number(item?.bid_amount ?? 0);
        const timestamp = item?.created_at || new Date(0).toISOString();

        return {
          id: `${timestamp}-${index}`,
          amount,
          timestamp,
          bidder_name: item?.bidder_name || "Unknown bidder",
          source: item?.source === "onsite" ? "onsite" : "online",
          is_winning: false,
        } as Bid;
      })
      .filter((item) => Number.isFinite(item.amount) && item.amount > 0)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    if (normalized.length > 0) {
      normalized[0].is_winning = true;
    }

    return normalized;
  }, [data?.bids]);

  return (
    <div className="bg-card rounded-xl shadow-md overflow-hidden">
      <div className="p-4 bg-primary text-white">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Live Bids</h3>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-green-400 rounded-full mr-1.5 animate-pulse" />
            <span className="text-sm">Live</span>
          </div>
        </div>
      </div>

      <div className="p-2">
        <div className="flex mb-2 text-xs text-foreground/70 justify-between px-2">
          <div className="flex rtl:space-x-reverse space-x-2">
            <div className="bg-green-500/10 text-green-700 rounded-full px-2 py-0.5 flex items-center">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-1" />
              <span>On-site</span>
            </div>
            <div className="bg-blue-500/10 text-blue-700 rounded-full px-2 py-0.5 flex items-center">
              <div className="h-2 w-2 bg-blue-500 rounded-full mr-1" />
              <span>Online</span>
            </div>
          </div>
          <span>Latest 10 bids</span>
        </div>

        {bids.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No bids yet.</div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto p-1">
            {bids.map((bid) => (
              <div
                key={bid.id}
                className={`flex items-center justify-between rounded-lg p-2.5 ${
                  bid.source === "online"
                    ? "bg-blue-500/10 border-l-4 border-blue-400"
                    : "bg-green-500/10 border-l-4 border-green-400"
                } ${bid.is_winning ? "ring-2 ring-yellow-400" : ""}`}
              >
                <div className="flex items-center">
                  <div
                    className={`rounded-full p-1.5 flex-shrink-0 mr-2 ${
                      bid.source === "online"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    <User size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{bid.bidder_name}</p>
                    <div className="flex items-center text-xs text-foreground/70 mt-0.5">
                      <Clock size={12} className="mr-1" />
                      <span>{formatTimeAgo(bid.timestamp)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div
                    className={`text-lg font-bold ${
                      bid.is_winning ? "text-yellow-600" : "text-foreground/80"
                    }`}
                  >
                    {formatCurrency(bid.amount)}
                  </div>
                  {bid.is_winning && (
                    <div className="text-xs text-yellow-600 font-medium">Current leading bid</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 p-2 border-t border-border">
          <div className="flex justify-between items-center">
            <div className="flex items-center text-foreground/70 text-sm">
              <Users size={16} className="mr-1.5" />
              <span>
                Bids: <span className="font-medium">{bids.length}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
