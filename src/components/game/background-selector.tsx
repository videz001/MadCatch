"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ImageIcon } from 'lucide-react';

interface Background {
  id: string;
  name: string;
  imageUrl: string;
  hint: string;
}

interface BackgroundSelectorProps {
  backgrounds: Background[];
  selectedId: string;
  onSelect: (background: Background) => void;
}

export default function BackgroundSelector({ backgrounds, selectedId, onSelect }: BackgroundSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-primary" />
            <span>Choose Background</span>
        </CardTitle>
        <CardDescription>Pick a scene for your experiment.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {backgrounds.map((bg) => (
            <div
              key={bg.id}
              onClick={() => onSelect(bg)}
              className={cn(
                "relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all",
                selectedId === bg.id ? 'border-primary shadow-lg shadow-primary/30' : 'border-transparent hover:border-muted-foreground'
              )}
            >
              <Image
                src={bg.imageUrl}
                alt={bg.name}
                width={200}
                height={150}
                data-ai-hint={bg.hint}
                className="w-full h-auto object-cover aspect-[4/3]"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                <p className="text-sm font-semibold text-white text-center">{bg.name}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
