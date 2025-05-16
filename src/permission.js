import { Platform, PermissionsAndroid } from "react-native";
import * as Location from "expo-location";
import * as Device from "expo-device";

export async function requestRequiredPermissions() {
  try {
    if (Platform.OS === "ios") {
      const foreground = await Location.requestForegroundPermissionsAsync();
      const background = await Location.requestBackgroundPermissionsAsync();

      return foreground.status === "granted" && background.status === "granted";
    }

    if (Platform.OS !== "android") {
      return false;
    }

    const sdkVersion = Device.osVersion ? parseInt(Device.osVersion, 10) : 0;

    let fineLocationGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    if (!fineLocationGranted) {
      const fineLocationResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Konum İzni",
          message: "Navigasyon için konum izni gereklidir.",
          buttonPositive: "Tamam",
          buttonNegative: "İptal",
        }
      );

      fineLocationGranted =
        fineLocationResult === PermissionsAndroid.RESULTS.GRANTED;
    }

    let backgroundLocationGranted = true;
    if (sdkVersion >= 29) {
      backgroundLocationGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
      );

      if (!backgroundLocationGranted) {
        const backgroundLocationResult = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
          {
            title: "Arka Plan Konum İzni",
            message: "Navigasyon için arka planda konum erişimi gereklidir.",
            buttonPositive: "Tamam",
            buttonNegative: "İptal",
          }
        );

        backgroundLocationGranted =
          backgroundLocationResult === PermissionsAndroid.RESULTS.GRANTED;
      }
    }

    let bluetoothGranted = true;
    if (sdkVersion >= 31) {
      const bluetoothConnectGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      );

      const bluetoothScanGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
      );

      if (!bluetoothConnectGranted || !bluetoothScanGranted) {
        const bluetoothResults = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        ]);

        bluetoothGranted =
          bluetoothResults[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          bluetoothResults[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
            PermissionsAndroid.RESULTS.GRANTED;
      }
    }

    return fineLocationGranted && backgroundLocationGranted && bluetoothGranted;
  } catch (error) {
    console.error("İzin isteme hatası:", error);
    return false;
  }
}

export async function checkAllPermissions() {
  try {
    if (Platform.OS === "ios") {
      const foreground = await Location.getForegroundPermissionsAsync();
      const background = await Location.getBackgroundPermissionsAsync();

      return foreground.status === "granted" && background.status === "granted";
    }

    if (Platform.OS !== "android") {
      return false;
    }

    const sdkVersion = Device.osVersion ? parseInt(Device.osVersion, 10) : 0;

    const fineLocationGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    let backgroundLocationGranted = true;
    if (sdkVersion >= 29) {
      backgroundLocationGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
      );
    }

    let bluetoothGranted = true;
    if (sdkVersion >= 31) {
      const bluetoothConnectGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      );

      const bluetoothScanGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
      );

      bluetoothGranted = bluetoothConnectGranted && bluetoothScanGranted;
    }

    return fineLocationGranted && backgroundLocationGranted && bluetoothGranted;
  } catch (error) {
    console.error("İzin kontrolü hatası:", error);
    return false;
  }
}

export async function checkLocationPermission() {
  try {
    if (Platform.OS === "ios") {
      const foreground = await Location.getForegroundPermissionsAsync();
      const background = await Location.getBackgroundPermissionsAsync();

      return foreground.status === "granted" && background.status === "granted";
    }

    if (Platform.OS !== "android") {
      return false;
    }

    const sdkVersion = Device.osVersion ? parseInt(Device.osVersion, 10) : 0;

    const fineLocationGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    let backgroundLocationGranted = true;
    if (sdkVersion >= 29) {
      backgroundLocationGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
      );
    }

    return fineLocationGranted && backgroundLocationGranted;
  } catch (error) {
    console.error("Konum izni kontrolü hatası:", error);
    return false;
  }
}

export async function checkBluetoothPermission() {
  try {
    if (Platform.OS === "ios") {
      return true;
    }

    if (Platform.OS !== "android") {
      return false;
    }

    const sdkVersion = Device.osVersion ? parseInt(Device.osVersion, 10) : 0;

    if (sdkVersion >= 31) {
      const bluetoothConnectGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      );

      const bluetoothScanGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
      );

      return bluetoothConnectGranted && bluetoothScanGranted;
    }

    return true;
  } catch (error) {
    console.error("Bluetooth izni kontrolü hatası:", error);
    return false;
  }
}
