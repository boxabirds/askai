import { file } from 'bun';
import yaml from 'yaml';

interface OpenAPIOperation {
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: any;
}

interface OpenAPIPathItem {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  patch?: OpenAPIOperation;
}

interface OpenAPISpec {
  paths: Record<string, OpenAPIPathItem>;
}

interface OpenAIFunctionParameter {
  type: string;
  description?: string;
  enum?: string[];
  items?: {
    type: string;
    [key: string]: any;
  };
  properties?: Record<string, OpenAIFunctionParameter>;
  required?: string[];
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

function convertParametersToOpenAI(parameters: any[] = [], requestBody: any = null): OpenAIFunction['parameters'] {
  const properties: Record<string, OpenAIFunctionParameter> = {};
  const required: string[] = [];

  // Handle path/query parameters
  for (const param of parameters) {
    properties[param.name] = {
      type: param.schema.type,
      description: param.description || `${param.in} parameter ${param.name}`
    };
    if (param.required) {
      required.push(param.name);
    }
  }

  // Handle request body
  if (requestBody?.content?.['application/json']?.schema) {
    const bodySchema = requestBody.content['application/json'].schema;
    if (bodySchema.properties) {
      for (const [propName, propSchema] of Object.entries(bodySchema.properties)) {
        properties[propName] = propSchema as OpenAIFunctionParameter;
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

function convertOperationToOpenAI(path: string, method: string, operation: OpenAPIOperation): OpenAIFunction {
  const name = operation.operationId || `${method}${path.replace(/\//g, '_').replace(/[{}]/g, '')}`;
  
  return {
    name,
    description: operation.summary || operation.description || `${method.toUpperCase()} ${path}`,
    parameters: convertParametersToOpenAI(operation.parameters, operation.requestBody)
  };
}

async function generateOpenAITools() {
  try {
    // Read OpenAPI spec
    const openApiText = await file('./src/api/openapi.yaml').text();
    const openApiSpec = yaml.parse(openApiText) as OpenAPISpec;
    
    const tools: OpenAIFunction[] = [];

    // Convert each path and method to an OpenAI function
    for (const [path, pathItem] of Object.entries(openApiSpec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (operation) {
          tools.push(convertOperationToOpenAI(path, method, operation));
        }
      }
    }

    // Write the tools JSON file
    const toolsJson = JSON.stringify({ tools }, null, 2);
    await Bun.write('./src/api/openapi-tools.json', toolsJson);
    
    console.log('Successfully generated OpenAI tools JSON');
  } catch (error) {
    console.error('Error generating OpenAI tools:', error);
    process.exit(1);
  }
}

// Run the generator
generateOpenAITools();
