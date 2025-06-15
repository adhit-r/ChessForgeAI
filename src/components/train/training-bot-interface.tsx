
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, BotIcon, MessageSquare, Brain, Send, RotateCcw } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";

import { analyzeGameAndSuggestMove, TrainingBotInput, TrainingBotOutput } from '@/ai/flows/training-bot-analysis';
import EvaluationBar from './evaluation-bar';

const moveSchema = z.object({
  userMove: z.string().min(2, { message: "Move must be at least 2 characters (e.g., e4)." })
    .regex(/^[a-h][1-8][a-h][1-8]([qrbn])?$/, { message: "Invalid move format (e.g., e2e4, e7e8q)." }),
});
type MoveFormValues = z.infer<typeof moveSchema>;

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  evaluation?: number;
  suggestion?: string;
}

// Standard starting FEN
const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function TrainingBotInterface() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentFen, setCurrentFen] = useState(initialFen); // This should be updated by actual game logic
  const [moveNumber, setMoveNumber] = useState(1);
  const [botEvaluation, setBotEvaluation] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const moveForm = useForm<MoveFormValues>({
    resolver: zodResolver(moveSchema),
    defaultValues: { userMove: "" },
  });

  const addMessage = (sender: ChatMessage['sender'], text: string, evaluation?: number, suggestion?: string) => {
    setChatMessages(prev => [...prev, { id: Date.now().toString(), sender, text, evaluation, suggestion }]);
  };
  
  useEffect(() => {
    addMessage('system', "Game started. Enter your move in UCI format (e.g., e2e4). The bot uses Lichess Stockfish for analysis.");
  }, []);

  useEffect(() => {
    // Scroll to bottom of chat
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [chatMessages]);

  const handleResetGame = () => {
    setCurrentFen(initialFen);
    setMoveNumber(1);
    setBotEvaluation(0);
    setChatMessages([]);
    addMessage('system', "Game reset. Enter your move in UCI format.");
    moveForm.reset();
    toast({ title: "Game Reset", description: "The training board has been reset."});
  };

  const handleMoveSubmit: SubmitHandler<MoveFormValues> = async (data) => {
    setIsLoading(true);
    const userMoveText = `Your move: ${data.userMove}`;
    addMessage('user', userMoveText);
    moveForm.reset();

    try {
      // In a real app, you'd update currentFen based on data.userMove using a chess library
      // For this placeholder, we'll just pass the existing FEN
      const botInput: TrainingBotInput = {
        currentBoardState: currentFen, 
        moveNumber: moveNumber,
      };

      const response = await analyzeGameAndSuggestMove(botInput);
      
      addMessage(
        'bot', 
        `Lichess Stockfish suggests: ${response.suggestedMove}. ${response.explanation}`,
        response.evaluation,
        response.suggestedMove
      );
      setBotEvaluation(response.evaluation);
      // Again, in a real app, update currentFen based on bot's suggestedMove if it were playing against itself, or after user makes bot's suggested move.
      // For now, we'll just increment move number.
      setMoveNumber(prev => prev + 1);

    } catch (error) {
      console.error("Error interacting with training bot:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addMessage('system', `Error: ${errorMessage}`);
      toast({ title: "Bot Error", description: `Could not get suggestion. ${errorMessage}`, variant: "destructive" });
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
              <BotIcon size={24} /> Training Bot
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={handleResetGame} title="Reset Game">
              <RotateCcw size={18} />
            </Button>
          </div>
          <CardDescription>
            Enter moves in UCI format (e.g. e2e4). Bot uses Lichess Stockfish.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <EvaluationBar evaluation={botEvaluation/100} /> {/* Assuming eval is in centipawns */}
          
          <ScrollArea className="h-[300px] w-full rounded-lg border border-white/10 p-4 mt-4 mb-4 bg-background/30 shadow-inner-glow" ref={scrollAreaRef}>
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`mb-3 p-3 rounded-xl max-w-[90%] break-words text-sm ${
                msg.sender === 'user' ? 'ml-auto bg-primary/80 text-primary-foreground shadow-md' : 
                msg.sender === 'bot' ? 'mr-auto bg-accent/80 text-accent-foreground shadow-md' : 
                'mx-auto bg-muted/50 text-muted-foreground text-xs text-center italic'
              }`}>
                <p>{msg.text}</p>
                {msg.sender === 'bot' && msg.evaluation !== undefined && (
                  <p className="text-xs mt-1 opacity-80">Eval: {(msg.evaluation/100).toFixed(2)}</p>
                )}
              </div>
            ))}
          </ScrollArea>
          
          <Form {...moveForm}>
            <form onSubmit={moveForm.handleSubmit(handleMoveSubmit)} className="flex items-start gap-3">
              <FormField
                control={moveForm.control}
                name="userMove"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel htmlFor="userMove" className="sr-only">Your Move</FormLabel>
                    <FormControl>
                      <Input id="userMove" placeholder="e.g., e2e4" {...field} autoComplete="off" className="font-code bg-background/50 border-border/50 placeholder-muted-foreground/70"/>
                    </FormControl>
                    <FormMessage className="mt-1 text-xs" />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} aria-label="Send move" className="px-4 py-2 h-10">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card glass className="p-4 sm:p-6">
        <CardHeader className="p-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-lg"><Brain size={20}/>Bot State (Example)</CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-sm text-muted-foreground space-y-1 font-code text-xs">
            <p><strong>FEN:</strong> <span className="break-all">{currentFen}</span></p>
            <p><strong>Move #:</strong> {moveNumber}</p>
            <p className="italic text-muted-foreground/70 pt-2">This section would show more detailed real-time game state if a full chess library were integrated.</p>
        </CardContent>
      </Card>
    </div>
  );
}
