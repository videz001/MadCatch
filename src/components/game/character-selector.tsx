"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from "@/lib/utils";
import { type Nft } from "@/lib/types";
import { Skeleton } from '../ui/skeleton';
import { AlertCircle, UserCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface CharacterSelectorProps {
  nfts: Nft[];
  defaultCharacter: Nft;
  selectedId: string;
  onSelect: (character: Nft) => void;
  isLoading: boolean;
  walletConnected: boolean;
}

export default function CharacterSelector({
  nfts,
  defaultCharacter,
  selectedId,
  onSelect,
  isLoading,
  walletConnected,
}: CharacterSelectorProps) {
  const characters = [defaultCharacter, ...nfts];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-primary" />
          <span>Select Character</span>
        </CardTitle>
        {!walletConnected && <CardDescription>Connect your wallet to see your Mad Scientists NFTs.</CardDescription>}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pr-4">
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="w-24 h-24 rounded-full" />
                <Skeleton className="w-20 h-4" />
              </div>
            ))}

            {!isLoading && characters.map((character) => (
              <div
                key={character.id}
                onClick={() => onSelect(character)}
                className={cn(
                  "flex flex-col items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border-2 border-transparent",
                  selectedId === character.id ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                )}
              >
                <Image
                  src={character.imageUrl}
                  alt={character.name}
                  width={96}
                  height={96}
                  data-ai-hint={character.hint}
                  className="rounded-full bg-muted object-cover aspect-square"
                />
                <p className="text-sm text-center font-medium truncate w-full">{character.name}</p>
              </div>
            ))}
             {!isLoading && walletConnected && nfts.length === 0 && (
                <div className="col-span-full">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No Mad Scientists Found</AlertTitle>
                        <AlertDescription>
                           We couldn't find any Mad Scientist NFTs in your wallet. You can play with the default character.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
