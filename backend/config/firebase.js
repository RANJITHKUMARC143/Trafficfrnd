// Firebase Admin SDK configuration
// This file should be used to initialize Firebase Admin SDK with proper credentials

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
function initializeFirebase() {
  try {
    // Option 1: Using service account key file (recommended for development)
    // const serviceAccount = require('./path/to/serviceAccountKey.json');
    // admin.initializeApp({
    //   credential: admin.credential.cert(serviceAccount),
    //   projectId: 'traffic-frnd'
    // });

    // Option 2: Using environment variables (recommended for production)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'traffic-frnd'
      });
    } else {
      // Option 3: Using application default credentials
      admin.initializeApp({
        projectId: 'traffic-frnd'
      });
    }

    console.log('Firebase Admin SDK initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    return false;
  }
}

module.exports = {
  initializeFirebase,
  admin
};
