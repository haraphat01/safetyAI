import { LocationInfo, locationService } from './LocationService';

export interface SafetyZone {
  id: string;
  name: string;
  type: SafetyZoneType;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  distance: number; // in meters
  phone?: string;
  rating?: number;
  openNow?: boolean;
  icon?: string;
}

export enum SafetyZoneType {
  POLICE_STATION = 'police_station',
  HOSPITAL = 'hospital',
  FIRE_STATION = 'fire_station',
  EMBASSY = 'embassy',
  PHARMACY = 'pharmacy',
  URGENT_CARE = 'urgent_care',
  GAS_STATION = 'gas_station',
  ATM = 'atm',
  HOTEL = 'hotel',
  RESTAURANT = 'restaurant',
}

export interface SafetyZoneFilters {
  types: SafetyZoneType[];
  maxDistance: number; // in meters
  openNow?: boolean;
}

class SafetyZonesService {
  private readonly GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
  private readonly GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

  constructor() {
    if (!this.GOOGLE_PLACES_API_KEY) {
      console.warn('Google Places API key not found. Safety zones feature will be limited.');
    }
  }

  /**
   * Get nearby safety zones based on current location
   */
  public async getNearbySafetyZones(
    filters: SafetyZoneFilters = {
      types: [
        SafetyZoneType.POLICE_STATION,
        SafetyZoneType.HOSPITAL,
        SafetyZoneType.FIRE_STATION,
        SafetyZoneType.EMBASSY,
        SafetyZoneType.PHARMACY,
        SafetyZoneType.URGENT_CARE,
      ],
      maxDistance: 5000, // 5km default
    }
  ): Promise<SafetyZone[]> {
    try {
      const currentLocation = await locationService.getCurrentLocation();
      if (!currentLocation) {
        throw new Error('Unable to get current location');
      }

      const allZones: SafetyZone[] = [];

      // Fetch each type of safety zone
      for (const type of filters.types) {
        const zones = await this.fetchPlacesByType(
          currentLocation,
          type,
          filters.maxDistance,
          filters.openNow
        );
        allZones.push(...zones);
      }

      // Sort by distance
      allZones.sort((a, b) => a.distance - b.distance);

      return allZones;
    } catch (error) {
      console.error('Error fetching nearby safety zones:', error);
      // Return mock data if API is not available
      return this.getMockSafetyZones();
    }
  }

