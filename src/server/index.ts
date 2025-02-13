import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { Database } from 'bun:sqlite';
import { file } from 'bun';
import { Todo, TodoRow } from '../types/todo';

// Initialize SQLite database
const db = new Database('todos.sqlite');
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

interface TodoRecord {
  id: string;
  text: string;
  completed: number;
  created_at: string;
}

// Load OpenAPI spec from YAML file
const openApiSpec = await file('./src/api/openapi.yaml').text();

const app = new Elysia()
  .use(cors({
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type']
  }))
  .use(swagger({
    documentation: openApiSpec
  }))
  .group('/api', app => app
    .get('/todos', () => {
      const todos = db.query('SELECT * FROM todos ORDER BY created_at DESC').all() as TodoRow[];
      return todos.map((todo: TodoRow): Todo => ({
        id: todo.id,
        text: todo.text,
        completed: Boolean(todo.completed),
        createdAt: new Date(todo.created_at).toISOString()
      }));
    })
    .post('/todos', ({ body }) => {
      const { text } = body as { text: string };
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      
      db.query(`
        INSERT INTO todos (id, text, completed, created_at)
        VALUES (?, ?, 0, ?)
      `).run(id, text, createdAt);

      return {
        id,
        text,
        completed: false,
        createdAt
      };
    })
    .patch('/todos/:id', ({ params, body }) => {
      const { id } = params;
      const updates = body as { completed?: boolean; text?: string };
      
      const todo = db.query('SELECT * FROM todos WHERE id = ?').get(id);
      if (!todo) {
        throw new Error('Todo not found');
      }

      const updateFields: string[] = [];
      const values: any[] = [];

      if ('completed' in updates) {
        updateFields.push('completed = ?');
        values.push(updates.completed ? 1 : 0);
      }
      if ('text' in updates) {
        updateFields.push('text = ?');
        values.push(updates.text);
      }

      if (updateFields.length > 0) {
        db.query(`
          UPDATE todos 
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `).run(...values, id);
      }

      const updatedTodo = db.query('SELECT * FROM todos WHERE id = ?').get(id) as TodoRecord;
      return {
        id: updatedTodo.id,
        text: updatedTodo.text,
        completed: Boolean(updatedTodo.completed),
        createdAt: new Date(updatedTodo.created_at).toISOString()
      };
    })
    .delete('/todos/:id', ({ params }) => {
      const { id } = params;
      const result = db.query('DELETE FROM todos WHERE id = ?').run(id);
      if (result.changes === 0) {
        throw new Error('Todo not found');
      }
      return null;
    })
  )
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
