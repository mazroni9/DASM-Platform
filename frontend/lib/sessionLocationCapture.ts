/**
 * Browser session geolocation for bid audit (current_session_location).
 * Separate from profile display_location — never mixed.
 * Coordinates are sent to backend only; UI uses city/region or a generic line.
 */

export type SessionPermissionState =
  | "granted"
  | "denied"
  | "unavailable"
  | "prompt"
  | "prompt_dismissed";

export type SessionGeolocationSource = "browser" | "none";

export interface SessionLocationApiShape {
  permission_state: SessionPermissionState;
  geolocation_source: SessionGeolocationSource;
  latitude: number | null;
  longitude: number | null;
  accuracy_meters: number | null;
  city: string | null;
  region: string | null;
  captured_at: string | null;
  /** Filled at bid submit from navigator.onLine */
  online_status?: "online" | "offline" | null;
  /** Network Information API effectiveType when supported */
  network_effective_type?: string | null;
  network_downlink?: number | null;
  risk_flags?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface BidLocationAttachment {
  client_session_id: string;
  session_location: SessionLocationApiShape;
}

const STORAGE_SESSION = "dasm_client_session_id";
const STORAGE_SNAPSHOT = "dasm_session_loc_snapshot_v1";

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getOrCreateClientSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem(STORAGE_SESSION);
    if (!id) {
      id = randomId();
      sessionStorage.setItem(STORAGE_SESSION, id);
    }
    return id;
  } catch {
    return randomId();
  }
}

function readCached(): BidLocationAttachment | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_SNAPSHOT);
    if (!raw) return null;
    return JSON.parse(raw) as BidLocationAttachment;
  } catch {
    return null;
  }
}

function writeCached(v: BidLocationAttachment): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_SNAPSHOT, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

function emptyPayload(
  permission: SessionPermissionState,
  source: SessionGeolocationSource = "none"
): BidLocationAttachment {
  return {
    client_session_id: getOrCreateClientSessionId(),
    session_location: {
      permission_state: permission,
      geolocation_source: source,
      latitude: null,
      longitude: null,
      accuracy_meters: null,
      city: null,
      region: null,
      captured_at: null,
      risk_flags: null,
      metadata: { phase: "collection_v1" },
    },
  };
}

async function reverseGeocodeClient(
  lat: number,
  lng: number
): Promise<{ city: string | null; region: string | null }> {
  try {
    const res = await fetch("/api/reverse-geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng }),
    });
    if (!res.ok) return { city: null, region: null };
    const data = (await res.json()) as {
      city?: string | null;
      region?: string | null;
    };
    return {
      city: typeof data.city === "string" ? data.city : null,
      region: typeof data.region === "string" ? data.region : null,
    };
  } catch {
    return { city: null, region: null };
  }
}

let inflight: Promise<BidLocationAttachment> | null = null;

/**
 * Single-flight capture for the tab: first call runs geolocation (if possible);
 * later calls return the same snapshot unless clearSessionLocationSnapshot() is used.
 */
export function ensureSessionLocationForBid(): Promise<BidLocationAttachment> {
  if (typeof window === "undefined") {
    return Promise.resolve(emptyPayload("unavailable"));
  }
  const cached = readCached();
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;

  inflight = (async () => {
    const base = emptyPayload("unavailable");

    if (!("geolocation" in navigator)) {
      base.session_location.permission_state = "unavailable";
      writeCached(base);
      return base;
    }

    let perm: SessionPermissionState = "prompt";
    try {
      const q = await navigator.permissions?.query({ name: "geolocation" });
      if (q?.state === "granted") perm = "granted";
      else if (q?.state === "denied") perm = "denied";
      else perm = "prompt";
    } catch {
      perm = "prompt";
    }

    if (perm === "denied") {
      base.session_location.permission_state = "denied";
      base.session_location.geolocation_source = "none";
      writeCached(base);
      return base;
    }

    const pos = await new Promise<GeolocationPosition | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve(p),
        () => resolve(null),
        { enableHighAccuracy: false, maximumAge: 120_000, timeout: 12_000 }
      );
    });

    if (!pos) {
      base.session_location.permission_state =
        perm === "granted" ? "unavailable" : "denied";
      base.session_location.geolocation_source = "none";
      writeCached(base);
      return base;
    }

    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const acc =
      typeof pos.coords.accuracy === "number" && !Number.isNaN(pos.coords.accuracy)
        ? pos.coords.accuracy
        : null;

    const geo = await reverseGeocodeClient(lat, lng);
    const city = geo.city;
    const region = geo.region;

    const out: BidLocationAttachment = {
      client_session_id: getOrCreateClientSessionId(),
      session_location: {
        permission_state: "granted",
        geolocation_source: "browser",
        latitude: lat,
        longitude: lng,
        accuracy_meters: acc,
        city,
        region,
        captured_at: new Date().toISOString(),
        risk_flags: null,
        metadata: { phase: "collection_v1" },
      },
    };
    writeCached(out);
    return out;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

export function humanSessionLocationLine(
  snap: BidLocationAttachment | null
): string {
  if (!snap) return "الموقع الحالي غير متاح";
  const sl = snap.session_location;
  if (sl.permission_state === "denied") {
    return "الموقع الحالي غير متاح";
  }
  if (sl.permission_state === "unavailable") {
    return "الموقع الحالي غير متاح";
  }
  if (sl.city) {
    return `موقعك الحالي: ${sl.city}`;
  }
  if (sl.region) {
    return `موقعك الحالي: ${sl.region}`;
  }
  if (sl.geolocation_source === "browser" && sl.latitude != null) {
    return "موقع تقريبي مسجّل";
  }
  return "الموقع الحالي غير متاح";
}
