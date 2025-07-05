import { NextResponse } from 'next/server';
import { z } from 'zod';

// Define the input schema using Zod
const TrainingBotInputSchema = z.object({
  gameHistory: z.string().optional().describe('The game history in PGN format of the user (optional for Lichess FEN analysis).'),
  currentBoardState: z.string().describe('The current board state in FEN format.'),
  moveNumber: z.number().optional().describe('The current move number in the game (optional).'),
});
export type TrainingBotInput = z.infer<typeof TrainingBotInputSchema>;

// Define the output schema using Zod
const TrainingBotOutputSchema = z.object({
  suggestedMove: z.string().describe('The suggested move in UCI notation (e.g., e2e4).'),
  evaluation: z.number().describe('The evaluation of the current board state from White\'s perspective (positive is good for white, in centipawns).'),
  explanation: z.string().describe('Explanation of the suggestion source.'),
});
export type TrainingBotOutput = z.infer<typeof TrainingBotOutputSchema>;

// Helper function to get Lichess FEN analysis (copied from original)
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
    const lines = ndjson.trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        const data = JSON.parse(line);
        if (data.pvs && data.pvs.length > 0) {
          const bestPv = data.pvs[0];
          return {
            moveUci: bestPv.moves?.split(' ')[0],
            evaluationCp: bestPv.cp,
            mate: bestPv.mate,
          };
        }
        if (data.cp || data.mate) {
            return {
                moveUci: undefined,
                evaluationCp: data.cp,
                mate: data.mate,
            };
        }
      }
    }
    console.warn("Lichess FEN Analysis: No suitable PV or direct eval found in response.", ndjson);
    return null;
  } catch (error) {
    console.error("Failed to fetch or parse Lichess FEN cloud evaluation:", error);
    return null;
  }
}

// Core logic function (renamed from analyzeWithLichessStockfish)
async function trainingBotLogic(input: TrainingBotInput): Promise<TrainingBotOutput> {
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
    explanation: `Lichess Stockfish. Eval: ${(finalEval/100.0).toFixed(2)}. ${analysis.mate ? `Mate: ${analysis.mate}.` : `CP: ${finalEval}.`}`,
  };
}

// Next.js API Route handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedInput = TrainingBotInputSchema.safeParse(body);

    if (!validatedInput.success) {
      return NextResponse.json({ error: 'Invalid input', details: validatedInput.error.flatten() }, { status: 400 });
    }

    const output = await trainingBotLogic(validatedInput.data);
    return NextResponse.json(output);

  } catch (error) {
    console.error('Error in training-bot-analysis API route:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
