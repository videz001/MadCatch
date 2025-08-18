// app/api/floor-nfts/route.ts
import { NextResponse } from "next/server";

type Ask = {
  collection: string;
  token_id: string | number;
  price?: { amount: string; denom: string };
  coin?: { amount: string; denom: string }; // some versions use coin
};

type Nft = {
  id: string;
  name: string;
  imageUrl: string;
};

export const dynamic = "force-dynamic";

// ====== CONFIG ======
const COLLECTION_ADDR =
  "stars1v8avajk64z7pppeu45ce6vv8wuxmwacdff484lqvv0vnka0cwgdqdk64sf"; // your collection
const LIMIT = 5;

// LCD endpoints, in priority order. Add your own/in-house first for reliability.
const LCDS = [
  process.env.STARGAZE_LCD?.trim(),
  "https://stargaze-api.bluestake.net",
  "https://rest.cosmos.directory/stargaze",
].filter(Boolean) as string[];

// REQUIRED: marketplace contract (global). Put this in your env.
const MARKETPLACE_ADDR = (process.env.STARGAZE_MARKETPLACE_ADDR || "").trim();

function toHttp(uri?: string): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    return "https://cloudflare-ipfs.com/ipfs/" + uri.replace("ipfs://", "");
  }
  return uri;
}

function b64(obj: unknown) {
  return Buffer.from(JSON.stringify(obj)).toString("base64");
}

async function smartQuery<T>(
  lcd: string,
  contract: string,
  msg: unknown,
  abortSignal?: AbortSignal
): Promise<T> {
  const url = `${lcd.replace(/\/+$/, "")}/cosmwasm/wasm/v1/contract/${contract}/smart/${b64(
    msg
  )}`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal: abortSignal });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LCD ${lcd} ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as { data?: T };
  if (!json || json.data === undefined) {
    throw new Error(`LCD ${lcd} returned no data`);
  }
  return json.data;
}

// Try multiple LCDs. Short-circuit on first success.
async function withLCDs<T>(fn: (lcd: string) => Promise<T>): Promise<T> {
  const errors: string[] = [];
  for (const lcd of LCDS) {
    try {
      return await fn(lcd);
    } catch (e: any) {
      errors.push(`[${lcd}] ${e?.message || e}`);
    }
  }
  throw new Error(`All LCDs failed:\n${errors.join("\n")}`);
}

function parseAmount(ask: Ask): number {
  const raw = ask.price?.amount ?? ask.coin?.amount ?? "0";
  // amounts are in micro (ustars). Convert to number for sorting (still sort-safe).
  return Number(raw);
}

// --- Marketplace queries differ slightly by version.
// 1) Preferred: asks_sorted_by_price { collection, order, limit }
// 2) Fallback:  asks { collection, start_after, limit }  (then we sort client-side)
// Both return { asks: Ask[] } or { asks: { asks: Ask[] } } depending on build.
// We handle both shapes.
async function queryCheapestAsks(lcd: string): Promise<Ask[]> {
  // Preferred: sorted by price ASC on-chain
  const q1 = {
    asks_sorted_by_price: {
      collection: COLLECTION_ADDR,
      order: "asc",
      limit: LIMIT * 2, // fetch a little extra to filter nulls/images
    },
  };
  try {
    const data = await smartQuery<any>(lcd, MARKETPLACE_ADDR, q1);
    const asks: Ask[] = (data.asks ?? data?.data ?? data?.result ?? data ?? []);
    if (Array.isArray(asks) && asks.length) return asks;
  } catch (_) {
    // swallow and try fallback
  }

  // Fallback: unsorted asks, limit more and sort locally
  const q2 = {
    asks: {
      collection: COLLECTION_ADDR,
      start_after: null,
      limit: 100,
    },
  };
  const data = await smartQuery<any>(lcd, MARKETPLACE_ADDR, q2);
  const asksAny: Ask[] = (data.asks ?? data?.data ?? data?.result ?? data ?? []);
  return Array.isArray(asksAny) ? asksAny : [];
}

// Query SG721 for token metadata (nft_info -> token_uri + extension.name)
async function getNftInfo(
  lcd: string,
  collectionAddr: string,
  tokenId: string
): Promise<{ token_uri?: string; name?: string }> {
  const q = { nft_info: { token_id: tokenId } };
  const data = await smartQuery<any>(lcd, collectionAddr, q);
  // Data shape: { token_uri?: string, extension?: { name?: string, image?: string } }
  const token_uri: string | undefined =
    data.token_uri ?? data?.nft_info?.token_uri ?? data?.data?.token_uri;
  const ext = data.extension ?? data?.nft_info?.extension ?? {};
  const name: string | undefined = ext.name;
  const imageFromExt: string | undefined = ext.image || ext.image_url;
  return { token_uri: token_uri || imageFromExt, name };
}

export async function GET() {
  try {
    if (!MARKETPLACE_ADDR) {
      return NextResponse.json(
        {
          error: "Missing configuration",
          message:
            "Set STARGAZE_MARKETPLACE_ADDR in your environment (global Marketplace contract address).",
        },
        { status: 500 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    // 1) Pull asks
    const asks = await withLCDs((lcd) => queryCheapestAsks(lcd));

    // Normalize token ids to string
    const normalized = asks
      .map((a) => ({
        ...a,
        token_id: String(a.token_id),
        micros: parseAmount(a),
      }))
      // filter for this collection (extra safety) and remove zero-price
      .filter((a) => a.collection === COLLECTION_ADDR && a.micros > 0);

    // If fallback path was used, ensure ascending by price
    normalized.sort((a, b) => a.micros - b.micros);

    const top = normalized.slice(0, LIMIT);

    // 2) For each token, fetch metadata & image (SG721)
    const nfts = await withLCDs(async (lcd) => {
      const out: Nft[] = [];
      for (const a of top) {
        try {
          const meta = await getNftInfo(lcd, COLLECTION_ADDR, a.token_id as string);
          const imageUrl = toHttp(meta.token_uri);
          out.push({
            id: String(a.token_id),
            name: meta.name || `Scientist #${a.token_id}`,
            imageUrl,
          });
        } catch (e) {
          // tolerate a single token failing; continue
          // eslint-disable-next-line no-console
          console.warn("nft_info failed for token", a.token_id, e);
        }
      }
      return out;
    });

    clearTimeout(timeout);

    // Filter any missing images and cap to LIMIT
    const cleaned = nfts.filter((n) => n.imageUrl).slice(0, LIMIT);

    if (!cleaned.length) {
      throw new Error("No NFT images resolved. Check marketplace address or LCD.");
    }

    return NextResponse.json(cleaned, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("floor-nfts route failed:", e);
    return NextResponse.json(
      { error: "Failed to fetch floor NFTs (LCD)", message: String(e?.message || e) },
      { status: 502 }
    );
  }
}
