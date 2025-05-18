import { Platform, PermissionsAndroid } from 'react-native';

/**
 * Request all necessary permissions for Poilabs VD Navigation SDK
 * @returns {Promise<boolean>} - Promise resolving to true if all permissions granted
 */
export async function requestPermissions() {
  try {
    if (Platform.OS === 'ios') {
      // iOS permissions are requested at runtime by the system
      return true;
    }

    if (Platform.OS === 'android') {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      ]);
      
      // Check if all critical permissions were granted
      const locationGranted = 
        results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === 
        PermissionsAndroid.RESULTS.GRANTED;
        
      // Bluetooth permissions only exist on Android 12+ (API 31+)
      const bluetoothPermissionsGranted = Platform.Version < 31 ? true : (
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 
          PermissionsAndroid.RESULTS.GRANTED &&
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 
          PermissionsAndroid.RESULTS.GRANTED
      );
      
      return locationGranted && bluetoothPermissionsGranted;
    }
  } catch (error) {
    console.error("Permission request error:", error);
  }
  
  return false;
}

/**
 * Check if all necessary permissions are granted
 * @returns {Promise<boolean>} - Promise resolving to true if all permissions granted
 */
export async function checkPermissions() {
  try {
    if (Platform.OS === 'ios') {
      // On iOS, we assume permissions are granted since they're requested at runtime
      return true;
    }

    if (Platform.OS === 'android') {
      // Check location permissions (required for all Android versions)
      const hasLocationPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      
      // Check Bluetooth permissions (only on Android 12+)
      let hasBluetoothPermissions = true;
      if (Platform.Version >= 31) {
        hasBluetoothPermissions = 
          await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT) &&
          await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
      }
      
      return hasLocationPermission && hasBluetoothPermissions;
    }
  } catch (error) {
    console.error("Permission check error:", error);
  }
  
  return false;
}

/**
 * Check if Bluetooth permissions are granted (relevant for Android 12+)
 * @returns {Promise<boolean>} - Promise resolving to true if Bluetooth permissions granted
 */
export async function checkBluetoothPermission() {
  try {
    if (Platform.OS !== 'android' || Platform.Version < 31) {
      return true;
    }
    
    const hasConnectPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
    );
    const hasScanPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
    );
    
    if (!hasConnectPermission || !hasScanPermission) {
      // If permissions not granted, request them
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
      ]);
      
      return (
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 
          PermissionsAndroid.RESULTS.GRANTED &&
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 
          PermissionsAndroid.RESULTS.GRANTED
      );
    }
    
    return hasConnectPermission && hasScanPermission;
  } catch (error) {
    console.error("Bluetooth permission check error:", error);
    return false;
  }
}