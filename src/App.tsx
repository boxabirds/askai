import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { TodoList } from './components/TodoList/TodoList';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-2">
            Keep track of your tasks and get things done.
          </p>
        </header>

        <ErrorBoundary
          fallback={
            <div className="text-destructive p-4 rounded-md bg-destructive/10">
              Something went wrong. Please try again.
            </div>
          }
          onError={(error) => {
            console.error('Error in TodoList:', error);
          }}
        >
          <Suspense 
            fallback={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }
          >
            <TodoList />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default App;
