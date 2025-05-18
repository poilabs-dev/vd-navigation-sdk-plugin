import { NativeModules, Platform } from 'react-native';
import { requestPermissions, checkPermissions, checkBluetoothPermission } from './permission';

const { PoilabsVdNavigationModule } = NativeModules;

/**
 * Initialize and start the Poilabs VD Navigation SDK
 *
 * @param {Object} config - Configuration object
 * @param {string} config.applicationId - Application ID provided by Poilabs
 * @param {string} config.applicationSecretKey - Secret key provided by Poilabs
 * @param {string} config.uniqueId - Unique ID for the user
 * @param {string} [config.language='en'] - Language code (e.g. "en", "tr")
 * @param {string} [config.title=''] - Title to display on the first page
 * @param {string} [config.configUrl=null] - Optional URL to redirect requests
 * @returns {Promise<boolean>} - Promise resolving to true if initialization was successful
 */
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
    if (PoilabsVdNavigationModule) {
      return await PoilabsVdNavigationModule.initialize(
        applicationId,
        applicationSecretKey,
        uniqueId,
        language,
        title,
        configUrl
      );
    } else {
      console.error('PoilabsVdNavigationModule not found');
      return false;
    }
  } catch (error) {
    console.error('Failed to initialize Poilabs SDK:', error);
    return false;
  }
}

/**
 * Show the Poilabs VD Navigation interface
 * 
 * @returns {Promise<boolean>} - Promise resolving to true if navigation started successfully
 */
export async function showPoilabsVdNavigation() {
  try {
    if (PoilabsVdNavigationModule) {
      return await PoilabsVdNavigationModule.showPoilabsVdNavigation();
    } else if (NativeModules.PoilabsNavigationBridge) {
      // For iOS, we can also use the bridge directly
      NativeModules.PoilabsNavigationBridge.showPoilabsVdNavigation();
      return true;
    } else {
      console.error('Navigation module not found');
      return false;
    }
  } catch (error) {
    console.error('Failed to start navigation:', error);
    return false;
  }
}

/**
 * Get the current user location
 * 
 * @returns {Promise<{latitude: number, longitude: number, floorLevel: number|null}>} - 
 * Promise resolving to location object
 */
export async function getUserLocation() {
  try {
    if (PoilabsVdNavigationModule) {
      return await PoilabsVdNavigationModule.getUserLocation();
    } else {
      console.error('PoilabsVdNavigationModule not found');
      return null;
    }
  } catch (error) {
    console.error('Failed to get user location:', error);
    return null;
  }
}

/**
 * Update the user's unique ID
 * 
 * @param {string} uniqueId - New unique ID for the user
 * @returns {Promise<boolean>} - Promise resolving to true if update was successful
 */
export async function updateUniqueId(uniqueId) {
  try {
    if (!uniqueId) {
      console.error('uniqueId is required');
      return false;
    }
    
    if (PoilabsVdNavigationModule && PoilabsVdNavigationModule.updateUniqueId) {
      return await PoilabsVdNavigationModule.updateUniqueId(uniqueId);
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