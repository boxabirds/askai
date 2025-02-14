import OpenAI from 'openai';
import type { AskAiRequest } from '@/api/generated/models/AskAiRequest';
import type { AskAiResponse } from '@/api/generated/models/AskAiResponse';
import { AI_CONFIG } from '../config/ai';

export class AiHandler {
  private client: OpenAI;

  constructor() {
    if (!AI_CONFIG.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.client = new OpenAI({
      apiKey: AI_CONFIG.apiKey,
      baseURL: AI_CONFIG.baseURL,
    });
  }

  async askAI(request: AskAiRequest): Promise<AskAiResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: AI_CONFIG.systemPrompt },
          { role: 'user', content: request.query }
        ],
        temperature: AI_CONFIG.temperature,
      });

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from AI');
      }

      try {
        // Parse the JSON response
        const parsedResponse = JSON.parse(content);
        return parsedResponse as AskAiResponse;
      } catch (error) {
        console.error('Failed to parse AI response as JSON:', content);
        // Fallback response if parsing fails
        return {
          response: "I apologize, but I'm having trouble understanding how to help with that specific request. Could you try rephrasing it?",
          endpoint: '/api/todos',
          method: 'GET'
        };
      }
    } catch (error) {
      console.error('AI request failed:', error);
      return {
        response: "I apologize, but I'm currently having trouble processing your request. Please try again later.",
        endpoint: '/api/todos',
        method: 'GET'
      };
    }
  }
}
