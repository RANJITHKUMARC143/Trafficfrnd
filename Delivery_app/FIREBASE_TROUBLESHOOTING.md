# Firebase FCM Token Troubleshooting Guide

## 🚨 Common Error: "Firebase module not installed natively"

This error occurs when Firebase messaging is not properly integrated into the native Android app.

## ✅ Solutions

### 1. **Use Development Build (NOT Expo Go)**
Firebase messaging does NOT work in Expo Go. You must use a development build.

```bash
# Build development APK
eas build --platform android --profile development

# Start development server
npx expo start --dev-client --tunnel --clear
```

### 2. **Verify Firebase Configuration**

#### Check `google-services.json`:
- File exists in `Delivery_app/google-services.json`
- Contains correct package name: `com.nanu01.delivery`
- Contains valid Firebase project configuration

#### Check `app.json`:
```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app",
      [
        "@react-native-firebase/messaging",
        {
          "android": {
            "googleServicesFile": "./google-services.json"
          }
        }
      ]
    ],
    "android": {
      "package": "com.nanu01.delivery",
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

### 3. **Debug Steps**

#### Step 1: Check App Environment
In the app, look at the debug information:
- **Platform**: Should be `android`
- **App Ownership**: Should be `store` (not `expo`)
- **Expo Go**: Should be `No`
- **Development Build**: Should be `Yes`
- **Firebase Available**: Should be `true`

#### Step 2: Test Firebase Initialization
1. Tap "Initialize Firebase" button
2. Check console logs for Firebase initialization
3. Look for success/error messages

#### Step 3: Test FCM Token
1. Tap "Test FCM Token Registration" button
2. Check if token is retrieved successfully
3. Verify token is registered with backend

### 4. **Common Issues & Fixes**

#### Issue: "Firebase is not available"
**Cause**: Running in Expo Go or Firebase not properly installed
**Fix**: Use development build, not Expo Go

#### Issue: "Permission denied"
**Cause**: Notification permissions not granted
**Fix**: Grant notification permissions in device settings

#### Issue: "Failed to get FCM token"
**Cause**: Firebase not properly configured or app not rebuilt
**Fix**: Rebuild the app after Firebase configuration changes

#### Issue: "Network request failed"
**Cause**: Backend not running or API URL incorrect
**Fix**: Start backend server and check API configuration

### 5. **Verification Checklist**

- [ ] Using development build APK (not Expo Go)
- [ ] `google-services.json` exists and is correct
- [ ] Firebase packages installed: `@react-native-firebase/app`, `@react-native-firebase/messaging`
- [ ] App rebuilt after Firebase configuration
- [ ] Backend server running
- [ ] Notification permissions granted
- [ ] Device has internet connection

### 6. **Console Logs to Check**

Look for these logs in Metro console:
```
Firebase messaging loaded successfully
Initializing Firebase notification service...
Firebase available: true
Requesting Firebase notification permission...
Firebase notification permission granted: true
Getting FCM token...
FCM Token retrieved successfully: [token]...
FCM token registered with backend successfully
```

### 7. **If Still Not Working**

1. **Clear all caches**:
   ```bash
   npx expo start --dev-client --tunnel --clear
   ```

2. **Rebuild completely**:
   ```bash
   eas build --platform android --profile development --clear-cache
   ```

3. **Check Firebase Console**:
   - Verify app is registered in Firebase Console
   - Check that package name matches exactly
   - Verify `google-services.json` is from the correct project

4. **Test on different device**:
   - Try on a different Android device
   - Ensure device has Google Play Services

## 🎯 Expected Success Flow

1. **App starts** → Firebase initializes automatically
2. **User taps "Test FCM Token"** → Permission requested
3. **Permission granted** → FCM token retrieved
4. **Token registered** → Success message shown
5. **Backend receives token** → Ready for notifications

## 📞 Support

If issues persist:
1. Check Metro console logs for detailed error messages
2. Verify all configuration steps
3. Test with a fresh development build
4. Check Firebase Console for any configuration issues
