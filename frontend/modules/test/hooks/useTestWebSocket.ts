<<<<<<< HEAD
import { useEffect, useState, useCallback } from "react";
import Pusher from "pusher-js";
import type { TestResult } from "../types";

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_APP_KEY || "";
const PUSHER_CLUSTER =
  process.env.NEXT_PUBLIC_PUSHER_CLUSTER ||
  process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER ||
  "ap2";
=======
import { useEffect, useState, useCallback } from 'react';
import Pusher from 'pusher-js';
import type { TestResult } from '../types';

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '';
const PUSHER_CLUSTER =
  process.env.NEXT_PUBLIC_PUSHER_CLUSTER ||
  process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER ||
  'ap2';
>>>>>>> e7da2df1 (fix conflict)

interface UseTestWebSocketReturn {
  connected: boolean;
  latestResult: TestResult | null;
}

export function useTestWebSocket(): UseTestWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [latestResult, setLatestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    if (!PUSHER_KEY) {
      console.warn("Pusher key not configured");
      return;
    }

    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      //forceTLS: true,
    });

    const channel = pusher.subscribe("admin.auction-tests");

    channel.bind("pusher:subscription_succeeded", () => {
      setConnected(true);
    });

    channel.bind("AuctionTestResultUpdated", (data: { test_result: any }) => {
      if (data.test_result) {
        setLatestResult(data.test_result as TestResult);
      }
    });

    channel.bind("pusher:error", (error: any) => {
      console.error("Pusher error:", error);
      setConnected(false);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
      setConnected(false);
    };
  }, []);

  return {
    connected,
    latestResult,
  };
}
