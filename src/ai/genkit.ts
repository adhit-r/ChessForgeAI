import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // Using 'gemini-pro' as a more standard and widely available model.
  model: 'gemini-pro',
});
