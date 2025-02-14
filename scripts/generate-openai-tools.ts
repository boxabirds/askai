import { file } from 'bun';
import yaml from 'yaml';
import { OpenAPIV3 } from 'openapi-types';

interface OpenAIFunctionParameter {
  type: string;
  description?: string;
  enum?: string[];
}

interface OpenAIFunction {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, OpenAIFunctionParameter>;
    required: string[];
  };
}

function convertParametersToOpenAI(
  parameters: OpenAPIV3.ParameterObject[] = [], 
  requestBody: OpenAPIV3.RequestBodyObject | null = null
): OpenAIFunction['parameters'] {
  const properties: Record<string, OpenAIFunctionParameter> = {};
  const required: string[] = [];

  // Handle path/query parameters
  for (const param of parameters) {
    if ('schema' in param) {
      const schema = param.schema as OpenAPIV3.SchemaObject;
      properties[param.name] = {
        type: schema.type as string,
        description: param.description || `${param.in} parameter: ${param.name}`
      };
      if (param.required) {
        required.push(param.name);
      }
    }
  }

  // Handle request body
  if (requestBody?.content?.['application/json']?.schema) {
    const bodySchema = requestBody.content['application/json'].schema as OpenAPIV3.SchemaObject;
    if (bodySchema.properties) {
      for (const [propName, propSchema] of Object.entries(bodySchema.properties)) {
        const schema = propSchema as OpenAPIV3.SchemaObject;
        if (propName === 'ids') {
          properties[propName] = {
            type: "string",
            description: "Specify either 'all' to affect all todos, or a comma-separated list of todo IDs (e.g., 'id1,id2,id3')"
          };
        } else if (propName === 'completed') {
          properties[propName] = {
            type: "boolean",
            description: "Whether to mark the todo(s) as completed (true) or not completed (false)"
          };
        } else if (propName === 'text') {
          properties[propName] = {
            type: "string",
            description: "The text content of the todo item"
          };
        } else {
          properties[propName] = {
            type: schema.type as string,
            description: schema.description || `Parameter: ${propName}`
          };
        }
      }
      if (bodySchema.required) {
        required.push(...bodySchema.required);
      }
    }
  }

  return {
    type: "object",
    properties,
    required
  };
}

function convertOperationToOpenAI(
  path: string, 
  method: string, 
  operation: OpenAPIV3.OperationObject
): OpenAIFunction {
  const name = operation.operationId || `${method}${path.replace(/\//g, '_').replace(/[{}]/g, '')}`;
  const description = operation.description || operation.summary || `${method.toUpperCase()} ${path}`;
  
  // Add more context to the description
  const fullDescription = `${description}
Endpoint: ${path}
Method: ${method.toUpperCase()}`;
  
  return {
    name,
    description: fullDescription,
    parameters: convertParametersToOpenAI(
      operation.parameters as OpenAPIV3.ParameterObject[],
      operation.requestBody as OpenAPIV3.RequestBodyObject
    )
  };
}

async function generateOpenAITools() {
  try {
    // Read OpenAPI spec
    const openApiText = await file('./src/api/openapi.yaml').text();
    const openApiSpec = yaml.parse(openApiText) as OpenAPIV3.Document;
    
    const tools: OpenAIFunction[] = [];

    // Convert each path and method to an OpenAI function
    for (const [path, pathItem] of Object.entries(openApiSpec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (operation && method !== 'parameters') {  // Skip path-level parameters
          tools.push(convertOperationToOpenAI(path, method, operation as OpenAPIV3.OperationObject));
        }
      }
    }

    // Write the tools JSON file
    const toolsJson = JSON.stringify({ tools }, null, 2);
    await Bun.write('./src/api/openai-tools.json', toolsJson);
    
    console.log('Successfully generated OpenAI tools JSON');
  } catch (error) {
    console.error('Error generating OpenAI tools:', error);
    process.exit(1);
  }
}

// Run the generator
generateOpenAITools();
