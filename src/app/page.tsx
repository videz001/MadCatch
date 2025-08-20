"use client";

import React from 'react';
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
import type { Nft, Player } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const backgrounds = [
  { id: "bg1", name: "Lab", imageUrl: "https://i.imgur.com/X4RApaE.png", hint: "science lab" },
  { id: "bg2", name: "Moon", imageUrl: "https://i.imgur.com/yZLFpGT.png", hint: "moon surface" },
  { id: "bg3", name: "Mad Uni", imageUrl: "https://i.imgur.com/3fbQCYs.png", hint: "university building" },
];

const defaultCharacter: Nft = { id: "default", name: "Default Scientist", imageUrl: "https://i.imgur.com/6nVF8r7.png" };

const featuredCharacters: Nft[] = [
  { id: '2580', name: 'Scientist #2580', imageUrl: 'https://rarity.madscientists.io/images/2580.png' },
  { id: '3618', name: 'Scientist #3618', imageUrl: 'https://rarity.madscientists.io/images/3618.png' },
  { id: '2588', name: 'Scientist #2588', imageUrl: 'https://rarity.madscientists.io/images/2588.png' },
  { id: '4036', name: 'Scientist #4036', imageUrl: 'https://rarity.madscientists.io/images/4036.png' },
  { id: '3815', name: 'Scientist #3815', imageUrl: 'https://rarity.madscientists.io/images/3815.png' },
];

export default function Home() {
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null);
  
  const [selectedCharacter, setSelectedCharacter] = React.useState<Nft>(defaultCharacter);
  const [selectedBackground, setSelectedBackground] = React.useState(backgrounds[0]);
  
  const [gameKey, setGameKey] = React.useState(Date.now());
  const [gameState, setGameState] = React.useState<"ready" | "playing" | "over">("ready");
  const [score, setScore] = React.useState(0);
  const [misses, setMisses] = React.useState(0);
  const { toast } = useToast();
  const [leaderboardData, setLeaderboardData] = React.useState<Player[]>([]);

  const MAX_MISSES = 5;

  const handleConnect = (address: string) => {
    setWalletAddress(address);
    toast({ title: "Wallet Connected", description: `Address: ${address.substring(0, 10)}...${address.substring(address.length - 4)}` });
  };

  const handleCharacterSelect = (character: Nft) => {
    setSelectedCharacter(character);
    toast({ title: "Character Changed", description: `Now playing as ${character.name}` });
  };
  
  const handleBackgroundSelect = (background: { id: string, name: string, imageUrl: string, hint: string }) => {
    setSelectedBackground(background);
  };
  
  const startGame = () => {
    if (!walletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to start playing.",
        variant: "destructive",
      });
      return;
    }
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

    if (walletAddress) {
      setLeaderboardData(prevLeaderboard => {
        const existingPlayerIndex = prevLeaderboard.findIndex(p => p.address === walletAddress);
        let newLeaderboard = [...prevLeaderboard];
        const newPlayer = { 
          address: walletAddress, 
          score: finalScore, 
          rank: 0,
          characterUrl: selectedCharacter.imageUrl 
        };

        if (existingPlayerIndex !== -1) {
          if (finalScore > newLeaderboard[existingPlayerIndex].score) {
            newLeaderboard[existingPlayerIndex] = newPlayer;
          }
        } else {
          newLeaderboard.push(newPlayer);
        }
        return newLeaderboard.sort((a, b) => b.score - a.score).map((player, index) => ({ ...player, rank: index + 1 }));
      });
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-body">
      <div className="container mx-auto p-4">
        <header className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Beaker className="w-10 h-10 text-primary" />
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
                <TabsTrigger value="background">Background</TabsTrigger>
              </TabsList>
              <TabsContent value="character">
                <CharacterSelector
                  onSelect={handleCharacterSelect}
                  selectedCharacter={selectedCharacter}
                  defaultCharacter={defaultCharacter}
                  characters={featuredCharacters}
                />
              </TabsContent>
              <TabsContent value="leaderboard">
                <Leaderboard players={leaderboardData} />
              </TabsContent>
              <TabsContent value="background">
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
