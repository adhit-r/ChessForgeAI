
"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

interface ChessBoardPlaceholderProps {
  fen?: string; // FEN string to display
}

const ChessBoardPlaceholder: React.FC<ChessBoardPlaceholderProps> = ({ fen }) => {
  // Use a consistent placeholder image; dynamic FEN-to-image is complex
  const placeholderImageUrl = "https://placehold.co/500x500/FFFFFF/9CA3AF?text=Chess+Board";

  return (
    <Card glass className="aspect-square w-full max-w-lg mx-auto p-2 sm:p-3">
      <CardContent className="p-0 flex flex-col items-center justify-center h-full bg-background/20 rounded-lg shadow-inner-glow">
        <Image 
          src={placeholderImageUrl}
          alt="Chess Board Placeholder" 
          width={500} 
          height={500}
          className="rounded-md object-contain opacity-80"
          data-ai-hint="chess board pieces"
          priority 
        />
        {fen && (
          <div className="mt-3 p-2 bg-background/40 rounded-md w-full max-w-xs sm:max-w-sm md:max-w-md text-center">
            <p className="text-xs font-code text-muted-foreground break-all">
              Displaying position for FEN:
            </p>
            <p className="text-xs font-code text-foreground break-all mt-1">
              {fen}
            </p>
          </div>
        )}
         <p className="mt-2 text-sm text-center text-muted-foreground opacity-70">
            Interactive chessboard coming soon. Input FEN below to analyze.
          </p>
      </CardContent>
    </Card>
  );
};

export default ChessBoardPlaceholder;
