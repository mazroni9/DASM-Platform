"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import Pusher from "pusher-js";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_APP_KEY || "";
const PUSHER_CLUSTER =
  process.env.NEXT_PUBLIC_PUSHER_CLUSTER ||
  process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER ||
  "ap2";

const buildApiUrl = (path: string) => {
  if (!API_BASE_URL) return path;

  const normalized = API_BASE_URL.replace(/\/$/, "");
  if (normalized.endsWith("/api")) {
    return `${normalized}${path.replace(/^\/api/, "")}`;
  }
  return `${normalized}${path}`;
};

export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  current_price: number;
  images: string[];
  title?: string;
  mileage?: number;
  condition?: string;
  min_price?: number;
}

export interface Bid {
  id: number;
  amount: number;
  bidder_name: string;
  created_at: string;
  is_online?: boolean;
  timestamp?: string;
}

interface Stats {
  viewerCount: number;
  bidderCount: number;
  totalBids: number;
}

interface WebSocketContextType {
  currentCar: Car | null;
  upcomingCars: Car[];
  bids: Bid[];
  auctionStatus: "active" | "paused" | "ended";
  stats: Stats;
  connected: boolean;
  connectionError: string | null;
  handleNextCar: () => void;
  handleEndAuction: () => void;
  handleTogglePause: () => void;
  refreshData: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [currentCar, setCurrentCar] = useState<Car | null>(null);
  const [upcomingCars, setUpcomingCars] = useState<Car[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [auctionStatus, setAuctionStatus] = useState<
    "active" | "paused" | "ended"
  >("active");
  const [stats, setStats] = useState<Stats>({
    viewerCount: 0,
    bidderCount: 0,
    totalBids: 0,
  });
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Fetch initial data
  const fetchLiveStatus = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl("/api/broadcast"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.status === "success" && data.data) {
          const broadcast = data.data;
          const auction = data.data.auction;
          const car = auction?.car;

          // Update current car from broadcast data
          if (car) {
            setCurrentCar({
              id: car.id,
              make: car.make,
              model: car.model,
              year: car.year,
              current_price:
                auction?.current_bid || car.evaluation_price || 0,
              images: car.images || [],
            });
          } else {
            setCurrentCar(null);
          }

          // Update auction status
          if (broadcast?.is_live) {
            setAuctionStatus("active");
          } else {
            setAuctionStatus("ended");
          }
        } else {
          setCurrentCar(null);
          setAuctionStatus("ended");
        }
      } else {
        console.warn("Failed to fetch live status:", response.status);
      }
    } catch (error) {
      console.error("Error fetching live status:", error);
    }
  }, []);

  // WebSocket connection via Pusher
  useEffect(() => {
    // Check if key is missing or is a placeholder
    if (!PUSHER_KEY || PUSHER_KEY.includes('your_pusher') || PUSHER_KEY === '') {
      console.warn("[WebSocketProvider] Missing or invalid PUSHER_APP_KEY. Pusher will not be initialized.");
      setConnectionError(null);
      return;
    }

    // Fetch initial data
    fetchLiveStatus();

    // Initialize Pusher
    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    });

    // Connection state handlers
    pusher.connection.bind("connected", () => {
      console.log("[WebSocketProvider] Connected to Pusher");
      setConnected(true);
      setConnectionError(null);
    });

    pusher.connection.bind("disconnected", () => {
      console.warn("[WebSocketProvider] Disconnected from Pusher");
      setConnected(false);
    });

    pusher.connection.bind("error", (err: Error) => {
      console.error("[WebSocketProvider] Connection error:", err);
      setConnected(false);
      setConnectionError("حدث خطأ في الاتصال");
    });

    // Subscribe to live auction channel
    const channel = pusher.subscribe("auction.live");

    // Listen for live market bid events
    channel.bind(
      "LiveMarketBidEvent",
      (data: {
        bidder_id: number;
        auction_id: number;
        bid_amount: number;
        car_make: string;
        car_model: string;
        car_year: number;
        current_bid: number;
        message: string;
        timestamp: string;
      }) => {
        console.log("[WebSocketProvider] Received LiveMarketBidEvent:", data);

        // Update current car price
        setCurrentCar((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            current_price: data.current_bid,
          };
        });

        // Add new bid to bids list
        setBids((prev) => [
          {
            id: Date.now(),
            amount: data.bid_amount,
            bidder_name: `مزايد #${data.bidder_id.toString().slice(-4)}`,
            created_at: data.timestamp,
            is_online: true,
          },
          ...prev.slice(0, 9), // Keep last 10 bids
        ]);

        // Update stats
        setStats((prev) => ({
          ...prev,
          totalBids: prev.totalBids + 1,
        }));
      }
    );

    // Listen for auction status changes
    channel.bind(
      "AuctionStatusChangedEvent",
      (data: {
        auction_id: number;
        car_id: number;
        old_status: string;
        new_status: string;
        current_bid: number;
      }) => {
        console.log(
          "[WebSocketProvider] Received AuctionStatusChangedEvent:",
          data
        );

        // Update auction status
        if (data.new_status === "live" || data.new_status === "active") {
          setAuctionStatus("active");
        } else if (
          data.new_status === "ended" ||
          data.new_status === "completed"
        ) {
          setAuctionStatus("ended");
        }

        // Refresh data to get updated car info
        fetchLiveStatus();
      }
    );

    // Listen for car approval events
    channel.bind("CarApprovedForLiveEvent", () => {
      console.log(
        "[WebSocketProvider] Car approved for live - refreshing data"
      );
      fetchLiveStatus();
    });

    // Cleanup
    return () => {
      pusher.unsubscribe("auction.live");
      pusher.disconnect();
      setConnected(false);
    };
  }, [fetchLiveStatus]);

  const handleNextCar = useCallback(() => {
    // Refresh to get next car
    fetchLiveStatus();
  }, [fetchLiveStatus]);

  const handleEndAuction = useCallback(() => {
    setAuctionStatus("ended");
  }, []);

  const handleTogglePause = useCallback(() => {
    setAuctionStatus((prev) => (prev === "active" ? "paused" : "active"));
  }, []);

  const refreshData = useCallback(() => {
    fetchLiveStatus();
  }, [fetchLiveStatus]);

  const value: WebSocketContextType = {
    currentCar,
    upcomingCars,
    bids,
    auctionStatus,
    stats,
    connected,
    connectionError,
    handleNextCar,
    handleEndAuction,
    handleTogglePause,
    refreshData,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
