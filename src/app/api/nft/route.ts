// app/api/nft/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const upstream = `https://madcatch.xyz/mad-nft.php?id=${encodeURIComponent(id)}`;

  try {
    const res = await fetch(upstream, { cache: "no-store", headers: { Accept: "application/json" } });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "Upstream error", detail: text }, { status: 502 });
    }
    const data = await res.json();
    if (!data?.url) return NextResponse.json({ error: "No image URL" }, { status: 502 });
    return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (e: any) {
    return NextResponse.json({ error: "Fetch failed", message: e.message }, { status: 500 });
  }
}
