import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dislink.app',
  appName: 'Dislink',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Allow connections to localhost for development
    allowNavigation: [
      'https://dislinkboltv2duplicate.netlify.app',
      'https://bbonxxvifycwpoeaxsor.supabase.co',
      'http://localhost:*'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#4F46E5',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'large',
      spinnerColor: '#FFFFFF',
      splashFullScreen: true,
      splashImmersive: true
    },
    Camera: {
      permissions: ['camera', 'photos'],
      iosUseDefaultQualitySettings: true,
      androidUseDefaultQualitySettings: true
    },
    Geolocation: {
      permissions: ['location'],
      enableHighAccuracy: true,
      maximumAge: 60000,
      timeout: 10000
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
      enableAutoRegister: true
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#4F46E5',
      sound: 'default'
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#4F46E5'
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true
    },
    App: {
      launchUrl: 'https://dislinkboltv2duplicate.netlify.app'
    },
    Device: {},
    Network: {},
    Share: {
      subject: 'Dislink - Professional Connections',
      dialogTitle: 'Share with'
    },
    Toast: {},
    Haptics: {},
    Clipboard: {},
    Browser: {
      presentationStyle: 'popover'
    }
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    backgroundColor: '#4F46E5',
    scheme: 'Dislink'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Set to true for debugging
    appendUserAgent: 'Dislink-Mobile-App',
    backgroundColor: '#4F46E5',
    overrideUserAgent: 'Mozilla/5.0 (Mobile; Dislink App) AppleWebKit/537.36',
    buildOptions: {
      keystorePath: undefined, // Set in CI/CD
      keystorePassword: undefined, // Set in CI/CD
      keystoreAlias: undefined, // Set in CI/CD
      keystoreAliasPassword: undefined, // Set in CI/CD
      releaseType: 'APK', // or 'AAB' for Play Store
      signingType: 'apksigner'
    }
  }
};

export default config;
