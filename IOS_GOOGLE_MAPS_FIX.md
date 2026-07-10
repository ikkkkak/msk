# 🍎 iOS Google Maps Production Fix Guide

## Problem: Gray/Blank Maps on iOS Production Build

If your iOS app shows gray maps (no tiles loading), follow these steps:

## ✅ Checklist for iOS Google Maps Production

### 1. **Google Cloud Console Setup** ⚠️ CRITICAL

#### Enable Maps SDK for iOS
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Library**
4. Search for **"Maps SDK for iOS"**
5. Click **Enable** (must be enabled for iOS)

#### Configure API Key Restrictions
1. Go to **APIs & Services** → **Credentials**
2. Find your API key: `AIzaSyDMVJYe9H8uHWPQ7uHWPQ7toM5WBCNEuqVmGzvgE`
3. Click **Edit** on the API key
4. Under **Application restrictions**, select **iOS apps**
5. **Add bundle identifier**: `com.jeremypersing.apartmentsclone`
6. **Save** changes

**⚠️ IMPORTANT**: Bundle ID must match exactly what's in your `app.json`:
```json
"ios": {
  "bundleIdentifier": "com.jeremypersing.apartmentsclone"
}
```

### 2. **app.json Configuration** ✅ Already Configured

Your `app.json` already has the correct configuration:

```json
{
  "ios": {
    "bundleIdentifier": "com.jeremypersing.apartmentsclone",
    "config": {
      "googleMapsApiKey": "AIzaSyDMVJYe9H8uHWPQ7toM5WBCNEuqVmGzvgE"
    }
  }
}
```

### 3. **Rebuild the App** ⚠️ REQUIRED

After making ANY changes to:
- Google Cloud Console (API key restrictions)
- `app.json` configuration
- Bundle identifier

You **MUST** rebuild the app:

```bash
# For EAS Build
eas build --platform ios

# Or for local development build
npx expo prebuild --clean
cd ios && pod install
```

**⚠️ IMPORTANT**: 
- Expo Go does NOT include native configuration
- You need a **production build** or **development build** (not Expo Go)
- TestFlight/App Store builds will work correctly once configured

### 4. **Verify Bundle Identifier Match**

Make sure your Google Cloud Console bundle ID matches exactly:

**app.json**: `com.jeremypersing.apartmentsclone`
**Google Cloud**: Must be exactly `com.jeremypersing.apartmentsclone`

### 5. **Common Issues & Solutions**

#### Issue: Maps still gray after rebuild
**Solution**: 
- Double-check Maps SDK for iOS is **enabled** in Google Cloud
- Verify API key has **iOS app restrictions** (not just Android)
- Ensure bundle identifier matches **exactly** (no typos)

#### Issue: Works in dev but not production
**Solution**:
- Production builds use different bundle IDs sometimes
- Check if you have different bundle IDs for dev/prod
- Add both bundle IDs to Google Cloud restrictions

#### Issue: API key errors in console
**Solution**:
- Check Google Cloud billing is enabled
- Verify Maps SDK for iOS is enabled (not just Android)
- Check API key restrictions match your bundle ID

### 6. **Testing Checklist**

- [ ] Maps SDK for iOS enabled in Google Cloud
- [ ] API key has iOS app restrictions
- [ ] Bundle identifier matches in Google Cloud and app.json
- [ ] App rebuilt after configuration changes
- [ ] Testing on actual device (not simulator - maps may differ)
- [ ] Using production/development build (not Expo Go)

## 🚀 Quick Fix Steps

1. **Enable Maps SDK for iOS** in Google Cloud Console
2. **Add bundle identifier** to API key restrictions (iOS apps)
3. **Rebuild app** with `eas build --platform ios`
4. **Test on device** (TestFlight or development build)

## 📝 Current Configuration

**Bundle ID**: `com.jeremypersing.apartmentsclone`
**API Key**: `AIzaSyDMVJYe9H8uHWPQ7toM5WBCNEuqVmGzvgE`
**Configuration**: ✅ Set in `app.json`

## ⚠️ Critical Notes

1. **Expo Go will NOT work** - you need a custom development or production build
2. **Bundle ID must match exactly** - check for typos in Google Cloud Console
3. **Rebuild required** - any config change requires a new build
4. **Billing must be enabled** - Google Maps requires active billing

## 🔍 Debugging

If maps are still gray after following all steps:

1. Check Google Cloud Console → APIs & Services → Enabled APIs
   - Should see: ✅ Maps SDK for iOS (enabled)

2. Check API key restrictions:
   - Application restrictions: iOS apps
   - Bundle ID: `com.jeremypersing.apartmentsclone`

3. Verify billing is enabled in Google Cloud

4. Check device logs for API key errors:
   ```bash
   # iOS device logs
   xcrun simctl spawn booted log stream --predicate 'processImagePath contains "your-app"'
   ```

5. Test with a simple MapView:
   ```tsx
   <MapView
     provider={PROVIDER_GOOGLE}
     style={{ flex: 1 }}
     initialRegion={{
       latitude: 37.78825,
       longitude: -122.4324,
       latitudeDelta: 0.0922,
       longitudeDelta: 0.0421,
     }}
   />
   ```
