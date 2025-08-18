// app/api/floor-nfts/route.ts
import { NextResponse } from "next/server";
import type { Nft } from "@/lib/types";

// Ensure this route is dynamic and not cached
export const dynamic = "force-dynamic";

// You can toggle between the two official endpoints:
const ENDPOINT = process.env.STARGAZE_GRAPHQL_URL
  ?? "https://constellations-api.mainnet.stargaze-apis.com/graphql";
// Alt: "https://graphql.mainnet.stargaze-apis.com/graphql" (same data) 

const COLLECTION_ADDR =
  process.env.STARGAZE_COLLECTION_ADDR
  ?? "stars1v8avajk64z7pppeu45ce6vv8wuxmwacdff484lqvv0vnka0cwgdqdk64sf";

const LIMIT = 5;

// Constellations schema: listings -> listings[] (not nodes)
const QUERY = /* GraphQL */ `
  query FloorListings($collection: String!, $limit: Int!) {
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
          media {
            image
            preview
            thumbnail
            original
            url
          }
        }
      }
    }
  }
`;

// Normalize ipfs:// URIs to an HTTP gateway
function toHttp(u?: string): string {
  if (!u) return "";
  return u.startsWith("ipfs://")
    ? "https://cloudflare-ipfs.com/ipfs/" + u.slice("ipfs://".length)
    : u;
}

// Pick the first available media field
function pickMedia(media?: any): string {
  if (!media) return "";
  return (
    media.image ||
    media.preview ||
    media.thumbnail ||
    media.original ||
    media.url ||
    ""
  );
}

export async function GET() {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        query: QUERY,
        variables: { collection: COLLECTION_ADDR, limit: LIMIT },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[Stargaze API Error]", res.status, errorText);
      throw new Error(`Stargaze API failed: ${res.status}`);
    }

    const json = await res.json();

    if (json.errors) {
      console.error("[Stargaze GraphQL Errors]", json.errors);
      throw new Error("GraphQL error from Stargaze indexer");
    }

    const items = json?.data?.listings?.listings ?? [];
    if (!Array.isArray(items)) {
      console.error("[Unexpected shape]", json?.data);
      throw new Error("Unexpected GraphQL response shape");
    }

    const nfts: Nft[] = items.map((item: any) => {
      const img = toHttp(pickMedia(item?.token?.media));
      return {
        id: String(item?.tokenId ?? ""),
        name: item?.token?.name || `Scientist #${item?.tokenId}`,
        imageUrl: img,
      };
    });

    return NextResponse.json(nfts, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    console.error("Failed to fetch floor NFTs:", e);
    return NextResponse.json(
      { error: "Failed to fetch floor NFTs", message: e?.message ?? String(e) },
      { status: 500 },
    );
  }
}
