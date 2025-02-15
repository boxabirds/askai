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
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.client = new OpenAI({
      apiKey: AI_CONFIG.apiKey,
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
        const toolConfig = AI_CONFIG.tools.find(t => t.function.name === response.tool!.name);
        if (!toolConfig) {
          throw new Error(`AI selected invalid tool: ${response.tool.name}`);
        }

        // Skip parameter validation if no parameters schema is defined
        if (toolConfig.function.parameters) {
          this.validateToolParameters(response.tool.parameters, toolConfig.function.parameters);
        }

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
    schema: OpenAI.FunctionParameters
  ): void {
    // Check required parameters are present
    if (schema.required && Array.isArray(schema.required)) {
      schema.required.forEach(required => {
        if (!(required in params)) {
          throw new Error(`Missing required parameter: ${required}`);
        }
      });
    }

    // Validate parameter types (basic validation)
    const properties = schema.properties as Record<string, { type?: string }>;
    if (properties && typeof properties === 'object') {
      for (const [key, value] of Object.entries(params)) {
        const paramSchema = properties[key];
        if (!paramSchema) {
          throw new Error(`Unknown parameter: ${key}`);
        }

        // Basic type checking
        if (paramSchema.type) {
          switch (paramSchema.type) {
            case 'string':
              if (typeof value !== 'string') {
                throw new Error(`Parameter ${key} must be a string`);
              }
              break;
            case 'number':
            case 'integer':
              if (typeof value !== 'number') {
                throw new Error(`Parameter ${key} must be a number`);
              }
              break;
            case 'boolean':
              if (typeof value !== 'boolean') {
                throw new Error(`Parameter ${key} must be a boolean`);
              }
              break;
            case 'array':
              if (!Array.isArray(value)) {
                throw new Error(`Parameter ${key} must be an array`);
              }
              break;
            case 'object':
              if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                throw new Error(`Parameter ${key} must be an object`);
              }
              break;
            // Add more types as needed
          }
        }
      }
    }
  }
}
