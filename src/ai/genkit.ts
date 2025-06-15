import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // Using 'gemini-pro' as a standard, widely available model, often suitable for free/basic tier usage.
  model: 'gemini-pro',
});
