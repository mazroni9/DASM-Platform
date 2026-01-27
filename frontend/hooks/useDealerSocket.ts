// hooks/useDealerSocket.ts
"use client";

import { useEffect, useRef, useCallback } from "react";
import Pusher from "pusher-js";
import { useDealerStore, AiRecommendation } from "@/store/dealerStore";

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || "";
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu";

interface UseDealerSocketOptions {
  userId: number;
  authToken: string;
  aiEnabled: boolean;
}

export function useDealerSocket({
  userId,
  authToken,
  aiEnabled,
}: UseDealerSocketOptions) {
  const pusherRef = useRef<Pusher | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pingStartRef = useRef<number>(0);

  const {
    setConnectionStatus,
    setWallet,
    updateAuctionPrice,
    addAiRecommendation,
    clearAiRecommendations,
  } = useDealerStore();

  // Initialize Pusher
  const initPusher = useCallback(() => {
    if (pusherRef.current) return;

    // Check if key is missing or is a placeholder
    if (!PUSHER_KEY || PUSHER_KEY.includes('your_pusher') || PUSHER_KEY === '') {
      console.warn("[DealerSocket] Missing or invalid PUSHER_KEY. Pusher will not be initialized.");
      return;
    }

    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      authEndpoint: "/api/broadcasting/auth",
      auth: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    // Connection state handling
    pusher.connection.bind("connected", () => {
      setConnectionStatus(true, 0);
    });

    pusher.connection.bind("disconnected", () => {
      setConnectionStatus(false, 0);
    });

    pusher.connection.bind("error", (err: any) => {
      console.error("[DealerSocket] Error:", err);
      setConnectionStatus(false, 999);
    });

    pusherRef.current = pusher;
    return pusher;
  }, [authToken, setConnectionStatus]);

  // Subscribe to channels
  const subscribeToChannels = useCallback(() => {
    const pusher = pusherRef.current;
    if (!pusher || !userId) return;

    // Private Wallet channel
    const walletChannel = pusher.subscribe(`private-dealer.${userId}.wallet`);
    walletChannel.bind("balance-updated", (data: any) => {
      setWallet({
        availableBalance: data.available_balance,
        fundedBalance: data.funded_balance,
        onHold: data.on_hold,
      });
    });

    // Private System channel (for latency pong)
    const systemChannel = pusher.subscribe(`private-dealer.${userId}.system`);
    systemChannel.bind("pong", (data: any) => {
      const latency = Date.now() - pingStartRef.current;
      setConnectionStatus(true, latency);
    });

    // AI Recommendations channel (only if enabled)
    if (aiEnabled) {
      const aiChannel = pusher.subscribe(`private-dealer.${userId}.ai`);
      aiChannel.bind("opportunity-detected", (data: any) => {
        const recommendation: AiRecommendation = {
          vehicleId: data.vehicle_id,
          name: data.name,
          discountPercentage: data.discount_percentage,
          reason: data.reason,
          confidenceScore: data.confidence_score,
          currentPrice: data.current_price,
          marketPrice: data.market_price,
          timestamp: data.timestamp,
        };
        addAiRecommendation(recommendation);
      });
    }

    return () => {
      pusher.unsubscribe(`private-dealer.${userId}.wallet`);
      pusher.unsubscribe(`private-dealer.${userId}.system`);
      if (aiEnabled) {
        pusher.unsubscribe(`private-dealer.${userId}.ai`);
      }
    };
  }, [userId, aiEnabled, setWallet, setConnectionStatus, addAiRecommendation]);

  // Subscribe to auction channel
  const subscribeToAuction = useCallback(
    (auctionId: number) => {
      const pusher = pusherRef.current;
      if (!pusher) return;

      const channel = pusher.subscribe(`auction.${auctionId}`);
      channel.bind("price-updated", (data: any) => {
        updateAuctionPrice(data.auction_id, data.price, data.end_time);
      });

      return () => {
        pusher.unsubscribe(`auction.${auctionId}`);
      };
    },
    [updateAuctionPrice]
  );

  // Latency ping - Real measurement using API
  const startLatencyPing = useCallback(() => {
    if (pingIntervalRef.current) return;

    pingIntervalRef.current = setInterval(async () => {
      const pusher = pusherRef.current;
      if (pusher?.connection.state === "connected") {
        const start = performance.now();
        try {
          // Simple ping to measure round-trip time
          await fetch("/api/health", {
            method: "HEAD",
            cache: "no-store",
          });
          const latency = Math.round(performance.now() - start);
          setConnectionStatus(true, latency);
        } catch {
          // If ping fails, still mark as connected but with unknown latency
          setConnectionStatus(true, -1);
        }
      } else {
        setConnectionStatus(false, 0);
      }
    }, 5000);
  }, [setConnectionStatus]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, []);

  // Handle AI toggle changes
  useEffect(() => {
    const pusher = pusherRef.current;
    if (!pusher || !userId) return;

    if (aiEnabled) {
      const aiChannel = pusher.subscribe(`private-dealer.${userId}.ai`);
      aiChannel.bind("opportunity-detected", (data: any) => {
        const recommendation: AiRecommendation = {
          vehicleId: data.vehicle_id,
          name: data.name,
          discountPercentage: data.discount_percentage,
          reason: data.reason,
          confidenceScore: data.confidence_score,
          currentPrice: data.current_price,
          marketPrice: data.market_price,
          timestamp: data.timestamp,
        };
        addAiRecommendation(recommendation);
      });
    } else {
      pusher.unsubscribe(`private-dealer.${userId}.ai`);
      clearAiRecommendations();
    }
  }, [aiEnabled, userId, addAiRecommendation, clearAiRecommendations]);

  return {
    initPusher,
    subscribeToChannels,
    subscribeToAuction,
    startLatencyPing,
    disconnect: () => {
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    },
  };
}
