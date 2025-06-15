import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // Using 'gemini-1.0-pro' as a standard, widely available model.
  model: 'gemini-1.0-pro',
});
