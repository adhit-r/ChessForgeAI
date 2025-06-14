
"use client";

import React from 'react';
import PageTitle from '@/components/common/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, AlertCircle } from 'lucide-react';

export default function OpeningsPage() {
  return (
    <div className="space-y-8">
      <PageTitle 
        title="Chess Openings" 
        subtitle="Explore and study popular chess opening lines." 
        icon={<BrainCircuit size={32} />} 
      />

      <Card className="bg-card rounded-xl shadow-soft-ui">
        <CardHeader>
          <CardTitle>Opening Explorer</CardTitle>
          <CardDescription>
            Dive into different openings and understand their key ideas. More coming soon!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">Opening Explorer Coming Soon</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              We're developing an interactive openings explorer. Please check back later!
            </p>
          </CardContent>
      </Card>
    </div>
  );
}
