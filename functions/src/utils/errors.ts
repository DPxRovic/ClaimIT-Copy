import { HttpsError, FunctionsErrorCode } from 'firebase-functions/v2/https';

export interface ErrorDetails {
  field?: string;
  reason?: string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Standard Application Error for Cloud Functions.
 * Enforces standardized error codes and user-facing messages.
 */
export class AppError extends HttpsError {
  public readonly timestamp: string;

  constructor(
    code: FunctionsErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    const timestamp = new Date().toISOString();
    super(code, message, { ...details, timestamp });
    this.timestamp = timestamp;
  }
}

/**
 * Normalizes any error thrown within a Cloud Function into a valid HttpsError.
 */
export function handleFunctionError(error: unknown): HttpsError {
  if (error instanceof HttpsError) {
    return error;
  }

  const message = error instanceof Error ? error.message : 'An unexpected internal error occurred.';
  return new HttpsError('internal', message, {
    timestamp: new Date().toISOString(),
  });
}
