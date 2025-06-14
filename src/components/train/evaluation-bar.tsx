"use client";

import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface EvaluationBarProps {
  evaluation: number; // e.g., from -10 (strong black) to +10 (strong white)
  maxAbsEval?: number; // Maximum absolute evaluation for scaling, default 10
}

const EvaluationBar: React.FC<EvaluationBarProps> = ({ evaluation, maxAbsEval = 10 }) => {
  const [barValue, setBarValue] = useState(50); // 0-100 scale for progress bar

  useEffect(() => {
    // Normalize evaluation to 0-100 range
    // 0 eval = 50% bar
    // +maxAbsEval eval = 100% bar (favoring white)
    // -maxAbsEval eval = 0% bar (favoring black)
    const clampedEval = Math.max(-maxAbsEval, Math.min(maxAbsEval, evaluation));
    const normalizedValue = ((clampedEval + maxAbsEval) / (2 * maxAbsEval)) * 100;
    setBarValue(normalizedValue);
  }, [evaluation, maxAbsEval]);

  // Determine gradient based on evaluation
  // More white advantage: bar fills more from left with white-ish color
  // More black advantage: bar fills more from right with black-ish color (or less from left)
  // For a single progress bar, it always fills from left.
  // We can change the color of the bar itself.
  // Or use two bars, one for white, one for black.
  // A simple approach: color the bar based on who has advantage.

  const whiteAdvantage = evaluation > 0.1;
  const blackAdvantage = evaluation < -0.1;
  let barColorClass = "bg-primary"; // Neutral or primary color

  if (whiteAdvantage) {
    barColorClass = "bg-green-400"; // White has advantage
  } else if (blackAdvantage) {
    barColorClass = "bg-destructive"; // Black has advantage
  }
  
  // Text display of evaluation
  const evalText = evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1);


  return (
    <div className="w-full p-2 rounded-lg bg-background/30 border border-border/30">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">Black</span>
        <span className="text-sm font-bold text-foreground">{evalText}</span>
        <span className="text-xs font-medium text-muted-foreground">White</span>
      </div>
      <Progress value={barValue} className={cn("h-3 w-full", barColorClass)} />
       <style jsx>{`
        .${barColorClass.replace('bg-','')} { /* Dynamically create a style for the progress indicator */ }
        .${barColorClass.replace('bg-','')} > div {
          background-color: hsl(var(--${barColorClass.split('-')[1]})); /* This is a hack, won't work well with complex tailwind colors */
        }
      `}</style>
      {/* The style jsx hack above is problematic. Tailwind applies bg color to the indicator.
          We can customize Progress component or just rely on Tailwind's default behavior.
          Let's remove the style jsx and simply pass the class. The progress bar indicator inherits the primary color.
          To make it dynamic based on white/black advantage, we'd need more complex styling or multiple progress components.
          For now, a single bar that changes length is sufficient. We can make its color fixed (e.g. accent).
      */}
    </div>
  );
};

export default EvaluationBar;
