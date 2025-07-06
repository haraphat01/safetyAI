import { locationService } from '@/services/LocationService';
import {
    SafetyZone,
    SafetyZoneFilters,
    safetyZonesService,
    SafetyZoneType,
} from '@/services/SafetyZonesService';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export interface UseSafetyZonesReturn {
  safetyZones: SafetyZone[];
  filteredZones: SafetyZone[];
  loading: boolean;
  refreshing: boolean;
  locationPermission: boolean | null;
  filters: SafetyZoneFilters;
  loadSafetyZones: () => Promise<void>;
  onRefresh: () => Promise<void>;
  setFilters: (filters: SafetyZoneFilters) => void;
  requestLocationPermission: () => Promise<void>;
  getTypeCount: (type: SafetyZoneType) => number;
}

export function useSafetyZones(): UseSafetyZonesReturn {
  const [safetyZones, setSafetyZones] = useState<SafetyZone[]>([]);
  const [filteredZones, setFilteredZones] = useState<SafetyZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [filters, setFiltersState] = useState<SafetyZoneFilters>({
    types: [
      SafetyZoneType.POLICE_STATION,
      SafetyZoneType.HOSPITAL,
      SafetyZoneType.FIRE_STATION,
      SafetyZoneType.EMBASSY,
      SafetyZoneType.PHARMACY,
      SafetyZoneType.URGENT_CARE,
    ],
    maxDistance: 5000,
  });

  const loadSafetyZones = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check location permission
      const location = await locationService.getCurrentLocation();
      if (!location) {
        setLocationPermission(false);
        setLoading(false);
        return;
      }
      
      setLocationPermission(true);
      
      // Fetch safety zones
      const zones = await safetyZonesService.getNearbySafetyZones(filters);
      setSafetyZones(zones);
      setFilteredZones(zones);
    } catch (error) {
      console.error('Error loading safety zones:', error);
      Alert.alert(
        'Error',
        'Unable to load nearby safety zones. Please check your location permissions and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSafetyZones();
    setRefreshing(false);
  }, [loadSafetyZones]);

  const setFilters = useCallback((newFilters: SafetyZoneFilters) => {
    setFiltersState(newFilters);
  }, []);

  const requestLocationPermission = useCallback(async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setLocationPermission(true);
        await loadSafetyZones();
      } else {
        setLocationPermission(false);
        Alert.alert(
          'Location Permission Required',
          'This feature requires location access to show nearby safety zones. Please enable location permissions in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {} }, // Could open settings
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationPermission(false);
    }
  }, [loadSafetyZones]);

  const getTypeCount = useCallback((type: SafetyZoneType): number => {
    return filteredZones.filter(zone => zone.type === type).length;
  }, [filteredZones]);

  // Apply filters when they change
  useEffect(() => {
    const filtered = safetyZones.filter(zone => {
      // Filter by type
      if (!filters.types.includes(zone.type)) {
        return false;
      }
      
      // Filter by distance
      if (zone.distance > filters.maxDistance) {
        return false;
      }
      
      // Filter by open now
      if (filters.openNow === true && zone.openNow === false) {
        return false;
      }
      
      return true;
    });
    
    setFilteredZones(filtered);
  }, [safetyZones, filters]);

  // Load safety zones on mount and when filters change
  useEffect(() => {
    loadSafetyZones();
  }, [loadSafetyZones]);

  return {
    safetyZones,
    filteredZones,
    loading,
    refreshing,
    locationPermission,
    filters,
    loadSafetyZones,
    onRefresh,
    setFilters,
    requestLocationPermission,
    getTypeCount,
  };
} 