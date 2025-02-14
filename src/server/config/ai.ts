import toolsConfig from '../../api/openapi-tools.json';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';

// Convert OpenAPI tools to OpenAI's tool format
function convertToOpenAITools(tools: typeof toolsConfig.tools): ChatCompletionTool[] {
  return tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
}

export const AI_CONFIG = {
  model: 'gemini-2.0-flash',
  temperature: 0.7,
  // Add your API key to .env file
  apiKey: process.env.GEMINI_API_KEY || '',
  baseURL: 'https://generativelanguage.googleapis.com/v1/models',
  systemPrompt: `You are a helpful API assistant. Your task is to understand the user's request and select the most appropriate API tool to help them.

If you identify a relevant tool, respond with a JSON object containing:
{
  "tool": {
    "name": "the selected tool name",
    "parameters": {
      // parameters required by the tool
    }
  },
  "explanation": "A brief explanation of why this tool was selected"
}

If no tool is appropriate, respond with:
{
  "tool": null,
  "explanation": "A helpful message explaining why no tool matches and what the user might try instead"
}

Always validate that:
1. The tool name exactly matches one from the available tools
2. All required parameters for the tool are provided
3. Parameter types match the tool's schema`,
  tools: convertToOpenAITools(toolsConfig.tools)
};
