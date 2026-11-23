import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : 500;
  const isSafeClientError = statusCode >= 400 && statusCode < 500;

  // Log full error on server
  console.error(`❌ [${req.method} ${req.originalUrl}] Error ${statusCode}:`, err);

  // Safe sanitized message for client
  const defaultInternalMessage = 'An unexpected error occurred. Please try again later.';
  const message = isSafeClientError
    ? (err.message || 'The request could not be completed.')
    : defaultInternalMessage;

  res.status(statusCode).json({
    error: {
      code: isSafeClientError ? (err.code || 'ERROR') : 'INTERNAL_ERROR',
      message,
      ...(isSafeClientError && err.details ? { details: err.details } : {}),
    },
  });
}
