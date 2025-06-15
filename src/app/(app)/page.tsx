
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageTitle from "@/components/common/page-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { BarChart3, BrainCircuit, LayoutDashboard, AlertTriangle, TrendingUp, TrendingDown, Puzzle, Loader2, Info } from "lucide-react";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";

import { fetchGameHistory } from '@/ai/flows/fetch-game-history';
import { deepAnalyzeGameMetrics, DeepAnalyzeGameMetricsOutput } from '@/ai/flows/deep-analyze-game-metrics';

interface Insight {
  id: string;
  title: string;
  value: string; // Main text for the insight card, could be training suggestion text
  icon: React.ReactNode;
  description?: string; // Detailed description of the weakness
  color?: string; // Tailwind color class e.g. text-destructive
  trainingLink?: string; // Link to a training page
  severity?: "high" | "medium" | "low";
}

// Helper function to get Lucide icon component from string name
function getLucideIcon(iconName?: string): React.ReactNode {
  const icons: { [key: string]: React.ReactNode } = {
    AlertTriangle: <AlertTriangle size={24} />,
    Puzzle: <Puzzle size={24} />,
    BrainCircuit: <BrainCircuit size={24} />,
    TrendingDown: <TrendingDown size={24} />,
    TrendingUp: <TrendingUp size={24} />,
    BarChart3: <BarChart3 size={24} />,
    Info: <Info size={24}/>
  };
  if (iconName && icons[iconName]) {
    return icons[iconName];
  }
  return <Info size={24} />; // Default icon
}

const defaultInsights: Insight[] = [
  {
    id: 'placeholder1',
    title: "Loading Insights...",
    value: "Analyzing your game history.",
    icon: <Loader2 className="animate-spin" size={24} />,
    description: "Please wait while we generate personalized tips.",
  },
];


export default function DashboardPage() {
  const { toast } = useToast();
  const [analysisInsights, setAnalysisInsights] = useState<Insight[]>(defaultInsights);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoadingInsights(true);
      setAnalysisSummary(null);
      setAnalysisInsights(defaultInsights);

      try {
        const gameHistoryOutput = await fetchGameHistory({ platform: "lichess", username: "MockDashboardUser" });

        if (gameHistoryOutput.games && gameHistoryOutput.games.length > 0) {
          const deepAnalysis = await deepAnalyzeGameMetrics({ gamePgns: gameHistoryOutput.games, playerUsername: "MockDashboardUser" });

          if (deepAnalysis && deepAnalysis.primaryWeaknesses) {
            setAnalysisSummary(deepAnalysis.overallSummary);
            const newInsights = deepAnalysis.primaryWeaknesses.map((weakness, index) => ({
              id: weakness.name.toLowerCase().replace(/\s+/g, '_') || `weakness-${index}`,
              title: weakness.name,
              value: weakness.trainingSuggestion.text,
              icon: getLucideIcon(weakness.icon),
              description: weakness.description,
              severity: weakness.severity,
              trainingLink: weakness.trainingSuggestion.link,
              color: weakness.severity === 'high' ? 'text-destructive' : weakness.severity === 'medium' ? 'text-yellow-500' : 'text-green-500',
            }));
            setAnalysisInsights(newInsights.length > 0 ? newInsights : [{
              id: 'no_specific_weaknesses',
              title: "General Review",
              value: "Continue practicing and analyzing your games!",
              icon: getLucideIcon("Info"),
              description: "No specific primary weaknesses identified from recent games, or analysis is general. Keep up the good work!",
            }]);
          } else {
            setAnalysisSummary("AI analysis could not identify specific areas. Try playing more games or import them for analysis.");
            setAnalysisInsights([{
              id: 'analysis_unavailable',
              title: "Analysis Incomplete",
              value: "Detailed insights could not be generated at this time.",
              icon: getLucideIcon("AlertTriangle"),
              description: "Try importing more games for a deeper analysis.",
            }]);
          }
        } else {
          setAnalysisSummary("No game history found. Import games in the 'Game Analysis' section to get personalized insights.");
           setAnalysisInsights([{
              id: 'no_games',
              title: "No Games Found",
              value: "Import games to get started.",
              icon: getLucideIcon("Info"),
              description: "Head over to the Game Analysis page to import your chess games.",
              trainingLink: "/analysis"
            }]);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast({
          title: "Dashboard Error",
          description: "Could not load AI-powered insights. " + (error instanceof Error ? error.message : String(error)),
          variant: "destructive",
        });
        setAnalysisSummary("Failed to load insights due to an error. Please try again later.");
        setAnalysisInsights([{
          id: 'error_loading',
          title: "Error",
          value: "Could not load insights.",
          icon: getLucideIcon("AlertTriangle"),
          description: "There was a problem fetching or analyzing your game data.",
        }]);
      } finally {
        setIsLoadingInsights(false);
      }
    };

    loadDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Toast is stable

  return (
    <div className="space-y-8">
      <PageTitle title="Dashboard" subtitle="Your chess performance at a glance" icon={<LayoutDashboard size={32} />} />

      {isLoadingInsights && !analysisSummary && (
         <Card className="bg-card rounded-xl shadow-soft-ui">
          <CardHeader>
            <CardTitle>Personalized Insights</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[100px] flex items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
             <p className="ml-2 text-muted-foreground">Generating your personalized dashboard...</p>
          </CardContent>
        </Card>
      )}

      {analysisSummary && !isLoadingInsights && (
        <Card className="bg-card rounded-xl shadow-soft-ui">
          <CardHeader>
            <CardTitle>AI Coach Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{analysisSummary}</p>
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {analysisInsights.map((insight) => (
          <Card key={insight.id} className="bg-card rounded-xl shadow-soft-ui flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className={`text-sm font-medium ${insight.color || 'text-muted-foreground'}`}>{insight.title}</CardTitle>
                {insight.severity && (
                   <span className={`px-2 py-0.5 text-xs rounded-full ${
                    insight.severity === "high" ? "bg-red-500/20 text-red-400" :
                    insight.severity === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-green-500/20 text-green-400" 
                  }`}>
                    Severity: {insight.severity}
                  </span>
                )}
              </div>
              <span className={insight.color || 'text-muted-foreground'}>{insight.icon}</span>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className={`text-lg font-semibold ${insight.color || 'text-foreground'}`}>{insight.value}</div>
              {insight.description && <p className="text-xs text-muted-foreground pt-1">{insight.description}</p>}
            </CardContent>
            {insight.trainingLink && (
              <CardContent className="pt-0">
                <Link href={insight.trainingLink} passHref>
                  <Button variant="outline" size="sm" className="w-full">
                    Train This Area
                  </Button>
                </Link>
              </CardContent>
            )}
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
              <Image src="https://placehold.co/600x300.png" alt="Performance Chart Placeholder" data-ai-hint="graph performance" width={600} height={300} className="rounded-md opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card rounded-xl shadow-soft-ui">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Summary of your latest analyzed games (mock data).</CardDescription>
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
                  game.result === "Win" ? "bg-green-500/20 text-green-400" : 
                  game.result === "Loss" ? "bg-red-500/20 text-red-400" : 
                  "bg-yellow-500/20 text-yellow-400" 
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

