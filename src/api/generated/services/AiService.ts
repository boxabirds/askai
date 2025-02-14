/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AskAiRequest } from '../models/AskAiRequest';
import type { AskAiResponse } from '../models/AskAiResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AiService {
    /**
     * Ask AI about the API
     * @param requestBody
     * @returns AskAiResponse AI response
     * @throws ApiError
     */
    public static askAi(
        requestBody: AskAiRequest,
    ): CancelablePromise<AskAiResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ask',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
