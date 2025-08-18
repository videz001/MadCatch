
// app/api/floor-nfts/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { Nft } from "@/lib/types";

export const dynamic = "force-dynamic";

const ENDPOINTS = [
  process.env.STARGAZE_GRAPHQL_URL?.trim(),
  "https://constellations-api.mainnet.stargaze-apis.com/graphql",
  "https://graphql.mainnet.stargaze-apis.com/graphql",
].filter(Boolean) as string[];

const COLLECTION_ADDR =
  process.env.STARGAZE_COLLECTION_ADDR
  ?? "stars1v8avajk64z7pppeu45ce6vv8wuxmwacdff484lqvv0vnka0cwgdqdk64sf";

const LIMIT = 5;

// Corrected query using 'activeListings' which seems to be the current schema.
// This query shape is based on common Stargaze indexer patterns.
const QUERY = `
  query($collection:String!, $limit:Int!) {
    activeListings(collectionAddr:$collection, sortBy:PRICE_ASC, limit:$limit) {
      tokenId 
      status 
      price 
      denom 
      token { 
        name 
        media { image preview thumbnail original url } 
      }
    }
  }`;


const pickMedia = (m?: any) =>
  (m?.image || m?.preview || m?.thumbnail || m?.original || m?.url || "") as string;

const toHttp = (u?: string) =>
  !u ? "" : u.startsWith("ipfs://") ? "https://cloudflare-ipfs.com/ipfs/" + u.slice(7) : u;

async function runQuery(endpoint: string, query: string, vars: any) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    cache: "no-store",
    body: JSON.stringify({ query, variables: vars }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${endpoint}: ${text.slice(0, 400)}`);
  const json = JSON.parse(text);
  if (json.errors) throw new Error(`GraphQL errors from ${endpoint}: ${JSON.stringify(json.errors)}`);
  
  // The response for activeListings is expected to be a direct array
  const arr = json?.data?.activeListings ?? [];
  if (!Array.isArray(arr)) throw new Error(`Unexpected shape: expected 'activeListings' to be an array.`);
  return arr as any[];
}

export async function GET(req: NextRequest) {
  const debug = req.nextUrl.searchParams.get("debug") === "1";
  const diag: Record<string, any> = { tried: [] };

  try {
    let items: any[] = [];
    let used: { endpoint?: string } = {};

    for (const ep of ENDPOINTS) {
      try {
        items = await runQuery(ep, QUERY, { collection: COLLECTION_ADDR, limit: LIMIT });
        used = { endpoint: ep };
        break; // Success, stop trying endpoints
      } catch (e) {
        diag.tried.push({ endpoint: ep, error: String(e) });
      }
    }
    
    // Filter for active/for-sale if status is present
    const filtered = items.filter((it) => {
      const s = String(it?.status || "").toUpperCase();
      return !s || s === "ACTIVE" || s === "LISTED"; // tolerate unknown enums
    });

    const nfts: Nft[] = (filtered.length ? filtered : items).slice(0, LIMIT).map((it: any) => ({
      id: String(it?.tokenId ?? ""),
      name: it?.token?.name || `#${it?.tokenId}`,
      imageUrl: toHttp(pickMedia(it?.token?.media)),
    }));

    if (debug) {
      return NextResponse.json({ used, count: nfts.length, sample: nfts[0] || null, diag });
    }

    if (!nfts.length && diag.tried.length > 0) {
      return NextResponse.json(
        { error: "No listings found", hint: "Indexer may be empty/lagging or schema changed. See diag for details.", diag },
        { status: 502 }
      );
    }

    return NextResponse.json(nfts, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    console.error("[floor-nfts]", e?.stack || e);
    return NextResponse.json(
      { error: "Failed to fetch floor NFTs", message: String(e?.message || e), diag },
      { status: 500 }
    );
  }
}
