/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AskAiResponse = {
    /**
     * A clear explanation of what action was taken or why no action was possible
     */
    response: string;
    /**
     * Whether a valid tool was identified for the request
     */
    success: boolean;
    /**
     * The name of the selected tool (only present if success is true)
     */
    selectedTool?: string;
    /**
     * Parameters for the selected tool (only present if success is true)
     */
    parameters?: Record<string, any>;
};

