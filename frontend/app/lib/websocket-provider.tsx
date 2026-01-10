"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  handleNextCar: () => void;
  handleEndAuction: () => void;
  handleTogglePause: () => void;
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

  useEffect(() => {
    let isActive = true;
    let timeoutId: NodeJS.Timeout;

    const pollLiveStatus = async () => {
      if (!isActive) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/broadcast/live-status`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();

          if (data.status === "success" && data.data) {
            const { broadcast, car, auction, stats: liveStats } = data.data;

            // Update current car from broadcast data
            if (car) {
              setCurrentCar({
                id: car.id,
                make: car.make,
                model: car.model,
                year: car.year,
                current_price: auction?.current_bid || car.starting_price || 0,
                images: car.images || [],
              });
            }

            // Update auction status
            if (broadcast?.is_live) {
              setAuctionStatus("active");
            } else {
              setAuctionStatus("ended");
            }

            // Update stats if available
            if (liveStats) {
              setStats({
                viewerCount: liveStats.viewerCount || 0,
                bidderCount: liveStats.bidderCount || 0,
                totalBids: liveStats.totalBids || 0,
              });
            }

            setConnected(true);
          }
        } else {
          console.warn("Failed to fetch live status:", response.status);
          setConnected(false);
        }
      } catch (error) {
        console.error("Error polling live status:", error);
        setConnected(false);
      }

      // Schedule next poll only if component is still active
      if (isActive) {
        timeoutId = setTimeout(pollLiveStatus, 2000); // Poll every 2 seconds
      }
    };

    // Start initial poll
    pollLiveStatus();

    // Cleanup function
    return () => {
      isActive = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setConnected(false);
    };
  }, []);

  const handleNextCar = () => {
    // Implementation for moving to next car
  };

  const handleEndAuction = () => {
    setAuctionStatus("ended");
  };

  const handleTogglePause = () => {
    setAuctionStatus((prev) => (prev === "active" ? "paused" : "active"));
  };

  const value: WebSocketContextType = {
    currentCar,
    upcomingCars,
    bids,
    auctionStatus,
    stats,
    connected,
    handleNextCar,
    handleEndAuction,
    handleTogglePause,
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
