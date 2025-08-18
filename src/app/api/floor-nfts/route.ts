// app/api/floor-nfts/route.ts
import { NextResponse } from "next/server";

// Keep dynamic
export const dynamic = "force-dynamic";

// ---- Config ----
const GRAPHQL_ENDPOINT =
  process.env.STARGAZE_GRAPHQL ??
  "https://graphql.mainnet.stargaze-apis.com/graphql";

const LCD_PING =
  process.env.STARGAZE_LCD_PING ??
  "https://stargaze-api.bluestake.net/cosmos/base/tendermint/v1beta1/blocks/latest";

const COLLECTION_ADDR =
  "stars1v8avajk64z7pppeu45ce6vv8wuxmwacdff484lqvv0vnka0cwgdqdk64sf";

const LIMIT = 5;

// ---- Utils ----
function toHttp(uri?: string): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://ipfs/")) {
    return "https://cloudflare-ipfs.com/" + uri.replace("ipfs://", "");
  }
  if (uri.startsWith("ipfs://")) {
    return "https://cloudflare-ipfs.com/ipfs/" + uri.slice("ipfs://".length);
  }
  // Some metadata uses /ipfs/<hash> or gateway-agnostic links already
  if (uri.startsWith("/ipfs/")) {
    return "https://cloudflare-ipfs.com" + uri;
  }
  return uri;
}

type GqlOk = {
  nodes?: Array<{
    tokenId?: string | number;
    price?: number | string | null;
    token?: { name?: string | null; media?: { url?: string | null } | null } | null;
    // accept some other possible shapes
    media?: { url?: string | null } | null;
    name?: string | null;
  }>;
};

type Nft = {
  id: string;
  name: string;
  imageUrl: string;
  // optional: price in STARS if available
  priceStars?: number | null;
};

// ---- Candidate queries (try in order) ----
// A) tokens on root with collectionAddr filter
const QUERY_A = `
  query Cheapest($collection: String!, $limit: Int!) {
    tokens(
      filter: { collectionAddr: $collection, forSale: true }
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

// B) tokens under collection()
const QUERY_B = `
  query Cheapest($collection: String!, $limit: Int!) {
    collection(collectionAddr: $collection) {
      tokens(
        filter: { forSale: true }
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

// C) marketplace active listings (older schema on some deployments)
const QUERY_C = `
  query Cheapest($collection: String!, $limit: Int!) {
    marketplace {
      activeListings(
        filter: { collectionAddr: $collection }
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

async function postGraphQL(query: string, variables: Record<string, any>) {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ query, variables }),
    // keep a short timeout-ish via Next fetch options if you like; left default here
    next: { revalidate: 0 },
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // leave json = null
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}. Body: ${text.slice(0, 500)}`);
  }
  if (json?.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors).slice(0, 1000)}`);
  }
  return json?.data;
}

function parseNodes(container: any): GqlOk {
  if (!container) return { nodes: [] };
  if (container.tokens?.nodes) return { nodes: container.tokens.nodes as any };
  if (container.activeListings?.nodes) return { nodes: container.activeListings.nodes as any };
  if (container.nodes) return { nodes: container.nodes as any };
  return { nodes: [] };
}

function mapToNfts(nodes: NonNullable<GqlOk["nodes"]>): Nft[] {
  return (nodes || []).map((it) => {
    const id = String(it?.tokenId ?? "");
    const name =
      it?.token?.name ??
      (it?.name ?? (id ? `Token #${id}` : "Unknown Token"));
    const mediaUrl =
      it?.token?.media?.url ??
      it?.media?.url ??
      "";

    let priceStars: number | null = null;
    const raw = it?.price;
    if (typeof raw === "number") priceStars = raw;
    else if (typeof raw === "string") {
      // Sometimes price is microstars as a string; best-effort parse
      const num = Number(raw);
      if (!Number.isNaN(num)) {
        // Heuristic: treat large integers as micro (>= 1e5)
        priceStars = num >= 100000 ? num / 1_000_000 : num;
      }
    }

    return {
      id,
      name,
      imageUrl: toHttp(mediaUrl || ""),
      priceStars: Number.isFinite(priceStars as any) ? (priceStars as number) : null,
    };
  });
}

async function tryQueries() {
  const vars = { collection: COLLECTION_ADDR, limit: LIMIT };

  // Try A
  try {
    const dataA = await postGraphQL(QUERY_A, vars);
    const nodes = parseNodes(dataA?.tokens).nodes ?? [];
    if (nodes.length) return { from: "A", nfts: mapToNfts(nodes) };
  } catch (e: any) {
    console.error("[Stargaze][A] tokens@root failed:", e?.message || e);
  }

  // Try B
  try {
    const dataB = await postGraphQL(QUERY_B, vars);
    const nodes = parseNodes(dataB?.collection).nodes ?? [];
    if (nodes.length) return { from: "B", nfts: mapToNfts(nodes) };
  } catch (e: any) {
    console.error("[Stargaze][B] collection.tokens failed:", e?.message || e);
  }

  // Try C
  try {
    const dataC = await postGraphQL(QUERY_C, vars);
    const nodes = parseNodes(dataC?.marketplace).nodes ?? [];
    if (nodes.length) return { from: "C", nfts: mapToNfts(nodes) };
  } catch (e: any) {
    console.error("[Stargaze][C] marketplace.activeListings failed:", e?.message || e);
  }

  // Nothing worked
  return { from: null as const, nfts: [] as Nft[] };
}

async function pingLCD() {
  try {
    const res = await fetch(LCD_PING, { cache: "no-store" });
    return { ok: res.ok, status: res.status };
  } catch (e: any) {
    return { ok: false, status: 0, err: e?.message || String(e) };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug");

  try {
    const result = await tryQueries();

    if (debug) {
      const lcd = await pingLCD();
      return NextResponse.json({
        _debug: {
          graphqlEndpoint: GRAPHQL_ENDPOINT,
          lcdPing: lcd,
          tried: ["A: tokens@root", "B: collection.tokens", "C: marketplace.activeListings"],
          picked: result.from,
          count: result.nfts.length,
          sample: result.nfts[0] ?? null,
        },
      });
    }

    if (!result.nfts.length) {
      throw new Error("No results from any known GraphQL shape (A/B/C). Check server logs.");
    }

    // Return only what you need on the client
    const payload = result.nfts.map(({ id, name, imageUrl }) => ({ id, name, imageUrl }));
    return NextResponse.json(payload);
  } catch (e: any) {
    console.error("Failed to fetch floor NFTs:", e);
    return NextResponse.json(
      {
        error: "Failed to fetch floor NFTs",
        message: e?.message || "Unknown error",
      },
      { status: 502 }
    );
  }
}
