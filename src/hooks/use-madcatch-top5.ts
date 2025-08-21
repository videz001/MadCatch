// src/hooks/use-madcatch-top5.ts
"use client";

import { useEffect, useState } from "react";
import type { Nft } from "@/lib/types";

export function useMadcatchTop5(
  endpoint = process.env.NEXT_PUBLIC_TOP5_URL || "https://madcatch.xyz/api/top5"
) {
  const [items, setItems] = useState<Nft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    let gone = false;
    (async () => {
      try {
        setLoading(true);
        // Add a timestamp to prevent caching
        const r = await fetch(`${endpoint}?ts=${Date.now()}`, { cache: "no-store" });
        if (!r.ok) throw new Error(`API returned status ${r.status}`);
        
        const data = await r.json();
        const images = data?.images;

        if (gone) return;
        if (!Array.isArray(images)) {
          throw new Error("API response did not contain an images array.");
        }

        const mapped: Nft[] = images.map((url: string, i: number) => ({
          id: `top5-${i}-${Math.random()}`, // Add random element to key for safety
          name: `Unrevealed #${i + 1}`,
          imageUrl: url,
        }));

        setItems(mapped);
      } catch (e: any) {
        console.error("Failed to fetch top 5 NFTs:", e);
        setError(e?.message ?? "Failed to load");
      } finally {
        if (!gone) setLoading(false);
      }
    })();
    return () => { gone = true; };
  }, [endpoint]);

  return { items, loading, error };
}