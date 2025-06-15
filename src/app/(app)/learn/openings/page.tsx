
"use client";

import React from 'react';
import PageTitle from '@/components/common/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, AlertCircle } from 'lucide-react';

export default function OpeningsPage() {
  return (
    <div className="space-y-8 pb-10">
      <PageTitle 
        title="Chess Openings" 
        subtitle="Explore and study popular chess opening lines." 
        icon={<BrainCircuit size={32} className="text-primary"/>} 
      />

      <Card glass className="p-6 animate-fade-in">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-xl">Opening Explorer</CardTitle>
          <CardDescription>
            Dive into different openings and understand their key ideas. This feature is under development.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-8 text-center min-h-[200px] flex flex-col items-center justify-center">
            <AlertCircle className="mx-auto h-16 w-16 text-muted-foreground opacity-50 mb-4" />
            <h3 className="mt-4 text-xl font-medium text-foreground">Opening Explorer Coming Soon</h3>
            <p className="mt-2 text-base text-muted-foreground">
              We're developing an interactive openings explorer. Please check back later!
            </p>
          </CardContent>
      </Card>
    </div>
  );
}
