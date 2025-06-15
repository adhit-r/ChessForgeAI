
'use server';

/**
 * @fileOverview Provides a training bot that analyzes current FEN using Lichess Stockfish
 * and suggests moves during a live game.
 *
 * - analyzeGameAndSuggestMove - A function that analyzes the current game state and provides a move suggestion.
 * - TrainingBotInput - The input type for the analyzeGameAndSuggestMove function.
 * - TrainingBotOutput - The return type for the analyzeGameAndSuggestMove function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const TrainingBotInputSchema = z.object({
  // gameHistory is not used by Lichess FEN analysis directly, but kept for schema compatibility
  gameHistory: z.string().optional().describe('The game history in PGN format of the user (optional for Lichess FEN analysis).'),
  currentBoardState: z.string().describe('The current board state in FEN format.'),
  // moveNumber is not used by Lichess FEN analysis directly
  moveNumber: z.number().optional().describe('The current move number in the game (optional).'),
});
export type TrainingBotInput = z.infer<typeof TrainingBotInputSchema>;

const TrainingBotOutputSchema = z.object({
  suggestedMove: z.string().describe('The suggested move in UCI notation (e.g., e2e4).'),
  evaluation: z.number().describe('The evaluation of the current board state from White\'s perspective (positive is good for white, in centipawns).'),
  explanation: z.string().describe('Explanation of the suggestion source.'),
});
export type TrainingBotOutput = z.infer<typeof TrainingBotOutputSchema>;


async function getLichessFenAnalysis(fen: string): Promise<{ moveUci?: string, evaluationCp?: number, mate?: number } | null> {
  try {
    const response = await fetch(`https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}`, {
      headers: { 'Accept': 'application/x-ndjson' }
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Lichess API error for FEN cloud-eval: ${response.status} ${response.statusText}`, errorBody);
      return null;
    }
    const ndjson = await response.text();
    // For FEN, Lichess often returns a single line if cached, or streams if calculating.
    // We'll take the first valid line with PVs.
    const lines = ndjson.trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        const data = JSON.parse(line);
        if (data.pvs && data.pvs.length > 0) {
          const bestPv = data.pvs[0];
          return {
            moveUci: bestPv.moves?.split(' ')[0], // Get the first move of the principal variation
            evaluationCp: bestPv.cp,
            mate: bestPv.mate,
          };
        }
         // Sometimes, the top-level object directly contains the eval if it's a simple lookup
        if (data.cp || data.mate) {
            return {
                moveUci: undefined, // No PV given in this format, just eval
                evaluationCp: data.cp,
                mate: data.mate,
            };
        }
      }
    }
    console.warn("Lichess FEN Analysis: No suitable PV found in response.", ndjson);
    return null;
  } catch (error) {
    console.error("Failed to fetch or parse Lichess FEN cloud evaluation:", error);
    return null;
  }
}

async function analyzeWithLichessStockfish(input: TrainingBotInput): Promise<TrainingBotOutput> {
  const analysis = await getLichessFenAnalysis(input.currentBoardState);

  if (!analysis) {
    return {
      suggestedMove: "N/A",
      evaluation: 0,
      explanation: "Could not get analysis from Lichess Stockfish.",
    };
  }

  let finalEval = 0;
  if (typeof analysis.evaluationCp === 'number') {
    finalEval = analysis.evaluationCp;
  } else if (typeof analysis.mate === 'number') {
    finalEval = analysis.mate > 0 ? 10000 : -10000; // Convert mate to large CP value
  }
  
  return {
    suggestedMove: analysis.moveUci || "N/A (eval only)",
    evaluation: finalEval,
    explanation: `Lichess Stockfish evaluation. Eval: ${finalEval/100.0} (CP: ${finalEval}). ${analysis.mate ? `Mate in ${analysis.mate}.` : ''}`,
  };
}

// Exported function that invokes the Genkit flow
export async function analyzeGameAndSuggestMove(input: TrainingBotInput): Promise<TrainingBotOutput> {
  return trainingBotFlow(input);
}

const trainingBotFlow = ai.defineFlow(
  {
    name: 'trainingBotFlow',
    inputSchema: TrainingBotInputSchema,
    outputSchema: TrainingBotOutputSchema,
  },
  analyzeWithLichessStockfish // Use the Lichess Stockfish implementation
);
