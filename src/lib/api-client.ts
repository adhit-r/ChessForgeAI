import {
  type FetchGameHistoryInput, type FetchGameHistoryOutput,
  type AnalyzeChessGameInput, type AnalyzeChessGameOutput,
  type DeepAnalyzeGameMetricsInput, type DeepAnalyzeGameMetricsOutput,
  type GenerateImprovementTipsInput, type GenerateImprovementTipsOutput,
  type TrainingBotInput, type TrainingBotOutput
} from './types/api-schemas';

// Helper function for making API requests
async function post<TInput, TOutput>(endpoint: string, payload: TInput): Promise<TOutput> {
  const response = await fetch(`/api/ai${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // If response is not JSON, use status text
      errorData = { error: response.statusText, details: `Status: ${response.status}` };
    }
    throw new Error(errorData?.error || `API request to ${endpoint} failed with status ${response.status}`);
  }
  return response.json() as Promise<TOutput>;
}

export const apiClient = {
  fetchGameHistory: (payload: FetchGameHistoryInput): Promise<FetchGameHistoryOutput> => {
    return post<FetchGameHistoryInput, FetchGameHistoryOutput>('/fetch-game-history', payload);
  },

  analyzeChessGame: (payload: AnalyzeChessGameInput): Promise<AnalyzeChessGameOutput> => {
    return post<AnalyzeChessGameInput, AnalyzeChessGameOutput>('/analyze-chess-game', payload);
  },

  deepAnalyzeGameMetrics: (payload: DeepAnalyzeGameMetricsInput): Promise<DeepAnalyzeGameMetricsOutput> => {
    // Note: The DeepAnalyzeGameMetricsInput requires a baseUrl.
    // If this client is only used client-side, window.location.origin can be automatically added here,
    // or it must be ensured that the caller provides it.
    // For now, assuming payload includes baseUrl if called from client.
    let modifiedPayload = payload;
    if (typeof window !== 'undefined' && !payload.baseUrl) {
        // Automatically set baseUrl if running in browser and not already set
        modifiedPayload = { ...payload, baseUrl: window.location.origin };
    } else if (!payload.baseUrl) {
        // This case should ideally not happen if called from server-side without explicit baseUrl.
        // Or, if called server-side, baseUrl should point to the deployed app's URL.
        console.warn("apiClient.deepAnalyzeGameMetrics: baseUrl is not set and not in a browser environment. Self-API calls might fail or use unexpected URLs if this API route is called by another server-side process without a full URL.");
    }
    return post<DeepAnalyzeGameMetricsInput, DeepAnalyzeGameMetricsOutput>('/deep-analyze-game-metrics', modifiedPayload);
  },

  generateImprovementTips: (payload: GenerateImprovementTipsInput): Promise<GenerateImprovementTipsOutput> => {
    return post<GenerateImprovementTipsInput, GenerateImprovementTipsOutput>('/generate-improvement-tips', payload);
  },

  trainingBotAnalysis: (payload: TrainingBotInput): Promise<TrainingBotOutput> => {
    return post<TrainingBotInput, TrainingBotOutput>('/training-bot-analysis', payload);
  },
};

// Custom Error class for API errors, if more detailed error objects are preferred
export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// Example of a more robust post function using ApiError
