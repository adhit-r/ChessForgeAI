
"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

interface ChessBoardPlaceholderProps {
  fen?: string; // Optional FEN string to display
}

const ChessBoardPlaceholder: React.FC<ChessBoardPlaceholderProps> = ({ fen }) => {
  return (
    <Card className="bg-card rounded-xl shadow-soft-ui aspect-square w-full max-w-md mx-auto">
      <CardContent className="p-2 sm:p-4 flex flex-col items-center justify-center h-full">
        <Image 
          src="https://placehold.co/400x400.png/FFFFFF/252F40?text=Chess+Board" 
          alt="Chess Board Placeholder" 
          width={400} 
          height={400}
          className="rounded-md object-contain"
          data-ai-hint="chess board"
        />
        {fen && (
          <p className="mt-2 text-xs font-code text-center text-muted-foreground p-2 bg-muted/50 rounded-md w-full break-all">
            FEN: {fen}
          </p>
        )}
         <p className="mt-4 text-sm text-center text-muted-foreground">
            Interactive chessboard coming soon.
          </p>
      </CardContent>
    </Card>
  );
};

export default ChessBoardPlaceholder;
