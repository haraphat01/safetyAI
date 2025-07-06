import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SafetyZoneCard from '@/components/SafetyZoneCard';
import SafetyZoneFiltersComponent from '@/components/SafetyZoneFilters';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafetyZones } from '@/hooks/useSafetyZones';
import {
  SafetyZone,
  SafetyZoneFilters,
  safetyZonesService,
  SafetyZoneType,
} from '@/services/SafetyZonesService';
import * as Haptics from 'expo-haptics';

export default function SafetyZonesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const {
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
  } = useSafetyZones();

  const handleFiltersChange = useCallback((newFilters: SafetyZoneFilters) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilters(newFilters);
  }, [setFilters]);

  const handleSafetyZonePress = useCallback((safetyZone: SafetyZone) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      safetyZone.name,
      `${safetyZone.address}\n\nDistance: ${safetyZone.distance < 1000 ? `${Math.round(safetyZone.distance)}m` : `${(safetyZone.distance / 1000).toFixed(1)}km`}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Get Directions',
          onPress: () => {
            const directionsUrl = safetyZonesService.getDirectionsUrl(safetyZone);
            // This will be handled by the SafetyZoneCard component
          },
        },
        {
          text: 'Call',
          onPress: () => {
            const phoneNumber = safetyZone.phone || safetyZonesService.getEmergencyContact(safetyZone.type);
            // This will be handled by the SafetyZoneCard component
          },
        },
      ]
    );
  }, []);

  const getTypeLabel = (type: SafetyZoneType): string => {
    const labelMap: Record<SafetyZoneType, string> = {
      [SafetyZoneType.POLICE_STATION]: 'Police',
      [SafetyZoneType.HOSPITAL]: 'Hospital',
      [SafetyZoneType.FIRE_STATION]: 'Fire',
      [SafetyZoneType.EMBASSY]: 'Embassy',
      [SafetyZoneType.PHARMACY]: 'Pharmacy',
      [SafetyZoneType.URGENT_CARE]: 'Urgent Care',
      [SafetyZoneType.GAS_STATION]: 'Gas',
      [SafetyZoneType.ATM]: 'ATM',
      [SafetyZoneType.HOTEL]: 'Hotel',
      [SafetyZoneType.RESTAURANT]: 'Restaurant',
    };
    return labelMap[type] || 'Unknown';
  };

  if (locationPermission === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.permissionContainer}>
          <Ionicons name="location-outline" size={64} color={colors.tabIconDefault} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>
            Location Permission Required
          </Text>
          <Text style={[styles.permissionText, { color: colors.tabIconDefault }]}>
            To show nearby safety zones, we need access to your location.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.tint }]}
            onPress={requestLocationPermission}
          >
            <Text style={styles.permissionButtonText}>Enable Location Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Safety Zones</Text>
          <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
            Nearby emergency services & important locations
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: colors.tint }]}
          onPress={onRefresh}
          disabled={loading}
        >
          <Ionicons name="refresh" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <SafetyZoneFiltersComponent filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Type Summary */}
      {filteredZones.length > 0 && (
        <View style={styles.summaryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.types.map((type) => {
              const count = getTypeCount(type);
              if (count === 0) return null;
              
              return (
                <View key={type} style={[styles.summaryChip, { backgroundColor: colors.tabIconDefault }]}>
                  <Text style={[styles.summaryText, { color: colors.text }]}>
                    {getTypeLabel(type)}: {count}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
              Finding nearby safety zones...
            </Text>
          </View>
        ) : filteredZones.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color={colors.tabIconDefault} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No safety zones found
            </Text>
            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
              Try adjusting your filters or expanding the search radius
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.tint }]}
              onPress={() => {
                setFilters({
                  types: [
                    SafetyZoneType.POLICE_STATION,
                    SafetyZoneType.HOSPITAL,
                    SafetyZoneType.FIRE_STATION,
                    SafetyZoneType.EMBASSY,
                    SafetyZoneType.PHARMACY,
                    SafetyZoneType.URGENT_CARE,
                  ],
                  maxDistance: 10000,
                });
              }}
            >
              <Text style={styles.emptyButtonText}>Expand Search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredZones.map((safetyZone) => (
            <SafetyZoneCard
              key={safetyZone.id}
              safetyZone={safetyZone}
              onPress={handleSafetyZonePress}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingRight: 24, // Extra padding on the right to prevent cutoff
  },
  headerTextContainer: {
    flex: 1, // Take up available space
    marginRight: 12, // Add margin to prevent overlap with button
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8, // Add some margin to prevent cutoff
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  summaryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 