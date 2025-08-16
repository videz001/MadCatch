"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

const CHARACTER_WIDTH = 80;
const INITIAL_SPEED = 0;
const MAX_SPEED = 20;
const ACCELERATION = 1.2;
const FLASK_WIDTH = 40;
const FLASK_HEIGHT = 40;
const INITIAL_FLASK_SPEED = 4;
const FLASK_ACCELERATION = 0.2;

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
  const [flask, setFlask] = useState<Flask | null>(null);
  
  const scoreRef = useRef(0);
  const missesRef = useRef(0);
  const velocityXRef = useRef(INITIAL_SPEED);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const gameLoopRef = useRef<number>();

  const spawnFlask = useCallback(() => {
    if (gameAreaWidth > 0 && isPlaying) {
      const newFlaskSpeed = INITIAL_FLASK_SPEED + (scoreRef.current * FLASK_ACCELERATION);
      setFlask({
        id: Date.now(),
        x: Math.random() * (gameAreaWidth - FLASK_WIDTH),
        y: -FLASK_HEIGHT,
        speed: newFlaskSpeed,
      });
    }
  }, [gameAreaWidth, isPlaying]);
  
  const resetGame = useCallback(() => {
    setCharacterX(gameAreaWidth / 2 - CHARACTER_WIDTH / 2);
    setFlask(null);
    scoreRef.current = 0;
    missesRef.current = 0;
    onScoreUpdate(0);
    onMiss(0);
    velocityXRef.current = 0;
    if (isPlaying) {
      spawnFlask();
    }
  }, [gameAreaWidth, onScoreUpdate, onMiss, isPlaying, spawnFlask]);

  // Game Loop
  useEffect(() => {
    const gameLoop = () => {
      if (!isPlaying) {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        return;
      }

      // Update character position based on keyboard input
      let currentVelocityX = velocityXRef.current;
      if (keysRef.current['ArrowLeft']) {
        currentVelocityX = Math.max(-MAX_SPEED, currentVelocityX - ACCELERATION);
      } else if (keysRef.current['ArrowRight']) {
        currentVelocityX = Math.min(MAX_SPEED, currentVelocityX + ACCELERATION);
      } else {
        currentVelocityX = 0; // Stop immediately if no key is pressed
      }
      velocityXRef.current = currentVelocityX;
      
      setCharacterX(prevX => {
        const newX = prevX + currentVelocityX;
        return Math.max(0, Math.min(gameAreaWidth - CHARACTER_WIDTH, newX));
      });

      // Update flask position and check for catch/miss
      setFlask(currentFlask => {
        if (currentFlask) {
          const newFlaskY = currentFlask.y + currentFlask.speed;
          const characterY = gameAreaHeight - 80;

          // Collision detection
          if (
            newFlaskY + FLASK_HEIGHT >= characterY &&
            currentFlask.y < characterY + FLASK_HEIGHT &&
            currentFlask.x < characterX + CHARACTER_WIDTH &&
            currentFlask.x + FLASK_WIDTH > characterX
          ) {
            scoreRef.current += 1;
            onScoreUpdate(scoreRef.current);
            spawnFlask();
            return null; // Remove caught flask
          } else if (newFlaskY > gameAreaHeight) {
            missesRef.current += 1;
            onMiss(missesRef.current);
            if (missesRef.current >= maxMisses) {
              onGameOver(scoreRef.current);
            } else {
              spawnFlask();
            }
            return null; // Remove missed flask
          } else {
            return { ...currentFlask, y: newFlaskY }; // Update flask position
          }
        }
        return currentFlask;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    if (isPlaying) {
      if (!flask) spawnFlask(); // Initial flask spawn
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isPlaying, gameAreaWidth, gameAreaHeight, maxMisses, onGameOver, onScoreUpdate, onMiss, spawnFlask, characterX]);


  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if(e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        keysRef.current[e.key] = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if(e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        keysRef.current[e.key] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    resetGame();
  }, [isPlaying, gameAreaWidth, resetGame]); // isPlaying toggle or resize should reset the game

  return { characterX, flask };
};
