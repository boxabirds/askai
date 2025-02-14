import { Database } from 'bun:sqlite';

export function initTodosDB(dbName: string = process.env.DB_NAME || 'todos.sqlite'): Database {
  const db = new Database(dbName);
  
  // Create todos table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}
