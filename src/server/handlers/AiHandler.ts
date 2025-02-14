import OpenAI from 'openai';
import type { AskAiRequest } from '@/api/generated/models/AskAiRequest';
import type { AskAiResponse } from '@/api/generated/models/AskAiResponse';
import { AI_CONFIG } from '../config/ai';

interface ToolResponse {
  tool: {
    name: string;
    parameters: Record<string, any>;
  } | null;
  explanation: string;
}

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
        tools: AI_CONFIG.tools,
        temperature: AI_CONFIG.temperature,
      });

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from AI');
      }

      try {
        // Parse the response as a ToolResponse
        const response = JSON.parse(content) as ToolResponse;
        
        // If no tool was selected
        if (!response.tool) {
          return {
            response: response.explanation,
            success: false
          };
        }

        // Validate the selected tool exists
        const toolConfig = AI_CONFIG.tools.find(t => t.name === response.tool!.name);
        if (!toolConfig) {
          throw new Error(`AI selected invalid tool: ${response.tool.name}`);
        }

        // Validate parameters against tool schema
        this.validateToolParameters(response.tool.parameters, toolConfig.parameters);

        return {
          response: response.explanation,
          selectedTool: response.tool.name,
          parameters: response.tool.parameters,
          success: true
        };

      } catch (error) {
        console.error('Failed to process AI response:', error);
        return {
          response: "I'm having trouble understanding how to help with that request. Could you try rephrasing it?",
          success: false
        };
      }
    } catch (error) {
      console.error('AI request failed:', error);
      return {
        response: "Sorry, I encountered an error while processing your request. Please try again.",
        success: false
      };
    }
  }

  private validateToolParameters(
    params: Record<string, any>,
    schema: { type: string; properties: Record<string, any>; required?: string[] }
  ): void {
    // Check required parameters are present
    if (schema.required) {
      for (const required of schema.required) {
        if (!(required in params)) {
          throw new Error(`Missing required parameter: ${required}`);
        }
      }
    }

    // Validate parameter types (basic validation)
    for (const [key, value] of Object.entries(params)) {
      const paramSchema = schema.properties[key];
      if (!paramSchema) {
        throw new Error(`Unknown parameter: ${key}`);
      }

      // Basic type checking
      switch (paramSchema.type) {
        case 'string':
          if (typeof value !== 'string') {
            throw new Error(`Parameter ${key} must be a string`);
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            throw new Error(`Parameter ${key} must be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            throw new Error(`Parameter ${key} must be a boolean`);
          }
          break;
        // Add more types as needed
      }
    }
  }
}
