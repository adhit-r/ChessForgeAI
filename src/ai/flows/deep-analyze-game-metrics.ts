
'use server';
/**
 * @fileOverview Performs a simplified analysis of a user's game history using Lichess-based
 * analysis for individual games. This version avoids LLM calls.
 *
 * - deepAnalyzeGameMetrics - Analyzes game PGNs and provides insights.
 * - DeepAnalyzeGameMetricsInput - Input type for the flow.
 * - DeepAnalyzeGameMetricsOutput - Output type for the flow.
 */

import {ai}from '@/ai/genkit';
import {z}from 'genkit';
import { analyzeChessGame as analyzeSingleChessGameWithLichess, type AnalyzeChessGameOutput } from './analyze-chess-game'; // Import the Lichess-based analyzer

const DeepAnalyzeGameMetricsInputSchema = z.object({
  gamePgns: z.array(z.string()).min(1).describe("An array of chess games in PGN format (at least one game required)."),
  playerUsername: z.string().optional().describe("The username of the player whose games are being analyzed, for context."),
});
export type DeepAnalyzeGameMetricsInput = z.infer<typeof DeepAnalyzeGameMetricsInputSchema>;

// Output schema is kept similar, but content will be more generic
const WeaknessSchema = z.object({
  name: z.string().describe("Concise name of the weakness (e.g., 'High Blunder Rate', 'Frequent Mistakes')."),
  description: z.string().describe("Detailed explanation of the weakness based on aggregated Lichess analysis."),
  severity: z.enum(["high", "medium", "low"]).describe("Assessed severity of the weakness."),
  icon: z.enum(["AlertTriangle", "Puzzle", "BrainCircuit", "TrendingDown", "BarChart3", "Info"]).optional().describe("Suggested Lucide icon name."),
  trainingSuggestion: z.object({
    text: z.string().describe("A concrete training suggestion."),
    link: z.string().optional().describe("A relative path to a training page.")
  }).describe("A concrete training suggestion to address the weakness.")
});

const DeepAnalyzeGameMetricsOutputSchema = z.object({
  overallSummary: z.string().describe("A brief overall summary based on aggregated Lichess game analyses."),
  primaryWeaknesses: z.array(WeaknessSchema).min(1).max(2).describe("An array of 1 to 2 primary areas for improvement."),
});
export type DeepAnalyzeGameMetricsOutput = z.infer<typeof DeepAnalyzeGameMetricsOutputSchema>;


async function analyzeMetricsWithLichess(input: DeepAnalyzeGameMetricsInput): Promise<DeepAnalyzeGameMetricsOutput> {
  let totalGamesAnalyzed = 0;
  let gamesWithBlunders = 0;
  let gamesWithMistakes = 0;
  // In a more complex version, we could count total blunders/mistakes across all games.
  // This requires `analyzeSingleChessGameWithLichess` to return structured counts.
  // For now, we'll base it on the presence of keywords in the analysis string.

  if (input.gamePgns.length === 0) {
    return {
      overallSummary: "No games provided for analysis.",
      primaryWeaknesses: [{
        name: "No Games",
        description: "Please import games to get an analysis.",
        severity: "low",
        icon: "Info",
        trainingSuggestion: { text: "Import games via the Analysis page.", link: "/analysis" }
      }]
    };
  }

  for (const pgn of input.gamePgns) {
    if (!pgn.trim()) continue;
    try {
      const singleGameAnalysis: AnalyzeChessGameOutput = await analyzeSingleChessGameWithLichess({ pgn });
      totalGamesAnalyzed++;
      if (singleGameAnalysis.analysis.toLowerCase().includes("blunder")) {
        gamesWithBlunders++;
      }
      if (singleGameAnalysis.analysis.toLowerCase().includes("mistake")) {
        gamesWithMistakes++;
      }
    } catch (error) {
      console.error("Error analyzing a single game in deepAnalyzeGameMetrics:", error);
      // Optionally skip this game or mark as failed analysis
    }
  }

  let overallSummary = `Analyzed ${totalGamesAnalyzed} game(s). `;
  const primaryWeaknesses: z.infer<typeof WeaknessSchema>[] = [];

  if (totalGamesAnalyzed === 0 && input.gamePgns.length > 0) {
    overallSummary = "Could not analyze the provided games using Lichess Stockfish.";
     primaryWeaknesses.push({
        name: "Analysis Failed",
        description: "Failed to process games with Lichess Stockfish. Check individual game analysis or PGN validity.",
        severity: "high",
        icon: "AlertTriangle",
        trainingSuggestion: { text: "Try analyzing a single game first.", link: "/analysis" }
      });
  } else if (gamesWithBlunders > totalGamesAnalyzed / 2 || gamesWithBlunders >= 3) { // Example thresholds
    overallSummary += `A high number of games contained blunders (${gamesWithBlunders}/${totalGamesAnalyzed}).`;
    primaryWeaknesses.push({
      name: "Reduce Blunders",
      description: `Stockfish analysis identified blunders in ${gamesWithBlunders} out of ${totalGamesAnalyzed} games. Focus on minimizing major errors by carefully checking your moves.`,
      severity: "high",
      icon: "AlertTriangle",
      trainingSuggestion: { text: "Practice tactical puzzles and play longer time control games.", link: "/learn/puzzles" }
    });
  } else if (gamesWithMistakes > totalGamesAnalyzed / 2 || gamesWithMistakes >= 3) {
    overallSummary += `Several games contained mistakes (${gamesWithMistakes}/${totalGamesAnalyzed}).`;
    primaryWeaknesses.push({
      name: "Minimize Mistakes",
      description: `Stockfish analysis identified mistakes in ${gamesWithMistakes} out of ${totalGamesAnalyzed} games. Review these positions to understand better alternatives.`,
      severity: "medium",
      icon: "TrendingDown",
      trainingSuggestion: { text: "Analyze your games thoroughly, especially after a loss or a complicated game.", link: "/analysis" }
    });
  } else {
    overallSummary += "No consistent pattern of frequent blunders or mistakes was found across the analyzed games. Keep practicing!";
    primaryWeaknesses.push({
      name: "Consistent Practice",
      description: "Your games show a reasonable level of play according to Stockfish. Continue to practice, study, and analyze to steadily improve all aspects of your game.",
      severity: "low",
      icon: "BrainCircuit",
      trainingSuggestion: { text: "Explore different openings or study endgame principles.", link: "/learn/openings" }
    });
  }
  
  if (primaryWeaknesses.length === 0) { // Fallback
     primaryWeaknesses.push({
        name: "General Improvement",
        description: "Analyze your games regularly to find areas for improvement. Every game is a learning opportunity.",
        severity: "medium",
        icon: "Puzzle",
        trainingSuggestion: { text: "Use the game analysis tools and practice regularly.", link: "/analysis" }
    });
  }


  return {
    overallSummary,
    primaryWeaknesses: primaryWeaknesses.slice(0,2) // Limit to 1-2 main points
  };
}


// Exported function that invokes the Genkit flow
export async function deepAnalyzeGameMetrics(input: DeepAnalyzeGameMetricsInput): Promise<DeepAnalyzeGameMetricsOutput> {
  return deepAnalyzeGameMetricsFlow(input);
}

const deepAnalyzeGameMetricsFlow = ai.defineFlow(
  {
    name: 'deepAnalyzeGameMetricsFlow',
    inputSchema: DeepAnalyzeGameMetricsInputSchema,
    outputSchema: DeepAnalyzeGameMetricsOutputSchema,
  },
  analyzeMetricsWithLichess // Use the Lichess-based implementation
);
