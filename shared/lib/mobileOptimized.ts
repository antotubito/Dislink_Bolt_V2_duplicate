// 🚀 MOBILE-OPTIMIZED UTILITIES FOR DISLINK
// Production-ready mobile enhancements for iOS and Android

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation, Position } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';
import { Device, DeviceInfo } from '@capacitor/device';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Toast } from '@capacitor/toast';
import { logger } from './logger';

export interface MobileCapabilities {
  isNative: boolean;
  platform: 'ios' | 'android' | 'web';
  hasCamera: boolean;
  hasGeolocation: boolean;
  hasPushNotifications: boolean;
  hasHaptics: boolean;
  isOnline: boolean;
}

/**
 * Detect mobile platform capabilities
 */
export async function getMobileCapabilities(): Promise<MobileCapabilities> {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
  
  // Check network status
  const networkStatus = await Network.getStatus();
  
  return {
    isNative,
    platform,
    hasCamera: isNative,
    hasGeolocation: true, // Available on all platforms
    hasPushNotifications: isNative,
    hasHaptics: isNative,
    isOnline: networkStatus.connected
  };
}

/**
 * Enhanced camera functionality for QR scanning and profile photos
 */
export class MobileCamera {
  static async takeProfilePhoto(): Promise<string | null> {
    try {
      const capabilities = await getMobileCapabilities();
      
      if (!capabilities.hasCamera) {
        logger.warn('Camera not available on this platform');
        return null;
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // Let user choose camera or gallery
        width: 512,
        height: 512,
        correctOrientation: true
      });

      return image.dataUrl || null;
    } catch (error) {
      logger.error('Error taking profile photo:', error);
      return null;
    }
  }

  static async scanQRCode(): Promise<string | null> {
    try {
      // For web platforms, we'll use the existing QR scanner
      // For native, we can use a dedicated QR scanning plugin
      const capabilities = await getMobileCapabilities();
      
      if (capabilities.platform === 'web') {
        // Use existing web QR scanner
        return null; // Will be handled by existing QR scanner component
      }

      // Native QR scanning would be implemented here
      // For now, fallback to web scanner
      return null;
    } catch (error) {
      logger.error('Error scanning QR code:', error);
      return null;
    }
  }
}

/**
 * Enhanced geolocation for QR scan tracking
 */
export class MobileGeolocation {
  static async getCurrentPosition(): Promise<Position | null> {
    try {
      // Request permissions first
      const permissions = await Geolocation.requestPermissions();
      
      if (permissions.location !== 'granted') {
        logger.warn('Geolocation permission denied');
        return null;
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });

      return position;
    } catch (error) {
      logger.error('Error getting current position:', error);
      return null;
    }
  }

  static async watchPosition(callback: (position: Position) => void): Promise<string | null> {
    try {
      const watchId = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000
      }, callback);

      return watchId;
    } catch (error) {
      logger.error('Error watching position:', error);
      return null;
    }
  }

  static async clearWatch(watchId: string): Promise<void> {
    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch (error) {
      logger.error('Error clearing position watch:', error);
    }
  }
}

/**
 * Push notifications for mobile apps
 */
export class MobilePushNotifications {
  static async initialize(): Promise<boolean> {
    try {
      const capabilities = await getMobileCapabilities();
      
      if (!capabilities.hasPushNotifications) {
        logger.info('Push notifications not available on this platform');
        return false;
      }

      // Request permission
      const permStatus = await PushNotifications.requestPermissions();
      
      if (permStatus.receive === 'granted') {
        // Register for push notifications
        await PushNotifications.register();
        
        // Add listeners
        PushNotifications.addListener('registration', (token) => {
          logger.info('Push registration success, token:', token.value);
          // Send token to your server
        });

        PushNotifications.addListener('registrationError', (error) => {
          logger.error('Push registration error:', error);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          logger.info('Push notification received:', notification);
          // Handle notification
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          logger.info('Push notification action performed:', notification);
          // Handle notification action
        });

        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error initializing push notifications:', error);
      return false;
    }
  }

  static async sendLocalNotification(title: string, body: string): Promise<void> {
    try {
      // For local notifications, we'd use the LocalNotifications plugin
      // This is a placeholder for the implementation
      logger.info('Local notification:', { title, body });
    } catch (error) {
      logger.error('Error sending local notification:', error);
    }
  }
}

/**
 * Device information and network status
 */
export class MobileDevice {
  static async getDeviceInfo(): Promise<DeviceInfo> {
    return await Device.getInfo();
  }

  static async getNetworkStatus(): Promise<ConnectionStatus> {
    return await Network.getStatus();
  }

  static addNetworkListener(callback: (status: ConnectionStatus) => void): void {
    Network.addListener('networkStatusChange', callback);
  }

