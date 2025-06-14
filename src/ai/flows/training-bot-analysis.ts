'use server';

/**
 * @fileOverview Provides a training bot that analyzes previous games and suggests moves during a live game.
 *
 * - analyzeGameAndSuggestMove - A function that analyzes the current game state and provides a move suggestion.
 * - TrainingBotInput - The input type for the analyzeGameAndSuggestMove function.
 * - TrainingBotOutput - The return type for the analyzeGameAndSuggestMove function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TrainingBotInputSchema = z.object({
  gameHistory: z
    .string()
    .describe('The game history in PGN format of the user.'),
  currentBoardState: z.string().describe('The current board state in FEN format.'),
  moveNumber: z.number().describe('The current move number in the game.'),
});
export type TrainingBotInput = z.infer<typeof TrainingBotInputSchema>;

const TrainingBotOutputSchema = z.object({
  suggestedMove: z.string().describe('The suggested move in algebraic notation.'),
  evaluation: z.number().describe('The evaluation of the current board state from the bot\'s perspective (positive is good for white).'),
  explanation: z.string().describe('The explanation of why the move is suggested.'),
});
export type TrainingBotOutput = z.infer<typeof TrainingBotOutputSchema>;

export async function analyzeGameAndSuggestMove(
  input: TrainingBotInput
): Promise<TrainingBotOutput> {
  return trainingBotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'trainingBotPrompt',
  input: {schema: TrainingBotInputSchema},
  output: {schema: TrainingBotOutputSchema},
  prompt: `You are a chess training bot that analyzes the provided game history and the current board state to suggest the best move for the user.

Analyze the game history to identify the user's playing style, common mistakes, and strengths.

Based on the analysis and the current board state, suggest a move, provide an evaluation of the board state, and explain why the move is suggested.

Game History (PGN):\n{{gameHistory}}\n\nCurrent Board State (FEN):\n{{currentBoardState}}\n\nCurrent Move Number: {{moveNumber}}\n\nConsider the following:
*   Tactical opportunities (e.g., forks, pins, skewers)
*   Positional advantages (e.g., control of the center, pawn structure, piece activity)
*   Material balance
*   The user's playing style from the game history.
*   Try to avoid suggesting moves the user has made mistakes on in the past.
\nOutput the move in algebraic notation (e.g., e4, Nf3, O-O) and the evaluation as a number. Positive evaluations favor white; negative evaluations favor black. The explanation should be concise and easy to understand.
`,
});

const trainingBotFlow = ai.defineFlow(
  {
    name: 'trainingBotFlow',
    inputSchema: TrainingBotInputSchema,
    outputSchema: TrainingBotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
