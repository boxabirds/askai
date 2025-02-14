import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { file } from 'bun';
import { parse } from 'yaml';
import { TodoHandler } from './handlers/TodoHandler';
import { AiHandler } from './handlers/AiHandler';
import { initTodosDB } from './db/todos';
import type { AskAiRequest } from '@/api/generated/models/AskAiRequest';

// Initialize database
const db = initTodosDB();

// Initialize handlers
const todoHandler = new TodoHandler(db);
const aiService = new AiHandler();

// Load and parse OpenAPI spec from YAML file
const openApiYaml = await file('./src/api/openapi.yaml').text();
const openApiSpec = parse(openApiYaml);

const app = new Elysia()
  .use(cors({
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type']
  }))
  .use(swagger({
    documentation: openApiSpec
  }))
  .get('/api/openapi.yaml', () => openApiYaml)
  .group('/api', app => app
    .post('/ask', ({ body }) => aiService.askAI(body as AskAiRequest))
    .get('/todos', () => todoHandler.listTodos())
    .post('/todos', ({ body }) => {
      const { text } = body as { text: string };
      return todoHandler.createTodo(text);
    })
    .post('/todos/batch/delete', async ({ body }) => {
      const { ids } = body as { ids: string[] | 'all' };
      return todoHandler.deleteTodos(ids);
    })
    .post('/todos/batch/complete', async ({ body }) => {
      const { ids, completed } = body as { ids: string[] | 'all', completed: boolean };
      return todoHandler.completeTodos(ids, completed);
    })
    .patch('/todos/:id', ({ params, body }) => {
      const { id } = params;
      const updates = body as { completed?: boolean; text?: string };
      return todoHandler.updateTodo(id, updates);
    })
    .delete('/todos/:id', ({ params }) => {
      const { id } = params;
      return todoHandler.deleteTodo(id);
    })
  )
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
