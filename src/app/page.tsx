"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Beaker, Heart, Trophy, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WalletConnect from "@/components/game/wallet-connect";
import CharacterSelector from "@/components/game/character-selector";
import Leaderboard from "@/components/game/leaderboard";
import BackgroundSelector from "@/components/game/background-selector";
import GameScreen from "@/components/game/game-screen";
import type { Nft } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_CHARACTER = "/images/default-character.png";
const DEFAULT_BACKGROUND = "/images/bg1.png";

const backgrounds = [
  { id: "bg1", name: "Lab A", imageUrl: "https://placehold.co/800x600/292533/39FF14.png", hint: "science lab" },
  { id: "bg2", name: "Neon Grid", imageUrl: "https://placehold.co/800x600/201528/FFFFFF.png", hint: "neon background" },
  { id: "bg3", name: "Reaction", imageUrl: "https://placehold.co/800x600/152821/D65C5C.png", hint: "chemical reaction" },
];

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [isNftsLoading, setIsNftsLoading] = useState(false);
  
  const defaultCharacter = useMemo(() => ({
    id: "default",
    name: "Default Scientist",
    imageUrl: "https://placehold.co/150x150/292533/39FF14.png",
    hint: "scientist cartoon"
  }), []);

  const [selectedCharacter, setSelectedCharacter] = useState<Nft>(defaultCharacter);
  const [selectedBackground, setSelectedBackground] = useState(backgrounds[0]);
  
  const [gameKey, setGameKey] = useState(Date.now());
  const [gameState, setGameState] = useState<"ready" | "playing" | "over">("ready");
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const { toast } = useToast();

  const MAX_MISSES = 5;

  const handleConnect = (address: string) => {
    setWalletAddress(address);
    toast({ title: "Wallet Connected", description: `Address: ${address.substring(0, 10)}...` });
    
    // Fetch NFTs
    setIsNftsLoading(true);
    setTimeout(() => {
        const cacheBuster = `?t=${new Date().getTime()}`;
        const fetchedNfts: Nft[] = [
            { id: "1", name: "Scientist #1", imageUrl: `https://rarity.madscientists.io/images/1.png${cacheBuster}`, hint: "scientist cartoon" },
            { id: "2", name: "Scientist #2", imageUrl: `https://rarity.madscientists.io/images/2.png${cacheBuster}`, hint: "scientist cartoon" },
            { id: "3", name: "Scientist #3", imageUrl: `https://rarity.madscientists.io/images/3.png${cacheBuster}`, hint: "scientist cartoon" },
        ];
        setNfts(fetchedNfts);
        setIsNftsLoading(false);
    }, 1500);
  };

  const handleCharacterSelect = (character: Nft) => {
    setSelectedCharacter(character);
    toast({ title: "Character Changed", description: `Now playing as ${character.name}` });
  };

  const handleBackgroundSelect = (background: { id: string, name: string, imageUrl: string, hint: string }) => {
    setSelectedBackground(background);
  };
  
  const startGame = () => {
    setScore(0);
    setMisses(0);
    setGameKey(Date.now());
    setGameState("playing");
  };

  const handleGameOver = (finalScore: number) => {
    setGameState("over");
    toast({
      title: "Game Over!",
      description: `Your final score is ${finalScore}.`,
      variant: "destructive",
    });
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-body">
      <div className="container mx-auto p-4">
        <header className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Beaker className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary font-headline">Mad Catch</h1>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden relative shadow-lg shadow-primary/20">
              <CardContent className="p-0">
                <div className="aspect-[4/3] relative">
                  {gameState !== "playing" && (
                    <div className="absolute inset-0 bg-black/70 z-20 flex flex-col items-center justify-center gap-4">
                      {gameState === "ready" && (
                        <>
                          <h2 className="text-4xl font-bold text-primary animate-pulse">Ready to Catch?</h2>
                          <Button size="lg" onClick={startGame}>
                            <Wand2 className="mr-2" /> Start Game
                          </Button>
                        </>
                      )}
                      {gameState === "over" && (
                        <>
                          <h2 className="text-4xl font-bold text-accent">Game Over</h2>
                           <p className="text-xl text-foreground">Final Score: {score}</p>
                          <Button size="lg" onClick={startGame}>
                            <Wand2 className="mr-2" /> Play Again
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                  <GameScreen
                    key={gameKey}
                    characterImage={selectedCharacter.imageUrl}
                    backgroundImage={selectedBackground.imageUrl}
                    onGameOver={handleGameOver}
                    onScoreUpdate={setScore}
                    onMiss={setMisses}
                    maxMisses={MAX_MISSES}
                    isPlaying={gameState === "playing"}
                  />
                </div>
                <div className="absolute top-4 left-4 z-10 bg-background/80 p-3 rounded-lg flex items-center gap-4">
                  <div className="flex items-center gap-2 text-primary font-bold text-xl">
                    <Trophy className="w-6 h-6" />
                    <span>{score}</span>
                  </div>
                  <div className="flex items-center gap-2 text-accent font-bold text-xl">
                    <Heart className="w-6 h-6" />
                    <span>{MAX_MISSES - misses}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <WalletConnect onConnect={handleConnect} address={walletAddress} />
            
            <Tabs defaultValue="character" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="character">Character</TabsTrigger>
                <TabsTrigger value="leaderboard">Leaders</TabsTrigger>
                <TabsTrigger value="settings">Style</TabsTrigger>
              </TabsList>
              <TabsContent value="character">
                <CharacterSelector
                  nfts={nfts}
                  defaultCharacter={defaultCharacter}
                  selectedId={selectedCharacter.id}
                  onSelect={handleCharacterSelect}
                  isLoading={isNftsLoading}
                  walletConnected={!!walletAddress}
                />
              </TabsContent>
              <TabsContent value="leaderboard">
                <Leaderboard />
              </TabsContent>
              <TabsContent value="settings">
                 <BackgroundSelector
                    backgrounds={backgrounds}
                    selectedId={selectedBackground.id}
                    onSelect={handleBackgroundSelect}
                  />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  );
}
