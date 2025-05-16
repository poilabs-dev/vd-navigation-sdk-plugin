# @poilabs-dev/vd-navigation-sdk-plugin

Official **Expo Config Plugin** for integrating the [Poilabs Visually Disabled Navigation SDK](https://www.poilabs.com/en/vd-navigation-sdk/) into Expo (prebuild) projects.

> 🚀 Automatically links native dependencies and modifies required iOS/Android files.

---

## ✨ What this plugin does

When used with `expo prebuild`, this plugin:

- ✅ Adds required Android permissions to `AndroidManifest.xml`
- ✅ Adds Poilabs VD Navigation SDK dependency to `android/app/build.gradle`
- ✅ Adds JitPack repository to `android/build.gradle`
- ✅ Adds `pod 'PoilabsVdNavigation'` to the iOS Podfile
- ✅ Adds `Info.plist` keys for Location and Bluetooth usage
- ✅ Configures native modules for both Android and iOS
- ✅ Creates bridging code for React Native integration

---

## 📦 Installation

Install the plugin to your Expo project:

```bash
npm install @poilabs-dev/vd-navigation-sdk-plugin
# or
yarn add @poilabs-dev/vd-navigation-sdk-plugin
```

Also install the required dependencies:

```bash
npx expo install expo-location expo-device
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

1. Clean and rebuild your Android project:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx expo run:android
   ```

#### iOS Setup

1. Install Pods:
   ```bash
   cd ios
   pod install --repo-update
   cd ..
   npx expo run:ios
   ```

## 🚀 Usage

After the prebuild process, you can use the SDK in your application:

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { 
  startPoilabsVdNavigation, 
  stopPoilabsVdNavigation,
  addLocationChangeListener,
  removeLocationChangeListener
} from '@poilabs-dev/vd-navigation-sdk-plugin';

export default function App() {
  const [sdkStatus, setSdkStatus] = useState('Not initialized');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    // Add location change listener
    addLocationChangeListener((locationData) => {
      setLocation(locationData);
    });

    // Clean up on unmount
    return () => {
      removeLocationChangeListener();
      stopPoilabsVdNavigation();
    };
  }, []);

  const handleStartSDK = async () => {
    try {
      const success = await startPoilabsVdNavigation({
        applicationId: 'YOUR_APPLICATION_ID', // Get from Poilabs
        applicationSecret: 'YOUR_APPLICATION_SECRET', // Get from Poilabs
        uniqueId: 'USER_UNIQUE_ID', // A unique identifier for the user
        lang: 'en' // Optional language parameter (default is 'tr')
      });

      setSdkStatus(success ? 'Running ✅' : 'Failed to start ❌');
    } catch (error) {
      setSdkStatus(`Error: ${error.message}`);
    }
  };

  const handleStopSDK = async () => {
    try {
      const success = await stopPoilabsVdNavigation();
      setSdkStatus(success ? 'Stopped ⛔' : 'Failed to stop ❓');
    } catch (error) {
      setSdkStatus(`Stop Error: ${error.message}`);
    }
  };

  return (
    
      Poilabs VD Navigation
      Status: {sdkStatus}
      
      {location && (
        
          Latitude: {location.latitude}
          Longitude: {location.longitude}
          {location.floorLevel !== undefined && (
            Floor Level: {location.floorLevel}
          )}
        
      )}
      
      
        
        
      
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
  },
  locationContainer: {
    marginVertical: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  }
});
```

## 📝 API Reference

### `startPoilabsVdNavigation(config)`

Starts the Poilabs VD Navigation SDK with the given configuration.

#### Parameters

- `config` (Object):
  - `applicationId` (String): The application ID provided by Poilabs
  - `applicationSecret` (String): The application secret provided by Poilabs
  - `uniqueId` (String): A unique identifier for the user
  - `lang` (String, optional): The language for navigation UI (default: 'tr')
  - `configUrl` (String, optional): Custom configuration URL

#### Returns

- `Promise<boolean>`: Resolves to `true` if SDK was started successfully, `false` otherwise

### `stopPoilabsVdNavigation()`

Stops the Poilabs VD Navigation SDK.

#### Returns

- `Promise<boolean>`: Resolves to `true` if SDK was stopped successfully, `false` otherwise

### `updateUniqueId(uniqueId)`

Updates the unique identifier in the SDK after initialization.

#### Parameters

- `uniqueId` (String): New unique identifier for the user

#### Returns

- `Promise<boolean>`: Resolves to `true` if update was successful

### `setCustomConfigUrl(url)`

Sets a custom configuration URL for the SDK.

#### Parameters

- `url` (String): Custom configuration URL

#### Returns

- `Promise<boolean>`: Resolves to `true` if URL was set successfully

### `addLocationChangeListener(callback)`

Adds a listener for location changes.

#### Parameters

- `callback` (Function): Function to call when location changes, receives location object with latitude, longitude and optionally floorLevel

### `removeLocationChangeListener()`

Removes the location change listener.

### `addStatusChangeListener(callback)`

Adds a listener for SDK status changes.

#### Parameters

- `callback` (Function): Function to call when SDK status changes

### `removeStatusChangeListener()`

Removes the status change listener.

### `addErrorListener(callback)`

Adds a listener for SDK errors.

#### Parameters

- `callback` (Function): Function to call when SDK encounters an error

### `removeErrorListener()`

Removes the error listener.

### `requestRequiredPermissions()`

Requests all the required permissions for the SDK to work properly.

#### Returns

- `Promise<boolean>`: Resolves to `true` if all required permissions are granted, `false` otherwise

### `checkAllPermissions()`

Checks if all required permissions are granted.

#### Returns

- `Promise<boolean>`: `true` if all required permissions are granted, `false` otherwise

### `checkLocationPermission()`

Checks if location permissions are granted.

#### Returns

- `Promise<boolean>`: `true` if location permissions are granted, `false` otherwise

### `checkBluetoothPermission()`

Checks if Bluetooth permissions are granted (relevant for Android 12+).

#### Returns

- `Promise<boolean>`: `true` if Bluetooth permissions are granted, `false` otherwise

## 📋 Required Permissions

The plugin automatically adds these permissions:

### Android

- `INTERNET` - For network communication
- `BLUETOOTH` and `BLUETOOTH_ADMIN` - For Bluetooth functionality
- `ACCESS_FINE_LOCATION` - For precise location
- `ACCESS_COARSE_LOCATION` - For approximate location
- `ACCESS_BACKGROUND_LOCATION` - For background location tracking (Android 10+)
- `BLUETOOTH_CONNECT` and `BLUETOOTH_SCAN` - For enhanced Bluetooth functionality (Android 12+)
- `RECEIVE_BOOT_COMPLETED` - For starting services on device boot
- `ACCESS_NETWORK_STATE` - For network state monitoring

### iOS

- `NSLocationWhenInUseUsageDescription` - Location permission when app is in use
- `NSLocationAlwaysUsageDescription` - Location permission even when app is not in use
- `NSLocationAlwaysAndWhenInUseUsageDescription` - Combined location permission
- `NSBluetoothPeripheralUsageDescription` - Bluetooth permission
- `NSBluetoothAlwaysUsageDescription` - Persistent Bluetooth permission

## ❓ Troubleshooting

### Module not found error

If you see `PoilabsVdNavigationModule` not found error:

1. Make sure you have run `npx expo prebuild`
2. Verify that the iOS and Android native directories contain the necessary module files
3. Run `npx expo run:android` or `npx expo run:ios` to build and run the native project
4. For Expo Go, this plugin will not work because it requires native modules

### iOS Integration Issues

If you're having issues with iOS integration:

1. Make sure the Podfile is correctly updated with `pod 'PoilabsVdNavigation'`
2. Verify that `use_frameworks!` is in your Podfile
3. Make sure the Swift files are properly added to your project
4. Run `pod install --repo-update` from the ios directory

### Android Integration Issues

If you're having issues with Android integration:

1. Check that JitPack repository is properly added to your project's build.gradle
2. Make sure the SDK dependency is added to app/build.gradle
3. Verify that the package is properly initialized in MainApplication.java
4. Check that all required permissions are included in AndroidManifest.xml

### Permission issues

If the SDK is not working due to permission issues:

1. Make sure you have requested all the necessary permissions
2. For Android 10+, background location permission needs to be requested separately
3. For Android 12+, Bluetooth permissions need to be requested separately

## 📞 Support

If you encounter any issues, please contact Poilabs support or open an issue on GitHub.