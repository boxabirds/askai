import { Database } from 'bun:sqlite';
import { Todo, TodoRow } from '@/types/todo';

export class TodoHandler {
  constructor(private db: Database) {}

  listTodos(): Todo[] {
    const todos = this.db.query('SELECT * FROM todos ORDER BY created_at DESC').all() as TodoRow[];
    return todos.map(this.mapTodoRowToTodo);
  }

  createTodo(text: string): Todo {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    
    this.db.query(`
      INSERT INTO todos (id, text, completed, created_at)
      VALUES (?, ?, 0, ?)
    `).run(id, text, createdAt);

    return {
      id,
      text,
      completed: false,
      createdAt
    };
  }

  deleteTodos(ids: string[] | 'all'): { success: boolean } {
    if (ids === 'all') {
      this.db.prepare('DELETE FROM todos').run();
      return { success: true };
    }

    const placeholders = ids.map(() => '?').join(',');
    this.db.prepare(`DELETE FROM todos WHERE id IN (${placeholders})`).run(...ids);
    return { success: true };
  }

  completeTodos(ids: string[] | 'all', completed: boolean): Todo[] {
    const completedValue = completed ? 1 : 0;
    let updatedTodos: TodoRow[];
    
    if (ids === 'all') {
      this.db.prepare('UPDATE todos SET completed = ?').run(completedValue);
      updatedTodos = this.db.prepare('SELECT * FROM todos').all() as TodoRow[];
    } else {
      const placeholders = ids.map(() => '?').join(',');
      this.db.prepare(`UPDATE todos SET completed = ? WHERE id IN (${placeholders})`).run(completedValue, ...ids);
      updatedTodos = this.db.prepare(`SELECT * FROM todos WHERE id IN (${placeholders})`).all(...ids) as TodoRow[];
    }

    return updatedTodos.map(this.mapTodoRowToTodo);
  }

  updateTodo(id: string, updates: { completed?: boolean; text?: string }): Todo {
    const todo = this.db.query('SELECT * FROM todos WHERE id = ?').get(id);
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
      this.db.query(`
        UPDATE todos 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).run(...values, id);
    }

    const updatedTodo = this.db.query('SELECT * FROM todos WHERE id = ?').get(id) as TodoRow;
    return this.mapTodoRowToTodo(updatedTodo);
  }

  deleteTodo(id: string): null {
    const result = this.db.query('DELETE FROM todos WHERE id = ?').run(id);
    if (result.changes === 0) {
      throw new Error('Todo not found');
    }
    return null;
  }

  private mapTodoRowToTodo(todo: TodoRow): Todo {
    return {
      id: todo.id,
      text: todo.text,
      completed: Boolean(todo.completed),
      createdAt: new Date(todo.created_at).toISOString()
    };
  }
}
