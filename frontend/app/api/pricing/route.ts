import { NextRequest, NextResponse } from "next/server";

const AI_ENGINE_URL =
  process.env.AI_ENGINE_URL ||
  "https://lobster-app-ba3dk.ondigitalocean.app/api/v1/pricing/estimate";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Basic validation
    const required = ["make", "model", "year", "mileage", "condition", "city"];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return NextResponse.json(
          { error: `الحقل ${field} مطلوب` },
          { status: 400 }
        );
      }
    }

    const upstream = await fetch(AI_ENGINE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        make: String(body.make),
        model: String(body.model),
        year: Number(body.year),
        mileage: Number(body.mileage),
        condition: String(body.condition),
        city: String(body.city),
      }),
      // 30s timeout
      signal: AbortSignal.timeout(30_000),
    });

    const data = await upstream.json();

    return NextResponse.json(data, { status: upstream.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[pricing-proxy] error:", message);
    return NextResponse.json(
      { error: "تعذّر الوصول إلى محرك التسعير، حاول مجدداً." },
      { status: 502 }
    );
  }
}
