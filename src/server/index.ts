import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface OpenAPISpec {
  paths: Record<string, any>;
  components?: Record<string, any>;
}

interface AskRequest {
  query: string;
  openApiSpec: OpenAPISpec;
  geminiApiKey: string;
}

interface AIResponse {
  endpoint: string;
  method: string;
  parameters: Record<string, any>;
  explanation: string;
}

const app = new Elysia()
  .use(cors())
  .post('/api/ask', async ({ body }: { body: AskRequest }) => {
    const { query, openApiSpec, geminiApiKey } = body;
    
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
        Given this OpenAPI specification: ${JSON.stringify(openApiSpec)}
        And this user query: "${query}"
        Determine which API endpoint would best fulfill this request and provide the necessary parameters.
        Format your response as JSON with the following structure:
        {
          "endpoint": "/path/to/endpoint",
          "method": "GET/POST/etc",
          "parameters": {},
          "explanation": "A user-friendly explanation"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const aiResponse = JSON.parse(response) as AIResponse;
      
      return { 
        response: aiResponse.explanation,
        endpoint: aiResponse.endpoint,
        method: aiResponse.method,
        parameters: aiResponse.parameters
      };
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : 'An error occurred' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  })
  .listen(3000);

console.log(
  `🦊 Server is running at ${app.server?.hostname}:${app.server?.port}`
);
