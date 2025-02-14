import { useState } from 'react';
import { AiService } from '@/api/generated';

interface AIResponse {
  response: string;
  endpoint: string;
  method: string;
  parameters?: Record<string, any>;
}

export function useAskAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AIResponse | null>(null);

  const askAI = async (query: string): Promise<AIResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await AiService.askAi({ query });
      setResponse(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    askAI,
    response,
    isLoading,
    error,
  };
}
