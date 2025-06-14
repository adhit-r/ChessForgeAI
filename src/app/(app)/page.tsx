
"use client";

import PageTitle from "@/components/common/page-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, BrainCircuit, LayoutDashboard, AlertTriangle, TrendingUp, TrendingDown, Puzzle } from "lucide-react";
import Image from 'next/image';

interface Insight {
  id: string;
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string; // Tailwind color class e.g. text-green-400
}

const insights: Insight[] = [
  {
    id: 'mistakes',
    title: "Common Blunders",
    value: "Pawn Structure",
    icon: <AlertTriangle className="text-destructive" size={24} />,
    description: "Frequent errors in maintaining pawn integrity.",
    color: "text-destructive"
  },
  {
    id: 'weakest_phase',
    title: "Weakest Phase",
    value: "Middlegame",
    icon: <Puzzle className="text-yellow-400" size={24} />,
    description: "Struggles with complex tactical positions.",
     color: "text-yellow-400"
  },
  {
    id: 'best_opening',
    title: "Best Opening",
    value: "Sicilian Defense",
    icon: <TrendingUp className="text-green-400" size={24} />,
    description: "Highest win rate when playing this opening.",
    color: "text-green-400"
  },
   {
    id: 'improvement_area',
    title: "Focus Area",
    value: "Endgame Technique",
    icon: <BrainCircuit className="text-accent" size={24} />,
    description: "Needs practice in converting advantages.",
    color: "text-accent"
  }
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageTitle title="Dashboard" subtitle="Your chess performance at a glance" icon={<LayoutDashboard size={32} />} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {insights.map((insight) => (
          <Card key={insight.id} className="bg-card rounded-xl shadow-soft-ui">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{insight.title}</CardTitle>
              {insight.icon}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${insight.color || 'text-foreground'}`}>{insight.value}</div>
              {insight.description && <p className="text-xs text-muted-foreground pt-1">{insight.description}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card rounded-xl shadow-soft-ui">
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Your ELO rating over the last 30 games (mock data).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
              <Image src="https://placehold.co/600x300.png/F8F9FA/252F40?text=Performance+Chart" alt="Performance Chart Placeholder" data-ai-hint="graph performance" width={600} height={300} className="rounded-md opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card rounded-xl shadow-soft-ui">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Summary of your latest analyzed games.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {id: 1, opponent: "PlayerX", result: "Win", opening: "King's Gambit"},
              {id: 2, opponent: "ChessMasterY", result: "Loss", opening: "Caro-Kann"},
              {id: 3, opponent: "RookieZ", result: "Draw", opening: "Italian Game"},
            ].map(game => (
              <div key={game.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                <div>
                  <p className="font-medium text-foreground">vs {game.opponent}</p>
                  <p className="text-xs text-muted-foreground">{game.opening}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  game.result === "Win" ? "bg-green-500/20 text-green-400" : // TODO: Use theme colors
                  game.result === "Loss" ? "bg-red-500/20 text-red-400" : // TODO: Use theme colors
                  "bg-yellow-500/20 text-yellow-400" // TODO: Use theme colors
                }`}>
                  {game.result}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
