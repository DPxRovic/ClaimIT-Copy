import { onCall, CallableRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { adminApp } from './config/firebase.js';

// Configure regional defaults and execution limits
setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
  timeoutSeconds: 60,
});

/**
 * Health check endpoint to verify Cloud Functions 2nd Gen runtime
 * and Firebase Admin SDK initialization.
 */
export const healthCheck = onCall(async (_request: CallableRequest) => {
  return {
    status: 'ok',
    service: 'claimit-backend',
    version: '2nd-gen',
    appName: adminApp.name,
    timestamp: new Date().toISOString(),
  };
});

// Authentication and user lifecycle functions
export { registerUser } from './modules/auth.js';
export { manageAccountStatus, setAdminRole } from './modules/admin.js';

// Report lifecycle functions
export { createReport, updateReport, closeReport, deleteReport } from './modules/reports.js';

// Claims and ownership verification functions
export { submitClaim, reviewClaim, withdrawClaim } from './modules/claims.js';

