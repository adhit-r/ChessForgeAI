
'use server';
/**
 * @fileOverview Fetches chess game history for a user from a specified platform.
 * Lichess is fetched via API. Other platforms return empty as LLM use is removed.
 *
 * - fetchGameHistory - A function that fetches recent games.
 * - FetchGameHistoryInput - The input type for the fetchGameHistory function.
 * - FetchGameHistoryOutput - The return type for the fetchGameHistory function.
 */

import {ai}from '@/ai/genkit';
import {z}from 'genkit';

const FetchGameHistoryInputSchema = z.object({
  platform: z.enum(["lichess", "chesscom", "chess24"]).describe('The chess platform (e.g., "lichess", "chesscom", "chess24").'),
  username: z.string().describe('The username on the specified platform.'),
  maxGames: z.number().optional().default(10).describe('Maximum number of games to fetch.'),
});
export type FetchGameHistoryInput = z.infer<typeof FetchGameHistoryInputSchema>;

const FetchGameHistoryOutputSchema = z.object({
  games: z.array(z.string().describe("A game in PGN format.")).describe("An array of game PGNs. Returns an empty array if no games are found or an error occurs.")
});
export type FetchGameHistoryOutput = z.infer<typeof FetchGameHistoryOutputSchema>;

// The main logic is moved into this implementation function
async function fetchGameHistoryImplementation(input: FetchGameHistoryInput): Promise<FetchGameHistoryOutput> {
  if (input.platform === "lichess") {
    try {
      console.log(`Fetching Lichess games for ${input.username}, max: ${input.maxGames}`);
      // Common parameters for fetching PGNs:
      // literate=true (includes comments like clock times if available)
      // tags=true (includes standard PGN tags)
      // opening=true (includes ECO code and opening name if Lichess recognizes it)
      // players=true (includes player details)
      const lichessApiUrl = new URL(`https://lichess.org/api/games/user/${input.username}`);
      lichessApiUrl.searchParams.set('max', String(input.maxGames));
      lichessApiUrl.searchParams.set('pgns', 'true');
      lichessApiUrl.searchParams.set('literate', 'true'); 
      lichessApiUrl.searchParams.set('tags', 'true');
      lichessApiUrl.searchParams.set('opening', 'true');
      // lichessApiUrl.searchParams.set('clocks', 'true'); // To include clock comments
      // lichessApiUrl.searchParams.set('evals', 'false'); // Evals not needed here, analyze separately

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
      const games = textData.trim().split(/\n\n\n|\r\n\r\n\r\n/).filter(pgn => pgn.trim().startsWith('[Event') && pgn.length > 20);
      console.log(`Fetched ${games.length} games from Lichess for ${input.username}`);
      return { games };

    } catch (error) {
      console.error(`Failed to fetch games from Lichess for ${input.username}:`, error);
      return { games: [] }; // Return empty on error
    }
  } else if (input.platform === "chesscom") {
    console.log(`Chess.com game fetching for ${input.username} not implemented with direct API (requires auth or different API). Returning empty.`);
    return { games: [] };
  } else if (input.platform === "chess24") {
    console.log(`Chess24 game fetching for ${input.username} not implemented. Returning empty.`);
    return { games: [] };
  }
  
  console.warn(`Platform ${input.platform} not implemented for game fetching or LLM fallback removed. Returning empty array.`);
  return { games: [] };
}

// Exported function that invokes the Genkit flow
export async function fetchGameHistory(input: FetchGameHistoryInput): Promise<FetchGameHistoryOutput> {
  return fetchGameHistoryFlow(input);
}

const fetchGameHistoryFlow = ai.defineFlow(
  {
    name: 'fetchGameHistoryFlow',
    inputSchema: FetchGameHistoryInputSchema,
    outputSchema: FetchGameHistoryOutputSchema,
  },
  fetchGameHistoryImplementation
);
// Removed the ai.definePrompt for 'fetchGameHistoryPrompt' as it's no longer used.
