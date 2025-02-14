import type { FC, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFormStatus } from 'react-dom';
import { useOptimistic, startTransition, useState } from 'react';
import { useAskAI } from '@/hooks/useAskAI';

// Types
interface AskAIButtonProps {
  openApiSpec: string;
  apiBaseUrl: string;
}

interface ActionResponse {
  message: string;
  error?: string;
}

// Form status component using React 19's useFormStatus
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Thinking...' : 'Ask'}
    </Button>
  );
}

export const AskAIButton: FC<AskAIButtonProps> = ({ openApiSpec, apiBaseUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [optimisticResponse, addOptimisticResponse] = useOptimistic<ActionResponse | null>(null);

  const {
    askAI,
    isLoading,
    response,
    error: askError
  } = useAskAI({
    openApiSpec,
    apiBaseUrl
  });

  // React 19 form handler
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get('query') as string;
    
    if (!query.trim()) return;

    try {
      startTransition(() => {
        addOptimisticResponse({ message: 'Processing your request...' });
      });

      const aiResponse = await askAI(query);
      
      startTransition(() => {
        addOptimisticResponse({ 
          message: aiResponse.explanation,
        });
      });
    } catch (err) {
      startTransition(() => {
        addOptimisticResponse({ 
          message: '',
          error: err instanceof Error ? err.message : 'An error occurred'
        });
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">✨ Ask AI</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>What do you want to do?</DialogTitle>
          <DialogDescription>
            Ask anything about the API and I'll help you use it.
          </DialogDescription>
        </DialogHeader>
        <form 
          onSubmit={handleSubmit}
          className="mt-4"
        >
          <div className="flex flex-col gap-4">
            <input
              type="text"
              name="query"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              placeholder="E.g., How do I create a new user?"
              disabled={isLoading}
              autoFocus
            />
            <SubmitButton />
            {optimisticResponse?.error || askError ? (
              <p className="text-red-500 text-sm">{optimisticResponse?.error || askError}</p>
            ) : optimisticResponse?.message ? (
              <div className="mt-2 p-4 bg-muted rounded-md">
                <p className="text-sm text-foreground">{optimisticResponse.message}</p>
                {response && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>Endpoint: {response.endpoint}</p>
                    <p>Method: {response.method}</p>
                    {response.parameters && (
                      <pre className="mt-2 p-2 bg-background rounded">
                        {JSON.stringify(response.parameters, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
