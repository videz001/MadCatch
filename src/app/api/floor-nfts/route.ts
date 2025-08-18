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

// Query A: limit on root; response at listings.listings
const QUERY_A = `
  query($collection:String!, $limit:Int!) {
    listings(filter:{collectionAddr:$collection}, sortBy:PRICE_ASC, limit:$limit) {
      listings { tokenId status price denom token { name media { image preview thumbnail original url } } }
    }
  }`;

// Query B: pagination.limit; response at listings.nodes
const QUERY_B = `
  query($collection:String!, $limit:Int!) {
    listings(filter:{collectionAddr:$collection}, sortBy:PRICE_ASC, pagination:{limit:$limit}) {
      nodes { tokenId status price denom token { name media { image preview thumbnail original url } } }
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
  const root = json?.data?.listings ?? {};
  const arr = root.listings ?? root.nodes ?? [];
  if (!Array.isArray(arr)) throw new Error(`Unexpected shape: ${Object.keys(root || {})}`);
  return arr as any[];
}

export async function GET(req: NextRequest) {
  const debug = req.nextUrl.searchParams.get("debug") === "1";
  const diag: Record<string, any> = { tried: [] };

  try {
    let items: any[] = [];
    let used: { endpoint?: string; query?: "A" | "B" } = {};

    for (const ep of ENDPOINTS) {
      try {
        items = await runQuery(ep, QUERY_A, { collection: COLLECTION_ADDR, limit: LIMIT });
        used = { endpoint: ep, query: "A" };
        break;
      } catch (eA) {
        diag.tried.push({ endpoint: ep, query: "A", error: String(eA) });
        try {
          items = await runQuery(ep, QUERY_B, { collection: COLLECTION_ADDR, limit: LIMIT });
          used = { endpoint: ep, query: "B" };
          break;
        } catch (eB) {
          diag.tried.push({ endpoint: ep, query: "B", error: String(eB) });
        }
      }
    }

    // Filter for active/for-sale if status is present
    const filtered = items.filter((it) => {
      const s = String(it?.status || "");
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

    if (!nfts.length) {
      return NextResponse.json(
        { error: "No listings found", hint: "Indexer may be empty/lagging. Try debug=1 for details.", diag },
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
