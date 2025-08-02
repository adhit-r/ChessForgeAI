import { NextResponse } from 'next/server';
import {
    GenerateImprovementTipsInputSchema,
    type GenerateImprovementTipsInput,
    type GenerateImprovementTipsOutput
} from '@/lib/types/api-schemas';

// Improvement tip constants
const TIP_BLUNDER = "One or more blunders were identified. Focus on improving your tactical vision and calculation. Regularly solving puzzles can help. [Practice Puzzles on Lichess](https://lichess.org/training)";
const TIP_MISTAKE = "Mistakes were made that significantly changed the evaluation. Review these moments carefully. Understanding why a mistake occurred is crucial for avoiding it in the future. [Analyze your games on Lichess](https://lichess.org/analysis)";
const TIP_INACCURACY = "Inaccuracies can accumulate. Try to find the most precise moves, especially in critical positions. Deeper calculation or better positional understanding might be needed.";
const TIP_STOCKFISH = "Review the game with Stockfish to understand key moments and alternative lines. [Use Lichess Analysis Board](https://lichess.org/analysis)";
const TIP_NO_KEYWORDS = "The analysis didn't pinpoint specific frequent errors based on keywords (blunder, mistake, inaccuracy). Consistent practice and reviewing your games are always beneficial. [Play a game on Lichess](https://lichess.org/play)";
const TIP_NO_ANALYSIS = "No analysis data provided to generate tips. Please analyze a game first. [Play a game on Lichess](https://lichess.org/play)";
const TIP_OPENINGS = "Consider studying common openings and their typical middlegame plans to get a better start. [Explore Openings on Lichess](https://lichess.org/opening)";
const TIP_TACTICAL_OVERSIGHTS = "Double-check your moves for simple tactical oversights before committing, especially checking for undefended pieces or potential forks/pins.";
const TIP_GENERAL = "Keep practicing and learning! Every game is an opportunity to improve. [Play a game on Lichess](https://lichess.org/play)";

// Core logic function (renamed from generateRuleBasedTips)
async function generateTipsLogic(input: GenerateImprovementTipsInput): Promise<GenerateImprovementTipsOutput> {
  const tips: string[] = [];
  const analysisText = input.gameAnalysis.toLowerCase();

  if (analysisText.includes("blunder")) {
    tips.push(TIP_BLUNDER);
  }
  if (analysisText.includes("mistake")) {
    tips.push(TIP_MISTAKE);
  }
  if (analysisText.includes("inaccuracy")) {
    tips.push(TIP_INACCURACY);
  }

  if (tips.length < 2 && analysisText.includes("stockfish")) {
     tips.push(TIP_STOCKFISH);
  }

  if (tips.length === 0 && !analysisText.includes("blunder") && !analysisText.includes("mistake") && !analysisText.includes("inaccuracy")) {
    // Only add this if no specific errors were mentioned but analysis text is present
    if (analysisText.length > 0) { // Check if analysisText is not empty
        tips.push(TIP_NO_KEYWORDS);
    } else {
        tips.push(TIP_NO_ANALYSIS);
    }
  }

  // Add a general tip if space allows
  if (tips.length < 3) {
    tips.push(TIP_OPENINGS);
  }
  if (tips.length < 4 && (analysisText.includes("blunder") || analysisText.includes("mistake"))) {
      tips.push(TIP_TACTICAL_OVERSIGHTS);
  }

  // Ensure between 1 and 4 tips.
  let finalTips = tips.slice(0, 4);
  if (finalTips.length === 0) { // Ensure at least one tip, especially if input was empty
    finalTips.push(TIP_GENERAL);
  }

  return { tips: finalTips };
}

// Next.js API Route handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedInput = GenerateImprovementTipsInputSchema.safeParse(body);

    if (!validatedInput.success) {
      return NextResponse.json({ error: 'Invalid input', details: validatedInput.error.flatten() }, { status: 400 });
    }

    const output = await generateTipsLogic(validatedInput.data);
    return NextResponse.json(output);

  } catch (error) {
    console.error('Error in generate-improvement-tips API route:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
