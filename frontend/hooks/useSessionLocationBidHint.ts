"use client";

import { useCallback, useEffect, useState } from "react";
import { getClientConnectionSnapshot } from "@/lib/clientConnectionSnapshot";
import {
  ensureSessionLocationForBid,
  humanSessionLocationLine,
  type BidLocationAttachment,
} from "@/lib/sessionLocationCapture";

export function useSessionLocationBidHint() {
  const [line, setLine] = useState("الموقع الحالي غير متاح");
  const [snapshot, setSnapshot] = useState<BidLocationAttachment | null>(null);

  const refreshLine = useCallback((snap: BidLocationAttachment | null) => {
    setSnapshot(snap);
    setLine(humanSessionLocationLine(snap));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem("dasm_session_loc_snapshot_v1");
      if (raw) {
        const parsed = JSON.parse(raw) as BidLocationAttachment;
        refreshLine(parsed);
      }
    } catch {
      /* ignore */
    }
  }, [refreshLine]);

  const prepareForBidSubmit = useCallback(async () => {
    const snap = await ensureSessionLocationForBid();
    refreshLine(snap);
    const conn = getClientConnectionSnapshot();
    return {
      ...snap,
      session_location: {
        ...snap.session_location,
        online_status: conn.online_status,
        network_effective_type: conn.network_effective_type,
        network_downlink: conn.network_downlink,
      },
    };
  }, [refreshLine]);

  return { line, snapshot, prepareForBidSubmit };
}
