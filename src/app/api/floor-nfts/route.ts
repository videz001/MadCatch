
// app/api/floor-nfts/route.ts
import { NextResponse } from "next/server";
import type { Nft } from "@/lib/types";

// Dynamic; no cache
export const dynamic = "force-dynamic";

const ENDPOINTS = [
  process.env.STARGAZE_GRAPHQL_URL?.trim(),
  "https://constellations-api.mainnet.stargaze-apis.com/graphql",
  "https://graphql.mainnet.stargaze-apis.com/graphql",
].filter(Boolean) as string[];

const COLLECTION_ADDR =
  process.env.STARGAZE_COLLECTION_ADDR ??
  "stars1v8avajk64z7pppeu45ce6vv8wuxmwacdff484lqvv0vnka0cwgdqdk64sf";

const LIMIT = 5;

// Query A: some builds use `limit` on root and return `listings.listings`
const QUERY_A = /* GraphQL */ `
  query FloorListingsA($collection: String!, $limit: Int!) {
    listings(
      filter: { collectionAddr: $collection, status: ACTIVE }
      sortBy: PRICE_ASC
      limit: $limit
    ) {
      listings {
        tokenId
        price
        denom
        token {
          name
          media { image preview thumbnail original url }
        }
      }
    }
  }
`;

// Query B: others use `pagination { limit }` and return `listings.nodes`
const QUERY_B = /* GraphQL */ `
  query FloorListingsB($collection: String!, $limit: Int!) {
    listings(
      filter: { collectionAddr: $collection, status: ACTIVE }
      sortBy: PRICE_ASC
      pagination: { limit: $limit }
    ) {
      nodes {
        tokenId
        price
        denom
        token {
          name
          media { image preview thumbnail original url }
        }
      }
    }
  }
`;

function toHttp(u?: string): string {
  if (!u) return "";
  return u.startsWith("ipfs://")
    ? "https://cloudflare-ipfs.com/ipfs/" + u.slice("ipfs://".length)
    : u;
}
function pickMedia(m?: any): string {
  if (!m) return "";
  return m.image || m.preview || m.thumbnail || m.original || m.url || "";
}

async function tryQuery(endpoint: string, query: string) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      query,
      variables: { collection: COLLECTION_ADDR, limit: LIMIT },
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${endpoint}: ${text.slice(0, 500)}`);
  }

  let json: any;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error(`Non-JSON from ${endpoint}: ${text.slice(0, 200)}`);
  }

  if (json.errors) {
    throw new Error(`GraphQL errors from ${endpoint}: ${JSON.stringify(json.errors)}`);
  }

  const root = json?.data?.listings ?? {};
  const arr = root.listings ?? root.nodes ?? (Array.isArray(root) ? root : []);
  if (!Array.isArray(arr)) {
    throw new Error(`Unexpected shape from ${endpoint}: ${JSON.stringify(Object.keys(root || {}))}`);
  }
  return arr as any[];
}

export async function GET() {
  try {
    let items: any[] = [];

    // Try all endpoints with Query A, then Query B
    for (const ep of ENDPOINTS) {
      try {
        items = await tryQuery(ep, QUERY_A);
        if (items.length) break;
      } catch (_) {
        // fall through and try B
        try {
          items = await tryQuery(ep, QUERY_B);
          if (items.length) break;
        } catch {
          // continue to next endpoint
        }
      }
    }

    if (!items.length) {
      // Surface a helpful error to the client
      return NextResponse.json(
        { error: "No active listings found for collection.", hint: "Indexer may be lagging or schema differs." },
        { status: 502 }
      );
    }

    const nfts: Nft[] = items.slice(0, LIMIT).map((it: any) => ({
      id: String(it?.tokenId ?? ""),
      name: it?.token?.name || `#${it?.tokenId}`,
      imageUrl: toHttp(pickMedia(it?.token?.media)),
    }));

    return NextResponse.json(nfts, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    console.error("[floor-nfts] Failure:", e?.stack || e);
    return NextResponse.json(
      { error: "Failed to fetch floor NFTs", message: String(e?.message || e) },
      { status: 500 }
    );
  }
}
