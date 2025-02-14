import { describe, expect, test, beforeAll, afterEach } from "bun:test";
import { Database } from "bun:sqlite";

const API_URL = "http://localhost:3000/api";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

describe("Todo API", () => {
  // Clear the database before each test
  beforeAll(() => {
    const db = new Database("todos.test.sqlite");
    db.exec("DELETE FROM todos");
  });

  afterEach(async () => {
    // Clean up after each test
    const db = new Database("todos.test.sqlite");
    db.exec("DELETE FROM todos");
  });

  describe("Single Item Operations", () => {
    test("should handle complete lifecycle of a single todo", async () => {
      // 1. Create a todo
      const createResponse = await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Test todo" }),
      });
      expect(createResponse.status).toBe(200);
      const todo: Todo = await createResponse.json();
      expect(todo.text).toBe("Test todo");
      expect(todo.completed).toBe(false);

      // 2. Edit the todo text
      const editResponse = await fetch(`${API_URL}/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Updated todo" }),
      });
      expect(editResponse.status).toBe(200);
      const editedTodo: Todo = await editResponse.json();
      expect(editedTodo.text).toBe("Updated todo");

      // 3. Mark as complete
      const completeResponse = await fetch(`${API_URL}/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
      expect(completeResponse.status).toBe(200);
      const completedTodo: Todo = await completeResponse.json();
      expect(completedTodo.completed).toBe(true);

      // 4. Delete the todo
      const deleteResponse = await fetch(`${API_URL}/todos/${todo.id}`, {
        method: "DELETE",
      });
      expect(deleteResponse.status).toBe(200);

      // 5. Verify deletion
      const getResponse = await fetch(`${API_URL}/todos`);
      const todos: Todo[] = await getResponse.json();
      expect(todos.length).toBe(0);
    });
  });

  describe("Bulk Operations", () => {
    test("should handle bulk operations with specific items", async () => {
      // 1. Create multiple todos
      const todo1 = await (await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Todo 1" }),
      })).json();

      const todo2 = await (await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Todo 2" }),
      })).json();

      // 2. Mark both as complete
      const completeResponse = await fetch(`${API_URL}/todos/batch/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [todo1.id, todo2.id],
          completed: true,
        }),
      });
      expect(completeResponse.status).toBe(200);
      const completedTodos: Todo[] = await completeResponse.json();
      expect(completedTodos.length).toBe(2);
      expect(completedTodos.every(todo => todo.completed)).toBe(true);

      // 3. Delete both
      const deleteResponse = await fetch(`${API_URL}/todos/batch/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [todo1.id, todo2.id],
        }),
      });
      expect(deleteResponse.status).toBe(200);

      // 4. Verify deletion
      const getResponse = await fetch(`${API_URL}/todos`);
      const todos: Todo[] = await getResponse.json();
      expect(todos.length).toBe(0);
    });

    test("should handle bulk operations with 'all' specifier", async () => {
      // 1. Create multiple todos
      await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Todo 1" }),
      });

      await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Todo 2" }),
      });

      await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Todo 3" }),
      });

      // 2. Mark all as complete
      const completeResponse = await fetch(`${API_URL}/todos/batch/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: "all",
          completed: true,
        }),
      });
      expect(completeResponse.status).toBe(200);
      const completedTodos: Todo[] = await completeResponse.json();
      expect(completedTodos.length).toBe(3);
      expect(completedTodos.every(todo => todo.completed)).toBe(true);

      // 3. Delete all
      const deleteResponse = await fetch(`${API_URL}/todos/batch/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: "all",
        }),
      });
      expect(deleteResponse.status).toBe(200);

      // 4. Verify deletion
      const getResponse = await fetch(`${API_URL}/todos`);
      const todos: Todo[] = await getResponse.json();
      expect(todos.length).toBe(0);
    });
  });
});
