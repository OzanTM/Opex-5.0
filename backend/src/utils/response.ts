import { Response } from 'express';
import { IApiResponse } from '../types';

/**
 * Send success response
 */
export const sendSuccess = <T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
): Response => {
    const response: IApiResponse<T> = {
        success: true,
        message,
        data,
    };
    return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
    res: Response,
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: unknown
): Response => {
    const response: IApiResponse<never> = {
        success: false,
        message,
        error: {
            code,
            message,
            details,
        },
    };
    return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 */
export const sendPaginated = <T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Success'
): Response => {
    const totalPages = Math.ceil(total / limit);
    const response: IApiResponse<{
        data: T[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }> = {
        success: true,
        message,
        data: {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
        },
    };
    return res.status(200).json(response);
};

/**
 * Send created response
 */
export const sendCreated = <T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully'
): Response => {
    return sendSuccess(res, data, message, 201);
};

/**
 * Send no content response
 */
export const sendNoContent = (res: Response): Response => {
    return res.status(204).send();
};

/**
 * Send bad request error
 */
export const sendBadRequest = (
    res: Response,
    message: string = 'Bad request',
    details?: unknown
): Response => {
    return sendError(res, message, 400, 'BAD_REQUEST', details);
};

/**
 * Send unauthorized error
 */
export const sendUnauthorized = (
    res: Response,
    message: string = 'Unauthorized'
): Response => {
    return sendError(res, message, 401, 'UNAUTHORIZED');
};

/**
 * Send forbidden error
 */
export const sendForbidden = (
    res: Response,
    message: string = 'Forbidden'
): Response => {
    return sendError(res, message, 403, 'FORBIDDEN');
};

/**
 * Send not found error
 */
export const sendNotFound = (
    res: Response,
    message: string = 'Resource not found'
): Response => {
    return sendError(res, message, 404, 'NOT_FOUND');
};

/**
 * Send conflict error
 */
export const sendConflict = (
    res: Response,
    message: string = 'Conflict'
): Response => {
    return sendError(res, message, 409, 'CONFLICT');
};

/**
 * Send validation error
 */
export const sendValidationError = (
    res: Response,
    message: string = 'Validation error',
    details?: unknown
): Response => {
    return sendError(res, message, 422, 'VALIDATION_ERROR', details);
};

/**
 * Send too many requests error
 */
export const sendTooManyRequests = (
    res: Response,
    message: string = 'Too many requests'
): Response => {
    return sendError(res, message, 429, 'TOO_MANY_REQUESTS');
};

/**
 * Send internal server error
 */
export const sendInternalError = (
    res: Response,
    message: string = 'Internal server error',
    details?: unknown
): Response => {
    return sendError(res, message, 500, 'INTERNAL_ERROR', details);
};