  static async getBatteryInfo(): Promise<any> {
    try {
      const info = await Device.getBatteryInfo();
      return info;
    } catch (error) {
      logger.error('Error getting battery info:', error);
      return null;
    }
  }
}

/**
 * Native sharing functionality
 */
export class MobileShare {
  static async shareProfile(profileUrl: string, userName: string): Promise<boolean> {
    try {
      await Share.share({
        title: `Connect with ${userName} on Dislink`,
        text: `Check out ${userName}'s professional profile on Dislink`,
        url: profileUrl,
        dialogTitle: 'Share Profile'
      });
      return true;
    } catch (error) {
      logger.error('Error sharing profile:', error);
      return false;
    }
  }

  static async shareQRCode(qrCodeData: string, userName: string): Promise<boolean> {
    try {
      await Share.share({
        title: `Connect with ${userName}`,
        text: 'Scan this QR code to connect with me on Dislink',
        url: qrCodeData,
        dialogTitle: 'Share QR Code'
      });
      return true;
    } catch (error) {
      logger.error('Error sharing QR code:', error);
      return false;
    }
  }
}

/**
 * Haptic feedback for better UX
 */
export class MobileHaptics {
  static async impact(style: ImpactStyle = ImpactStyle.Medium): Promise<void> {
    try {
      const capabilities = await getMobileCapabilities();
      if (capabilities.hasHaptics) {
        await Haptics.impact({ style });
      }
    } catch (error) {
      logger.error('Error with haptic feedback:', error);
    }
  }

  static async notification(type: 'SUCCESS' | 'WARNING' | 'ERROR' = 'SUCCESS'): Promise<void> {
    try {
      const capabilities = await getMobileCapabilities();
      if (capabilities.hasHaptics) {
        await Haptics.notification({ type });
      }
    } catch (error) {
      logger.error('Error with haptic notification:', error);
    }
  }

  static async vibrate(duration: number = 300): Promise<void> {
    try {
      const capabilities = await getMobileCapabilities();
      if (capabilities.hasHaptics) {
        await Haptics.vibrate({ duration });
      }
    } catch (error) {
      logger.error('Error with vibration:', error);
    }
  }
}

/**
 * Status bar management
 */
export class MobileStatusBar {
  static async setStyle(style: Style): Promise<void> {
    try {
      const capabilities = await getMobileCapabilities();
      if (capabilities.isNative) {
        await StatusBar.setStyle({ style });
      }
    } catch (error) {
      logger.error('Error setting status bar style:', error);
    }
  }

  static async setBackgroundColor(color: string): Promise<void> {
    try {
      const capabilities = await getMobileCapabilities();
      if (capabilities.isNative) {
        await StatusBar.setBackgroundColor({ color });
      }
    } catch (error) {
      logger.error('Error setting status bar color:', error);
    }
  }

  static async hide(): Promise<void> {
    try {
      const capabilities = await getMobileCapabilities();
      if (capabilities.isNative) {
        await StatusBar.hide();
      }
    } catch (error) {
      logger.error('Error hiding status bar:', error);
    }
  }

  static async show(): Promise<void> {
    try {
      const capabilities = await getMobileCapabilities();
      if (capabilities.isNative) {
        await StatusBar.show();
      }
    } catch (error) {
      logger.error('Error showing status bar:', error);
    }
  }
}

/**
 * Toast notifications for mobile
 */
export class MobileToast {
  static async show(text: string, duration: 'short' | 'long' = 'short'): Promise<void> {
    try {
      await Toast.show({
        text,
        duration: duration === 'short' ? 'short' : 'long',
        position: 'bottom'
      });
    } catch (error) {
      logger.error('Error showing toast:', error);
    }
  }
}

/**
 * Offline data management
 */
export class MobileOffline {
  static async cacheData(key: string, data: any): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(`dislink_cache_${key}`, JSON.stringify({
          data,
          timestamp: Date.now(),
          expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }));
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error caching data:', error);
      return false;
    }
  }

  static async getCachedData(key: string): Promise<any> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = window.localStorage.getItem(`dislink_cache_${key}`);
        if (cached) {
          const { data, expires } = JSON.parse(cached);
          if (Date.now() < expires) {
            return data;
          } else {
            // Remove expired cache
            window.localStorage.removeItem(`dislink_cache_${key}`);
          }
        }
      }
      return null;
    } catch (error) {
      logger.error('Error getting cached data:', error);
      return null;
    }
  }

  static async clearCache(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(window.localStorage);
        keys.forEach(key => {
          if (key.startsWith('dislink_cache_')) {
            window.localStorage.removeItem(key);
          }
        });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error clearing cache:', error);
      return false;
    }
  }
}

// Classes are already exported individually above

// Initialize mobile features when imported
export async function initializeMobileFeatures(): Promise<void> {
  try {
    const capabilities = await getMobileCapabilities();
    logger.info('Mobile capabilities detected:', capabilities);

    if (capabilities.isNative) {
      // Initialize native features
      await MobilePushNotifications.initialize();
      await MobileStatusBar.setStyle(Style.Dark);
      await MobileStatusBar.setBackgroundColor('#4F46E5');
      
      logger.info('Mobile features initialized successfully');
    }
  } catch (error) {
    logger.error('Error initializing mobile features:', error);
  }
}
