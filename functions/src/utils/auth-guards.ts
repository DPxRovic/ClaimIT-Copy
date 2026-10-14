import { AppError } from './errors.js';

export interface DecodedAuthToken {
  role?: string;
  status?: string;
  email?: string;
  [key: string]: unknown;
}

export interface AuthContext {
  uid: string;
  token?: DecodedAuthToken;
}

/**
 * Ensures caller is authenticated with Firebase Authentication.
 * Returns the non-empty caller UID.
 */
export function assertAuthenticated(auth: { uid?: string; token?: unknown } | undefined | null): AuthContext {
  if (!auth?.uid) {
    throw new AppError('unauthenticated', 'You must be logged in to perform this operation.');
  }
  return {
    uid: auth.uid,
    token: (auth.token as DecodedAuthToken) || {},
  };
}

/**
 * Ensures caller has the 'admin' role in custom claims.
 * Missing, malformed, or student/faculty roles are strictly rejected.
 */
export function assertAdmin(auth: { uid?: string; token?: unknown } | undefined | null): AuthContext {
  const context = assertAuthenticated(auth);
  const role = (context.token?.role || '').toLowerCase();
  if (role !== 'admin') {
    throw new AppError('permission-denied', 'Administrative privileges are required for this operation.');
  }
  return context;
}

/**
 * Ensures caller is an active user (status === 'active').
 * Users who are suspended or pending approval are rejected.
 */
export function assertActiveUser(auth: { uid?: string; token?: unknown } | undefined | null): AuthContext {
  const context = assertAuthenticated(auth);
  const status = (context.token?.status || '').toLowerCase();
  if (status !== 'active') {
    throw new AppError('permission-denied', 'Account is not in active status. Action not permitted.');
  }
  return context;
}

/**
 * Ensures caller either owns the specified resource or is an administrator.
 */
export function assertOwnerOrAdmin(
  auth: { uid?: string; token?: unknown } | undefined | null,
  resourceOwnerUid: string
): AuthContext {
  const context = assertAuthenticated(auth);
  const role = (context.token?.role || '').toLowerCase();
  if (context.uid !== resourceOwnerUid && role !== 'admin') {
    throw new AppError('permission-denied', 'You are not authorized to modify this resource.');
  }
  return context;
}

/**
 * Validates that an object contains only allowed keys to prevent prototype poisoning or unexpected fields.
 */
export function assertAllowedKeys<T extends Record<string, unknown>>(
  payload: T,
  allowedKeys: string[],
  contextName = 'Request'
): void {
  if (!payload || typeof payload !== 'object') {
    throw new AppError('invalid-argument', `${contextName} payload must be an object.`);
  }
  const unexpected = Object.keys(payload).filter((key) => !allowedKeys.includes(key));
  if (unexpected.length > 0) {
    throw new AppError(
      'invalid-argument',
      `${contextName} contains unexpected field(s): ${unexpected.join(', ')}`,
      { unexpectedFields: unexpected }
    );
  }
}
