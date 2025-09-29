# Firebase Push Notifications Setup for Delivery App

This guide explains how to set up Firebase push notifications for the delivery app.

## Overview

The delivery app now supports Firebase Cloud Messaging (FCM) for push notifications. The implementation includes:

- **Frontend**: React Native Firebase integration
- **Backend**: Firebase Admin SDK for sending notifications
- **Hybrid Support**: Both Firebase and Expo notifications (Firebase preferred)

## Prerequisites

1. Firebase project set up with Cloud Messaging enabled
2. `google-services.json` file in the delivery app directory
3. Firebase Admin SDK service account key

## Setup Instructions

### 1. Frontend Setup (Delivery App)

#### Install Dependencies
```bash
cd Delivery_app
npm install @react-native-firebase/app @react-native-firebase/messaging
```

#### Configuration Files
- `google-services.json` is already copied to the delivery app directory
- Firebase plugin is added to `app.json`

#### Key Files Added/Modified:
- `services/firebaseNotificationService.ts` - Main Firebase notification service
- `services/alertService.ts` - Updated to support FCM token registration
- `app/_layout.tsx` - Updated to initialize Firebase notifications
- `components/TestNotificationComponent.tsx` - Test component for notifications

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install firebase-admin
```

#### Configuration Files
- `config/firebase.js` - Firebase Admin SDK configuration
- `services/firebaseService.js` - Firebase notification service
- `services/pushService.js` - Updated to support both Firebase and Expo

#### Key Files Added/Modified:
- `models/DeliveryBoy.js` - Added `fcmToken` field
- `controllers/deliveryAlertController.js` - Added FCM token registration endpoint
- `routes/deliveryAlertRoutes.js` - Added FCM token route

### 3. Firebase Admin SDK Setup

#### Option 1: Service Account Key (Development)
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key
3. Save the JSON file as `serviceAccountKey.json` in the backend directory
4. Update `backend/config/firebase.js` to use the service account key

#### Option 2: Environment Variables (Production)
Set these environment variables:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
# OR
export FIREBASE_PROJECT_ID="traffic-frnd"
export FIREBASE_PRIVATE_KEY="your-private-key"
export FIREBASE_CLIENT_EMAIL="your-client-email"
```

## API Endpoints

### New Endpoints Added:
- `POST /api/delivery-alerts/register-fcm-token` - Register FCM token for delivery boy

### Request Body:
```json
{
  "fcmToken": "fcm-token-string"
}
```

## Testing

### 1. Frontend Testing
1. Run the delivery app: `npm run dev`
2. Navigate to the dashboard
3. Use the "Firebase Notifications" test section
4. Tap "Test FCM Token Registration" to register the token
5. Check console logs for FCM token

### 2. Backend Testing
1. Start the backend server
2. Check logs for Firebase Admin SDK initialization
3. Test the FCM token registration endpoint
4. Send test notifications using the existing test alert endpoint

### 3. Notification Flow
1. App requests notification permission
2. FCM token is generated and registered with backend
3. Backend stores FCM token in delivery boy profile
4. Notifications are sent via Firebase Admin SDK
5. App receives notifications (foreground/background)

## Features

### Notification Types Supported:
- **Order Updates**: New orders, status changes
- **Alerts**: System notifications, warnings
- **General**: Info messages

### Notification Handling:
- **Foreground**: Custom in-app notifications
- **Background**: System notifications
- **App Closed**: Notifications open the app

### Token Management:
- Automatic token refresh
- Fallback to Expo notifications if Firebase fails
- Token validation and error handling

## Troubleshooting

### Common Issues:

1. **Firebase Admin SDK not initialized**
   - Check service account key configuration
   - Verify environment variables
   - Check console logs for initialization errors

2. **FCM token not generated**
   - Verify `google-services.json` is in the correct location
   - Check notification permissions
   - Ensure Firebase plugin is configured in `app.json`

3. **Notifications not received**
   - Check FCM token registration
   - Verify backend is sending notifications
   - Check device notification settings

### Debug Steps:
1. Check console logs for Firebase initialization
2. Verify FCM token generation and registration
3. Test with Firebase Console notifications
4. Check backend logs for notification sending

## Migration from Expo Notifications

The system now supports both Firebase and Expo notifications:
- Firebase notifications are preferred and tried first
- Expo notifications are used as fallback
- Existing Expo tokens continue to work
- Gradual migration is supported

## Security Notes

- FCM tokens are stored securely in the database
- Service account keys should be kept secure
- Use environment variables in production
- Implement proper token validation

## Next Steps

1. Test the notification flow end-to-end
2. Configure Firebase Console for testing
3. Set up production Firebase project
4. Monitor notification delivery rates
5. Implement notification analytics
