
"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

interface ChessBoardPlaceholderProps {
  fen?: string; // Optional FEN string to display
}

const ChessBoardPlaceholder: React.FC<ChessBoardPlaceholderProps> = ({ fen }) => {
  return (
    <Card glass className="aspect-square w-full max-w-lg mx-auto p-2 sm:p-3"> {/* Max width for larger screens */}
      <CardContent className="p-0 flex flex-col items-center justify-center h-full bg-background/20 rounded-lg shadow-inner-glow">
        <Image 
          src="https://placehold.co/500x500/FFFFFF/9CA3AF?text=Chess+Board" // Neutral placeholder color
          alt="Chess Board Placeholder" 
          width={500} 
          height={500}
          className="rounded-md object-contain opacity-80"
          data-ai-hint="chess board pieces"
          priority // Prioritize loading for LCP
        />
        {fen && (
          <p className="mt-3 text-xs font-code text-center text-muted-foreground p-2 bg-background/30 rounded-md w-full break-all max-w-xs sm:max-w-sm">
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
