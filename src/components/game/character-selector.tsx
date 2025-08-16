"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserCheck, Wand2, Beaker, FlaskConical, TestTube, TestTube2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Nft } from "@/lib/types";

interface CharacterSelectorProps {
  onSelectById: (id: string) => void;
  selectedCharacter: Nft;
}

const iconMap: { [key: string]: React.ElementType } = {
    Beaker,
    FlaskConical,
    TestTube,
    TestTube2,
};

export default function CharacterSelector({
  onSelectById,
  selectedCharacter,
}: CharacterSelectorProps) {
  const [nftId, setNftId] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSelectById(nftId);
  };

  const IconComponent = iconMap[selectedCharacter.imageUrl] || Beaker;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-primary" />
          <span>Select Character</span>
        </CardTitle>
        <CardDescription>Enter an ID to select a character icon.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                type="text"
                value={nftId}
                onChange={(e) => setNftId(e.target.value)}
                placeholder="Enter any number (e.g., 123)"
                className="w-full"
              />
              <Button type="submit" size="icon">
                <Wand2 />
              </Button>
            </form>
            <div className="mt-4 flex flex-col items-center justify-center gap-2 p-4 border rounded-lg bg-muted">
                <h3 className="font-semibold">Current Character</h3>
                <div className="rounded-full bg-muted-foreground/20 object-cover aspect-square w-24 h-24 flex items-center justify-center">
                    <IconComponent className="w-16 h-16 text-primary" />
                </div>
                <p className="text-sm text-center font-medium truncate w-full">{selectedCharacter.name}</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
