import { NextResponse } from 'next/server';
import { z } from 'zod';

// Define the input schema using Zod
const GenerateImprovementTipsInputSchema = z.object({
  gameAnalysis: z
    .string()
    .describe(
      'A textual summary of chess game analysis, expected to come from Lichess Stockfish (e.g., highlighting blunders, mistakes).'
    ),
});
export type GenerateImprovementTipsInput = z.infer<typeof GenerateImprovementTipsInputSchema>;

// Define the output schema using Zod
const GenerateImprovementTipsOutputSchema = z.object({
  tips: z
    .array(z.string())
    .describe(
      'An array of 1-4 plain-text improvement tips based on the game analysis summary.' // Corrected max items based on logic
    ),
});
export type GenerateImprovementTipsOutput = z.infer<typeof GenerateImprovementTipsOutputSchema>;

// Core logic function (renamed from generateRuleBasedTips)
async function generateTipsLogic(input: GenerateImprovementTipsInput): Promise<GenerateImprovementTipsOutput> {
  const tips: string[] = [];
  const analysisText = input.gameAnalysis.toLowerCase();

  if (analysisText.includes("blunder")) {
    tips.push("One or more blunders were identified. Focus on improving your tactical vision and calculation. Regularly solving puzzles can help. [Practice Puzzles on Lichess](https://lichess.org/training)");
  }
  if (analysisText.includes("mistake")) {
    tips.push("Mistakes were made that significantly changed the evaluation. Review these moments carefully. Understanding why a mistake occurred is crucial for avoiding it in the future. [Analyze your games on Lichess](https://lichess.org/analysis)");
  }
  if (analysisText.includes("inaccuracy")) {
    tips.push("Inaccuracies can accumulate. Try to find the most precise moves, especially in critical positions. Deeper calculation or better positional understanding might be needed.");
  }

  if (tips.length < 2 && analysisText.includes("stockfish")) {
     tips.push("Review the game with Stockfish to understand key moments and alternative lines. [Use Lichess Analysis Board](https://lichess.org/analysis)");
  }

  if (tips.length === 0 && !analysisText.includes("blunder") && !analysisText.includes("mistake") && !analysisText.includes("inaccuracy")) {
    // Only add this if no specific errors were mentioned but analysis text is present
    if (analysisText.length > 0) { // Check if analysisText is not empty
        tips.push("The analysis didn't pinpoint specific frequent errors based on keywords (blunder, mistake, inaccuracy). Consistent practice and reviewing your games are always beneficial. [Play a game on Lichess](https://lichess.org/play)");
    } else {
        tips.push("No analysis data provided to generate tips. Please analyze a game first. [Play a game on Lichess](https://lichess.org/play)");
    }
  }
  
  // Add a general tip if space allows
  if (tips.length < 3) {
    tips.push("Consider studying common openings and their typical middlegame plans to get a better start. [Explore Openings on Lichess](https://lichess.org/opening)");
  }
  if (tips.length < 4 && (analysisText.includes("blunder") || analysisText.includes("mistake"))) {
      tips.push("Double-check your moves for simple tactical oversights before committing, especially checking for undefended pieces or potential forks/pins.");
  }

  // Ensure between 1 and 4 tips.
  let finalTips = tips.slice(0, 4);
  if (finalTips.length === 0) { // Ensure at least one tip, especially if input was empty
    finalTips.push("Keep practicing and learning! Every game is an opportunity to improve. [Play a game on Lichess](https://lichess.org/play)");
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
