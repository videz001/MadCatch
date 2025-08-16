"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "lucide-react";
import type { Player } from "@/lib/types";

const mockLeaderboard: Player[] = [
    { rank: 1, address: "osmo1p69a2x2nytgxw7fxp4y0j8f8pjd9rldsfj0a5c", score: 1024 },
    { rank: 2, address: "osmo1h7agf7900edhvvuvpg4yj4cv26r0cavsapyhfw", score: 980 },
    { rank: 3, address: "osmo1r4u5q6k7l8m9n0b1v2c3x4y5z6a7b8d9e0f1g2", score: 850 },
    { rank: 4, address: "osmo1z9x8c7v6b5n4m3l2k1j0h9g8f7d6s5a4q2w1e3", score: 768 },
    { rank: 5, address: "osmo1qwe3r4t5y6u7i8o9p0l1k2j3h4g5f6d7s8a9z0", score: 642 },
    { rank: 6, address: "osmo1mnb2vc3x4z5l6k7j8h9g0f1d2s3a4q5w6e7r8t", score: 512 },
    { rank: 7, address: "osmo1poi2uy3tr4ew5q6as7df8gh9jk0lmnb1vc2x3z", score: 400 },
    { rank: 8, address: "osmo1lkj2h3g4f5d6s7a8z9x0c1v2b3n4m5q6w7e8r9", score: 350 },
    { rank: 9, address: "osmo1zaq2wsx3edc4rfv5tgb6yhn7ujm8ik9ol0p2aq", score: 300 },
    { rank: 10, address: "osmo1tgv2fju3mhy4gr5pwk6syqxfdce7y5kvers6j7", score: 250 },
];

export default function Leaderboard() {
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
                <TableCell className="font-mono">
                    {`${player.address.substring(0, 10)}...`}
                </TableCell>
                <TableCell className="text-right font-bold text-primary">{player.score}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
