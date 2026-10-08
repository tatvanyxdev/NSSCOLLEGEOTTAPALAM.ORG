import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';

/**
 * Returns true if running inside native Android/iOS Capacitor wrapper
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const getAppPlatform = (): string => {
  return Capacitor.getPlatform();
};

// Priority stack for custom back button handlers (modals, drawers, sub-views)
type BackHandler = () => boolean; // return true if handled, false to pass through
const backHandlerStack: BackHandler[] = [];

/**
 * Register a back-button handler (e.g. for modal or drawer).
 * When back is pressed, the most recently registered handler runs first.
 * Return cleanup function to deregister.
 */
export const registerBackHandler = (handler: BackHandler): (() => void) => {
  backHandlerStack.push(handler);
  return () => {
    const idx = backHandlerStack.indexOf(handler);
    if (idx !== -1) {
      backHandlerStack.splice(idx, 1);
    }
  };
};

let lastBackPressTime = 0;

/**
 * Configure native Android Status Bar according to theme
 */
export const updateNativeStatusBar = async (isDark: boolean) => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await StatusBar.setStyle({
      style: isDark ? Style.Dark : Style.Light,
    });
    await StatusBar.setBackgroundColor({
      color: isDark ? '#020617' : '#1e3a8a',
    });
  } catch (err) {
    console.debug('StatusBar configuration skipped:', err);
  }
};

/**
 * Hide native splash screen once DOM has mounted
 */
export const hideNativeSplashScreen = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await SplashScreen.hide({
      fadeOutDuration: 400,
    });
  } catch (err) {
    console.debug('SplashScreen hide skipped:', err);
  }
};

/**
 * Show a native toast-like hint if user is at root and presses back
 */
const showExitToast = () => {
  const existing = document.getElementById('native-exit-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'native-exit-toast';
  toast.innerText = 'Press back again to exit';
  toast.style.position = 'fixed';
  toast.style.bottom = '80px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = 'rgba(15, 23, 42, 0.9)';
  toast.style.color = '#ffffff';
  toast.style.padding = '8px 18px';
  toast.style.borderRadius = '20px';
  toast.style.fontSize = '12px';
  toast.style.fontWeight = '600';
  toast.style.zIndex = '99999';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  toast.style.pointerEvents = 'none';
  toast.style.transition = 'opacity 0.25s ease';
  toast.style.opacity = '0';

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 2000);
};

/**
 * Initialize native device capabilities (Back button, Keyboard, Splash, Lifecycle)
 */
export const initNativeAppBridge = (options?: { isDark?: boolean }) => {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  // 1. Splash & Status Bar
  hideNativeSplashScreen();
  if (options?.isDark !== undefined) {
    updateNativeStatusBar(options.isDark);
  }

  // 2. Android Hardware Back Button listener
  const backListenerPromise = CapacitorApp.addListener('backButton', () => {
    // Check custom handlers in LIFO order
    for (let i = backHandlerStack.length - 1; i >= 0; i--) {
      const handler = backHandlerStack[i];
      if (handler()) {
        return; // Handled by active modal or view
      }
    }

    // If window hash is not home, go back
    if (window.location.hash && window.location.hash !== '#' && window.location.hash !== '#home') {
      window.location.hash = '#home';
      return;
    }

    // At root: prompt double-tap to exit
    const now = Date.now();
    if (now - lastBackPressTime < 2000) {
      CapacitorApp.exitApp();
    } else {
      lastBackPressTime = now;
      showExitToast();
    }
  });

  // 3. Android Keyboard handling
  let keyboardShowListener: any;
  let keyboardHideListener: any;
  try {
    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-open');
    }).then(l => { keyboardShowListener = l; });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open');
    }).then(l => { keyboardHideListener = l; });
  } catch (e) {
    console.debug('Keyboard listener skipped:', e);
  }

  // Cleanup
  return () => {
    backListenerPromise.then(l => l.remove()).catch(() => {});
    if (keyboardShowListener) keyboardShowListener.remove();
    if (keyboardHideListener) keyboardHideListener.remove();
  };
};
