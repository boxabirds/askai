import { describe, expect, it, beforeAll, afterAll, mock, beforeEach } from "bun:test";
import OpenAI from 'openai';
import { AiHandler } from "../AiHandler";
import { AI_CONFIG } from '../../config/ai';
import { TodoHandler } from '../TodoHandler';
import { Database } from 'bun:sqlite';

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

// Mock OpenAI chat completions for different scenarios
const mockCreateTodo = mock(() =>
  Promise.resolve({
    choices: [{
      message: {
        content: JSON.stringify({
          tool: {
            name: "createTodo",
            parameters: {
              text: "apple"
            }
          },
          explanation: "I'll help you create a new todo item for 'apple'."
        })
      }
    }]
  })
);

const mockCompleteAll = mock(() =>
  Promise.resolve({
    choices: [{
      message: {
        content: JSON.stringify({
          tool: {
            name: "completeTodos",
            parameters: {
              ids: "all",
              completed: true
            }
          },
          explanation: "I'll mark all todos as completed."
        })
      }
    }]
  })
);

const mockDeleteAll = mock(() =>
  Promise.resolve({
    choices: [{
      message: {
        content: JSON.stringify({
          tool: {
            name: "deleteTodos",
            parameters: {
              ids: "all"
            }
          },
          explanation: "I'll delete all todo items."
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
let db: Database;
let todoHandler: TodoHandler;
let aiHandler: AiHandler;

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

describe("AiHandler Integration", () => {
  beforeAll(() => {
    // Setup database
    db = new Database(':memory:');
    db.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )
    `).run();

    // Setup handlers
    todoHandler = new TodoHandler(db);
    
    // Setup environment
    originalApiKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  beforeEach(() => {
    // Clear database
    db.query('DELETE FROM todos').run();
    
    // Add initial todos
    const initialTodos = ['bun', 'shoe', 'tree', 'door', 'sticks'];
    initialTodos.forEach(text => todoHandler.createTodo(text));
    
    // Verify initial state
    const todos = todoHandler.listTodos();
    expect(todos).toHaveLength(5);
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalApiKey;
    db.close();
  });

  describe("askAI with todo operations", () => {
    it("should create a new todo when asked", async () => {
      // Mock OpenAI response for creating todo
      (OpenAI as jest.Mock).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreateTodo
          }
        }
      }));

      aiHandler = new AiHandler();
      
      // Ask AI to create a todo
      const response = await aiHandler.askAI({ query: "Add an apple" });
      
      // Verify response
      expect(response.success).toBe(true);
      expect(response.selectedTool).toBe("createTodo");
      
      // Verify database state
      const todos = todoHandler.listTodos();
      expect(todos).toHaveLength(6);
      expect(todos.some(todo => todo.text.toLowerCase() === "apple")).toBe(true);
    });

    it("should mark all todos as complete when asked", async () => {
      // Mock OpenAI response for completing todos
      (OpenAI as jest.Mock).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCompleteAll
          }
        }
      }));

      aiHandler = new AiHandler();
      
      // Ask AI to complete all todos
      const response = await aiHandler.askAI({ query: "mark all as done" });
      
      // Verify response
      expect(response.success).toBe(true);
      expect(response.selectedTool).toBe("completeTodos");
      
      // Verify database state
      const todos = todoHandler.listTodos();
      expect(todos).toHaveLength(5);
      expect(todos.every(todo => todo.completed)).toBe(true);
    });

    it("should delete all todos when asked", async () => {
      // Mock OpenAI response for deleting todos
      (OpenAI as jest.Mock).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockDeleteAll
          }
        }
      }));

      aiHandler = new AiHandler();
      
      // Ask AI to delete all todos
      const response = await aiHandler.askAI({ query: "delete everything" });
      
      // Verify response
      expect(response.success).toBe(true);
      expect(response.selectedTool).toBe("deleteTodos");
      
      // Verify database state
      const todos = todoHandler.listTodos();
      expect(todos).toHaveLength(0);
    });
  });
});
