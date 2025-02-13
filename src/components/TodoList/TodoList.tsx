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

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {todos.map(todo => (
              <div
                key={todo.id}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                  todo.completed ? "bg-muted/50" : "bg-card"
                )}
              >
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => toggleTodo(todo.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm truncate",
                    todo.completed && "line-through text-muted-foreground"
                  )}>
                    {todo.text}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(todo.createdAt), 'MMM d, h:mm a')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTodo(todo.id)}
                  className="text-destructive hover:text-destructive/90"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {todos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No tasks yet. Add one above!
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
