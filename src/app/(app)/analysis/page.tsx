
"use client";

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import PageTitle from '@/components/common/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Lightbulb, Loader2, AlertCircle, CheckCircle, UserSearch } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

import { analyzeChessGame, AnalyzeChessGameOutput } from '@/ai/flows/analyze-chess-game';
import { generateImprovementTips, GenerateImprovementTipsOutput } from '@/ai/flows/generate-improvement-tips';
import { fetchGameHistory, FetchGameHistoryOutput } from '@/ai/flows/fetch-game-history';

const pgnImportSchema = z.object({
  pgn: z.string().min(10, { message: "PGN data seems too short." }).max(20000, { message: "PGN data is too long." }),
});

const usernameImportSchema = z.object({
  platform: z.enum(["lichess", "chesscom", "chess24"], { required_error: "Please select a platform." }),
  username: z.string().min(2, { message: "Username must be at least 2 characters." }),
});

type PgnImportFormValues = z.infer<typeof pgnImportSchema>;
type UsernameImportFormValues = z.infer<typeof usernameImportSchema>;

export default function AnalysisPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeChessGameOutput | null>(null);
  const [improvementTips, setImprovementTips] = useState<GenerateImprovementTipsOutput | null>(null);
  const [activeTab, setActiveTab] = useState<"username" | "pgn">("username");

  const pgnForm = useForm<PgnImportFormValues>({
    resolver: zodResolver(pgnImportSchema),
    defaultValues: { pgn: "" },
  });

  const usernameForm = useForm<UsernameImportFormValues>({
    resolver: zodResolver(usernameImportSchema),
  });

  const processAnalysis = async (pgnData: string, source: string) => {
    try {
      const analysis = await analyzeChessGame({ pgn: pgnData });
      setAnalysisResult(analysis);
      toast({ title: `Game from ${source} Analyzed`, description: "Successfully analyzed the game.", variant: "default" });

      if (analysis?.analysis) {
        const tips = await generateImprovementTips({ gameAnalysis: analysis.analysis });
        setImprovementTips(tips);
        toast({ title: "Tips Generated", description: "Improvement suggestions are ready.", variant: "default" });
      }
    } catch (error) {
      console.error(`Error analyzing game from ${source}:`, error);
      toast({ title: "Analysis Error", description: `Could not analyze the game from ${source}. ` + (error instanceof Error ? error.message : String(error)), variant: "destructive" });
    }
  };

  const handlePgnSubmit: SubmitHandler<PgnImportFormValues> = async (data) => {
    setIsLoading(true);
    setAnalysisResult(null);
    setImprovementTips(null);
    await processAnalysis(data.pgn, "PGN Upload");
    setIsLoading(false);
  };

  const handleUsernameSubmit: SubmitHandler<UsernameImportFormValues> = async (data) => {
    setIsLoading(true);
    setAnalysisResult(null);
    setImprovementTips(null);
    try {
      toast({ title: "Fetching Games...", description: `Attempting to fetch games for ${data.username} from ${data.platform}.`, variant: "default"});
      const historyOutput = await fetchGameHistory({ platform: data.platform as "lichess" | "chesscom" | "chess24", username: data.username });

      if (historyOutput.games && historyOutput.games.length > 0) {
        toast({ title: "Games Fetched!", description: `Found ${historyOutput.games.length} games. Analyzing the first one.`, variant: "default"});
        await processAnalysis(historyOutput.games[0], `${data.platform} (${data.username})`);
      } else {
        toast({ title: "No Games Found", description: `No games found for ${data.username} on ${data.platform}, or the platform integration is pending.`, variant: "default" });
      }
    } catch (error) {
      console.error("Error fetching/analyzing game history:", error);
      toast({ title: "Import Error", description: "Could not fetch or analyze game history. " + (error instanceof Error ? error.message : String(error)), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageTitle title="Game Analysis" subtitle="Import games and get AI-powered insights" icon={<FileText size={32}/>} />

      <Tabs defaultValue="username" onValueChange={(value) => setActiveTab(value as "username" | "pgn")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="username">Import by Username</TabsTrigger>
          <TabsTrigger value="pgn">Upload PGN</TabsTrigger>
        </TabsList>
        <TabsContent value="username">
          <Card className="bg-card rounded-xl shadow-soft-ui">
            <CardHeader>
              <CardTitle>Import from Chess.com, Lichess, or Chess24</CardTitle>
              <CardDescription>Enter your username to import recent games. (Mock data for now)</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...usernameForm}>
                <form onSubmit={usernameForm.handleSubmit(handleUsernameSubmit)} className="space-y-6">
                  <FormField
                    control={usernameForm.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lichess">Lichess.org</SelectItem>
                            <SelectItem value="chesscom">Chess.com</SelectItem>
                            <SelectItem value="chess24">Chess24</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={usernameForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., MagnusCarlsen" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                    {isLoading && activeTab === "username" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserSearch className="mr-2 h-4 w-4" />}
                    Import & Analyze
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pgn">
          <Card className="bg-card rounded-xl shadow-soft-ui">
            <CardHeader>
              <CardTitle>Upload PGN</CardTitle>
              <CardDescription>Paste your game data in PGN format below.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...pgnForm}>
                <form onSubmit={pgnForm.handleSubmit(handlePgnSubmit)} className="space-y-6">
                  <FormField
                    control={pgnForm.control}
                    name="pgn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PGN Data</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="[Event \"Rated Blitz game\"]..."
                            className="min-h-[150px] font-code text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                    {isLoading && activeTab === "pgn" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                    Analyze PGN
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isLoading && (
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-2 mt-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Processing your request...</p>
          <p className="text-muted-foreground">Fetching games and generating insights. This might take a few moments.</p>
        </div>
      )}

      {analysisResult && !isLoading && (
        <Card className="bg-card rounded-xl shadow-soft-ui mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle className="text-green-500" /> Game Analysis Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible defaultValue="analysis">
              <AccordionItem value="analysis">
                <AccordionTrigger className="text-lg font-semibold">Detailed Analysis</AccordionTrigger>
                <AccordionContent className="prose prose-sm prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap p-4 bg-muted/30 rounded-md font-code">
                  {analysisResult.analysis}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {improvementTips && improvementTips.tips.length > 0 && !isLoading && (
        <Card className="bg-card rounded-xl shadow-soft-ui mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="text-yellow-400" /> Improvement Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {improvementTips.tips.map((tip, index) => (
                <li key={index} className="p-4 bg-muted/30 rounded-md border border-border/50">
                  <span dangerouslySetInnerHTML={{ __html: tip.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">${text} <span role="img" aria-label="external link" class="inline-block align-middle"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link h-3 w-3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span></a>`) }}></span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {!isLoading && !analysisResult && !improvementTips && (
         <Card className="bg-card rounded-xl shadow-soft-ui mt-8">
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No Analysis Data</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Import a game by username or upload PGN to see analysis and suggestions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
    

    
