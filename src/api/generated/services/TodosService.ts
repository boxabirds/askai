/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Todo } from '../models/Todo';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TodosService {
    /**
     * List all todos
     * @returns Todo List of todos
     * @throws ApiError
     */
    public static listTodos(): CancelablePromise<Array<Todo>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/todos',
        });
    }
    /**
     * Create a new todo
     * @param requestBody
     * @returns Todo Created todo
     * @throws ApiError
     */
    public static createTodo(
        requestBody: {
            text: string;
        },
    ): CancelablePromise<Todo> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/todos',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete a todo
     * @param id
     * @returns any Todo deleted successfully
     * @throws ApiError
     */
    public static deleteTodo(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/todos/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Todo not found`,
            },
        });
    }
    /**
     * Update a todo
     * @param id
     * @param requestBody
     * @returns Todo Todo updated successfully
     * @throws ApiError
     */
    public static updateTodo(
        id: string,
        requestBody: {
            text?: string;
            completed?: boolean;
        },
    ): CancelablePromise<Todo> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/todos/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Todo not found`,
            },
        });
    }
    /**
     * Delete multiple todos
     * @param requestBody
     * @returns any Todos deleted successfully
     * @throws ApiError
     */
    public static deleteTodos(
        requestBody: {
            ids: (Array<string> | 'all');
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/todos/batch/delete',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Mark multiple todos as complete
     * @param requestBody
     * @returns Todo Todos updated successfully
     * @throws ApiError
     */
    public static completeTodos(
        requestBody: {
            ids: (Array<string> | 'all');
            completed: boolean;
        },
    ): CancelablePromise<Array<Todo>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/todos/batch/complete',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
