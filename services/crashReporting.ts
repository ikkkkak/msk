/**
 * Crash reporting — remote storage disabled.
 * Errors are not sent to the server or stored locally.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

/** Set false to stop POST /api/crash-logs and SecureStore queue writes. */
const REMOTE_STORAGE_ENABLED = false;

let Device: any = null;
try {
  Device = require('expo-device');
} catch {
  Device = {
    modelName: Platform.OS === 'ios' ? 'iPhone' : 'Android Device',
  };
}

interface CrashLog {
  timestamp: string;
  error: string;
  stack?: string;
  componentStack?: string;
  context?: Record<string, any>;
  deviceInfo: {
    platform: string;
    osVersion: string;
    deviceModel?: string;
    appVersion: string;
  };
}

class CrashReportingService {
  private logs: CrashLog[] = [];
  private maxLogs = 100;

  logError(
    error: Error | string,
    context?: Record<string, any>,
    componentStack?: string,
  ): void {
    try {
      const errorMessage = typeof error === 'string' ? error : error.message;
      const errorStack = typeof error === 'string' ? undefined : error.stack;

      const crashLog: CrashLog = {
        timestamp: new Date().toISOString(),
        error: errorMessage,
        stack: errorStack,
        componentStack,
        context,
        deviceInfo: {
          platform: Platform.OS,
          osVersion: Platform.Version.toString(),
          deviceModel: Device.modelName || 'Unknown',
          appVersion: Constants.expoConfig?.version || 'Unknown',
        },
      };

      this.logs.push(crashLog);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }

      if (__DEV__) {
        console.error('[crashReporting]', errorMessage, context ?? '');
      }
    } catch (e) {
      if (__DEV__) {
        console.error('Failed to log error locally:', e);
      }
    }
  }

  async sendQueuedLogs(): Promise<void> {
    if (!REMOTE_STORAGE_ENABLED) {
      try {
        await SecureStore.deleteItemAsync('crash_logs_queue');
      } catch {
        // ignore
      }
      return;
    }
  }

  logWarning(message: string, context?: Record<string, any>): void {
    if (__DEV__) {
      console.warn('⚠️ WARNING:', message, context);
    }
  }

  logInfo(message: string, context?: Record<string, any>): void {
    if (__DEV__) {
      console.log('ℹ️ INFO:', message, context);
    }
  }

  getLogs(): CrashLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  setUserInfo(_userInfo: { userId?: number; email?: string }): void {
    // no-op
  }

  setupCrashReporting(): void {
    if (__DEV__) {
      console.log('Crash reporting: remote storage disabled');
    }
  }
}

export const crashReporting = new CrashReportingService();

if (typeof global !== 'undefined') {
  try {
    const originalHandler = global.ErrorUtils?.getGlobalHandler?.();

    global.ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
      try {
        crashReporting.logError(error, {
          isFatal: isFatal ?? false,
          type: 'unhandledError',
          phase: 'app_startup',
          screen: 'unknown',
        });
      } catch {
        if (__DEV__) {
          console.error('Unhandled error:', error.message);
        }
      }

      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });

    if (typeof global.addEventListener === 'function') {
      global.addEventListener('unhandledrejection', (event: any) => {
        try {
          const error =
            event.reason instanceof Error
              ? event.reason
              : new Error(String(event.reason));

          crashReporting.logError(error, {
            type: 'unhandledPromiseRejection',
            phase: 'app_startup',
            screen: 'unknown',
          });
        } catch {
          if (__DEV__) {
            console.error('Unhandled promise rejection:', event.reason);
          }
        }
      });
    }
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to setup global error handlers:', error);
    }
  }
}
