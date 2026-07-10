# 🚨 Production Crash Reporting System

## Overview

A comprehensive crash reporting and logging system has been implemented to help diagnose production crashes. All crashes and errors are now logged with detailed context that will appear in your production logs.

## What Was Implemented

### 1. **Crash Reporting Service** (`services/crashReporting.ts`)
- Logs all errors with full context (device info, stack traces, component stacks)
- Stores last 100 crash logs in memory
- Handles unhandled errors and promise rejections
- Console logging in production (visible in logcat/console)

### 2. **Error Boundary Component** (`components/ErrorBoundary.tsx`)
- Catches React component errors
- Shows user-friendly error UI
- Logs errors with full context
- Wraps the entire app in `App.tsx`

### 3. **SearchScreen Logging**
- Logs component mount/unmount
- Logs all API calls (properties, sales, landmarks)
- Logs property selection events
- Wraps critical operations in try-catch
- Logs render errors

## How to View Crash Logs in Production

### Android Production Build

1. **Using ADB (Android Debug Bridge):**
   ```bash
   adb logcat | grep "CRASH REPORT"
   ```

2. **Using Android Studio:**
   - Connect device
   - Open Logcat
   - Filter by: `CRASH REPORT` or `🚨`

3. **Using React Native CLI:**
   ```bash
   npx react-native log-android | grep "CRASH"
   ```

### iOS Production Build

1. **Using Xcode:**
   - Connect device
   - Window → Devices and Simulators
   - Select device → View Device Logs
   - Filter by: `CRASH REPORT` or `🚨`

2. **Using Console.app (macOS):**
   - Open Console.app
   - Select your device
   - Filter by: `CRASH REPORT`

3. **Using React Native CLI:**
   ```bash
   npx react-native log-ios | grep "CRASH"
   ```

## Log Format

All crash logs follow this format:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRASH DETAILS:
Time: 2024-01-15T10:30:45.123Z
Error: Cannot read property 'x' of undefined
Platform: android 13
Device: Pixel 7
App Version: 1.2.2
Context: {"phase":"render","screen":"SearchScreen"}
Stack Trace: Error: Cannot read property 'x' of undefined
    at SearchScreen (SearchScreen.tsx:1234:56)
    ...
Component Stack: 
  in SearchScreen
  in ErrorBoundary
  ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## What Gets Logged

### Automatic Logging:
- ✅ Component mount/unmount
- ✅ Unhandled errors
- ✅ Unhandled promise rejections
- ✅ React component errors (via ErrorBoundary)
- ✅ API call failures
- ✅ Property selection events

### Context Included:
- ✅ Timestamp
- ✅ Error message and stack trace
- ✅ Component stack (for React errors)
- ✅ Device info (platform, OS version, model)
- ✅ App version
- ✅ Custom context (phase, screen, etc.)

## Example Crash Scenarios

### Scenario 1: API Call Failure
```
🚨 CRASH REPORT 🚨
Error: Network request failed
Phase: properties_search
Screen: SearchScreen
URL: http://192.168.1.1/api/properties/search
```

### Scenario 2: Render Error
```
🚨 CRASH REPORT 🚨
Error: Cannot read property 'title' of undefined
Phase: render
Screen: SearchScreen
Component Stack: in PropertyCard
```

### Scenario 3: Hook Error
```
🚨 CRASH REPORT 🚨
Error: Invalid hook call
Phase: hooks_initialization
Screen: SearchScreen
```

## Next Steps (Optional Enhancements)

### 1. Send to Backend
Uncomment and implement `sendToBackend()` in `crashReporting.ts`:

```typescript
// In crashReporting.ts
private async sendToBackend(crashLog: CrashLog) {
  try {
    await axios.post(`${endpoints.baseURL}/crashes`, crashLog);
  } catch (e) {
    // Fallback to console
  }
}
```

### 2. Integrate Sentry
```bash
npm install @sentry/react-native
```

Then in `crashReporting.ts`:
```typescript
import * as Sentry from '@sentry/react-native';

// In logError method:
Sentry.captureException(error, {
  extra: context,
  tags: { screen: 'SearchScreen' }
});
```

### 3. Integrate Firebase Crashlytics
```bash
npm install @react-native-firebase/crashlytics
```

## Testing

To test the crash reporting:

1. **Force an error in SearchScreen:**
   ```typescript
   // Add this temporarily in SearchScreen render
   throw new Error('Test crash');
   ```

2. **Check logs:**
   - Look for `🚨 CRASH REPORT 🚨` in console
   - Verify all context is logged
   - Check ErrorBoundary shows fallback UI

## Important Notes

- ⚠️ **Logs are visible in production** - All crash logs appear in console/logcat
- ⚠️ **No sensitive data** - Don't log passwords, tokens, or PII
- ⚠️ **Performance** - Logging is async and non-blocking
- ⚠️ **Memory** - Only last 100 logs kept in memory

## Troubleshooting

### Logs not appearing?
1. Check device is connected
2. Verify app is running in production mode
3. Check logcat/console filters
4. Look for `🚨` emoji in logs

### Too many logs?
- Adjust `maxLogs` in `crashReporting.ts`
- Filter logs by phase/screen
- Use log levels (info/warning/error)

## Support

If crashes persist:
1. Check logs for `CRASH REPORT` entries
2. Look for the error message and stack trace
3. Check the context (phase, screen, etc.)
4. Review component stack for React errors
