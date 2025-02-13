# AskAI OpenAPI Component

A React component that allows developers to easily add AI-powered natural language interactions with their OpenAPI-documented APIs. Built with React 19, shadcn/ui, and Google's Gemini AI.

## Features

- 🤖 Natural language processing of API requests using Google's Gemini AI
- ✨ Beautiful and accessible UI using shadcn/ui components
- 🚀 Built with React 19's latest features
- 📝 Full TypeScript support
- 🔄 Optimistic updates for better UX
- ⚡ Powered by Vite for fast development
- 🎯 Drop-in component for any React application

## Installation

```bash
# Install dependencies
bun install

# Start the development server
bun run dev

# In another terminal, start the API server
bun run server
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Usage

```tsx
import { AskAIButton } from './components/AskAI/AskAIButton';

// Your OpenAPI specification
const openApiSpec = {
  // ... your OpenAPI spec
};

function App() {
  return (
    <AskAIButton 
      openApiSpec={openApiSpec}
      apiBaseUrl="http://your-api-base-url"
      geminiApiKey={import.meta.env.VITE_GEMINI_API_KEY}
    />
  );
}
```

## Development

This project uses:
- React 19 for the UI
- shadcn/ui for components
- Vite for building
- TypeScript for type safety
- Tailwind CSS for styling
- Google's Gemini AI for natural language processing

## License

MIT
