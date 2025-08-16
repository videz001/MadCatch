"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "lucide-react";
import type { Player } from "@/lib/types";

interface LeaderboardProps {
    players: Player[];
}

export default function Leaderboard({ players }: LeaderboardProps) {
  const truncateAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            <span>Leaderboard</span>
        </CardTitle>
        <CardDescription>
            Top scores across the lab.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {players.length > 0 ? (
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[50px]">Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {players.map((player) => (
                    <TableRow key={player.rank}>
                        <TableCell className="font-medium">{player.rank}</TableCell>
                        <TableCell className="font-mono">
                            {truncateAddress(player.address)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">{player.score}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        ) : (
            <div className="text-center text-muted-foreground py-8">
                <p>No scores yet.</p>
                <p>Play a game to see your name on the board!</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
