"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

const CHARACTER_WIDTH = 80;
const CHARACTER_SPEED = 25;
const FLASK_WIDTH = 40;
const FLASK_HEIGHT = 40;
const FLASK_SPAWN_RATE = 1000; // ms

interface Flask {
  id: number;
  x: number;
  y: number;
  speed: number;
}

interface UseGameLogicProps {
  gameAreaWidth: number;
  gameAreaHeight: number;
  maxMisses: number;
  isPlaying: boolean;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  onMiss: (misses: number) => void;
}

export const useGameLogic = ({
  gameAreaWidth,
  gameAreaHeight,
  maxMisses,
  isPlaying,
  onGameOver,
  onScoreUpdate,
  onMiss
}: UseGameLogicProps) => {
  const [characterX, setCharacterX] = useState(gameAreaWidth / 2 - CHARACTER_WIDTH / 2);
  const [flasks, setFlasks] = useState<Flask[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  
  const gameLoopRef = useRef<number>();
  const flaskSpawnerRef = useRef<NodeJS.Timeout>();

  const resetGame = useCallback(() => {
    setCharacterX(gameAreaWidth / 2 - CHARACTER_WIDTH / 2);
    setFlasks([]);
    setScore(0);
    setMisses(0);
    onScoreUpdate(0);
    onMiss(0);
  }, [gameAreaWidth, onScoreUpdate, onMiss]);

  // Game Loop
  useEffect(() => {
    const gameLoop = () => {
      if (!isPlaying) {
        cancelAnimationFrame(gameLoopRef.current!);
        return;
      }

      setFlasks(prevFlasks => {
        const newFlasks = prevFlasks.map(flask => ({
          ...flask,
          y: flask.y + flask.speed,
        }));

        const caughtFlasks: number[] = [];
        let newMisses = misses;

        const characterY = gameAreaHeight - 80;

        for (const flask of newFlasks) {
          // Collision detection
          if (
            flask.y + FLASK_HEIGHT >= characterY &&
            flask.x < characterX + CHARACTER_WIDTH &&
            flask.x + FLASK_WIDTH > characterX
          ) {
            caughtFlasks.push(flask.id);
            setScore(s => {
              const newScore = s + 1;
              onScoreUpdate(newScore);
              return newScore;
            });
          }
        }
        
        const remainingFlasks = newFlasks.filter(flask => {
            if (flask.y > gameAreaHeight) {
                newMisses++;
                onMiss(newMisses);
                return false;
            }
            return !caughtFlasks.includes(flask.id);
        });

        if (newMisses >= maxMisses) {
            onGameOver(score);
        }
        setMisses(newMisses);

        return remainingFlasks;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    if (isPlaying) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isPlaying, characterX, gameAreaHeight, maxMisses, onGameOver, score, misses, onScoreUpdate, onMiss]);

  // Flask Spawner
  useEffect(() => {
    if (isPlaying) {
      flaskSpawnerRef.current = setInterval(() => {
        setFlasks(prev => [
          ...prev,
          {
            id: Date.now(),
            x: Math.random() * (gameAreaWidth - FLASK_WIDTH),
            y: -FLASK_HEIGHT,
            speed: 2 + Math.random() * 3,
          },
        ]);
      }, FLASK_SPAWN_RATE);
    } else {
      if (flaskSpawnerRef.current) clearInterval(flaskSpawnerRef.current);
    }

    return () => {
      if (flaskSpawnerRef.current) clearInterval(flaskSpawnerRef.current);
    };
  }, [isPlaying, gameAreaWidth]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if(!isPlaying) return;
      if (e.key === 'ArrowLeft') {
        setCharacterX(x => Math.max(0, x - CHARACTER_SPEED));
      } else if (e.key === 'ArrowRight') {
        setCharacterX(x => Math.min(gameAreaWidth - CHARACTER_WIDTH, x + CHARACTER_SPEED));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameAreaWidth]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  return { characterX, flasks };
};
