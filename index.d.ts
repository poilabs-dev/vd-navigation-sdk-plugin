export interface VdNavigationConfig {
  applicationId: string;
  applicationSecret: string;
  uniqueId: string;
  lang?: string;
  configUrl?: string;
}

export interface LocationResult {
  latitude: number;
  longitude: number;
  floorLevel?: number;
}

export function startPoilabsVdNavigation(
  config: VdNavigationConfig
): Promise<boolean>;

export function stopPoilabsVdNavigation(): Promise<boolean>;

export function updateUniqueId(uniqueId: string): Promise<boolean>;

export function setCustomConfigUrl(url: string): Promise<boolean>;

export function addLocationChangeListener(
  callback: (location: LocationResult) => void
): void;

export function removeLocationChangeListener(): void;

export function requestRequiredPermissions(): Promise<boolean>;

export function checkAllPermissions(): Promise<boolean>;

export function checkLocationPermission(): Promise<boolean>;

export function checkBluetoothPermission(): Promise<boolean>;
