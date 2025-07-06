import { NextResponse } from 'next/server';
// Zod is still needed for .safeParse if not using the schema directly from import for that
import { FetchGameHistoryInputSchema, type FetchGameHistoryInput, type FetchGameHistoryOutput } from '@/lib/types/api-schemas';

// The main logic for fetching game history
async function fetchGameHistoryLogic(input: FetchGameHistoryInput): Promise<FetchGameHistoryOutput> {
  if (input.platform === "lichess") {
    try {
      console.log(`Fetching Lichess games for ${input.username}, max: ${input.maxGames}`);
      const lichessApiUrl = new URL(`https://lichess.org/api/games/user/${input.username}`);
      lichessApiUrl.searchParams.set('max', String(input.maxGames));
      lichessApiUrl.searchParams.set('pgns', 'true');
      lichessApiUrl.searchParams.set('literate', 'true');
      lichessApiUrl.searchParams.set('tags', 'true');
      lichessApiUrl.searchParams.set('opening', 'true');

      const response = await fetch(
        lichessApiUrl.toString(),
        {
          headers: { 'Accept': 'application/x-nd-pgn' }
        }
      );

      if (!response.ok) {
        console.error(`Lichess API error for ${input.username}: ${response.status} ${response.statusText}`);
        const errorBody = await response.text();
        console.error("Lichess API error body:", errorBody);
        return { games: [] };
      }

      const textData = await response.text();
      // Split PGNs. Lichess uses three newlines as a separator for multiple PGNs in application/x-nd-pgn format.
      const games = textData.trim().split(/\n\n\n|\r\n\r\n\r\n/).filter(pgn => pgn.trim().startsWith('[Event') && pgn.length > 20);
      console.log(`Fetched ${games.length} games from Lichess for ${input.username}`);
      return { games };

    } catch (error) {
      console.error(`Failed to fetch games from Lichess for ${input.username}:`, error);
      return { games: [] };
    }
  } else if (input.platform === "chesscom") {
    console.log(`Chess.com game fetching for ${input.username} not implemented. Returning empty.`);
    return { games: [] };
  } else if (input.platform === "chess24") {
    console.log(`Chess24 game fetching for ${input.username} not implemented. Returning empty.`);
    return { games: [] };
  }

  console.warn(`Platform ${input.platform} not implemented. Returning empty array.`);
  return { games: [] };
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedInput = FetchGameHistoryInputSchema.safeParse(body);

    if (!validatedInput.success) {
      return NextResponse.json({ error: 'Invalid input', details: validatedInput.error.flatten() }, { status: 400 });
    }

    const output = await fetchGameHistoryLogic(validatedInput.data);
    return NextResponse.json(output);

  } catch (error) {
    console.error('Error in fetch-game-history API route:', error);
    if (error instanceof SyntaxError) { // Handle cases where request.json() fails
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Optionally, can add a GET handler if you want to pass parameters via URL query
// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const params = Object.fromEntries(searchParams.entries());
//   // Convert params to appropriate types for validation if needed (e.g., maxGames to number)
//   const validatedInput = FetchGameHistoryInputSchema.safeParse(params);
//
//   if (!validatedInput.success) {
//     return NextResponse.json({ error: 'Invalid input', details: validatedInput.error.flatten() }, { status: 400 });
//   }
//
//   const output = await fetchGameHistoryLogic(validatedInput.data);
//   return NextResponse.json(output);
// }
