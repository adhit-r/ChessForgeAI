
"use client";

import React from 'react';
import PageTitle from '@/components/common/page-title';
import ChessBoardPlaceholder from '@/components/train/chess-board-placeholder';
import TrainingBotInterface from '@/components/train/training-bot-interface';
import { BotIcon } from 'lucide-react'; // Changed from Bot to BotIcon for clarity if Bot is a component

export default function TrainPage() {
  // Example FEN, can be managed with state in a real app
  const currentFEN = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";

  return (
    <div className="space-y-8 pb-10">
      <PageTitle title="Train with AI Bot" subtitle="Play against Stockfish and get move suggestions" icon={<BotIcon size={32} className="text-primary"/>} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        <div className="lg:col-span-2 animate-slide-up">
          <ChessBoardPlaceholder fen={currentFEN} />
        </div>
        <div className="lg:col-span-1 animate-slide-up animation-delay-200">
          <TrainingBotInterface />
        </div>
      </div>
    </div>
  );
}
