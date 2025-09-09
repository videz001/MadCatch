// In a real app, this would be a database. For this demo, we'll use a file.
// NOTE: This approach is NOT thread-safe and will not scale. It's for demo purposes only.
import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import type { Player } from '@/lib/types';

const LEADERBOARD_FILE = path.join(process.cwd(), 'leaderboard.json');
const MAX_LEADERBOARD_ENTRIES = 10;

// Ensure the file exists
async function getLeaderboard(): Promise<Player[]> {
  try {
    const data = await fs.readFile(LEADERBOARD_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    return [];
  }
}

async function saveLeaderboard(players: Player[]): Promise<void> {
  // Sort by score descending and take top 10
  const sorted = players.sort((a, b) => b.score - a.score).slice(0, MAX_LEADERBOARD_ENTRIES);
  // Re-assign rank
  const ranked = sorted.map((p, i) => ({ ...p, rank: i + 1 }));
  await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(ranked, null, 2), 'utf-8');
}


export async function GET() {
  const leaderboard = await getLeaderboard();
  return NextResponse.json(leaderboard);
}

export async function POST(req: NextRequest) {
  try {
    const { address, score, characterUrl } = (await req.json()) as { address: string; score: number; characterUrl: string };

    if (!address || typeof score !== 'number' || !characterUrl) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const leaderboard = await getLeaderboard();
    const existingPlayerIndex = leaderboard.findIndex(p => p.address === address);

    if (existingPlayerIndex !== -1) {
      // Player exists, update score only if it's higher
      if (score > leaderboard[existingPlayerIndex].score) {
        leaderboard[existingPlayerIndex].score = score;
        leaderboard[existingPlayerIndex].characterUrl = characterUrl;
      }
    } else {
      // New player, check if they should be on the leaderboard
      if (leaderboard.length < MAX_LEADERBOARD_ENTRIES || score > (leaderboard[leaderboard.length - 1]?.score ?? 0)) {
        leaderboard.push({ address, score, characterUrl, rank: 0 }); // Rank will be recalculated in saveLeaderboard
      }
    }

    await saveLeaderboard(leaderboard);
    
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Failed to update leaderboard:', error);
    return NextResponse.json({ error: 'Failed to update leaderboard' }, { status: 500 });
  }
}
