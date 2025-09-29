#!/bin/bash

echo "🚀 Building Development Build for Delivery App with Firebase..."
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g @expo/eas-cli
fi

echo "📱 Building Android development build..."
eas build --platform android --profile development

echo ""
echo "✅ Build completed!"
echo ""
echo "📋 Next steps:"
echo "1. Download and install the generated APK on your device"
echo "2. Run: npx expo start --dev-client --tunnel --clear"
echo "3. Open the development build (not Expo Go) on your device"
echo "4. Test Firebase notifications in the app"
echo ""
echo "🔧 If you encounter issues:"
echo "- Make sure you're using the development build APK, not Expo Go"
echo "- Check that google-services.json is properly configured"
echo "- Verify Firebase project settings match your app package name"
