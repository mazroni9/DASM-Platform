/**
 * Read-only snapshot of browser connection hints for bid audit payloads.
 * Uses navigator.onLine + Network Information API when available; safe no-ops otherwise.
 */

export type ClientOnlineStatus = "online" | "offline";

export interface ClientConnectionSnapshot {
  online_status: ClientOnlineStatus;
  network_effective_type: string | null;
  network_downlink: number | null;
}

type NetworkInformationLike = {
  effectiveType?: string;
  downlink?: number;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function readNavigatorConnection(): NetworkInformationLike | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }
  const n = navigator as Navigator & {
    connection?: NetworkInformationLike;
    mozConnection?: NetworkInformationLike;
    webkitConnection?: NetworkInformationLike;
  };
  return n.connection ?? n.mozConnection ?? n.webkitConnection;
}

export function getClientConnectionSnapshot(): ClientConnectionSnapshot {
  if (typeof navigator === "undefined") {
    return {
      online_status: "offline",
      network_effective_type: null,
      network_downlink: null,
    };
  }

  const online = navigator.onLine === true;
  const conn = readNavigatorConnection();
  const etRaw = conn?.effectiveType;
  const et =
    typeof etRaw === "string" && etRaw.trim() !== ""
      ? etRaw.trim().slice(0, 32)
      : null;
  const dlRaw = conn?.downlink;
  const dl =
    typeof dlRaw === "number" && Number.isFinite(dlRaw) && dlRaw >= 0
      ? Math.round(dlRaw * 100) / 100
      : null;

  return {
    online_status: online ? "online" : "offline",
    network_effective_type: et,
    network_downlink: dl,
  };
}
