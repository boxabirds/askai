import { useState } from 'react';

interface OpenAPISpec {
  paths: Record<string, any>;
  components?: Record<string, any>;
}

interface UseAskAIOptions {
  openApiSpec: OpenAPISpec;
  apiBaseUrl: string;
}

interface AIResponse {
  explanation: string;
  endpoint: string;
  method: string;
  parameters?: Record<string, any>;
}

interface ServerResponse {
  response: string;
  endpoint: string;
  method: string;
  parameters?: Record<string, any>;
  error?: string;
}

export function useAskAI({ openApiSpec, apiBaseUrl }: UseAskAIOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AIResponse | null>(null);

  const askAI = async (query: string): Promise<AIResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Sending request to:', `${apiBaseUrl}/api/ask`);
      const result = await fetch(`${apiBaseUrl}/api/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          openApiSpec,
        }),
      });

      const data: ServerResponse = await result.json();
      console.log('Server response:', data);

      if (!result.ok || data.error) {
        throw new Error(data.error || `Server error: ${result.status}`);
      }

      if (!data.response || !data.endpoint || !data.method) {
        throw new Error('Invalid server response format');
      }

      const aiResponse: AIResponse = {
        explanation: data.response,
        endpoint: data.endpoint,
        method: data.method,
        parameters: data.parameters,
      };
      
      setResponse(aiResponse);
      setError(null);
      return aiResponse;
    } catch (err) {
      console.error('Error in askAI:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    askAI,
    isLoading,
    error,
    response,
  };
}
