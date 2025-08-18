// app/api/floor-nfts/route.ts
import { NextResponse } from "next/server";
import type { Nft } from "@/lib/types";

// Ensure this route is dynamic and not cached
export const dynamic = "force-dynamic";

const ENDPOINT = "https://constellations-api.mainnet.stargaze-apis.com/graphql";
const COLLECTION_ADDR = "stars1v8avajk64z7pppeu45ce6vv8wuxmwacdff484lqvv0vnka0cwgdqdk64sf";
const LIMIT = 5;

const QUERY = `
  query FloorListings($collection: String!, $limit: Int!) {
    listings(
      filter: { collectionAddr: $collection, status: ACTIVE }
      sortBy: PRICE_ASC
      pagination: { limit: $limit }
    ) {
      nodes {
        tokenId
        price
        token {
          name
          media {
            url
          }
        }
      }
    }
  }
`;

function toHttp(uri?: string): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    return "https://cloudflare-ipfs.com/ipfs/" + uri.replace("ipfs://", "");
  }
  return uri;
}

export async function GET() {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: QUERY,
        variables: { collection: COLLECTION_ADDR, limit: LIMIT },
      }),
      // Revalidate every 5 minutes
      next: { revalidate: 300 },
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error("Stargaze API Error:", errorText);
        throw new Error(`Stargaze API failed with status: ${res.status}`);
    }

    const json = await res.json();
    if (json.errors) {
        console.error("Stargaze GraphQL Error:", json.errors);
        throw new Error("Failed to query Stargaze listings.");
    }
    
    const items = (json.data.listings?.nodes || []);
    
    const nfts: Nft[] = items.map((item: any) => ({
      id: item.tokenId,
      name: item.token?.name || `Scientist #${item.tokenId}`,
      imageUrl: toHttp(item.token?.media?.url),
    }));

    return NextResponse.json(nfts);

  } catch (e: any) {
    console.error("Failed to fetch floor NFTs:", e);
    return NextResponse.json(
      { error: "Failed to fetch floor NFTs", message: e.message },
      { status: 500 }
    );
  }
}
