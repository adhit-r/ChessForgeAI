import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // Changed to a valid and current Gemini model name
  model: 'gemini-1.5-flash-latest',
});
