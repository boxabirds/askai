import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TodosService, Todo } from '@/api/generated';

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
      const data = await TodosService.listTodos();
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
      const todo = await TodosService.createTodo({ text: newTodo.trim() });
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

      const updatedTodo = await TodosService.updateTodo(id, { completed: !todo.completed });
      setTodos(prev =>
        prev.map(t => t.id === id ? updatedTodo : t)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await TodosService.deleteTodo(id);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    }
  };

  const updateTodoText = async (id: string, text: string) => {
    try {
      const updatedTodo = await TodosService.updateTodo(id, { text });
      setTodos(prev =>
        prev.map(t => t.id === id ? updatedTodo : t)
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <form onSubmit={addTodo} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo..."
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <Button type="submit">
          <PlusIcon className="h-4 w-4" />
          Add
        </Button>
      </form>

      <div className="space-y-2">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className={cn(
              "flex items-center gap-2 p-2 rounded hover:bg-gray-50",
              todo.completed && "text-gray-500"
            )}
          >
            <Checkbox
              checked={todo.completed}
              onCheckedChange={() => toggleTodo(todo.id)}
            />
            
            {editingId === todo.id ? (
              <input
                type="text"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={() => updateTodoText(todo.id, editingText)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateTodoText(todo.id, editingText);
                  } else if (e.key === 'Escape') {
                    setEditingId(null);
                  }
                }}
                className="flex-1 px-2 py-1 border rounded"
                autoFocus
              />
            ) : (
              <span
                className="flex-1 cursor-pointer"
                onDoubleClick={() => {
                  setEditingId(todo.id);
                  setEditingText(todo.text);
                }}
              >
                {todo.text}
              </span>
            )}
            
            <span className="text-sm text-gray-500">
              {format(new Date(todo.createdAt), 'MMM d, yyyy')}
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteTodo(todo.id)}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
