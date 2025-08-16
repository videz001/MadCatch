"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

const CHARACTER_WIDTH = 80;
const INITIAL_SPEED = 0;
const MAX_SPEED = 20;
const ACCELERATION = 0.5;
const FRICTION = 0.95;
const FLASK_WIDTH = 40;
const FLASK_HEIGHT = 40;
const INITIAL_FLASK_SPEED = 2;
const FLASK_ACCELERATION = 0.05;

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
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  
  const [velocityX, setVelocityX] = useState(INITIAL_SPEED);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  const gameLoopRef = useRef<number>();

  const spawnFlask = useCallback(() => {
    if (gameAreaWidth > 0) {
      const newFlaskSpeed = INITIAL_FLASK_SPEED + (score * FLASK_ACCELERATION);
      setFlask({
        id: Date.now(),
        x: Math.random() * (gameAreaWidth - FLASK_WIDTH),
        y: -FLASK_HEIGHT,
        speed: newFlaskSpeed,
      });
    }
  }, [gameAreaWidth, score]);
  
  const resetGame = useCallback(() => {
    setCharacterX(gameAreaWidth / 2 - CHARACTER_WIDTH / 2);
    setFlask(null);
    setScore(0);
    setMisses(0);
    onScoreUpdate(0);
    onMiss(0);
    setVelocityX(0);
    if(isPlaying) {
      spawnFlask();
    }
  }, [gameAreaWidth, onScoreUpdate, onMiss, isPlaying, spawnFlask]);


  // Game Loop
  useEffect(() => {
    const gameLoop = () => {
      if (!isPlaying) {
        cancelAnimationFrame(gameLoopRef.current!);
        return;
      }

      // Update character position
      let currentVelocityX = velocityX;
      if (keysRef.current['ArrowLeft']) {
        currentVelocityX = Math.max(-MAX_SPEED, currentVelocityX - ACCELERATION);
      } else if (keysRef.current['ArrowRight']) {
        currentVelocityX = Math.min(MAX_SPEED, currentVelocityX + ACCELERATION);
      } else {
        currentVelocityX *= FRICTION;
        if (Math.abs(currentVelocityX) < 0.1) {
          currentVelocityX = 0;
        }
      }
      
      setVelocityX(currentVelocityX);
      setCharacterX(prevX => {
        const newX = prevX + currentVelocityX;
        return Math.max(0, Math.min(gameAreaWidth - CHARACTER_WIDTH, newX));
      });

      // Update flask position and check for catch/miss
      if (flask) {
        const newFlaskY = flask.y + flask.speed;
        let newMisses = misses;

        const characterY = gameAreaHeight - 80;

        // Collision detection
        if (
          newFlaskY + FLASK_HEIGHT >= characterY &&
          flask.y < characterY + FLASK_HEIGHT && // prev position check
          flask.x < characterX + CHARACTER_WIDTH &&
          flask.x + FLASK_WIDTH > characterX
        ) {
          setScore(s => {
            const newScore = s + 1;
            onScoreUpdate(newScore);
            return newScore;
          });
          setFlask(null);
          spawnFlask();
        } else if (newFlaskY > gameAreaHeight) {
          newMisses++;
          onMiss(newMisses);
          setFlask(null);
          if (newMisses >= maxMisses) {
            onGameOver(score);
          } else {
            spawnFlask();
          }
        } else {
          setFlask({ ...flask, y: newFlaskY });
        }
        setMisses(newMisses);
      } else if (isPlaying) {
          spawnFlask();
      }

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
  }, [isPlaying, characterX, gameAreaHeight, maxMisses, onGameOver, score, misses, onScoreUpdate, onMiss, flask, velocityX, spawnFlask]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if(e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            keysRef.current[e.key] = true;
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if(e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
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
  }, [resetGame]);

  return { characterX, flask };
};
