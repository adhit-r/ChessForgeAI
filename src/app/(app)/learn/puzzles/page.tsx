
"use client";

import React from 'react';
import PageTitle from '@/components/common/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Puzzle, AlertCircle } from 'lucide-react';

export default function PuzzlesPage() {
  return (
    <div className="space-y-8">
      <PageTitle 
        title="Chess Puzzles" 
        subtitle="Sharpen your tactical vision with curated puzzles." 
        icon={<Puzzle size={32} />} 
      />

      <Card className="bg-card rounded-xl shadow-soft-ui">
        <CardHeader>
          <CardTitle>Puzzles Collection</CardTitle>
          <CardDescription>
            A variety of puzzles to test your skills. More coming soon!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">Puzzles Coming Soon</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              We're working on bringing you an exciting collection of chess puzzles. Check back later!
            </p>
          </CardContent>
      </Card>
    </div>
  );
}
