
'use server';
/**
 * @fileOverview Performs a deep analysis of a user's game history to identify metrics,
 * weaknesses, and suggest areas for improvement.
 *
 * - deepAnalyzeGameMetrics - Analyzes game PGNs and provides insights.
 * - DeepAnalyzeGameMetricsInput - Input type for the flow.
 * - DeepAnalyzeGameMetricsOutput - Output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const DeepAnalyzeGameMetricsInputSchema = z.object({
  gamePgns: z.array(z.string()).min(1).describe("An array of chess games in PGN format (at least one game required)."),
  playerUsername: z.string().optional().describe("The username of the player whose games are being analyzed, for context."),
});
export type DeepAnalyzeGameMetricsInput = z.infer<typeof DeepAnalyzeGameMetricsInputSchema>;

const WeaknessSchema = z.object({
  name: z.string().describe("Concise name of the weakness (e.g., 'Endgame Conversion', 'Opening Trap Vulnerability', 'Tactical Oversights'). Should be suitable as a card title."),
  description: z.string().describe("Detailed explanation of the weakness, its impact, and specific examples if possible from the PGNs."),
  severity: z.enum(["high", "medium", "low"]).describe("Assessed severity of the weakness."),
  icon: z.enum(["AlertTriangle", "Puzzle", "BrainCircuit", "TrendingDown", "BarChart3"]).optional().describe("Suggested Lucide icon name for this weakness (choose one from: AlertTriangle, Puzzle, BrainCircuit, TrendingDown, BarChart3)."),
  trainingSuggestion: z.object({
    text: z.string().describe("A call to action for training (e.g., 'Practice Rook Endgames', 'Study common tactical motifs like forks and pins')."),
    link: z.string().optional().describe("A relative path to a training page (e.g., '/learn/puzzles', '/learn/openings', or '/train'). Keep links generic for now.")
  }).describe("A concrete training suggestion to address the weakness.")
});

const DeepAnalyzeGameMetricsOutputSchema = z.object({
  overallSummary: z.string().describe("A brief (2-3 sentences) overall summary of the player's style, key strengths, and most critical areas for improvement based on the provided games."),
  primaryWeaknesses: z.array(WeaknessSchema).min(1).max(4).describe("An array of 1 to 4 most impactful weaknesses identified, formatted for display. Each should include a name, description, severity, an optional icon suggestion, and a training suggestion with an optional link."),
});
export type DeepAnalyzeGameMetricsOutput = z.infer<typeof DeepAnalyzeGameMetricsOutputSchema>;


export async function deepAnalyzeGameMetrics(input: DeepAnalyzeGameMetricsInput): Promise<DeepAnalyzeGameMetricsOutput> {
  return deepAnalyzeGameMetricsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'deepAnalyzeGameMetricsPrompt',
  model: 'gemini-pro', // Changed model name
  input: {schema: DeepAnalyzeGameMetricsInputSchema},
  output: {schema: DeepAnalyzeGameMetricsOutputSchema},
  prompt: `You are an expert chess grandmaster and coach, tasked with analyzing a player's game history (provided as an array of PGN strings) to identify key metrics, weaknesses, and provide actionable improvement advice. The player's username is {{playerUsername}}.

Analyze all provided PGNs:
{{{gamePgns}}}

Based on your analysis:
1.  Provide a concise 'overallSummary' (2-3 sentences) of the player's style, notable strengths, and the most critical areas needing improvement.
2.  Identify 1 to 4 'primaryWeaknesses'. For each weakness:
    *   'name': A short, descriptive title (e.g., "Middlegame Planning", "Tactical Blind Spots", "Endgame Technique").
    *   'description': A detailed explanation of this weakness. If possible, refer to general patterns or specific types of mistakes observed across the games.
    *   'severity': Classify as 'high', 'medium', or 'low'.
    *   'icon': Suggest a relevant Lucide icon name from this list: AlertTriangle, Puzzle, BrainCircuit, TrendingDown, BarChart3.
    *   'trainingSuggestion':
        *   'text': Offer a concrete, actionable training tip (e.g., "Focus on solving puzzles involving skewers and discovered attacks.", "Review master games in the Queen's Gambit Declined to understand typical plans.").
        *   'link': Optionally, suggest a generic link to a relevant section of our app: '/learn/puzzles', '/learn/openings', or '/train'. Do not make up new query parameters.

Focus on providing constructive, insightful, and personalized feedback that will genuinely help the player improve. Ensure your output strictly adheres to the JSON schema.
`,
});

const deepAnalyzeGameMetricsFlow = ai.defineFlow(
  {
    name: 'deepAnalyzeGameMetricsFlow',
    inputSchema: DeepAnalyzeGameMetricsInputSchema,
    outputSchema: DeepAnalyzeGameMetricsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      console.error('DeepAnalyzeGameMetricsFlow: AI model did not return an output.');
      throw new Error('Failed to get analysis from AI model. Output was null.');
    }
    return output;
  }
);
