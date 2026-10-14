import { AppError } from './errors.js';

/**
 * Shared validation utilities for Cloud Functions requests.
 */

export function assertRequiredString(value: unknown, fieldName: string, minLength = 1, maxLength = 1000): string {
  if (typeof value !== 'string' || value.trim().length < minLength) {
    throw new AppError('invalid-argument', `${fieldName} is required and must be at least ${minLength} characters.`, { field: fieldName });
  }
  if (value.length > maxLength) {
    throw new AppError('invalid-argument', `${fieldName} cannot exceed ${maxLength} characters.`, { field: fieldName });
  }
  return value.trim();
}

export function assertValidEmail(email: unknown, fieldName = 'email'): string {
  const str = assertRequiredString(email, fieldName, 5, 255);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(str)) {
    throw new AppError('invalid-argument', 'Please provide a valid email address.', { field: fieldName });
  }
  return str.toLowerCase();
}

export function assertValidPassword(password: unknown, minLength = 8): string {
  if (typeof password !== 'string' || password.length < minLength) {
    throw new AppError('invalid-argument', `Password must be at least ${minLength} characters long.`, { field: 'password' });
  }
  return password;
}

export function assertAuthenticated(auth: { uid?: string } | undefined | null): string {
  if (!auth?.uid) {
    throw new AppError('unauthenticated', 'You must be logged in to perform this action.');
  }
  return auth.uid;
}
