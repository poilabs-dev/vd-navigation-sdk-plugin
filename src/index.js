import { NativeModules } from 'react-native';
import { requestPermissions, checkPermissions, checkBluetoothPermission } from './permission';

const { PoilabsNavigationBridge } = NativeModules;

export async function startPoilabsNavigation(config) {
  try {
    const {
      applicationId,
      applicationSecretKey,
      uniqueId,
      language = 'en',
      title = '',
      configUrl = null,
    } = config;

    if (!applicationId) {
      console.error('applicationId is required');
      return false;
    }

    if (!applicationSecretKey) {
      console.error('applicationSecretKey is required');
      return false;
    }

    if (!uniqueId) {
      console.error('uniqueId is required');
      return false;
    }

    // Request necessary permissions
    const permissionsGranted = await requestPermissions();
    if (!permissionsGranted) {
      console.error('Required permissions not granted');
      return false;
    }

    // Initialize SDK
    if (PoilabsNavigationBridge) {
      return await PoilabsNavigationBridge.initialize(
        applicationId,
        applicationSecretKey,
        uniqueId,
        language,
        title,
        configUrl
      );
    } else {
      console.error('PoilabsNavigationBridge not found');
      return false;
    }
  } catch (error) {
    console.error('Failed to initialize Poilabs SDK:', error);
    return false;
  }
}

/**
 * Show the Poilabs VD Navigation interface
 */
export async function showPoilabsVdNavigation() {
  try {
    if (PoilabsNavigationBridge) {
      return await PoilabsNavigationBridge.showPoilabsVdNavigation();
    } else {
      console.error('PoilabsNavigationBridge not found');
      return false;
    }
  } catch (error) {
    console.error('Failed to start navigation:', error);
    return false;
  }
}

/**
 * Get the current user location
 */
export async function getUserLocation() {
  try {
    if (PoilabsNavigationBridge) {
      return await PoilabsNavigationBridge.getUserLocation();
    } else {
      console.error('PoilabsNavigationBridge not found');
      return null;
    }
  } catch (error) {
    console.error('Failed to get user location:', error);
    return null;
  }
}

/**
 * Update the user's unique ID
 */
export async function updateUniqueId(uniqueId) {
  try {
    if (!uniqueId) {
      console.error('uniqueId is required');
      return false;
    }
    
    if (PoilabsNavigationBridge && PoilabsNavigationBridge.updateUniqueId) {
      return await PoilabsNavigationBridge.updateUniqueId(uniqueId);
    } else {
      console.error('updateUniqueId method not available');
      return false;
    }
  } catch (error) {
    console.error('Failed to update unique ID:', error);
    return false;
  }
}

// Export permission helpers
export { requestPermissions, checkPermissions, checkBluetoothPermission };