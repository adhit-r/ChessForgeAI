
'use server';

/**
 * @fileOverview Chess game analysis flow to identify blunders, mistakes, and inaccuracies.
 *
 * - analyzeChessGame - Analyzes a chess game provided in PGN format.
 * - AnalyzeChessGameInput - The input type for the analyzeChessGame function.
 * - AnalyzeChessGameOutput - The return type for the analyzeChessGame function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeChessGameInputSchema = z.object({
  pgn: z.string().describe('The chess game in PGN format.'),
});
export type AnalyzeChessGameInput = z.infer<typeof AnalyzeChessGameInputSchema>;

const AnalyzeChessGameOutputSchema = z.object({
  analysis: z.string().describe('The analysis of the chess game, including identified blunders, mistakes, and inaccuracies.'),
});
export type AnalyzeChessGameOutput = z.infer<typeof AnalyzeChessGameOutputSchema>;

export async function analyzeChessGame(input: AnalyzeChessGameInput): Promise<AnalyzeChessGameOutput> {
  return analyzeChessGameFlow(input);
}

const analyzeChessGamePrompt = ai.definePrompt({
  name: 'analyzeChessGamePrompt',
  model: 'gemini-pro', // Changed model name
  input: {schema: AnalyzeChessGameInputSchema},
  output: {schema: AnalyzeChessGameOutputSchema},
  prompt: `You are an expert chess coach. Analyze the following chess game and identify blunders, mistakes, and inaccuracies.

PGN: {{{pgn}}}

Provide a detailed analysis of the game, pointing out specific moves and their consequences. Focus on areas where the player could have made better decisions.
`,
});

const analyzeChessGameFlow = ai.defineFlow(
  {
    name: 'analyzeChessGameFlow',
    inputSchema: AnalyzeChessGameInputSchema,
    outputSchema: AnalyzeChessGameOutputSchema,
  },
  async input => {
    const {output} = await analyzeChessGamePrompt(input);
    return output!;
  }
);
