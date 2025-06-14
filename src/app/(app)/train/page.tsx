"use client";

import React from 'react';
import PageTitle from '@/components/common/page-title';
import ChessBoardPlaceholder from '@/components/train/chess-board-placeholder';
import TrainingBotInterface from '@/components/train/training-bot-interface';
import { Bot } from 'lucide-react';

export default function TrainPage() {
  // Example FEN, can be managed with state in a real app
  const currentFEN = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";

  return (
    <div className="space-y-8">
      <PageTitle title="Train with AI Bot" subtitle="Sharpen your skills against an adaptive AI opponent" icon={<Bot size={32} />} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <ChessBoardPlaceholder fen={currentFEN} />
        </div>
        <div className="lg:col-span-1">
          <TrainingBotInterface />
        </div>
      </div>
    </div>
  );
}
