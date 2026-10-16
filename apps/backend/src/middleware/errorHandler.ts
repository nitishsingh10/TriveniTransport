import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const isProd = process.env.NODE_ENV === 'production';
  const statusCode = typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : 500;

  // Log full error on server
  console.error(`❌ [${req.method} ${req.originalUrl}] Error ${statusCode}:`, err);

  // Safe sanitized message for client
  const defaultInternalMessage = 'An unexpected error occurred. Please try again later.';
  const message = isProd && statusCode === 500
    ? defaultInternalMessage
    : (err.message || defaultInternalMessage);

  res.status(statusCode).json({
    error: {
      code: err.code || (statusCode === 500 ? 'INTERNAL_ERROR' : 'ERROR'),
      message,
      ...(isProd ? {} : { details: err.details, stack: err.stack }),
    },
  });
}
