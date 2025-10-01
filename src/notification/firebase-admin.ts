import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK once. Prefer credentials from env variables.
// Supported options:
// - FIREBASE_SERVICE_ACCOUNT: full JSON string of the service account
// - GOOGLE_APPLICATION_CREDENTIALS: path to a JSON key file
export function initializeFirebaseAdmin(): typeof admin {
  if (admin.apps.length > 0) return admin;

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  try {
    if (saJson) {
      const serviceAccount: admin.ServiceAccount = JSON.parse(
        saJson,
      ) as admin.ServiceAccount;
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      return admin;
    }

    if (keyPath) {
      // firebase-admin accepts a path string to the service account JSON
      admin.initializeApp({
        credential: admin.credential.cert(keyPath as any),
      });
      return admin;
    }

    // Fallback: default credentials if available in the environment
    admin.initializeApp();
    return admin;
  } catch {
    // As a last resort, initialize without explicit credentials
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    return admin;
  }
}
