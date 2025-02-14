import { describe, expect, it, beforeAll, afterAll, mock } from "bun:test";
import OpenAI from 'openai';
import { AiHandler } from "../AiHandler";
import { AI_CONFIG } from '../config/ai';

// Mock OpenAI chat completions
const mockCreate = mock(() =>
  Promise.resolve({
    choices: [{
      message: {
        content: JSON.stringify({
          response: "To create a new todo, you'll need to make a POST request with the todo text.",
          endpoint: '/api/todos',
          method: 'POST',
          parameters: {
            text: 'Your todo text here'
          }
        })
      }
    }]
  })
);

// Mock OpenAI client
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }))
  };
});

// Store original API key
let originalApiKey: string | undefined;

describe("AiHandler", () => {
  beforeAll(() => {
    originalApiKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalApiKey;
  });

  describe("askAI", () => {
    it("should call OpenAI API and parse response", async () => {
      const handler = new AiHandler();
      const response = await handler.askAI({ query: "How do I create a todo?" });
      
      expect(mockCreate).toHaveBeenCalledWith({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: AI_CONFIG.systemPrompt },
          { role: 'user', content: "How do I create a todo?" }
        ],
        temperature: AI_CONFIG.temperature,
      });

      expect(response).toEqual({
        response: "To create a new todo, you'll need to make a POST request with the todo text.",
        endpoint: '/api/todos',
        method: 'POST',
        parameters: {
          text: 'Your todo text here'
        }
      });
    });

    it("should handle API errors gracefully", async () => {
      mockCreate.mockImplementationOnce(() => Promise.reject(new Error("API Error")));
      
      const handler = new AiHandler();
      const response = await handler.askAI({ query: "How do I create a todo?" });
      
      expect(response).toEqual({
        response: "I apologize, but I'm currently having trouble processing your request. Please try again later.",
        endpoint: '/api/todos',
        method: 'GET'
      });
    });

    it("should handle invalid JSON responses", async () => {
      mockCreate.mockImplementationOnce(() =>
        Promise.resolve({
          choices: [{
            message: {
              content: "Invalid JSON"
            }
          }]
        })
      );
      
      const handler = new AiHandler();
      const response = await handler.askAI({ query: "How do I create a todo?" });
      
      expect(response).toEqual({
        response: "I apologize, but I'm having trouble understanding how to help with that specific request. Could you try rephrasing it?",
        endpoint: '/api/todos',
        method: 'GET'
      });
    });
  });
});
