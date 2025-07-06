import { NextResponse } from 'next/server';
import {
    DeepAnalyzeGameMetricsInputSchema,
    type DeepAnalyzeGameMetricsInput,
    type DeepAnalyzeGameMetricsOutput,
    type AnalyzeChessGameOutput // This type is used by analyzeSingleGameViaApi
} from '@/lib/types/api-schemas';

// Function to call the new analyze-chess-game API route
async function analyzeSingleGameViaApi(pgn: string, baseUrl: string): Promise<AnalyzeChessGameOutput | null> {
  try {
    const response = await fetch(`${baseUrl}/api/ai/analyze-chess-game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pgn }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API error from analyze-chess-game for PGN: ${response.status}`, errorBody);
      return null;
    }
    return await response.json() as AnalyzeChessGameOutput;
  } catch (error) {
    console.error('Failed to fetch from analyze-chess-game API:', error);
    return null;
  }
}

// Core logic function
async function analyzeMetricsLogic(input: DeepAnalyzeGameMetricsInput): Promise<DeepAnalyzeGameMetricsOutput> {
  let totalGamesAnalyzed = 0;
  let gamesWithBlunders = 0;
  let gamesWithMistakes = 0;

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
    // Call the new API route for single game analysis
    const singleGameAnalysis = await analyzeSingleGameViaApi(pgn, input.baseUrl);

    if (singleGameAnalysis && singleGameAnalysis.analysis) {
      totalGamesAnalyzed++;
      if (singleGameAnalysis.analysis.toLowerCase().includes("blunder")) {
        gamesWithBlunders++;
      }
      if (singleGameAnalysis.analysis.toLowerCase().includes("mistake")) {
        gamesWithMistakes++;
      }
    } else {
      console.warn("Skipping a game in deep analysis due to previous error or no analysis content.");
    }
  }

  let overallSummary = `Analyzed ${totalGamesAnalyzed} game(s) out of ${input.gamePgns.length} provided. `;
  const primaryWeaknesses: z.infer<typeof WeaknessSchema>[] = [];

  if (totalGamesAnalyzed === 0 && input.gamePgns.length > 0) {
    overallSummary = "Could not analyze the provided games. This might be due to issues with individual game analyses or PGN validity.";
     primaryWeaknesses.push({
        name: "Analysis Failed",
        description: "Failed to process games. Check individual game analysis or PGN validity if possible.",
        severity: "high",
        icon: "AlertTriangle",
        trainingSuggestion: { text: "Try analyzing a single game first to ensure it works.", link: "/analysis" }
      });
  } else if (gamesWithBlunders > totalGamesAnalyzed / 2 || (totalGamesAnalyzed > 0 && gamesWithBlunders >= Math.max(1, Math.min(3, totalGamesAnalyzed)) ) ) { // Adjusted threshold
    overallSummary += `A high number of games contained blunders (${gamesWithBlunders}/${totalGamesAnalyzed}).`;
    primaryWeaknesses.push({
      name: "Reduce Blunders",
      description: `Stockfish analysis identified blunders in ${gamesWithBlunders} out of ${totalGamesAnalyzed} analyzed games. Focus on minimizing major errors by carefully checking your moves.`,
      severity: "high",
      icon: "AlertTriangle",
      trainingSuggestion: { text: "Practice tactical puzzles and play longer time control games.", link: "/learn/puzzles" }
    });
  } else if (gamesWithMistakes > totalGamesAnalyzed / 2 || (totalGamesAnalyzed > 0 && gamesWithMistakes >= Math.max(1, Math.min(3, totalGamesAnalyzed)) ) ) {
    overallSummary += `Several games contained mistakes (${gamesWithMistakes}/${totalGamesAnalyzed}).`;
    primaryWeaknesses.push({
      name: "Minimize Mistakes",
      description: `Stockfish analysis identified mistakes in ${gamesWithMistakes} out of ${totalGamesAnalyzed} analyzed games. Review these positions to understand better alternatives.`,
      severity: "medium",
      icon: "TrendingDown",
      trainingSuggestion: { text: "Analyze your games thoroughly, especially after a loss or a complicated game.", link: "/analysis" }
    });
  } else if (totalGamesAnalyzed > 0) {
    overallSummary += "No consistent pattern of frequent blunders or mistakes was found across the analyzed games. Keep practicing!";
    primaryWeaknesses.push({
      name: "Consistent Practice",
      description: "Your games show a reasonable level of play according to Stockfish. Continue to practice, study, and analyze to steadily improve all aspects of your game.",
      severity: "low",
      icon: "BrainCircuit",
      trainingSuggestion: { text: "Explore different openings or study endgame principles.", link: "/learn/openings" }
    });
  }

  // Fallback if no specific weaknesses were identified despite games being analyzed
  if (totalGamesAnalyzed > 0 && primaryWeaknesses.length === 0) {
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

// Next.js API Route handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Add baseUrl to input for self-API calls
    // In a real deployment, this would come from environment variables or request headers
    // For local dev, it might be http://localhost:3000 (or whatever port Next.js is on)
    // The client calling this API should provide its own origin as the baseUrl
    const validatedInput = DeepAnalyzeGameMetricsInputSchema.safeParse(body);

    if (!validatedInput.success) {
      return NextResponse.json({ error: 'Invalid input', details: validatedInput.error.flatten() }, { status: 400 });
    }

    if (!validatedInput.data.baseUrl) {
        // Try to infer from request headers if not provided, though this is less reliable
        const inferredBaseUrl = request.headers.get('origin') || `http://${request.headers.get('host')}`;
        if (!inferredBaseUrl.startsWith('http')) {
             return NextResponse.json({ error: 'baseUrl is required and could not be reliably inferred.'}, { status: 400 });
        }
        validatedInput.data.baseUrl = inferredBaseUrl;
        console.warn(`baseUrl for deep-analyze-game-metrics was inferred to: ${validatedInput.data.baseUrl}. It's better if the client provides this explicitly.`);
    }


    const output = await analyzeMetricsLogic(validatedInput.data);
    return NextResponse.json(output);

  } catch (error) {
    console.error('Error in deep-analyze-game-metrics API route:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