  /**
   * Fetch places from Google Places API by type
   */
  private async fetchPlacesByType(
    location: LocationInfo,
    type: SafetyZoneType,
    maxDistance: number,
    openNow?: boolean
  ): Promise<SafetyZone[]> {
    if (!this.GOOGLE_PLACES_API_KEY) {
      return this.getMockSafetyZonesByType(type);
    }

    try {
      const radius = Math.min(maxDistance, 50000); // Google Places API max radius is 50km
      const url = `${this.GOOGLE_PLACES_BASE_URL}/nearbysearch/json?` +
        `location=${location.latitude},${location.longitude}&` +
        `radius=${radius}&` +
        `type=${this.getGooglePlaceType(type)}&` +
        `key=${this.GOOGLE_PLACES_API_KEY}` +
        (openNow ? '&opennow=true' : '');

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        // Handle different error statuses appropriately
        if (data.status === 'ZERO_RESULTS') {
          console.log(`No ${type} places found in the specified radius`);
        } else {
          console.error('Google Places API error:', data.status, data.error_message);
        }
        return this.getMockSafetyZonesByType(type);
      }

      return data.results.map((place: any) => this.mapGooglePlaceToSafetyZone(place, location, type));
    } catch (error) {
      console.error(`Error fetching ${type} places:`, error);
      return this.getMockSafetyZonesByType(type);
    }
  }

  /**
   * Map Google Places API response to SafetyZone interface
   */
  private mapGooglePlaceToSafetyZone(
    place: any,
    userLocation: LocationInfo,
    type: SafetyZoneType
  ): SafetyZone {
    const distance = this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      place.geometry.location.lat,
      place.geometry.location.lng
    );

    return {
      id: place.place_id,
      name: place.name,
      type,
      address: place.vicinity || place.formatted_address || '',
      location: {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      },
      distance,
      rating: place.rating,
      openNow: place.opening_hours?.open_now,
      icon: place.icon,
    };
  }

  /**
   * Convert our SafetyZoneType to Google Places API type
   */
  private getGooglePlaceType(type: SafetyZoneType): string {
    const typeMap: Record<SafetyZoneType, string> = {
      [SafetyZoneType.POLICE_STATION]: 'police',
      [SafetyZoneType.HOSPITAL]: 'hospital',
      [SafetyZoneType.FIRE_STATION]: 'fire_station',
      [SafetyZoneType.EMBASSY]: 'embassy',
      [SafetyZoneType.PHARMACY]: 'pharmacy',
      [SafetyZoneType.URGENT_CARE]: 'health',
      [SafetyZoneType.GAS_STATION]: 'gas_station',
      [SafetyZoneType.ATM]: 'atm',
      [SafetyZoneType.HOTEL]: 'lodging',
      [SafetyZoneType.RESTAURANT]: 'restaurant',
    };
    return typeMap[type] || 'establishment';
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get mock safety zones for development/testing
   */
  private getMockSafetyZones(): SafetyZone[] {
    const mockZones: SafetyZone[] = [
      {
        id: '1',
        name: 'Central Police Station',
        type: SafetyZoneType.POLICE_STATION,
        address: '123 Main St, Downtown',
        location: { latitude: 37.7749, longitude: -122.4194 },
        distance: 500,
        phone: '+1-555-0123',
        rating: 4.2,
        openNow: true,
      },
      {
        id: '2',
        name: 'City General Hospital',
        type: SafetyZoneType.HOSPITAL,
        address: '456 Health Ave, Medical District',
        location: { latitude: 37.7849, longitude: -122.4094 },
        distance: 1200,
        phone: '+1-555-0456',
        rating: 4.5,
        openNow: true,
      },
      {
        id: '3',
        name: 'Downtown Fire Station',
        type: SafetyZoneType.FIRE_STATION,
        address: '789 Safety Blvd, Downtown',
        location: { latitude: 37.7649, longitude: -122.4294 },
        distance: 800,
        phone: '+1-555-0789',
        rating: 4.8,
        openNow: true,
      },
      {
        id: '4',
        name: 'Canadian Embassy',
        type: SafetyZoneType.EMBASSY,
        address: '321 Diplomat Way, Embassy Row',
        location: { latitude: 37.7949, longitude: -122.3994 },
        distance: 2000,
        phone: '+1-555-0321',
        rating: 4.0,
        openNow: false,
      },
      {
        id: '5',
        name: '24/7 Pharmacy',
        type: SafetyZoneType.PHARMACY,
        address: '654 Medicine St, Healthcare Plaza',
        location: { latitude: 37.7549, longitude: -122.4394 },
        distance: 1500,
        phone: '+1-555-0654',
        rating: 4.3,
        openNow: true,
      },
    ];

    return mockZones;
  }

  /**
   * Get mock safety zones by type
   */
  private getMockSafetyZonesByType(type: SafetyZoneType): SafetyZone[] {
    const allMockZones = this.getMockSafetyZones();
    return allMockZones.filter(zone => zone.type === type);
  }

  /**
   * Get safety zone details including phone number and opening hours
   */
  public async getSafetyZoneDetails(placeId: string): Promise<any> {
    if (!this.GOOGLE_PLACES_API_KEY) {
      return null;
    }

    try {
      const url = `${this.GOOGLE_PLACES_BASE_URL}/details/json?` +
        `place_id=${placeId}&` +
        `fields=formatted_phone_number,opening_hours,website,reviews&` +
        `key=${this.GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        // Handle different error statuses appropriately
        if (data.status === 'NOT_FOUND') {
          console.log('Safety zone details not found');
        } else {
          console.error('Google Places Details API error:', data.status, data.error_message);
        }
        return null;
      }

      return data.result;
    } catch (error) {
      console.error('Error fetching safety zone details:', error);
      return null;
    }
  }

  /**
   * Get directions to a safety zone
   */
  public getDirectionsUrl(safetyZone: SafetyZone): string {
    const { latitude, longitude } = safetyZone.location;
    const destination = `${latitude},${longitude}`;
    
    // Try to get user's current location
    const currentLocation = locationService.getCurrentLocationData();
    const origin = currentLocation 
      ? `${currentLocation.latitude},${currentLocation.longitude}`
      : '';

    if (origin) {
      return `https://www.google.com/maps/dir/${origin}/${destination}`;
    } else {
      return `https://www.google.com/maps/search/?api=1&query=${destination}`;
    }
  }

  /**
   * Get emergency contact information for a safety zone type
   */
  public getEmergencyContact(type: SafetyZoneType): string {
    const emergencyContacts: Record<SafetyZoneType, string> = {
      [SafetyZoneType.POLICE_STATION]: '911',
      [SafetyZoneType.HOSPITAL]: '911',
      [SafetyZoneType.FIRE_STATION]: '911',
      [SafetyZoneType.EMBASSY]: '911',
      [SafetyZoneType.PHARMACY]: '911',
      [SafetyZoneType.URGENT_CARE]: '911',
      [SafetyZoneType.GAS_STATION]: '911',
      [SafetyZoneType.ATM]: '911',
      [SafetyZoneType.HOTEL]: '911',
      [SafetyZoneType.RESTAURANT]: '911',
    };
    return emergencyContacts[type] || '911';
  }
}

export const safetyZonesService = new SafetyZonesService(); 