import { z } from 'zod';

// Schemas from fetch-game-history
export const FetchGameHistoryInputSchema = z.object({
  platform: z.enum(["lichess", "chesscom", "chess24"]).describe('The chess platform (e.g., "lichess", "chesscom", "chess24").'),
  username: z.string().describe('The username on the specified platform.'),
  maxGames: z.number().optional().default(10).describe('Maximum number of games to fetch.'),
});
export type FetchGameHistoryInput = z.infer<typeof FetchGameHistoryInputSchema>;

export const FetchGameHistoryOutputSchema = z.object({
  games: z.array(z.string().describe("A game in PGN format.")).describe("An array of game PGNs. Returns an empty array if no games are found or an error occurs.")
});
export type FetchGameHistoryOutput = z.infer<typeof FetchGameHistoryOutputSchema>;

// Schemas from analyze-chess-game
export const AnalyzeChessGameInputSchema = z.object({
  pgn: z.string().describe('The chess game in PGN format.'),
});
export type AnalyzeChessGameInput = z.infer<typeof AnalyzeChessGameInputSchema>;

export const AnalyzeChessGameOutputSchema = z.object({
  analysis: z.string().describe('A summary of the chess game analysis from Lichess Stockfish, highlighting significant evaluation swings (blunders, mistakes, inaccuracies).'),
});
export type AnalyzeChessGameOutput = z.infer<typeof AnalyzeChessGameOutputSchema>;

// Schemas from deep-analyze-game-metrics
export const WeaknessSchema = z.object({
  name: z.string().describe("Concise name of the weakness (e.g., 'High Blunder Rate', 'Frequent Mistakes')."),
  description: z.string().describe("Detailed explanation of the weakness based on aggregated Lichess analysis."),
  severity: z.enum(["high", "medium", "low"]).describe("Assessed severity of the weakness."),
  icon: z.enum(["AlertTriangle", "Puzzle", "BrainCircuit", "TrendingDown", "BarChart3", "Info"]).optional().describe("Suggested Lucide icon name."),
  trainingSuggestion: z.object({
    text: z.string().describe("A concrete training suggestion."),
    link: z.string().optional().describe("A relative path to a training page.")
  }).describe("A concrete training suggestion to address the weakness.")
});

export const DeepAnalyzeGameMetricsInputSchema = z.object({
  gamePgns: z.array(z.string()).min(1).describe("An array of chess games in PGN format (at least one game required)."),
  playerUsername: z.string().optional().describe("The username of the player whose games are being analyzed, for context."),
  baseUrl: z.string().url().describe("Base URL of the current application, for self-API calls."),
});
export type DeepAnalyzeGameMetricsInput = z.infer<typeof DeepAnalyzeGameMetricsInputSchema>;

export const DeepAnalyzeGameMetricsOutputSchema = z.object({
  overallSummary: z.string().describe("A brief overall summary based on aggregated Lichess game analyses."),
  primaryWeaknesses: z.array(WeaknessSchema).min(0).max(2).describe("An array of 0 to 2 primary areas for improvement."),
});
export type DeepAnalyzeGameMetricsOutput = z.infer<typeof DeepAnalyzeGameMetricsOutputSchema>;

// Schemas from generate-improvement-tips
export const GenerateImprovementTipsInputSchema = z.object({
  gameAnalysis: z
    .string()
    .describe(
      'A textual summary of chess game analysis, expected to come from Lichess Stockfish (e.g., highlighting blunders, mistakes).'
    ),
});
export type GenerateImprovementTipsInput = z.infer<typeof GenerateImprovementTipsInputSchema>;

export const GenerateImprovementTipsOutputSchema = z.object({
  tips: z
    .array(z.string())
    .describe(
      'An array of 1-4 plain-text improvement tips based on the game analysis summary.'
    ),
});
export type GenerateImprovementTipsOutput = z.infer<typeof GenerateImprovementTipsOutputSchema>;

// Schemas from training-bot-analysis
export const TrainingBotInputSchema = z.object({
  gameHistory: z.string().optional().describe('The game history in PGN format of the user (optional for Lichess FEN analysis).'),
  currentBoardState: z.string().describe('The current board state in FEN format.'),
  moveNumber: z.number().optional().describe('The current move number in the game (optional).'),
});
export type TrainingBotInput = z.infer<typeof TrainingBotInputSchema>;

export const TrainingBotOutputSchema = z.object({
  suggestedMove: z.string().describe('The suggested move in UCI notation (e.g., e2e4).'),
  evaluation: z.number().describe('The evaluation of the current board state from White\'s perspective (positive is good for white, in centipawns).'),
  explanation: z.string().describe('Explanation of the suggestion source.'),
});
export type TrainingBotOutput = z.infer<typeof TrainingBotOutputSchema>;
