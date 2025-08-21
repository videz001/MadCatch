"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, UserCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Nft } from "@/lib/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface CharacterSelectorProps {
  onSelect: (character: Nft) => void;
  selectedCharacter: Nft;
  defaultCharacter: Nft;
  characters: Nft[];
  isLoading: boolean;
  error: string | null;
}

export default function CharacterSelector({
  onSelect,
  selectedCharacter,
  defaultCharacter,
  characters,
  isLoading,
  error,
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
        {error && (
          <div className="flex flex-col items-center justify-center text-destructive bg-destructive/10 p-4 rounded-lg">
            <AlertTriangle className="w-8 h-8 mb-2" />
            <p className="font-semibold">Could not load characters</p>
            <p className="text-xs">{error}</p>
          </div>
        )}
        <ScrollArea className="w-full whitespace-nowrap rounded-lg">
          <div className="flex w-max space-x-4 pb-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-40 h-48 flex-shrink-0">
                  <Skeleton className="w-full h-full rounded-lg" />
                </div>
              ))
            ) : (
              allCharacters.map((character) => (
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
                  {character.imageUrl ? (
                    <img
                      src={character.imageUrl}
                      alt={character.name}
                      width={160}
                      height={192}
                      crossOrigin="anonymous"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      Image not available
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-center">
                    <p className="truncate text-sm font-semibold text-white">
                      {character.name}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}