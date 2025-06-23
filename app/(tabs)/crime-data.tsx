import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import CrimeometerService, { CrimeAlert, CrimeData, SafetyZone } from '@/services/CrimeometerService';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function CrimeDataScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  
  const [crimeData, setCrimeData] = useState<CrimeData[]>([]);
  const [safetyZones, setSafetyZones] = useState<SafetyZone[]>([]);
  const [crimeAlerts, setCrimeAlerts] = useState<CrimeAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    loadCrimeData();
  }, []);

  const loadCrimeData = async () => {
    try {
      setLoading(true);
      
      // Get user location
      const location = await getCurrentLocation();
      if (!location) {
        Alert.alert('Location Error', 'Unable to get your location. Please enable location services.');
        return;
      }

      setUserLocation(location);

      // Fetch crime data, safety zones, and alerts
      const [crime, zones, alerts] = await Promise.all([
        CrimeometerService.getCrimeData(location.latitude, location.longitude, 1000),
        CrimeometerService.getSafetyZones(location.latitude, location.longitude),
        CrimeometerService.getCrimeAlerts(location.latitude, location.longitude),
      ]);

      setCrimeData(crime);
      setSafetyZones(zones);
      setCrimeAlerts(alerts);
    } catch (error) {
      console.error('Error loading crime data:', error);
      Alert.alert('Error', 'Failed to load crime data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show crime data.');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCrimeData();
    setRefreshing(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#F44336';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return colors.tabIconDefault;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'warning';
      case 'medium':
        return 'alert-circle';
      case 'low':
        return 'checkmark-circle';
      default:
        return 'information-circle';
    }
  };

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m away`;
    } else {
      return `${(distance / 1000).toFixed(1)}km away`;
    }
  };

  const renderCrimeAlert = (alert: CrimeAlert) => (
    <View key={alert.timestamp} style={[styles.alertCard, { backgroundColor: colors.card }]}>
      <View style={styles.alertHeader}>
        <Ionicons 
          name={getSeverityIcon(alert.severity)} 
          size={24} 
          color={getSeverityColor(alert.severity)} 
        />
        <View style={styles.alertInfo}>
          <Text style={[styles.alertTitle, { color: colors.text }]}>
            {alert.type.replace('_', ' ').toUpperCase()}
          </Text>
          <Text style={[styles.alertTime, { color: colors.tabIconDefault }]}>
            {new Date(alert.timestamp).toLocaleTimeString()}
          </Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
          <Text style={styles.severityText}>{alert.severity.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={[styles.alertMessage, { color: colors.text }]}>
        {alert.message}
      </Text>
      <Text style={[styles.alertDistance, { color: colors.tabIconDefault }]}>
        {formatDistance(alert.distance)}
      </Text>
    </View>
  );

  const renderCrimeIncident = (crime: CrimeData) => (
    <View key={crime.id} style={[styles.crimeCard, { backgroundColor: colors.card }]}>
      <View style={styles.crimeHeader}>
        <Ionicons 
          name={getSeverityIcon(crime.severity)} 
          size={20} 
          color={getSeverityColor(crime.severity)} 
        />
        <View style={styles.crimeInfo}>
          <Text style={[styles.crimeType, { color: colors.text }]}>
            {crime.type.toUpperCase()}
          </Text>
          <Text style={[styles.crimeTime, { color: colors.tabIconDefault }]}>
            {new Date(crime.timestamp).toLocaleString()}
          </Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(crime.severity) }]}>
          <Text style={styles.severityText}>{crime.severity.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={[styles.crimeDescription, { color: colors.text }]}>
        {crime.description}
      </Text>
      <Text style={[styles.crimeDistance, { color: colors.tabIconDefault }]}>
        {formatDistance(crime.distance)}
      </Text>
    </View>
  );

  const renderSafetyZone = (zone: SafetyZone) => (
    <View key={zone.id} style={[styles.zoneCard, { backgroundColor: colors.card }]}>
      <View style={styles.zoneHeader}>
        <Ionicons 
          name="shield-outline" 
          size={20} 
          color={getSeverityColor(zone.crimeLevel)} 
        />
        <View style={styles.zoneInfo}>
          <Text style={[styles.zoneName, { color: colors.text }]}>
            {zone.name}
          </Text>
          <Text style={[styles.zoneTime, { color: colors.tabIconDefault }]}>
            Updated: {new Date(zone.lastUpdated).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(zone.crimeLevel) }]}>
          <Text style={styles.severityText}>{zone.crimeLevel.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={[styles.zoneRadius, { color: colors.tabIconDefault }]}>
        Radius: {zone.radius}m
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="location" size={48} color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading crime data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Crime Data</Text>
          <TouchableOpacity onPress={loadCrimeData} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color={colors.tint} />
          </TouchableOpacity>
        </View>

        {/* Crime Alerts */}
        {crimeAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Safety Alerts
            </Text>
            {crimeAlerts.map(renderCrimeAlert)}
          </View>
        )}

        {/* Recent Crime Incidents */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Incidents
          </Text>
          {crimeData.length > 0 ? (
            crimeData.slice(0, 5).map(renderCrimeIncident)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No recent incidents in your area
              </Text>
            </View>
          )}
        </View>

        {/* Safety Zones */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Safety Zones
          </Text>
          {safetyZones.length > 0 ? (
            safetyZones.map(renderSafetyZone)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="shield" size={48} color={colors.tabIconDefault} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No safety zones defined in your area
              </Text>
            </View>
          )}
        </View>

        {/* Report Incident Button */}
        <TouchableOpacity
          style={[styles.reportButton, { backgroundColor: colors.tint }]}
          onPress={() => {
            Alert.alert(
              'Report Incident',
              'This feature will allow you to report safety incidents in your area.',
              [{ text: 'OK' }]
            );
          }}
        >
          <Ionicons name="add-circle" size={20} color={colors.buttonText} />
          <Text style={[styles.reportButtonText, { color: colors.buttonText }]}>
            Report Incident
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  alertCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertInfo: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  alertTime: {
    fontSize: 12,
    marginTop: 2,
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  alertDistance: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  crimeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  crimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  crimeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  crimeType: {
    fontSize: 14,
    fontWeight: '600',
  },
  crimeTime: {
    fontSize: 12,
    marginTop: 2,
  },
  crimeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  crimeDistance: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  zoneCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneInfo: {
    flex: 1,
    marginLeft: 12,
  },
  zoneName: {
    fontSize: 14,
    fontWeight: '600',
  },
  zoneTime: {
    fontSize: 12,
    marginTop: 2,
  },
  zoneRadius: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 32,
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 