
'use server';

/**
 * @fileOverview Chess game analysis flow to identify blunders, mistakes, and inaccuracies
 * using Lichess Stockfish cloud evaluation.
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
  analysis: z.string().describe('A summary of the chess game analysis from Lichess Stockfish, highlighting significant evaluation swings (blunders, mistakes, inaccuracies).'),
  // Optionally, we could return more structured data in the future
  // significantMoves: z.array(z.object({ /* ... */ })).optional(),
});
export type AnalyzeChessGameOutput = z.infer<typeof AnalyzeChessGameOutputSchema>;

const BLUNDER_THRESHOLD_CP = 200;
const MISTAKE_THRESHOLD_CP = 100;
const INACCURACY_THRESHOLD_CP = 50;

interface LichessEvalLine {
  ply: number;
  pvs?: Array<{ moves: string; cp?: number; mate?: number }>;
  knodes?: number;
  depth?: number;
}

function getPlayerForPly(ply: number): 'White' | 'Black' {
  return ply % 2 !== 0 ? 'White' : 'Black';
}

async function getLichessAnalysis(pgn: string): Promise<LichessEvalLine[]> {
  if (!pgn.trim()) {
    console.warn("Lichess Analysis: Empty PGN provided.");
    return [];
  }
  try {
    const response = await fetch(`https://lichess.org/api/cloud-eval?pgn=${encodeURIComponent(pgn)}`, {
      headers: { 'Accept': 'application/x-ndjson' }
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Lichess API error for cloud-eval: ${response.status} ${response.statusText}`, errorBody);
      return [];
    }
    const ndjson = await response.text();
    const lines = ndjson.trim().split('\n');
    return lines.map(line => JSON.parse(line) as LichessEvalLine).filter(line => line.pvs && line.pvs.length > 0);
  } catch (error) {
    console.error("Failed to fetch or parse Lichess cloud evaluation:", error);
    return [];
  }
}

async function analyzeChessGameWithLichessImpl(input: AnalyzeChessGameInput): Promise<AnalyzeChessGameOutput> {
  const lichessEvals = await getLichessAnalysis(input.pgn);

  if (lichessEvals.length === 0) {
    return { analysis: "Could not retrieve Stockfish analysis from Lichess for this game, or game PGN was empty/invalid." };
  }

  const significantSwings: Array<{
    ply: number;
    player: 'White' | 'Black';
    moveNumber: number;
    type: 'Blunder' | 'Mistake' | 'Inaccuracy';
    cpDrop: number;
    evalBefore: number;
    evalAfter: number;
    description: string;
  }> = [];
  
  const evals = lichessEvals.map(e => {
    let cp = 0;
    if (e.pvs && e.pvs[0]) {
      if (typeof e.pvs[0].cp === 'number') cp = e.pvs[0].cp;
      else if (typeof e.pvs[0].mate === 'number') cp = e.pvs[0].mate > 0 ? 10000 : -10000;
    }
    return { ply: e.ply, cp };
  }).filter(e => typeof e.cp === 'number' && e.ply > 0);

  if (evals.length === 0) {
    return { analysis: "No valid evaluation points found in Lichess analysis."};
  }

  const processedEvalsList = [];
  if (evals[0].ply > 1) { 
    processedEvalsList.push({ply: 0, cp: 0}); 
  }
  processedEvalsList.push(...evals);


  for (let i = 1; i < processedEvalsList.length; i++) {
    const prevPlyInfo = processedEvalsList[i-1];
    const currentPlyInfo = processedEvalsList[i];
    
    const player = getPlayerForPly(currentPlyInfo.ply);
    let cpLossForPlayer = 0;

    if (player === 'White') { 
      cpLossForPlayer = prevPlyInfo.cp - currentPlyInfo.cp;
    } else { 
      cpLossForPlayer = -(prevPlyInfo.cp - currentPlyInfo.cp); 
    }
    
    let moveType: 'Blunder' | 'Mistake' | 'Inaccuracy' | null = null;
    if (cpLossForPlayer >= BLUNDER_THRESHOLD_CP) moveType = 'Blunder';
    else if (cpLossForPlayer >= MISTAKE_THRESHOLD_CP) moveType = 'Mistake';
    else if (cpLossForPlayer >= INACCURACY_THRESHOLD_CP) moveType = 'Inaccuracy';

    if (moveType) {
      const moveNumber = Math.ceil(currentPlyInfo.ply / 2);
      const playerMoveIndicator = player === 'White' ? `${moveNumber}. ` : `${moveNumber}... `;
      significantSwings.push({
        ply: currentPlyInfo.ply,
        player,
        moveNumber,
        type: moveType,
        cpDrop: Math.round(cpLossForPlayer),
        evalBefore: Math.round(prevPlyInfo.cp), 
        evalAfter: Math.round(currentPlyInfo.cp),  
        description: `${moveType} by ${player} (move ${playerMoveIndicator.trim()}). Eval for White changed from ${(prevPlyInfo.cp/100).toFixed(2)} to ${(currentPlyInfo.cp/100).toFixed(2)}. Player's loss: ${(cpLossForPlayer/100).toFixed(2)}cp.`
      });
    }
  }

  let analysisTextResult = "Lichess Stockfish Analysis Summary (experimental):\n";
  if (significantSwings.length === 0) {
    analysisTextResult += "No significant blunders, mistakes, or inaccuracies detected based on centipawn evaluation swings.\n";
  } else {
    analysisTextResult += significantSwings.map(s => s.description).join("\n");
    analysisTextResult += "\n\n(Note: Player's loss indicates how much their position worsened according to Stockfish after their move.)";
  }

  return { analysis: analysisTextResult };
}

export async function analyzeChessGame(input: AnalyzeChessGameInput): Promise<AnalyzeChessGameOutput> {
  return analyzeChessGameFlowImpl(input);
}

const analyzeChessGameFlowImpl = ai.defineFlow(
  {
    name: 'analyzeChessGameFlow',
    inputSchema: AnalyzeChessGameInputSchema,
    outputSchema: AnalyzeChessGameOutputSchema,
  },
  analyzeChessGameWithLichessImpl
);
