// app/api/nft/route.ts
import { NextRequest, NextResponse } from "next/server";

// Ensure this route is dynamic (no ISR caching)
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();

  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });
  }

  // Upstream expects ?n= (NOT ?id=)
  const upstream = `https://madcatch.xyz/mad-nft.php?n=${encodeURIComponent(id)}`;

  try {
    const res = await fetch(upstream, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    const text = await res.text(); // Read as text first to preserve any error body

    if (!res.ok) {
      // Bubble up upstream error text so you can see it in Network panel
      return NextResponse.json({ error: "Upstream error", detail: text }, { status: 502 });
    }

    // Some hosts may include BOM or whitespace — parse safely
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      // ignore, will fail on next line
    }

    if (!data?.url) {
      return NextResponse.json({ error: "No image URL from upstream", detail: text }, { status: 502 });
    }

    return NextResponse.json(
      { url: data.url },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: "Proxy failed", message: e.message }, { status: 500 });
  }
}
