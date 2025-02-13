import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Fetch todos on component mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/todos');
      if (!response.ok) {
        throw new Error('Failed to fetch todos');
      }
      const data = await response.json();
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch todos');
    } finally {
      setIsLoading(false);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const response = await fetch('http://localhost:3000/api/todos', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newTodo.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to add todo');
      }

      const todo = await response.json();
      setTodos(prev => [todo, ...prev]);
      setNewTodo('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add todo');
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      const response = await fetch(`http://localhost:3000/api/todos/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !todo.completed }),
      });

      if (!response.ok) {
        throw new Error('Failed to update todo');
      }

      const updatedTodo = await response.json();
      setTodos(prev =>
        prev.map(t => t.id === id ? updatedTodo : t)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/todos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete todo');
      }

      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    }
  };

  const updateTodoText = async (id: string, newText: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/todos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newText }),
      });

      if (!response.ok) {
        throw new Error('Failed to update todo');
      }

      const updatedTodo = await response.json();
      setTodos(prev =>
        prev.map(t => t.id === id ? updatedTodo : t)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    }
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, todo: Todo) => {
    if (e.key === 'Enter' && editingText.trim()) {
      updateTodoText(todo.id, editingText.trim());
      setEditingId(null);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingText('');
    }
  };

  const handleEditBlur = (todo: Todo) => {
    if (editingText.trim()) {
      updateTodoText(todo.id, editingText.trim());
    }
    setEditingId(null);
    setEditingText('');
  };

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      <form onSubmit={addTodo} className="flex gap-2">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        />
        <Button type="submit" size="icon">
          <PlusIcon className="h-4 w-4" />
        </Button>
      </form>

      <ul className="space-y-4">
        {todos.map(todo => (
          <li
            key={todo.id}
            className="flex items-center justify-between space-x-2 border rounded-lg p-4"
          >
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={todo.completed}
                onCheckedChange={() => toggleTodo(todo.id)}
              />
              {editingId === todo.id ? (
                <input
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={(e) => handleEditKeyDown(e, todo)}
                  onBlur={() => handleEditBlur(todo)}
                  className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <span
                  onClick={() => startEditing(todo)}
                  className={cn(
                    "cursor-pointer hover:bg-gray-100 px-2 py-1 rounded",
                    todo.completed && "line-through text-gray-500"
                  )}
                >
                  {todo.text}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground">
                {format(new Date(todo.createdAt), 'MMM d, h:mm a')}
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTodo(todo.id)}
                className="text-destructive hover:text-destructive/90"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
        {todos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No tasks yet. Add one above!
          </div>
        )}
      </ul>
    </div>
  );
}
