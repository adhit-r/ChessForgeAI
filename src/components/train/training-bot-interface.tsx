
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; // Changed from Input
import { Loader2, BotIcon, MessageSquare, Brain, Send, RotateCcw, SearchCheck } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";

// Import types from the new API route location
import { type TrainingBotInput, type TrainingBotOutput } from '@/app/api/ai/training-bot-analysis/route';
import EvaluationBar from './evaluation-bar';

// Basic FEN validation: checks for 6 space-separated parts, and some common characters.
// More robust FEN validation is complex and usually requires a chess library.
const fenSchema = z.object({
  fenInput: z.string()
    .min(15, { message: "FEN string seems too short." })
    .max(100, { message: "FEN string is too long (max 100 chars)." })
    .regex(/^([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+ [wb] (K?Q?k?q?|-) ([a-h][36]|-)( \d+){2}$/, {
      message: "Invalid FEN format. Example: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    }),
});
type FenFormValues = z.infer<typeof fenSchema>;

interface AnalysisLogEntry {
  id: string;
  fen: string;
  suggestion?: string;
  evaluation?: number;
  error?: string;
}

interface TrainingBotInterfaceProps {
  onFenAnalyzed: (fen: string) => void;
  initialFen: string;
}

export default function TrainingBotInterface({ onFenAnalyzed, initialFen }: TrainingBotInterfaceProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisLog, setAnalysisLog] = useState<AnalysisLogEntry[]>([]);
  const [currentBotEvaluation, setCurrentBotEvaluation] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fenForm = useForm<FenFormValues>({
    resolver: zodResolver(fenSchema),
    defaultValues: { fenInput: initialFen },
  });

  const addLogEntry = (entry: Omit<AnalysisLogEntry, 'id'>) => {
    setAnalysisLog(prev => [{ id: Date.now().toString(), ...entry }, ...prev].slice(0, 10)); // Keep last 10
  };
  
  useEffect(() => {
    // Optionally, analyze the initial FEN on load
    // fenForm.handleSubmit(handleFenSubmit)(); 
    // For now, let user click to analyze initial FEN
  }, []);


  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [analysisLog]);

  const handleReset = () => {
    fenForm.reset({ fenInput: initialFen });
    setCurrentBotEvaluation(0);
    setAnalysisLog([]);
    onFenAnalyzed(initialFen); // Reset display FEN on parent
    toast({ title: "Analyzer Reset", description: "FEN input and analysis cleared."});
  };

  const handleFenSubmit: SubmitHandler<FenFormValues> = async (data) => {
    setIsLoading(true);
    const fenToAnalyze = data.fenInput;

    try {
      const botInput: TrainingBotInput = {
        currentBoardState: fenToAnalyze,
        // gameHistory and moveNumber are less critical for single FEN analysis but can be kept if needed
      };

      // Call the new API route
      const apiResponse = await fetch('/api/ai/training-bot-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botInput),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ error: 'Training bot analysis request failed with status ' + apiResponse.status }));
        throw new Error(errorData.error || 'Failed to get analysis from training bot');
      }
      const response: TrainingBotOutput = await apiResponse.json();
      
      addLogEntry({
        fen: fenToAnalyze,
        suggestion: response.suggestedMove,
        evaluation: response.evaluation,
      });
      setCurrentBotEvaluation(response.evaluation);
      onFenAnalyzed(fenToAnalyze); // Notify parent of the FEN that was analyzed
      toast({ title: "Analysis Complete", description: `Lichess Stockfish suggestion: ${response.suggestedMove}`});

    } catch (error) {
      console.error("Error interacting with training bot:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLogEntry({ fen: fenToAnalyze, error: errorMessage });
      toast({ title: "Bot Analysis Error", description: `Could not get suggestion. ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card glass className="p-4 sm:p-6">
        <CardHeader className="p-0 pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-xl">
              <BotIcon size={24} /> FEN Analyzer
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={handleReset} title="Reset Analyzer">
              <RotateCcw size={18} />
            </Button>
          </div>
          <CardDescription>
            Paste a FEN string to get Lichess Stockfish analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <EvaluationBar evaluation={currentBotEvaluation / 100} />
          
          <ScrollArea className="h-[200px] w-full rounded-lg border border-white/10 p-3 mt-4 mb-4 bg-background/30 shadow-inner-glow text-xs" ref={scrollAreaRef}>
            {analysisLog.length === 0 && <p className="text-muted-foreground text-center py-4">No analysis yet. Submit a FEN.</p>}
            {analysisLog.map((entry) => (
              <div key={entry.id} className="mb-2 p-2 rounded-md bg-background/40 border border-white/5 shadow-sm">
                <p className="font-code text-muted-foreground break-all">FEN: {entry.fen}</p>
                {entry.suggestion && <p className="text-primary">Suggested: {entry.suggestion} (Eval: {(entry.evaluation!/100).toFixed(2)})</p>}
                {entry.error && <p className="text-destructive">Error: {entry.error}</p>}
              </div>
            ))}
          </ScrollArea>
          
          <Form {...fenForm}>
            <form onSubmit={fenForm.handleSubmit(handleFenSubmit)} className="space-y-3">
              <FormField
                control={fenForm.control}
                name="fenInput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="fenInput">FEN String</FormLabel>
                    <FormControl>
                      <Textarea 
                        id="fenInput" 
                        placeholder="e.g., rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" 
                        {...field} 
                        autoComplete="off" 
                        className="font-code bg-background/50 border-border/50 placeholder-muted-foreground/70 min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage className="mt-1 text-xs" />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <SearchCheck className="mr-2 h-5 w-5" />}
                Analyze FEN
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
