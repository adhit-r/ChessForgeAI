
'use server';
/**
 * @fileOverview Fetches chess game history for a user from a specified platform.
 *
 * - fetchGameHistory - A function that fetches recent games.
 * - FetchGameHistoryInput - The input type for the fetchGameHistory function.
 * - FetchGameHistoryOutput - The return type for the fetchGameHistory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FetchGameHistoryInputSchema = z.object({
  platform: z.enum(["lichess", "chesscom", "chess24"]).describe('The chess platform (e.g., "lichess", "chesscom", "chess24").'),
  username: z.string().describe('The username on the specified platform.'),
});
export type FetchGameHistoryInput = z.infer<typeof FetchGameHistoryInputSchema>;

const FetchGameHistoryOutputSchema = z.object({
  games: z.array(z.string().describe("A game in PGN format.")).describe("An array of game PGNs. Returns an empty array if no games are found or an error occurs.")
});
export type FetchGameHistoryOutput = z.infer<typeof FetchGameHistoryOutputSchema>;

export async function fetchGameHistory(input: FetchGameHistoryInput): Promise<FetchGameHistoryOutput> {
  return fetchGameHistoryFlow(input);
}

// Mock PGN data
const mockPgnData = [
  `[Event "Rated Blitz game"]
[Site "Lichess.org"]
[Date "2024.01.01"]
[White "MockUser"]
[Black "Opponent1"]
[Result "1-0"]
[WhiteElo "1500"]
[BlackElo "1450"]
[PlyCount "61"]
[Variant "Standard"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. a4 Bg7 16. Bd3 c6 17. Bg5 Qc7 18. Qd2 Rac8 19. Bh6 Bh8 20. Ng5 Nf8 21. f4 exf4 22. Qxf4 Ne6 23. Nxe6 Rxe6 24. e5 dxe5 25. dxe5 Nd5 26. Qg4 Rce8 27. Nf5 Bxe5 28. Nh4 Bh2+ 29. Kh1 Rxe1+ 30. Rxe1 Rxe1+ 31. Bf1 Rxf1# 1-0`,
  `[Event "Classical game"]
[Site "Chess.com"]
[Date "2024.01.02"]
[White "Opponent2"]
[Black "MockUser"]
[Result "0-1"]
[WhiteElo "1600"]
[BlackElo "1550"]
[PlyCount "80"]
[Variant "Standard"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 O-O 5. a3 Bxc3+ 6. Qxc3 b6 7. Bg5 Bb7 8. e3 d6 9. Ne2 Nbd7 10. Qd3 h6 11. Bh4 c5 12. Nc3 Rc8 13. d5 exd5 14. cxd5 Re8 15. Be2 Ne5 16. Qd2 Ng6 17. Bg3 a6 18. O-O b5 19. Rfd1 Qb6 20. b4 c4 21. Qd4 Qxd4 22. Rxd4 Rcd8 23. a4 bxa4 24. Bxc4 Rc8 25. Ra3 Ne7 26. e4 Ng6 27. f3 Ne5 28. Bxe5 Rxe5 29. Nxa4 Nd7 30. Rdc3 Ree8 31. Be2 Rxc3 32. Rxc3 Rc8 33. Rxc8+ Bxc8 34. Kf2 Kf8 35. Ke3 Ke7 36. Kd4 Kd8 37. f4 f6 38. g3 Kc7 39. Bg4 Nb6 40. Nxb6 Kxb6 0-1`
];


const prompt = ai.definePrompt({
  name: 'fetchGameHistoryPrompt',
  input: {schema: FetchGameHistoryInputSchema},
  output: {schema: FetchGameHistoryOutputSchema},
  prompt: `You are a chess data provider. 
Given a username "{{username}}" and platform "{{platform}}", provide a list of their recent game PGNs.
If the platform is "lichess", return 2 mock Lichess games.
If the platform is "chesscom", return 1 mock Chess.com game.
If the platform is "chess24", return 1 mock Chess24 game.
If no games are found or the platform is unrecognized, return an empty list in the 'games' array.
Ensure the output is valid JSON conforming to the output schema.
Example of a game PGN:
[Event "Rated Blitz game"]
[Site "Lichess.org"]
[Date "2023.10.26"]
[Round "?"]
[White "PlayerA"]
[Black "PlayerB"]
[Result "1-0"]
1. e4 e5 2. Nf3 *
`,
});


const fetchGameHistoryFlow = ai.defineFlow(
  {
    name: 'fetchGameHistoryFlow',
    inputSchema: FetchGameHistoryInputSchema,
    outputSchema: FetchGameHistoryOutputSchema,
  },
  async (input) => {
    // In a real scenario, this is where you'd call external APIs.
    // For now, we return mock data based on the prompt's instructions.
    // The prompt itself is mostly for demonstration if we were to use a model that
    // directly calls tools or generates structured data. Here, we simulate.

    if (input.platform === "lichess") {
      return { games: [mockPgnData[0], mockPgnData[1]] };
    } else if (input.platform === "chesscom") {
      return { games: [mockPgnData[1]] };
    } else if (input.platform === "chess24") {
      // Add a mock chess24 game if desired
       return { games: [`[Event "Mock Chess24 Game"]\n[Site "Chess24"]\n[Date "2024.01.03"]\n[White "${input.username}"]\n[Black "OpponentC24"]\n[Result "1/2-1/2"]\n1. e4 c5 *`] };
    }
    // Fallback for the LLM to attempt generation or return empty
    // const { output } = await prompt(input);
    // return output!;
    // Forcing mock data if prompt doesn't execute as expected in this simplified version
    return { games: [] };
  }
);
