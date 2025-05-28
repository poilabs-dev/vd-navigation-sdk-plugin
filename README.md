# Poilabs Visually Disabled Navigation SDK Plugin

Official **Expo Config Plugin** for integrating the [Poilabs Visually Disabled Navigation SDK](https://www.poilabs.com/en/vd-navigation-sdk/) into Expo (prebuild) projects.

> 🚀 Automatically links native dependencies and modifies required iOS/Android files.

---

## ✨ What this plugin does

When used with `expo prebuild`, this plugin:

- ✅ Adds required Android permissions to `AndroidManifest.xml`
- ✅ Adds Poilabs VD Navigation SDK dependency to `android/app/build.gradle`
- ✅ Adds JitPack repository to `android/build.gradle`
- ✅ Adds `pod 'PoilabsVdNavigation'` to the iOS Podfile
- ✅ Adds `use_frameworks!` to the iOS Podfile
- ✅ Adds `Info.plist` keys for Location and Bluetooth usage
- ✅ Creates necessary bridge files for iOS and Android

---

## 📦 Installation

Install the plugin to your Expo project:

```bash
npm install @poilabs-dev/vd-navigation-sdk-plugin
# or
yarn add @poilabs-dev/vd-navigation-sdk-plugin
```

## ⚙️ Configuration

Add the plugin to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      [
        "@poilabs-dev/vd-navigation-sdk-plugin",
        {
          "jitpackToken": "YOUR_JITPACK_TOKEN" // Get this from Poilabs
        }
      ]
    ]
  }
}
```

Then run the prebuild command:

```bash
npx expo prebuild
```

### Additional Setup Required

After running `expo prebuild`, you need to perform these additional steps:

#### Android Setup

1. Find the `getPackages()` method and add the PoilabsPackage:

   ```kotlin
   override fun getPackages(): List<ReactPackage> {
      val packages = PackageList(this).packages
      // add this line
      packages.add(PoilabsPackage())
      return packages
    }
   ```

2. Clean and rebuild your Android project:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx expo run:android
   ```

#### iOS Setup

For iOS, you need to ensure the plugin files are properly included in your Xcode project:

1. Open your Xcode project
2. In Xcode, verify that the created files are added to your project:

   - `PoilabsVdNavigationManager.swift`
   - `PoilabsNavigationBridge.h`
   - `PoilabsNavigationBridge.m`

3. If files are missing, you may need to manually add them from the iOS directory

4. Ensure the Swift bridging header includes React and PoilabsVdNavigation

5. Upload pods: cd ios && pod install && cd ..

Then build and run your iOS project:

```bash
npx expo run:ios
```

## 🚀 Usage

After the prebuild process, you can use the SDK in your application:

```javascript
import {
  requestPermissions,
  startPoilabsNavigation,
} from "@poilabs-dev/vd-navigation-sdk-plugin";
import React, { useEffect } from "react";
import {View } from "react-native";

export default function App() {
  useEffect(() => {
    async function initNavigation() {
      try {
        // Request permissions first
        const hasPermissions = await requestPermissions();
        if (!hasPermissions) {
          return;
        }

        // Initialize the SDK
        const success = await startPoilabsNavigation({
          applicationId: 'YOUR_APPLICATION_ID', // Get from Poilabs
          applicationSecretKey: 'YOUR_APPLICATION_SECRET', // Get from Poilabs
          uniqueId: 'USER_UNIQUE_ID', // A unique identifier for the user
          language: 'en', // or 'tr' for Turkish
        });

      } catch (error: any) {
        console.error("Error", error)
      }
    }

    initNavigation();
  }, []);

  return (
    <View></View>
  );
}
```

## 📝 API Reference

### `startPoilabsNavigation(config)`

Initializes the Poilabs VD Navigation SDK with the given configuration.

#### Parameters

- `config` (Object):
  - `applicationId` (String): The application ID provided by Poilabs
  - `applicationSecretKey` (String): The application secret provided by Poilabs
  - `uniqueId` (String): A unique identifier for the user
  - `language` (String, optional): Language code (e.g. "en", "tr"). Defaults to "en"
  - `configUrl` (String, optional): Optional URL to redirect requests

#### Returns

- `Promise<boolean>`: Resolves to `true` if SDK was initialized successfully, `false` otherwise

### `showPoilabsVdNavigation()`

Shows the Poilabs VD Navigation interface.

#### Returns

- `Promise<boolean>`: Resolves to `true` if navigation started successfully, `false` otherwise

### `getUserLocation()`

Gets the current user location.

#### Returns

- `Promise<Object>`: Resolves to location object with the following properties:
  - `latitude` (Number): Latitude coordinate
  - `longitude` (Number): Longitude coordinate
  - `floorLevel` (Number|null): Floor level (null if not available)

### `updateUniqueId(uniqueId)`

Updates the unique identifier in the SDK after initialization.

#### Parameters

- `uniqueId` (String): New unique identifier for the user

#### Returns

- `Promise<boolean>`: Resolves to `true` if update was successful

### `requestPermissions()`

Requests all the required permissions for the SDK to work properly.

#### Returns

- `Promise<boolean>`: Resolves to `true` if all required permissions are granted, `false` otherwise

### `checkPermissions()`

Checks if all required permissions are granted.

#### Returns

- `Promise<boolean>`: `true` if all required permissions are granted, `false` otherwise

### `checkBluetoothPermission()`

Checks if Bluetooth permissions are granted (relevant for Android 12+).

#### Returns

- `Promise<boolean>`: `true` if Bluetooth permissions are granted, `false` otherwise

## 📋 Required Permissions

The plugin automatically adds these permissions:

### Android

- `INTERNET` - For network communication
- `ACCESS_FINE_LOCATION` - For precise location
- `ACCESS_COARSE_LOCATION` - For approximate location
- `BLUETOOTH`, `BLUETOOTH_ADMIN` - For Bluetooth functionality
- `BLUETOOTH_CONNECT`, `BLUETOOTH_SCAN` - For Bluetooth on Android 12+
- `RECEIVE_BOOT_COMPLETED` - For autostart capability
- `ACCESS_NETWORK_STATE` - For network connectivity

### iOS

- `NSLocationUsageDescription` - Location permission
- `NSLocationWhenInUseUsageDescription` - Location permission when app is in use
- `NSLocationAlwaysUsageDescription` - Location permission even when app is not in use
- `NSLocationAlwaysAndWhenInUseUsageDescription` - Location permission
- `NSBluetoothAlwaysUsageDescription` - Bluetooth permission
- `NSBluetoothPeripheralUsageDescription` - Bluetooth permission

## ❓ Troubleshooting

### Module not found error

If you see `PoilabsVdNavigationModule` not found error:

1. Make sure you have run `npx expo prebuild`
2. Verify you've completed the additional setup steps for Android/iOS
3. Run `npx expo run:android` or `npx expo run:ios` to build and run the native project
4. For Expo Go, this plugin will not work because it requires native modules

### iOS Integration Issues

If you're having issues with iOS integration:

1. Make sure the Podfile is correctly updated with `pod 'PoilabsVdNavigation'`
2. Verify that `use_frameworks!` is in your Podfile
3. Check that the Swift files are properly added to your project
4. Run `pod install --repo-update` from the ios directory

### Permission issues

If the SDK is not working due to permission issues:

1. Make sure you have requested all the necessary permissions
2. For Android, ensure Bluetooth permissions are properly granted on Android 12+
