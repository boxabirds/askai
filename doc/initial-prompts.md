Create a drop-in react ui component — maybe shadcdn — that allows web app developers easily turn any openapi apis into a chatbot that can execute against the API. 
1. The component is an “✨Ask AI” button that when selected brings up a floating panel with a prompt saying “What do you want to do?”. 
2. User enters plain text and it calls one of the OpenAPI endpoints for relaying a call to Google Gemini with the query loaded up with a mapping of tool definitions to OpenAPI API calls and a response that includes possible tool invocations and then calls those APIs with provided parameters. 
3. It should use custom hooks to make testability easier, and 
4. a test page and test relay server. 
5. use bun for build management. 
6. use react 19 for the UI.
