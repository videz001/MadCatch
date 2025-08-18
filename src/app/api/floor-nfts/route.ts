
// app/api/floor-nfts/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Nft = { id: string; name: string; imageUrl: string };

const ENDPOINTS = [
  // Prefer the official GraphQL endpoint
  "https://graphql.mainnet.stargaze-apis.com/graphql",
  // Constellations indexer, if enabled for your infra
  "https://constellations-api.mainnet.stargaze-apis.com/graphql",
];

const COLLECTION_ADDR =
  "stars1v8avajk64z7pppeu45ce6vv8wuxmwacdff484lqvv0vnka0cwgdqdk64sf";
const LIMIT = 5;

// --- Helpers ---
function toHttp(uri?: string | null): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    return "https://cloudflare-ipfs.com/ipfs/" + uri.replace("ipfs://", "");
  }
  return uri;
}

async function gqlFetch(endpoint: string, query: string, variables?: any) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // NOTE: do not cache schema responses too aggressively during dev
    next: { revalidate: 120 },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${endpoint}: ${text}`);
  }
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response from ${endpoint}: ${text.slice(0, 200)}`);
  }
  if (json.errors) {
    throw new Error(
      `GraphQL errors from ${endpoint}: ${JSON.stringify(json.errors)}`
    );
  }
  return json;
}

// Minimal introspection (root query fields only)
const INTROSPECTION = `
query Introspection {
  __schema {
    queryType {
      name
      fields { name }
    }
  }
}
`;

// Attempt A: (your old idea) listings at root — many schemas won’t have this
const QUERY_A = `
  query FloorListings($collection: String!, $limit: Int!) {
    listings(
      filter: { collectionAddr: $collection, status: ACTIVE }
      sortBy: PRICE_ASC
      pagination: { limit: $limit }
    ) {
      nodes {
        tokenId
        price
        token { name media { url } }
      }
    }
  }
`;

// Attempt B: a common pattern is to hang tokens off a collection.
// NOTE: This is a *best-effort* guess that works on some indexers.
// If your schema differs, the introspection output will tell you what to call.
const QUERY_B = `
  query FloorTokens($collection: String!, $limit: Int!) {
    collection(collectionAddr: $collection) {
      tokens(
        filter: { status: LISTED }
        sortBy: PRICE_ASC
        pagination: { limit: $limit }
      ) {
        nodes {
          tokenId
          price
          token { name media { url } }
        }
      }
    }
  }
`;

export async function GET() {
  const diag: {
    tried: Array<{ endpoint: string; query: "A" | "B"; error?: string }>;
    used?: { endpoint: string; query: "A" | "B" };
    count?: number;
    sample?: any;
    schemaFields?: Record<string, string[]>;
  } = { tried: [] };

  for (const endpoint of ENDPOINTS) {
    try {
      // 1) Introspect query root to see what fields actually exist
      let schemaFields: string[] = [];
      try {
        const introspection = await gqlFetch(endpoint, INTROSPECTION);
        schemaFields =
          introspection?.data?.__schema?.queryType?.fields?.map((f: any) => f.name) || [];
        diag.schemaFields = diag.schemaFields || {};
        diag.schemaFields[endpoint] = schemaFields;
      } catch (e: any) {
        // Don’t fail the whole request if introspection is disabled
        diag.schemaFields = diag.schemaFields || {};
        diag.schemaFields[endpoint] = [`(introspection failed: ${e.message})`];
      }

      // 2) Try Query A (root listings) only if the field exists
      if (schemaFields.includes("listings")) {
        try {
          const jsonA = await gqlFetch(endpoint, QUERY_A, {
            collection: COLLECTION_ADDR,
            limit: LIMIT,
          });
          const items = jsonA?.data?.listings?.nodes ?? [];
          if (items.length) {
            const nfts: Nft[] = items.slice(0, LIMIT).map((it: any) => ({
              id: String(it.tokenId),
              name: it?.token?.name || `Token #${it.tokenId}`,
              imageUrl: toHttp(it?.token?.media?.url),
            }));
            diag.used = { endpoint, query: "A" };
            diag.count = nfts.length;
            diag.sample = nfts[0];
            return NextResponse.json(nfts, { headers: { "x-floor-source": "A" } });
          }
        } catch (e: any) {
          diag.tried.push({ endpoint, query: "A", error: String(e.message) });
        }
      } else {
        diag.tried.push({
          endpoint,
          query: "A",
          error: `Schema has no root field "listings" (${schemaFields.join(", ")})`,
        });
      }

      // 3) Try Query B (collection → tokens) if `collection` exists
      if (schemaFields.includes("collection")) {
        try {
          const jsonB = await gqlFetch(endpoint, QUERY_B, {
            collection: COLLECTION_ADDR,
            limit: LIMIT,
          });
          const items = jsonB?.data?.collection?.tokens?.nodes ?? [];
          if (items.length) {
            const nfts: Nft[] = items.slice(0, LIMIT).map((it: any) => ({
              id: String(it.tokenId),
              name: it?.token?.name || `Token #${it.tokenId}`,
              imageUrl: toHttp(it?.token?.media?.url),
            }));
            diag.used = { endpoint, query: "B" };
            diag.count = nfts.length;
            diag.sample = nfts[0];
            return NextResponse.json(nfts, { headers: { "x-floor-source": "B" } });
          }
        } catch (e: any) {
          diag.tried.push({ endpoint, query: "B", error: String(e.message) });
        }
      } else {
        diag.tried.push({
          endpoint,
          query: "B",
          error: `Schema has no root field "collection" (${schemaFields.join(", ")})`,
        });
      }
    } catch (e: any) {
      // Catastrophic endpoint failure
      diag.tried.push({ endpoint, query: "A", error: String(e.message) });
      diag.tried.push({ endpoint, query: "B", error: String(e.message) });
    }
  }

  // If we got here, nothing worked – return a very explicit diagnostic payload
  return NextResponse.json(
    {
      error: "Could not fetch floor NFTs",
      message:
        "The GraphQL schema you're connecting to does not expose the fields this route expects. See diag for details.",
      diag,
    },
    { status: 502 }
  );
}
