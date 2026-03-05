<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

trait ApiResponse
{
    /**
     * Return a successful JSON response.
     *
     * @param string|null $message
     * @param array $data
     * @param int $statusCode
     * @return \Illuminate\Http\JsonResponse
     */
    protected function success(string $message = 'Success', array $data = [], int $statusCode = 200): JsonResponse
    {
        return Response::json([
            'status' => 'success',
            'message' => $message,
            'data' => $data,
            'error' => null,
        ], $statusCode);
    }

    /**
     * Return an error JSON response.
     *
     * @param string $message
     * @param array|null $errors
     * @param int $statusCode
     * @return \Illuminate\Http\JsonResponse
     */
    protected function error(string $message = 'Error', ?array $errors = null, int $statusCode = 400): JsonResponse
    {
        return Response::json([
            'status' => 'error',
            'message' => $message,
            'data' => null,
            'errors' => $errors,
        ], $statusCode);
    }

    /**
     * Return a JSON response for validation errors.
     *
     * @param array $errors
     * @param string $message
     * @return \Illuminate\Http\JsonResponse
     */
    protected function validationError(array $errors, string $message = 'Validation failed'): JsonResponse
    {
        return $this->error($message, $errors, 422);
    }

    /**
     * Return a JSON response for unauthorized access.
     *
     * @param string $message
     * @return \Illuminate\Http\JsonResponse
     */
    protected function unauthorized(string $message = 'Unauthorized'): JsonResponse
    {
        return $this->error($message, null, 401);
    }

    /**
     * Return a JSON response for not found errors.
     *
     * @param string $message
     * @return \Illuminate\Http\JsonResponse
     */
    protected function notFound(string $message = 'Resource not found'): JsonResponse
    {
        return $this->error($message, null, 404);
    }

    /**
     * Return a JSON response for a resource created successfully.
     *
     * @param string $message
     * @param array $data
     * @return \Illuminate\Http\JsonResponse
     */
    protected function created(string $message = 'Resource created', array $data = []): JsonResponse
    {
        return $this->success($message, $data, 201);
    }

    /**
     * Return a JSON response for a resource updated successfully.
     *
     * @param string $message
     * @param array $data
     * @return \Illuminate\Http\JsonResponse
     */
    protected function updated(string $message = 'Resource updated', array $data = []): JsonResponse
    {
        return $this->success($message, $data, 200);
    }

    /**
     * Return a JSON response for a resource deleted successfully.
     *
     * @param string $message
     * @return \Illuminate\Http\JsonResponse
     */
    protected function deleted(string $message = 'Resource deleted'): JsonResponse
    {
        return $this->success($message, [], 204);
    }
}
