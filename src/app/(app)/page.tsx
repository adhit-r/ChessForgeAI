
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageTitle from "@/components/common/page-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { BarChart3, BrainCircuit, LayoutDashboard, AlertTriangle, TrendingUp, TrendingDown, Puzzle, Loader2, Info, UserSearch, FileSignature } from "lucide-react";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { fetchGameHistory, FetchGameHistoryInput } from '@/ai/flows/fetch-game-history';
import { deepAnalyzeGameMetrics, DeepAnalyzeGameMetricsOutput } from '@/ai/flows/deep-analyze-game-metrics';

interface Insight {
  id: string;
  title: string;
  value: string; 
  icon: React.ReactNode;
  description?: string; 
  color?: string; 
  trainingLink?: string; 
  severity?: "high" | "medium" | "low";
}

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
  return <Info size={24} />; 
}

const defaultInsights: Insight[] = [
  {
    id: 'placeholder_initial',
    title: "Welcome to ChessForgeAI!",
    value: "Analyze your games to get personalized insights.",
    icon: <FileSignature size={24}/>,
    description: "Use the form below to fetch your Lichess game history or import games on the Analysis page.",
  },
];

const lichessUsernameSchema = z.object({
  lichessUsername: z.string().min(2, "Username must be at least 2 characters.").max(50, "Username too long."),
});
type LichessUsernameFormValues = z.infer<typeof lichessUsernameSchema>;

export default function DashboardPage() {
  const { toast } = useToast();
  const [analysisInsights, setAnalysisInsights] = useState<Insight[]>(defaultInsights);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true); // For initial load
  const [analysisSummary, setAnalysisSummary] = useState<string | null>("Enter your Lichess username below or use the Analysis page to get started.");
  const [isFetchingLichessGames, setIsFetchingLichessGames] = useState(false);

  const lichessForm = useForm<LichessUsernameFormValues>({
    resolver: zodResolver(lichessUsernameSchema),
    defaultValues: { lichessUsername: "" },
  });

  const processAndDisplayAnalysis = (analysisOutput: DeepAnalyzeGameMetricsOutput, username: string) => {
    setAnalysisSummary(analysisOutput.overallSummary || `Analysis complete for ${username}.`);
    const newInsights = analysisOutput.primaryWeaknesses.map((weakness, index) => ({
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
      description: `No specific primary weaknesses identified for ${username}, or analysis is general. Keep up the good work!`,
    }]);
  };

  const onFetchLichessGamesSubmit: SubmitHandler<LichessUsernameFormValues> = async (data) => {
    setIsFetchingLichessGames(true);
    setAnalysisSummary("Fetching your Lichess game history...");
    setAnalysisInsights([{
      id: 'loading_lichess',
      title: "Fetching Lichess Games...",
      value: `Looking for games for ${data.lichessUsername}.`,
      icon: <Loader2 className="animate-spin" size={24} />,
      description: "This might take a moment.",
    }]);

    try {
      const historyInput: FetchGameHistoryInput = { platform: "lichess", username: data.lichessUsername, maxGames: 10 };
      const historyOutput = await fetchGameHistory(historyInput);

      if (historyOutput.games && historyOutput.games.length > 0) {
        toast({
          title: "Games Fetched!",
          description: `Found ${historyOutput.games.length} games for ${data.lichessUsername}. Now analyzing...`,
        });
        setAnalysisSummary(`Analyzing ${historyOutput.games.length} games for ${data.lichessUsername}...`);
        setAnalysisInsights([{
          id: 'analyzing_lichess',
          title: "Analyzing Games...",
          value: `Processing ${historyOutput.games.length} games.`,
          icon: <Loader2 className="animate-spin" size={24} />,
          description: "Generating insights based on your play.",
        }]);

        const deepAnalysis = await deepAnalyzeGameMetrics({ gamePgns: historyOutput.games, playerUsername: data.lichessUsername });
        processAndDisplayAnalysis(deepAnalysis, data.lichessUsername);
        toast({
          title: "Analysis Complete",
          description: `Personalized insights for ${data.lichessUsername} are ready.`,
        });

      } else {
        toast({
          title: "No Games Found",
          description: `Could not find recent games for ${data.lichessUsername} on Lichess or an error occurred.`,
          variant: "default", 
        });
        setAnalysisSummary(`No Lichess games found for ${data.lichessUsername}. Try checking the username or play some games!`);
        setAnalysisInsights([{
          id: 'no_lichess_games',
          title: "No Lichess Games",
          value: "Please check the username or try again later.",
          icon: getLucideIcon("Info"),
          description: "Ensure the Lichess profile is public and has recent games.",
        }]);
      }
    } catch (error) {
      console.error("Error fetching/analyzing Lichess history:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: `Failed to process Lichess history for ${data.lichessUsername}. ${errorMessage}`,
        variant: "destructive",
      });
      setAnalysisSummary(`Error processing games for ${data.lichessUsername}.`);
      setAnalysisInsights([{
        id: 'error_lichess_processing',
        title: "Processing Error",
        value: "Could not fetch or analyze Lichess games.",
        icon: getLucideIcon("AlertTriangle"),
        description: errorMessage,
      }]);
    } finally {
      setIsFetchingLichessGames(false);
    }
  };


  useEffect(() => {
    const loadInitialDashboard = async () => {
      setIsLoadingInsights(true);
      // This is where you might check auth status and load user-specific data
      // For now, we just set the default state and let the user trigger Lichess fetch.
      setAnalysisInsights(defaultInsights);
      setAnalysisSummary("Enter your Lichess username below or use the Analysis page to get started.");
      setIsLoadingInsights(false);
    };
    loadInitialDashboard();
  }, []);

  return (
    <div className="space-y-8">
      <PageTitle title="Dashboard" subtitle="Your chess performance at a glance" icon={<LayoutDashboard size={32} />} />

      <Card className="bg-card rounded-xl shadow-soft-ui">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserSearch size={24}/> Fetch Lichess Game History</CardTitle>
          <CardDescription>Enter your Lichess.org username to fetch your recent games and get personalized insights.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...lichessForm}>
            <form onSubmit={lichessForm.handleSubmit(onFetchLichessGamesSubmit)} className="flex flex-col sm:flex-row items-start gap-4">
              <FormField
                control={lichessForm.control}
                name="lichessUsername"
                render={({ field }) => (
                  <FormItem className="flex-grow w-full sm:w-auto">
                    <FormLabel htmlFor="lichessUsername" className="sr-only">Lichess Username</FormLabel>
                    <FormControl>
                      <Input id="lichessUsername" placeholder="e.g., DrNykterstein" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isFetchingLichessGames} className="w-full sm:w-auto">
                {isFetchingLichessGames ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserSearch className="mr-2 h-4 w-4" />}
                Fetch & Analyze
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {(isLoadingInsights || isFetchingLichessGames) && !analysisSummary && ( // Show global loader only if summary is also not set
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

      {analysisSummary && (
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

