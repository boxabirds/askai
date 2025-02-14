import type { AskAiRequest } from '@/api/generated/models/AskAiRequest';
import type { AskAiResponse } from '@/api/generated/models/AskAiResponse';

export class AiHandler {
  askAI(request: AskAiRequest): AskAiResponse {
    const { query } = request;
    
    // Simple AI logic - just for demonstration
    if (query.toLowerCase().includes('create') || query.toLowerCase().includes('add')) {
      return {
        response: "To create a new todo, you'll need to make a POST request with the todo text.",
        endpoint: '/api/todos',
        method: 'POST',
        parameters: {
          text: 'Your todo text here'
        }
      };
    } else if (query.toLowerCase().includes('complete') || query.toLowerCase().includes('done')) {
      return {
        response: "To mark a todo as complete, you'll need to make a PATCH request with the todo ID.",
        endpoint: '/api/todos/{id}',
        method: 'PATCH',
        parameters: {
          id: 'todo-id',
          completed: true
        }
      };
    } else if (query.toLowerCase().includes('delete') || query.toLowerCase().includes('remove')) {
      return {
        response: "To delete a todo, you'll need to make a DELETE request with the todo ID.",
        endpoint: '/api/todos/{id}',
        method: 'DELETE',
        parameters: {
          id: 'todo-id'
        }
      };
    } else if (query.toLowerCase().includes('list') || query.toLowerCase().includes('get') || query.toLowerCase().includes('show')) {
      return {
        response: "To list all todos, you'll need to make a GET request.",
        endpoint: '/api/todos',
        method: 'GET'
      };
    }
    
    return {
      response: "I can help you with creating, completing, deleting, or listing todos. What would you like to do?",
      endpoint: '/api/todos',
      method: 'GET'
    };
  }
}
