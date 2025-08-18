"use client";

import React from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Nft } from "@/lib/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface CharacterSelectorProps {
  onSelect: (character: Nft) => void;
  selectedCharacter: Nft;
  defaultCharacter: Nft;
  characters: Nft[];
}

export default function CharacterSelector({
  onSelect,
  selectedCharacter,
  defaultCharacter,
  characters,
}: CharacterSelectorProps) {
  const allCharacters = [defaultCharacter, ...characters];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-primary" />
          <span>Select Character</span>
        </CardTitle>
        <CardDescription>
          Pick a scientist to play with.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap rounded-lg">
          <div className="flex w-max space-x-4 pb-4">
            {allCharacters.map((character) => (
              <div
                key={character.id}
                className={cn(
                  "group relative w-40 h-48 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all",
                  selectedCharacter.id === character.id
                    ? "border-primary shadow-lg shadow-primary/30"
                    : "border-transparent hover:border-muted-foreground"
                )}
                onClick={() => onSelect(character)}
              >
                <div className="absolute inset-0 bg-muted-foreground/20 z-0" />
                <Image
                  src={character.imageUrl}
                  alt={character.name}
                  width={160}
                  height={192}
                  unoptimized
                  crossOrigin="anonymous"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-center">
                  <p className="truncate text-sm font-semibold text-white">
                    {character.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
