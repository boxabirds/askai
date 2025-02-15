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
interface ActionResponse {
  message: string;
  error?: string;
  toolInfo?: {
    tool: string;
    parameters: any;
  };
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

export const AskAIButton: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [optimisticResponse, addOptimisticResponse] = useOptimistic<ActionResponse | null>(null);

  const {
    askAI,
    isLoading,
    response,
    error: askError
  } = useAskAI();

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
      console.log('AI Response:', aiResponse); // Debug log

      startTransition(() => {
        addOptimisticResponse({ 
          message: aiResponse.response,
          toolInfo: aiResponse.selectedTool ? {
            tool: aiResponse.selectedTool,
            parameters: aiResponse.parameters || {}
          } : undefined
        });
      });
    } catch (err) {
      console.error('Error in handleSubmit:', err); // Debug log
      startTransition(() => {
        addOptimisticResponse({ 
          message: '',
          error: err instanceof Error ? err.message : 'An error occurred'
        });
      });
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!isLoading) {
      setIsOpen(open);
      if (!open) {
        // Reset state when dialog closes
        startTransition(() => {
          addOptimisticResponse(null);
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
              placeholder="E.g., How do I create a new todo?"
              disabled={isLoading}
              autoFocus
            />
            <SubmitButton />
            <div className="mt-4">
              {optimisticResponse && (
                <div className="space-y-4">
                  <p className={optimisticResponse.error ? "text-red-500" : "text-gray-700"}>
                    {optimisticResponse.error || optimisticResponse.message}
                  </p>
                  {optimisticResponse.toolInfo && (
                    <div className="mt-2 p-4 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-900">Selected Tool: {optimisticResponse.toolInfo.tool}</p>
                      {optimisticResponse.toolInfo.parameters && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-900">Parameters:</p>
                          <pre className="mt-1 text-sm text-gray-500 overflow-auto">
                            {JSON.stringify(optimisticResponse.toolInfo.parameters, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-4 items-center mt-4">
                {response && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>Selected Tool: {response.selectedTool}</p>
                    {response.parameters && (
                      <>
                        <p className="mt-1">Parameters:</p>
                        <pre className="mt-1 bg-muted p-2 rounded">
                          {JSON.stringify(response.parameters, null, 2)}
                        </pre>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
