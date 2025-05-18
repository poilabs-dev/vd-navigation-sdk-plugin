export interface VdNavigationConfig {
  applicationId: string;
  applicationSecretKey: string;
  uniqueId: string;
  language?: string;
  title?: string;
  configUrl?: string | null;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  floorLevel: number | null;
}

/**
 * Initialize and start the Poilabs VD Navigation SDK
 * @param config Configuration options for the SDK
 * @returns Promise resolving to true if initialization was successful
 */
export function startPoilabsNavigation(config: VdNavigationConfig): Promise<boolean>;

/**
 * Show the Poilabs VD Navigation interface
 * @returns Promise resolving to true if navigation started successfully
 */
export function showPoilabsVdNavigation(): Promise<boolean>;

/**
 * Get the current user location
 * @returns Promise resolving to location object
 */
export function getUserLocation(): Promise<UserLocation | null>;

/**
 * Update the user's unique ID
 * @param uniqueId New unique ID for the user
 * @returns Promise resolving to true if update was successful
 */
export function updateUniqueId(uniqueId: string): Promise<boolean>;

/**
 * Request all necessary permissions for the SDK
 * @returns Promise resolving to true if all permissions granted
 */
export function requestPermissions(): Promise<boolean>;

/**
 * Check if all necessary permissions are granted
 * @returns Promise resolving to true if all permissions granted
 */
export function checkPermissions(): Promise<boolean>;

/**
 * Check if Bluetooth permissions are granted (relevant for Android 12+)
 * @returns Promise resolving to true if Bluetooth permissions granted
 */
export function checkBluetoothPermission(): Promise<boolean>;