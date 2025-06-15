
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Ensure you have GOOGLE_API_KEY="your_actual_api_key" in your .env file for this to work.
// This key should have permissions for the Vertex AI API or Generative Language API.
if (typeof process !== 'undefined' && !process.env.GOOGLE_API_KEY) {
  console.warn("Genkit/GoogleAI: GOOGLE_API_KEY environment variable is not set. The googleAI plugin might rely on Application Default Credentials or other fallback mechanisms.");
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY, // Explicitly pass the API key
    }),
  ],
  // Model specification will be handled at the prompt level in each flow file.
});
