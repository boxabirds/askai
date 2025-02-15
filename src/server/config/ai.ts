import toolsConfig from '../../api/openapi-tools.json';
import OpenAI from 'openai';

// Convert OpenAPI tools to OpenAI's tool format
function convertToOpenAITools(tools: typeof toolsConfig.tools): OpenAI.ChatCompletionTool[] {
  return tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
}

export const AI_CONFIG = {
  model: 'gpt-4-turbo-preview',
  temperature: 0.0,
  // Add your API key to .env file
  apiKey: process.env.OPENAI_API_KEY || '',
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
