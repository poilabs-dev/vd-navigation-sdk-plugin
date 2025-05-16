import { NativeModules, NativeEventEmitter, Platform } from "react-native";
import {
  requestRequiredPermissions,
  checkAllPermissions,
  checkLocationPermission,
  checkBluetoothPermission,
} from "./permission";

const { PoilabsVdNavigationModule } = NativeModules;

const poilabsEventEmitter = new NativeEventEmitter(PoilabsVdNavigationModule);
let locationChangeListener = null;
let statusChangeListener = null;
let errorListener = null;

export async function startPoilabsVdNavigation(config) {
  try {
    const {
      applicationId,
      applicationSecret,
      uniqueId,
      lang = Platform.OS === "ios"
        ? Locale.current?.languageCode || "tr"
        : "tr",
      configUrl,
    } = config;

    if (!applicationId || !applicationSecret || !uniqueId) {
      console.error(
        "applicationId, applicationSecret ve uniqueId parametreleri gereklidir."
      );
      return false;
    }

    const permissionsGranted = await requestRequiredPermissions();
    if (!permissionsGranted) {
      console.warn("Gerekli izinler verilmedi. SDK düzgün çalışmayabilir.");
    }

    if (configUrl) {
      return await PoilabsVdNavigationModule.startPoilabsVdNavigationWithCustomConfig(
        configUrl,
        applicationId,
        applicationSecret,
        uniqueId,
        lang,
        config.title || "Navigation"
      );
    } else {
      return await PoilabsVdNavigationModule.startPoilabsVdNavigation(
        applicationId,
        applicationSecret,
        uniqueId,
        lang,
        config.title || "Navigation"
      );
    }
  } catch (error) {
    console.error("Poilabs VD Navigation SDK başlatma hatası:", error);
    return false;
  }
}

export async function stopPoilabsVdNavigation() {
  try {
    if (locationChangeListener) {
      locationChangeListener.remove();
      locationChangeListener = null;
    }

    if (statusChangeListener) {
      statusChangeListener.remove();
      statusChangeListener = null;
    }

    if (errorListener) {
      errorListener.remove();
      errorListener = null;
    }

    await PoilabsVdNavigationModule.stopPoilabsVdNavigation();
    return true;
  } catch (error) {
    console.error("Poilabs VD Navigation SDK durdurma hatası:", error);
    return false;
  }
}

export async function updateUniqueId(uniqueId) {
  try {
    if (!uniqueId) {
      console.error("uniqueId parametresi gereklidir.");
      return false;
    }

    return await PoilabsVdNavigationModule.updateUniqueId(uniqueId);
  } catch (error) {
    console.error("uniqueId güncelleme hatası:", error);
    return false;
  }
}

export async function setCustomConfigUrl(url) {
  try {
    if (!url) {
      console.error("URL parametresi gereklidir.");
      return false;
    }

    // Bu fonksiyon şu an için SDK'da doğrudan yer almıyor,
    // bu nedenle startPoilabsVdNavigationWithCustomConfig çağrısında
    // configUrl parametresi olarak kullanılmalıdır.
    return true;
  } catch (error) {
    console.error("Custom URL ayarlama hatası:", error);
    return false;
  }
}

export function addLocationChangeListener(callback) {
  if (locationChangeListener) {
    locationChangeListener.remove();
  }

  PoilabsVdNavigationModule.addLocationChangeListener();
  locationChangeListener = poilabsEventEmitter.addListener(
    "PoilabsLocationChangeEvent",
    callback
  );
}

export function removeLocationChangeListener() {
  if (locationChangeListener) {
    locationChangeListener.remove();
    locationChangeListener = null;
  }

  PoilabsVdNavigationModule.removeLocationChangeListener();
}

export function addStatusChangeListener(callback) {
  if (statusChangeListener) {
    statusChangeListener.remove();
  }

  statusChangeListener = poilabsEventEmitter.addListener(
    "PoilabsStatusChangeEvent",
    callback
  );
}

export function removeStatusChangeListener() {
  if (statusChangeListener) {
    statusChangeListener.remove();
    statusChangeListener = null;
  }
}

export function addErrorListener(callback) {
  if (errorListener) {
    errorListener.remove();
  }

  errorListener = poilabsEventEmitter.addListener(
    "PoilabsErrorEvent",
    callback
  );
}

export function removeErrorListener() {
  if (errorListener) {
    errorListener.remove();
    errorListener = null;
  }
}

export {
  requestRequiredPermissions,
  checkAllPermissions,
  checkLocationPermission,
  checkBluetoothPermission,
};
