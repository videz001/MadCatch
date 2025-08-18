"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UserCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Nft } from "@/lib/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface CharacterSelectorProps {
  onSelect: (character: Nft) => void;
  selectedCharacter: Nft;
  defaultCharacter: Nft;
}

export default function CharacterSelector({
  onSelect,
  selectedCharacter,
  defaultCharacter,
}: CharacterSelectorProps) {
  const [floorCharacters, setFloorCharacters] = useState<Nft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFloorNfts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/floor-nfts");
        if (!res.ok) {
          throw new Error("Could not fetch floor NFTs");
        }
        const data: Nft[] = await res.json();
        setFloorCharacters(data);
      } catch (error) {
        console.error("Failed to load floor NFTs", error);
        toast({
            title: "Could not load floor characters",
            description: "There was a problem fetching the cheapest NFTs. Please try refreshing.",
            variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFloorNfts();
  }, [toast]);

  const allCharacters = [defaultCharacter, ...floorCharacters];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-primary" />
          <span>Select Character</span>
        </CardTitle>
        <CardDescription>
          Pick a scientist to play with. The first 5 are the cheapest on the market!
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="ml-2">Loading cheapest scientists...</p>
            </div>
        ) : (
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
                    {character.imageUrl ? (
                        <Image
                        src={character.imageUrl}
                        alt={character.name}
                        width={160}
                        height={192}
                        unoptimized
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
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
            </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
