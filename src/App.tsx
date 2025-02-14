import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { TodoList } from './components/TodoList/TodoList';
import { AskAIButton } from './components/AskAI/AskAIButton';
import { useOpenApiSpec } from './hooks/useOpenApiSpec';

function App() {
  const { spec: openApiSpec, error: specError } = useOpenApiSpec();

  if (specError) {
    console.error('Failed to load OpenAPI spec:', specError);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8 relative">
          <div className="absolute right-0 top-0">
            {openApiSpec && (
              <AskAIButton 
                openApiSpec={openApiSpec} 
                apiBaseUrl="http://localhost:3000" 
              />
            )}
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground mt-2">
              Keep track of your tasks and get things done.
            </p>
          </div>
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
