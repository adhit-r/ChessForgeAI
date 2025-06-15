
"use client";

import React, { useState } from 'react';
import PageTitle from '@/components/common/page-title';
import ChessBoardPlaceholder from '@/components/train/chess-board-placeholder';
import TrainingBotInterface from '@/components/train/training-bot-interface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, WandSparkles, BotMessageSquare } from 'lucide-react'; // Changed icon
import Link from 'next/link';

// Standard starting FEN or an interesting position
const defaultFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function TrainPage() {
  const [currentFenToDisplay, setCurrentFenToDisplay] = useState(defaultFen);

  const handleFenAnalyzed = (fen: string) => {
    setCurrentFenToDisplay(fen);
  };

  return (
    <div className="space-y-8 pb-10">
      <PageTitle 
        title="Position Analyzer & Move Suggester" 
        subtitle="Input a FEN to get Lichess Stockfish analysis for that position." 
        icon={<WandSparkles size={32} className="text-primary"/>} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        <div className="lg:col-span-2 animate-slide-up">
          <ChessBoardPlaceholder fen={currentFenToDisplay} />
        </div>
        <div className="lg:col-span-1 animate-slide-up animation-delay-200">
          <TrainingBotInterface onFenAnalyzed={handleFenAnalyzed} initialFen={defaultFen} />
        </div>
      </div>

      <Card glass className="p-6 animate-fade-in animation-delay-400">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-xl"><BotMessageSquare className="text-accent"/> Play Against a Leveled Bot</CardTitle>
          <CardDescription>
            Want to play a full game against an AI opponent of a specific strength?
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <p className="text-muted-foreground mb-4">
            Lichess.org offers an excellent "Play with the Computer" feature where you can choose from various ELO-rated Stockfish levels, select your color, and play full games.
          </p>
          <Link href="https://lichess.org/play/computer" target="_blank" rel="noopener noreferrer" passHref>
            <Button variant="outline" className="w-full sm:w-auto border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
              Play on Lichess.org <ExternalLink size={16} className="ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
