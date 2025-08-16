"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from "@/lib/utils";
import { type Nft } from "@/lib/types";
import { AlertCircle, UserCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import Image from "next/image";

interface CharacterSelectorProps {
  nfts: Nft[];
  selectedId: string;
  onSelect: (character: Nft) => void;
  walletConnected: boolean;
}

export default function CharacterSelector({
  nfts,
  selectedId,
  onSelect,
  walletConnected,
}: CharacterSelectorProps) {

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
            {nfts.map((character) => (
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
                  unoptimized // Helps with external URLs that might not be in next.config.ts
                  data-ai-hint={character.hint}
                  className="rounded-full bg-muted object-cover aspect-square w-24 h-24"
                />
                <p className="text-sm text-center font-medium truncate w-full">{character.name}</p>
              </div>
            ))}
             {walletConnected && nfts.length === 0 && (
                <div className="col-span-full">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No Mad Scientists Found</AlertTitle>
                        <AlertDescription>
                           We couldn't find any Mad Scientist NFTs in your wallet. Default characters are shown.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            {!walletConnected && (
                <div className="col-span-full">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Connect Wallet</AlertTitle>
                        <AlertDescription>
                           Connect your wallet to load your NFTs.
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
