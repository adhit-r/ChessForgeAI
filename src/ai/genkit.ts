
import {genkit} from 'genkit';
// googleAI plugin removed

export const ai = genkit({
  plugins: [
    // googleAI plugin removed
  ],
  // No default model needed if not using LLM-based prompts extensively.
  // Flows will now primarily use direct API calls (e.g., to Lichess).
});
