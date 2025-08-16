"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "lucide-react";
import type { Player } from "@/lib/types";

const mockLeaderboard: Player[] = [
  { rank: 1, address: "osmo1...jfa5c", score: 1024 },
  { rank: 2, address: "osmo1...d4fg6", score: 980 },
  { rank: 3, address: "osmo1...h7jkl", score: 850 },
  { rank: 4, address: "osmo1...a1s2d", score: 768 },
  { rank: 5, address: "osmo1...z9x8c", score: 642 },
  { rank: 6, address: "osmo1...qwe3r", score: 512 },
  { rank: 7, address: "osmo1...tyu6i", score: 400 },
];

export default function Leaderboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            <span>Leaderboard</span>
        </CardTitle>
        <CardDescription>Top scores across the lab.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockLeaderboard.map((player) => (
              <TableRow key={player.rank}>
                <TableCell className="font-medium">{player.rank}</TableCell>
                <TableCell className="font-mono">{`${player.address.substring(0, 10)}...`}</TableCell>
                <TableCell className="text-right font-bold text-primary">{player.score}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
