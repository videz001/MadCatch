"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UserCheck, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Nft } from "@/lib/types";
import Image from "next/image";

interface CharacterSelectorProps {
  /** Called when a valid tokenId is submitted (parent can persist this & drive gameplay) */
  onSelectById: (id: string) => void;
  /** The currently selected character from parent/store */
  selectedCharacter: Nft;
  /** Optional: override resolver that returns an image URL for a given tokenId */
  resolveImageUrl?: (tokenId: number) => Promise<string>;
}

async function defaultResolveImageUrl(tokenId: number): Promise<string> {
  // Rarity.madscientists.io is the canonical source
  return `https://rarity.madscientists.io/images/${tokenId}.png`;
}

export default function CharacterSelector({
  onSelectById,
  selectedCharacter,
  resolveImageUrl = defaultResolveImageUrl,
}: CharacterSelectorProps) {
  const [nftId, setNftId] = React.useState("");
  const [previewUrl, setPreviewUrl] = React.useState<string>("");
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = React.useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatus("idle");
    setPreviewUrl("");

    const idNum = Number(nftId);
    if (!Number.isInteger(idNum) || idNum < 0) {
      setStatus("error");
      setErrorMsg("Please enter a valid NFT number (integer ≥ 0).");
      return;
    }

    setStatus("loading");
    try {
      const url = await resolveImageUrl(idNum);

      // Optimistically preview for the user right away
      setPreviewUrl(url);
      setStatus("ok");

      // Let parent update its store/state and wire the skin into gameplay
      onSelectById(String(idNum));
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message || "Failed to load NFT image.");
    }
  };

  // Prefer parent-selected image (authoritative), fall back to local preview
  const displayImage =
    selectedCharacter?.imageUrl?.length > 0
      ? selectedCharacter.imageUrl
      : previewUrl;

  const titleText =
    selectedCharacter?.id != null
      ? `Scientist #${selectedCharacter.id}`
      : previewUrl
      ? `NFT #${nftId} (preview)`
      : "No character selected";

  const nameText =
    selectedCharacter?.name?.length > 0
      ? selectedCharacter.name
      : previewUrl
      ? `NFT #${nftId}`
      : "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-primary" />
          <span>Select Character</span>
        </CardTitle>
        <CardDescription>
          Enter an NFT number to use as your character.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              type="text"
              value={nftId}
              onChange={(e) =>
                setNftId(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="Enter NFT number (e.g., 3070)"
              className="w-full"
            />
            <Button type="submit" size="icon" disabled={status === "loading"}>
              <Wand2 className={status === "loading" ? "animate-pulse" : ""} />
            </Button>
          </form>

          {status === "error" && (
            <div className="text-sm text-destructive">{errorMsg}</div>
          )}

          <div className="mt-2 flex flex-col items-center justify-center gap-2 p-4 border rounded-lg bg-muted">
            <h3 className="font-semibold">Current Character</h3>

            <div className="relative rounded-full bg-muted-foreground/20 object-cover aspect-square w-24 h-24 flex items-center justify-center overflow-hidden">
              {displayImage ? (
                <Image
                  src={displayImage}
                  alt={titleText}
                  width={96}
                  height={96}
                  className="object-cover"
                  unoptimized
                  crossOrigin="anonymous"
                  onError={() => {
                    setStatus("error");
                    setErrorMsg(
                      "Image failed to load. Try another NFT or check endpoint."
                    );
                    setPreviewUrl("");
                  }}
                />
              ) : (
                <div className="text-xs text-muted-foreground">No image</div>
              )}
            </div>

            <p className="text-sm text-center font-medium truncate w-full">
              {nameText}
            </p>

            {/* Helpful status hint */}
            {status === "loading" && (
              <p className="text-xs text-muted-foreground">Resolving image…</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}