import * as Location from 'expo-location';
import * as Network from 'expo-network';

export interface LocationInfo {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedAddress?: string;
}

export interface NetworkInfo {
  isConnected: boolean;
  isInternetReachable: boolean;
  type?: string;
  isWifi?: boolean;
  isCellular?: boolean;
  strength?: number;
}

class LocationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private isTracking = false;
  private currentLocation: LocationInfo | null = null;

  constructor() {
    this.requestPermissions();
  }

  private async requestPermissions() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied');
      return;
    }

    const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus.status !== 'granted') {
      console.log('Background location permission denied');
    }
  }

  public async getCurrentLocation(): Promise<LocationInfo | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationInfo: LocationInfo = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      // Get address information using reverse geocoding
      try {
        const addressResults = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (addressResults.length > 0) {
          const address = addressResults[0];
          locationInfo.address = address.street || '';
          locationInfo.city = address.city || '';
          locationInfo.state = address.region || '';
          locationInfo.country = address.country || '';
          locationInfo.postalCode = address.postalCode || '';
          
          // Create a formatted address
          const addressParts = [
            address.street,
            address.city,
            address.region,
            address.postalCode,
            address.country
          ].filter(Boolean);
          
          locationInfo.formattedAddress = addressParts.join(', ');
        }
      } catch (geocodeError) {
        console.error('Error getting address:', geocodeError);
        // Continue without address information
      }

      this.currentLocation = locationInfo;
      return locationInfo;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  public async getNetworkInfo(): Promise<NetworkInfo> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      
      const networkInfo: NetworkInfo = {
        isConnected: networkState.isConnected || false,
        isInternetReachable: networkState.isInternetReachable || false,
        type: networkState.type || 'unknown',
        isWifi: networkState.type === Network.NetworkStateType.WIFI,
        isCellular: networkState.type === Network.NetworkStateType.CELLULAR,
      };

      // Try to get more detailed network information
      try {
        const ipAddress = await Network.getIpAddressAsync();
        console.log('IP Address:', ipAddress);
      } catch (ipError) {
        console.log('Could not get IP address:', ipError);
      }

      return networkInfo;
    } catch (error) {
      console.error('Error getting network info:', error);
      return {
        isConnected: false,
        isInternetReachable: false,
        type: 'unknown',
      };
    }
  }

  public async getDetailedLocationInfo(): Promise<{
    location: LocationInfo | null;
    network: NetworkInfo;
  }> {
    const [location, network] = await Promise.all([
      this.getCurrentLocation(),
      this.getNetworkInfo(),
    ]);

    return { location, network };
  }

  public async startLocationTracking() {
    if (this.isTracking) return;

    try {
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        async (location) => {
          const locationInfo: LocationInfo = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          };

          // Get address information
          try {
            const addressResults = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });

            if (addressResults.length > 0) {
              const address = addressResults[0];
              locationInfo.address = address.street || '';
              locationInfo.city = address.city || '';
              locationInfo.state = address.region || '';
              locationInfo.country = address.country || '';
              locationInfo.postalCode = address.postalCode || '';
              
              const addressParts = [
                address.street,
                address.city,
                address.region,
                address.postalCode,
                address.country
              ].filter(Boolean);
              
              locationInfo.formattedAddress = addressParts.join(', ');
            }
          } catch (geocodeError) {
            console.error('Error getting address during tracking:', geocodeError);
          }

          this.currentLocation = locationInfo;
        }
      );

      this.isTracking = true;
      console.log('Location tracking started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw error;
    }
  }

  public stopLocationTracking() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.isTracking = false;
    console.log('Location tracking stopped');
  }

  public isLocationTrackingActive(): boolean {
    return this.isTracking;
  }

  public getCurrentLocationData(): LocationInfo | null {
    return this.currentLocation;
  }
}

export const locationService = new LocationService(); 