import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AskAIButton } from './components/AskAI/AskAIButton';

// Example OpenAPI spec
const testOpenApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Test API",
    version: "1.0.0"
  },
  paths: {
    "/users": {
      get: {
        summary: "Get all users",
        responses: {
          "200": {
            description: "List of users",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      email: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "Create a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" }
                },
                required: ["name", "email"]
              }
            }
          }
        },
        responses: {
          "201": {
            description: "User created successfully"
          }
        }
      }
    }
  }
};

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8">AskAI Component Demo</h1>
        <div className="max-w-2xl mx-auto">
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Test API Integration</h2>
            <p className="text-muted-foreground mb-6">
              This demo shows how the AskAI component can help users interact with an API using natural language.
              Try asking questions like "How do I create a new user?" or "How can I get all users?"
            </p>
            <ErrorBoundary
              fallback={
                <div className="text-destructive p-4 rounded-md bg-destructive/10">
                  Something went wrong. Please try again.
                </div>
              }
              onError={(error) => {
                console.error('Error in AskAI component:', error);
              }}
            >
              <Suspense 
                fallback={
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                }
              >
                <AskAIButton 
                  openApiSpec={testOpenApiSpec}
                  apiBaseUrl="http://localhost:3000"
                  geminiApiKey={import.meta.env.VITE_GEMINI_API_KEY || ''}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
