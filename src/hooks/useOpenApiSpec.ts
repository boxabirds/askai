import { useState, useEffect } from 'react';

export function useOpenApiSpec() {
  const [spec, setSpec] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadSpec() {
      try {
        const response = await fetch('/api/openapi.yaml');
        const text = await response.text();
        setSpec(text);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load OpenAPI spec'));
      }
    }
    loadSpec();
  }, []);

  return { spec, error };
}
