import { supabase } from '@/lib/supabase';

export interface CrimeData {
  id: string;
  type: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  distance: number; // Distance from user location in meters
}

export interface SafetyZone {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number; // Safety zone radius in meters
  crimeLevel: 'low' | 'medium' | 'high';
  lastUpdated: string;
}

export interface CrimeAlert {
  type: 'crime_warning' | 'safety_zone' | 'high_risk_area';
  message: string;
  severity: 'low' | 'medium' | 'high';
  location: {
    latitude: number;
    longitude: number;
  };
  distance: number;
  timestamp: string;
}

class CrimeometerService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.crimeometer.com/v1';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeAPI();
  }

  private async initializeAPI() {
    try {
      // In a real app, you'd get this from environment variables or secure storage
      // For now, we'll use a placeholder that would be replaced with actual API key
      this.apiKey = process.env.EXPO_PUBLIC_CRIMEOMETER_API_KEY || null;
      
      if (!this.apiKey) {
        console.warn('Crimeometer API key not found. Using mock data.');
      }
    } catch (error) {
      console.error('Failed to initialize Crimeometer API:', error);
    }
  }

  public async getCrimeData(latitude: number, longitude: number, radius: number = 1000): Promise<CrimeData[]> {
    try {
      const cacheKey = `${latitude},${longitude},${radius}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // Use Supabase Edge Function for secure API calls
      const { data, error } = await supabase.functions.invoke('crime-data', {
        body: {
          latitude,
          longitude,
          radius,
          type: 'incidents',
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        // Fallback to mock data
        return this.getMockCrimeData(latitude, longitude, radius);
      }

      const crimeData = this.transformCrimeData(data, latitude, longitude);
      
      this.cache.set(cacheKey, { data: crimeData, timestamp: Date.now() });
      
      return crimeData;
    } catch (error) {
      console.error('Error fetching crime data:', error);
      // Fallback to mock data
      return this.getMockCrimeData(latitude, longitude, radius);
    }
  }

  public async getSafetyZones(latitude: number, longitude: number): Promise<SafetyZone[]> {
    try {
      // Use Supabase Edge Function for secure API calls
      const { data, error } = await supabase.functions.invoke('crime-data', {
        body: {
          latitude,
          longitude,
          type: 'safety-zones',
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        return this.getMockSafetyZones(latitude, longitude);
      }

      return this.transformSafetyZones(data);
    } catch (error) {
      console.error('Error fetching safety zones:', error);
      return this.getMockSafetyZones(latitude, longitude);
    }
  }

  public async getCrimeAlerts(latitude: number, longitude: number): Promise<CrimeAlert[]> {
    try {
      const [crimeData, safetyZones] = await Promise.all([
        this.getCrimeData(latitude, longitude, 500), // 500m radius for alerts
        this.getSafetyZones(latitude, longitude),
      ]);

      const alerts: CrimeAlert[] = [];

      // Check for recent crimes
      const recentCrimes = crimeData.filter(
        crime => Date.now() - new Date(crime.timestamp).getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
      );

      if (recentCrimes.length > 0) {
        const highSeverityCrimes = recentCrimes.filter(crime => crime.severity === 'high');
        if (highSeverityCrimes.length > 0) {
          alerts.push({
            type: 'crime_warning',
            message: `High crime activity detected in your area. ${highSeverityCrimes.length} incidents reported in the last 24 hours.`,
            severity: 'high',
            location: { latitude, longitude },
            distance: Math.min(...highSeverityCrimes.map(c => c.distance)),
            timestamp: new Date().toISOString(),
          });
        } else if (recentCrimes.length > 3) {
          alerts.push({
            type: 'crime_warning',
            message: `Multiple incidents reported in your area. Stay alert and consider alternative routes.`,
            severity: 'medium',
            location: { latitude, longitude },
            distance: Math.min(...recentCrimes.map(c => c.distance)),
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Check safety zones
      const nearbySafetyZones = safetyZones.filter(zone => zone.crimeLevel === 'high');
      if (nearbySafetyZones.length > 0) {
        alerts.push({
          type: 'high_risk_area',
          message: `You are near a high-risk area. Exercise extra caution and stay in well-lit areas.`,
          severity: 'medium',
          location: { latitude, longitude },
          distance: Math.min(...nearbySafetyZones.map(z => this.calculateDistance(latitude, longitude, z.location.latitude, z.location.longitude))),
          timestamp: new Date().toISOString(),
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error generating crime alerts:', error);
      return [];
    }
  }

  public async logIncident(userId: string, incidentData: {
    type: string;
    description: string;
    location: { latitude: number; longitude: number };
    severity: 'low' | 'medium' | 'high';
  }) {
    try {
      const { error } = await supabase
        .from('incident_logs')
        .insert({
          user_id: userId,
          incident_type: incidentData.type,
          description: incidentData.description,
          location: incidentData.location,
        });

      if (error) throw error;

      console.log('Incident logged successfully');
    } catch (error) {
      console.error('Error logging incident:', error);
      throw error;
    }
  }

  private transformCrimeData(apiData: any, userLat: number, userLon: number): CrimeData[] {
    // Transform API response to our format
    return apiData.incidents?.map((incident: any) => ({
      id: incident.id || Math.random().toString(),
      type: incident.type || 'unknown',
      description: incident.description || 'Crime incident reported',
      location: {
        latitude: incident.latitude || 0,
        longitude: incident.longitude || 0,
      },
      timestamp: incident.timestamp || new Date().toISOString(),
      severity: this.calculateSeverity(incident),
      distance: this.calculateDistance(userLat, userLon, incident.latitude, incident.longitude),
    })) || [];
  }

  private transformSafetyZones(apiData: any): SafetyZone[] {
    return apiData.zones?.map((zone: any) => ({
      id: zone.id || Math.random().toString(),
      name: zone.name || 'Safety Zone',
      location: {
        latitude: zone.latitude || 0,
        longitude: zone.longitude || 0,
      },
      radius: zone.radius || 100,
      crimeLevel: zone.crime_level || 'low',
      lastUpdated: zone.last_updated || new Date().toISOString(),
    })) || [];
  }

  private calculateSeverity(incident: any): 'low' | 'medium' | 'high' {
    // Simple severity calculation based on incident type
    const highSeverityTypes = ['assault', 'robbery', 'burglary', 'homicide'];
    const mediumSeverityTypes = ['theft', 'vandalism', 'drugs'];
    
    const type = incident.type?.toLowerCase() || '';
    
    if (highSeverityTypes.some(t => type.includes(t))) return 'high';
    if (mediumSeverityTypes.some(t => type.includes(t))) return 'medium';
    return 'low';
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private getMockCrimeData(latitude: number, longitude: number, radius: number): CrimeData[] {
    const mockIncidents = [
      {
        type: 'theft',
        description: 'Vehicle break-in reported',
        severity: 'medium' as const,
        offset: { lat: 0.001, lon: 0.001 },
      },
      {
        type: 'vandalism',
        description: 'Property damage incident',
        severity: 'low' as const,
        offset: { lat: -0.002, lon: 0.001 },
      },
      {
        type: 'assault',
        description: 'Assault incident reported',
        severity: 'high' as const,
        offset: { lat: 0.003, lon: -0.002 },
      },
    ];

    return mockIncidents.map((incident, index) => ({
      id: `mock-${index}`,
      type: incident.type,
      description: incident.description,
      location: {
        latitude: latitude + incident.offset.lat,
        longitude: longitude + incident.offset.lon,
      },
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      severity: incident.severity,
      distance: Math.random() * radius,
    }));
  }

  private getMockSafetyZones(latitude: number, longitude: number): SafetyZone[] {
    return [
      {
        id: 'zone-1',
        name: 'Downtown Safety Zone',
        location: {
          latitude: latitude + 0.005,
          longitude: longitude + 0.005,
        },
        radius: 200,
        crimeLevel: 'medium',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'zone-2',
        name: 'High Risk Area',
        location: {
          latitude: latitude - 0.003,
          longitude: longitude - 0.003,
        },
        radius: 150,
        crimeLevel: 'high',
        lastUpdated: new Date().toISOString(),
      },
    ];
  }
}

export default new CrimeometerService(); 