'use server';

/**
 * @fileOverview A chess improvement tips generator AI agent.
 *
 * - generateImprovementTips - A function that generates improvement tips for chess players.
 * - GenerateImprovementTipsInput - The input type for the generateImprovementTips function.
 * - GenerateImprovementTipsOutput - The return type for the generateImprovementTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImprovementTipsInputSchema = z.object({
  gameAnalysis: z
    .string()
    .describe(
      'A detailed analysis of recent chess games, including identified blunders, mistakes, and inaccuracies.'
    ),
});
export type GenerateImprovementTipsInput = z.infer<typeof GenerateImprovementTipsInputSchema>;

const GenerateImprovementTipsOutputSchema = z.object({
  tips: z
    .array(z.string())
    .describe(
      'An array of 3-5 plain-text improvement tips based on the game analysis, with links to relevant Lichess puzzles or openings.'
    ),
});
export type GenerateImprovementTipsOutput = z.infer<typeof GenerateImprovementTipsOutputSchema>;

export async function generateImprovementTips(
  input: GenerateImprovementTipsInput
): Promise<GenerateImprovementTipsOutput> {
  return generateImprovementTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateImprovementTipsPrompt',
  input: {schema: GenerateImprovementTipsInputSchema},
  output: {schema: GenerateImprovementTipsOutputSchema},
  prompt: `You are an expert chess coach. Analyze the following chess game analysis and provide 3-5 actionable improvement tips for the player. Include links to relevant Lichess puzzles or openings to help the player focus their training.

Game Analysis: {{{gameAnalysis}}}`,
});

const generateImprovementTipsFlow = ai.defineFlow(
  {
    name: 'generateImprovementTipsFlow',
    inputSchema: GenerateImprovementTipsInputSchema,
    outputSchema: GenerateImprovementTipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
