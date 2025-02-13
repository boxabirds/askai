import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface OpenAPISpec {
  paths: Record<string, any>;
  components?: Record<string, any>;
}

interface UseAskAIOptions {
  openApiSpec: OpenAPISpec;
  apiBaseUrl: string;
  geminiApiKey: string;
}

interface AIResponse {
  explanation: string;
  endpoint: string;
  method: string;
  parameters?: Record<string, any>;
}

export function useAskAI({ openApiSpec, apiBaseUrl, geminiApiKey }: UseAskAIOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AIResponse | null>(null);

  const askAI = async (query: string): Promise<AIResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
        Given this OpenAPI specification: ${JSON.stringify(openApiSpec)}
        And this user query: "${query}"
        Determine which API endpoint would best fulfill this request and provide the necessary parameters.
        Format your response as JSON with the following structure:
        {
          "endpoint": "/path/to/endpoint",
          "method": "GET/POST/etc",
          "parameters": {},
          "explanation": "A user-friendly explanation"
        }
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const aiResponse = JSON.parse(responseText) as AIResponse;
      
      setResponse(aiResponse);
      return aiResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const executeAPICall = async () => {
    if (!response?.endpoint) return null;

    try {
      const url = new URL(response.endpoint, apiBaseUrl);
      const result = await fetch(url.toString(), {
        method: response.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: response.method !== 'GET' ? JSON.stringify(response.parameters) : undefined,
      });

      if (!result.ok) {
        throw new Error('API call failed');
      }

      return await result.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'API call failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    askAI,
    executeAPICall,
    isLoading,
    error,
    response,
  };
}
