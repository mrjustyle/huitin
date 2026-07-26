import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vn.huitin.app',
  appName: 'Hụi Tín – Sổ Hụi',
  webDir: 'out',
  server: {
    url: 'http://192.168.110.98:3000',
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
