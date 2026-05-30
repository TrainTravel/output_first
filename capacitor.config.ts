import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.traintravel.outputfirst',
  appName: 'OutputFirst',
  webDir: 'dist',
  ios: {
    // Default scheme; can stay 'App' for v1.
    scheme: 'App',
    // Lets the web view render under the notch / dynamic island so the app
    // doesn't feel "floating in the middle of the screen". Pair with the
    // safe-area inset CSS so chrome doesn't get clipped.
    contentInset: 'never',
  },
  plugins: {
    SplashScreen: {
      // Brief flash, then hand off to the React app. 800ms is enough to
      // mask the JS bundle cold-start without feeling laggy.
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: '#F6F1EA',
      androidScaleType: 'CENTER_CROP',
      iosSpinnerStyle: 'small',
      showSpinner: false,
    },
    StatusBar: {
      // Sage palette is light — use dark status-bar glyphs.
      style: 'LIGHT_CONTENT',
      backgroundColor: '#F6F1EA',
    },
    Keyboard: {
      // 'native' = web view resizes; textarea stays above the keyboard.
      // 'body' would shift the whole body which interacts badly with our
      // fixed bottom bars.
      resize: 'native',
      style: 'LIGHT',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
