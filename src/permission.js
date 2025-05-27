import { Platform, PermissionsAndroid } from "react-native";

export async function requestPermissions() {
  try {
    if (Platform.OS === "ios") {
      return true;
    }

    if (Platform.OS === "android") {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      ]);

      const locationGranted =
        results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;

      const bluetoothPermissionsGranted =
        Platform.Version < 31
          ? true
          : results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
              PermissionsAndroid.RESULTS.GRANTED;

      return locationGranted && bluetoothPermissionsGranted;
    }
  } catch (error) {
    console.error("Permission request error:", error);
  }

  return false;
}

export async function checkPermissions() {
  try {
    if (Platform.OS === "ios") {
      return true;
    }

    if (Platform.OS === "android") {
      const hasLocationPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      let hasBluetoothPermissions = true;
      if (Platform.Version >= 31) {
        hasBluetoothPermissions =
          (await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
          )) &&
          (await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
          ));
      }

      return hasLocationPermission && hasBluetoothPermissions;
    }
  } catch (error) {
    console.error("Permission check error:", error);
  }

  return false;
}

export async function checkBluetoothPermission() {
  try {
    if (Platform.OS !== "android" || Platform.Version < 31) {
      return true;
    }

    const hasConnectPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
    );
    const hasScanPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
    );

    if (!hasConnectPermission || !hasScanPermission) {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
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
