import { NextResponse } from "next/server";

/**
 * Server-side reverse geocode for bid UI labels only (city/region).
 * Uses Nominatim — respect usage policy; internal/audit context only.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const b = body as { lat?: unknown; lng?: unknown };
  const lat = Number(b.lat);
  const lng = Number(b.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "invalid_coordinates" }, { status: 400 });
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "out_of_range" }, { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      String(lat)
    )}&lon=${encodeURIComponent(String(lng))}&accept-language=ar,en`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "DASM-Platform/1.0 (bid audit geocode; https://github.com/mazroni9/DASM-Platform)",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ city: null, region: null });
    }
    const data = (await res.json()) as {
      address?: Record<string, string>;
    };
    const addr = data.address || {};
    const city =
      addr.city || addr.town || addr.village || addr.municipality || null;
    const region = addr.state || addr.region || addr.county || null;
    return NextResponse.json({
      city: city || null,
      region: region || null,
    });
  } catch {
    return NextResponse.json({ city: null, region: null });
  }
}
