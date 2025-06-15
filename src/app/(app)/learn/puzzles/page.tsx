
"use client";

import React from 'react';
import PageTitle from '@/components/common/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Puzzle, AlertCircle } from 'lucide-react';

export default function PuzzlesPage() {
  return (
    <div className="space-y-8 pb-10">
      <PageTitle 
        title="Chess Puzzles" 
        subtitle="Sharpen your tactical vision with curated puzzles." 
        icon={<Puzzle size={32} className="text-primary"/>} 
      />

      <Card glass className="p-6 animate-fade-in">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-xl">Puzzles Collection</CardTitle>
          <CardDescription>
            A variety of puzzles to test your skills. This feature is under active development.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-8 text-center min-h-[200px] flex flex-col items-center justify-center">
            <AlertCircle className="mx-auto h-16 w-16 text-muted-foreground opacity-50 mb-4" />
            <h3 className="mt-4 text-xl font-medium text-foreground">Puzzles Coming Soon</h3>
            <p className="mt-2 text-base text-muted-foreground">
              We're working on bringing you an exciting collection of chess puzzles. Check back later!
            </p>
          </CardContent>
      </Card>
    </div>
  );
}
