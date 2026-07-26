#!/bin/bash
# Build script for Capacitor mobile apps
# Usage: ./scripts/mobile-build.sh [ios|android] [dev|prod]

set -e

PLATFORM=${1:-"ios"}
MODE=${2:-"dev"}

echo "📱 Building Hụi Tín for $PLATFORM ($MODE)..."

# For Capacitor with a server-rendered Next.js app,
# we use the "live reload" approach — the native app
# loads the web app from a URL (deployed or local).
#
# For production: the app points to https://sohuitin.com
# For development: the app points to http://localhost:3000

if [ "$MODE" == "prod" ]; then
  echo "🌐 Production mode → app will load from https://sohuitin.com"
  
  # Update capacitor.config.ts to use production URL
  cat > capacitor.config.ts << 'EOF'
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vn.huitin.app',
  appName: 'Hụi Tín',
  webDir: 'out',
  server: {
    url: 'https://sohuitin.com',
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0D1B2A',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0D1B2A',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Hụi Tín',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0D1B2A',
  },
};

export default config;
EOF
  
elif [ "$MODE" == "dev" ]; then
  # Get local IP
  LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")
  echo "🔧 Dev mode → app will load from http://$LOCAL_IP:3000"
  
  cat > capacitor.config.ts << EOF
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vn.huitin.app',
  appName: 'Hụi Tín',
  webDir: 'out',
  server: {
    url: 'http://$LOCAL_IP:3000',
    cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      launchAutoHide: true,
      backgroundColor: '#0D1B2A',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0D1B2A',
    },
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0D1B2A',
  },
};

export default config;
EOF
fi

# Create a minimal static fallback in 'out/' for Capacitor
mkdir -p out
cat > out/index.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hụi Tín</title>
  <style>
    body { display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0D1B2A; color: white; font-family: sans-serif; }
    .loader { text-align: center; }
    .loader h1 { font-size: 2rem; margin-bottom: 1rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #16A085; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loader">
    <h1>💎 Hụi Tín</h1>
    <div class="spinner"></div>
    <p>Đang tải...</p>
  </div>
</body>
</html>
HTML

# Add/sync native platform
if [ "$PLATFORM" == "ios" ]; then
  echo "🍎 Syncing iOS..."
  npx cap add ios 2>/dev/null || true
  npx cap sync ios
  echo ""
  echo "✅ Done! Open Xcode to run:"
  echo "   npx cap open ios"
  
elif [ "$PLATFORM" == "android" ]; then
  echo "🤖 Syncing Android..."
  npx cap add android 2>/dev/null || true
  npx cap sync android
  echo ""
  echo "✅ Done! Open Android Studio to run:"
  echo "   npx cap open android"
fi

echo ""
echo "📝 Notes:"
echo "  - Make sure 'npm run dev' is running for dev mode"
echo "  - For production, deploy to sohuitin.com first"
