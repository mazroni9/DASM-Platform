/**
 * Lightweight health check for connection quality measurement only.
 * Path is outside /api to avoid Laravel rewrite - no DB, no auth.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json(
    { ok: true, time: new Date().toISOString() },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  );
}
