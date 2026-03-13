const admin = require('firebase-admin');

// CRIT-1: Use env vars instead of serviceAccountKey.json file on disk.
// Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env
// FIREBASE_PRIVATE_KEY should be the raw private key string with literal \n (the replace call below handles it)
// Fall back to serviceAccountKey.json for local dev if env vars are not set
let credential;
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  });
} else {
  // Local dev fallback — serviceAccountKey.json must exist on disk
  const serviceAccount = require('../../serviceAccountKey.json');
  credential = admin.credential.cert(serviceAccount);
}

admin.initializeApp({ credential });

module.exports = admin;