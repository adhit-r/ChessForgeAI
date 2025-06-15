
'use server';

/**
 * @fileOverview A chess improvement tips generator based on Lichess Stockfish analysis summary.
 * This version does not use an LLM and provides rule-based tips.
 *
 * - generateImprovementTips - A function that generates improvement tips.
 * - GenerateImprovementTipsInput - The input type for the generateImprovementTips function.
 * - GenerateImprovementTipsOutput - The return type for the generateImprovementTips function.
 */

import {ai}from '@/ai/genkit';
import {z}from 'genkit';

const GenerateImprovementTipsInputSchema = z.object({
  gameAnalysis: z
    .string()
    .describe(
      'A textual summary of chess game analysis, expected to come from Lichess Stockfish (e.g., highlighting blunders, mistakes).'
    ),
});
export type GenerateImprovementTipsInput = z.infer<typeof GenerateImprovementTipsInputSchema>;

const GenerateImprovementTipsOutputSchema = z.object({
  tips: z
    .array(z.string())
    .describe(
      'An array of 3-5 plain-text improvement tips based on the game analysis summary.'
    ),
});
export type GenerateImprovementTipsOutput = z.infer<typeof GenerateImprovementTipsOutputSchema>;


async function generateRuleBasedTips(input: GenerateImprovementTipsInput): Promise<GenerateImprovementTipsOutput> {
  const tips: string[] = [];
  const analysisText = input.gameAnalysis.toLowerCase();

  if (analysisText.includes("blunder")) {
    tips.push("One or more blunders were identified. Focus on improving your tactical vision and calculation. Regularly solving puzzles can help. [Practice Puzzles on Lichess](https://lichess.org/training)");
  }
  if (analysisText.includes("mistake")) {
    tips.push("Mistakes were made that significantly changed the evaluation. Review these moments carefully. Understanding why a mistake occurred is crucial for avoiding it in the future. [Analyze your games on Lichess](https://lichess.org/analysis)");
  }
  if (analysisText.includes("inaccuracy")) {
    tips.push("Inaccuracies can accumulate. Try to find the most precise moves, especially in critical positions. Deeper calculation or better positional understanding might be needed.");
  }

  if (tips.length < 2 && analysisText.includes("stockfish")) {
     tips.push("Review the game with Stockfish to understand key moments and alternative lines. [Use Lichess Analysis Board](https://lichess.org/analysis)");
  }

  if (tips.length === 0) {
    tips.push("The analysis didn't pinpoint specific frequent errors. Consistent practice and reviewing your games are always beneficial. [Play a game on Lichess](https://lichess.org/play)");
  }
  
  // Add a general tip if space allows
  if (tips.length < 3) {
    tips.push("Consider studying common openings and their typical middlegame plans to get a better start. [Explore Openings on Lichess](https://lichess.org/opening)");
  }
  if (tips.length < 4 && (analysisText.includes("blunder") || analysisText.includes("mistake"))) {
      tips.push("Double-check your moves for simple tactical oversights before committing, especially checking for undefended pieces or potential forks/pins.");
  }


  // Ensure between 1 and 4 tips.
  const finalTips = tips.slice(0, 4);
  if (finalTips.length === 0) { // Ensure at least one tip
    finalTips.push("Keep practicing and learning! Every game is an opportunity to improve. [Play a game on Lichess](https://lichess.org/play)");
  }

  return { tips: finalTips };
}

// Exported function that invokes the Genkit flow
export async function generateImprovementTips(input: GenerateImprovementTipsInput): Promise<GenerateImprovementTipsOutput> {
  return generateImprovementTipsFlow(input);
}

const generateImprovementTipsFlow = ai.defineFlow(
  {
    name: 'generateImprovementTipsFlow',
    inputSchema: GenerateImprovementTipsInputSchema,
    outputSchema: GenerateImprovementTipsOutputSchema,
  },
  generateRuleBasedTips // Use the rule-based tip generation
);
