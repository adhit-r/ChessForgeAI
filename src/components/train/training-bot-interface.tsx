"use client";

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Bot, MessageSquare, Brain, Send } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";

import { analyzeGameAndSuggestMove, TrainingBotInput, TrainingBotOutput } from '@/ai/flows/training-bot-analysis';
import EvaluationBar from './evaluation-bar';

const moveSchema = z.object({
  userMove: z.string().min(2, { message: "Move must be at least 2 characters (e.g., e4)." })
    .regex(/^[a-h][1-8][a-h][1-8]([qrbn])?$/, { message: "Invalid move format (e.g., e2e4, e7e8q)." }), // Basic UCI format for simplicity
});
type MoveFormValues = z.infer<typeof moveSchema>;

interface ChatMessage {
  sender: 'user' | 'bot' | 'system';
  text: string;
  evaluation?: number;
  suggestion?: string;
}

// Sample PGN and FEN for demonstration
const sampleGameHistory = `
[Event "Casual Game"]
[Site "Local"]
[Date "2023.10.26"]
[Round "-"]
[White "User"]
[Black "TrainingBot"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 *
`;
const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";


export default function TrainingBotInterface() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentFen, setCurrentFen] = useState(initialFen);
  const [moveNumber, setMoveNumber] = useState(1);
  const [botEvaluation, setBotEvaluation] = useState(0); // For the eval bar

  const moveForm = useForm<MoveFormValues>({
    resolver: zodResolver(moveSchema),
    defaultValues: { userMove: "" },
  });

  useEffect(() => {
    // Initial message
    setChatMessages([{ sender: 'system', text: "Game started. Enter your move in UCI format (e.g., e2e4)." }]);
  }, []);

  const handleMoveSubmit: SubmitHandler<MoveFormValues> = async (data) => {
    setIsLoading(true);
    const userMoveText = `Your move: ${data.userMove}`;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMoveText }]);
    moveForm.reset();

    try {
      // In a real app, update currentFen based on userMove
      // For now, we'll use a static FEN or pass it along
      const botInput: TrainingBotInput = {
        gameHistory: sampleGameHistory, // This should be dynamically built
        currentBoardState: currentFen, // This should be updated after each move
        moveNumber: moveNumber,
      };

      const response = await analyzeGameAndSuggestMove(botInput);
      
      setChatMessages(prev => [
        ...prev,
        { 
          sender: 'bot', 
          text: `Suggested move: ${response.suggestedMove}. ${response.explanation}`,
          evaluation: response.evaluation,
          suggestion: response.suggestedMove
        }
      ]);
      setBotEvaluation(response.evaluation);
      setMoveNumber(prev => prev + 1);
      // Here you would update currentFen based on bot's suggestedMove (if it makes a move) or user's next move.
      // For this example, we are not updating the FEN to keep it simple.

    } catch (error) {
      console.error("Error interacting with training bot:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setChatMessages(prev => [...prev, { sender: 'system', text: `Error: ${errorMessage}` }]);
      toast({ title: "Bot Error", description: `Could not get suggestion. ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot size={24} /> Training Bot Interaction
          </CardTitle>
          <CardDescription>
            Play against the AI. Enter your moves in UCI format (e.g. e2e4, g1f3).
            The bot will provide suggestions and an evaluation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EvaluationBar evaluation={botEvaluation} />
          <ScrollArea className="h-[300px] w-full rounded-md border border-border/30 p-4 mt-4 mb-4 bg-background/20">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`mb-3 p-3 rounded-lg max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto bg-primary/80 text-primary-foreground' : 
                msg.sender === 'bot' ? 'mr-auto bg-accent/80 text-accent-foreground' : 
                'mx-auto bg-muted/80 text-muted-foreground text-xs text-center italic'
              }`}>
                <p className="text-sm">{msg.text}</p>
                {msg.sender === 'bot' && msg.evaluation !== undefined && (
                  <p className="text-xs mt-1 opacity-80">Evaluation: {msg.evaluation > 0 ? `+${msg.evaluation.toFixed(1)}` : msg.evaluation.toFixed(1)}</p>
                )}
              </div>
            ))}
          </ScrollArea>
          
          <Form {...moveForm}>
            <form onSubmit={moveForm.handleSubmit(handleMoveSubmit)} className="flex items-start gap-4">
              <FormField
                control={moveForm.control}
                name="userMove"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel htmlFor="userMove" className="sr-only">Your Move</FormLabel>
                    <FormControl>
                      <Input id="userMove" placeholder="e.g., e2e4" {...field} autoComplete="off" className="font-code" />
                    </FormControl>
                    <FormMessage className="mt-1 text-xs" />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} aria-label="Send move">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card className="glass-card">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Brain size={20}/>Bot Thoughts (Mock)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>Current FEN (example):</strong> {currentFen}</p>
            <p><strong>Move Number:</strong> {moveNumber}</p>
            <p className="italic">This section would show more detailed analysis from the bot in a real application.</p>
        </CardContent>
      </Card>
    </div>
  );
}
