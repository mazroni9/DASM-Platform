"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import Pusher, { Channel } from "pusher-js";

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_APP_KEY || "";
const PUSHER_CLUSTER =
  process.env.NEXT_PUBLIC_PUSHER_CLUSTER ||
  process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER ||
  "ap2";

interface PusherContextType {
  pusher: Pusher | null;
  isConnected: boolean;
  connectionError: string | null;
  subscribe: (channelName: string) => Channel | null;
  unsubscribe: (channelName: string) => void;
}

const PusherContext = createContext<PusherContextType | undefined>(undefined);

interface PusherProviderProps {
  children: ReactNode;
}

export function PusherProvider({ children }: PusherProviderProps) {
  const [pusher, setPusher] = useState<Pusher | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const pusherRef = useRef<Pusher | null>(null);

  // Initialize Pusher connection
  useEffect(() => {
    // Check if key is missing or is a placeholder
    if (!PUSHER_KEY || PUSHER_KEY.includes('your_pusher') || PUSHER_KEY === '') {
      console.warn("[PusherContext] Missing or invalid PUSHER_APP_KEY. Pusher will not be initialized.");
      setConnectionError(null); // Don't show error, just skip initialization
      return;
    }

    if (pusherRef.current) {
      return; // Already initialized
    }

    const pusherInstance = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    });

    // Connection state handlers
    pusherInstance.connection.bind("connected", () => {
      console.log("[PusherContext] Connected successfully");
      setIsConnected(true);
      setConnectionError(null);
    });

    pusherInstance.connection.bind("disconnected", () => {
      console.warn("[PusherContext] Disconnected");
      setIsConnected(false);
    });

    pusherInstance.connection.bind("error", (err: Error) => {
      console.error("[PusherContext] Connection error:", err);
      setIsConnected(false);
      setConnectionError("حدث خطأ في الاتصال بخادم التحديثات");
    });

    pusherInstance.connection.bind("connecting", () => {
      console.log("[PusherContext] Connecting...");
    });

    pusherInstance.connection.bind("unavailable", () => {
      console.warn("[PusherContext] Connection unavailable");
      setIsConnected(false);
      setConnectionError("خادم التحديثات غير متاح حالياً");
    });

    pusherRef.current = pusherInstance;
    setPusher(pusherInstance);

    // Cleanup on unmount
    return () => {
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
        setPusher(null);
        setIsConnected(false);
      }
    };
  }, []);

  // Subscribe to a channel
  const subscribe = useCallback((channelName: string): Channel | null => {
    if (!pusherRef.current) {
      console.warn("[PusherContext] Cannot subscribe - not connected");
      return null;
    }
    return pusherRef.current.subscribe(channelName);
  }, []);

  // Unsubscribe from a channel
  const unsubscribe = useCallback((channelName: string): void => {
    if (!pusherRef.current) return;
    pusherRef.current.unsubscribe(channelName);
  }, []);

  const value: PusherContextType = {
    pusher,
    isConnected,
    connectionError,
    subscribe,
    unsubscribe,
  };

  return (
    <PusherContext.Provider value={value}>{children}</PusherContext.Provider>
  );
}

// Hook for using Pusher context
export function usePusher() {
  const context = useContext(PusherContext);
  if (context === undefined) {
    throw new Error("usePusher must be used within a PusherProvider");
  }
  return context;
}

// Hook for subscribing to a specific channel
export function useChannel(channelName: string) {
  const { subscribe, unsubscribe, isConnected } = usePusher();
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    if (!isConnected || !channelName) return;

    const ch = subscribe(channelName);
    setChannel(ch);

    return () => {
      unsubscribe(channelName);
      setChannel(null);
    };
  }, [channelName, isConnected, subscribe, unsubscribe]);

  return channel;
}

// Hook for listening to events on a channel
export function useChannelEvent<T = unknown>(
  channelName: string,
  eventName: string,
  callback: (data: T) => void
) {
  const channel = useChannel(channelName);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!channel) return;

    const handler = (data: T) => {
      callbackRef.current(data);
    };

    channel.bind(eventName, handler);

    return () => {
      channel.unbind(eventName, handler);
    };
  }, [channel, eventName]);
}
