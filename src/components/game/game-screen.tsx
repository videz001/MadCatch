"use client";

import React, { useRef, useEffect, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { useGameLogic } from '@/hooks/use-game-logic';
import Image from 'next/image';

interface GameScreenProps {
  characterImage: string;
  backgroundImage: string;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  onMiss: (misses: number) => void;
  maxMisses: number;
  isPlaying: boolean;
}

export default function GameScreen({
  characterImage,
  backgroundImage,
  onGameOver,
  onScoreUpdate,
  onMiss,
  maxMisses,
  isPlaying,
}: GameScreenProps) {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (gameAreaRef.current) {
        setDimensions({
          width: gameAreaRef.current.offsetWidth,
          height: gameAreaRef.current.offsetHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const { characterX, flasks } = useGameLogic({
    gameAreaWidth: dimensions.width,
    gameAreaHeight: dimensions.height,
    maxMisses,
    isPlaying,
    onGameOver,
    onScoreUpdate,
    onMiss
  });

  return (
    <div
      ref={gameAreaRef}
      className="w-full h-full bg-cover bg-center overflow-hidden relative"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {dimensions.width > 0 && (
        <>
          {/* Character */}
          <div
            className="absolute bottom-5 transition-[left] duration-75 ease-linear"
            style={{
              left: `${characterX}px`,
              width: '80px',
              height: '80px',
            }}
          >
            <Image
              src={characterImage}
              alt="Game Character"
              width={80}
              height={80}
              unoptimized
              className="object-contain w-full h-full"
            />
          </div>

          {/* Flasks */}
          {flasks.map(flask => (
            <div
              key={flask.id}
              className="absolute text-primary"
              style={{
                left: `${flask.x}px`,
                top: `${flask.y}px`,
              }}
            >
              <FlaskConical className="w-10 h-10" fill="currentColor" />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
