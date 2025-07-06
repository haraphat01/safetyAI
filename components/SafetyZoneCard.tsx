import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SafetyZone, SafetyZoneType, safetyZonesService } from '@/services/SafetyZonesService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SafetyZoneCardProps {
  safetyZone: SafetyZone;
  onPress?: (safetyZone: SafetyZone) => void;
}

export default function SafetyZoneCard({ safetyZone, onPress }: SafetyZoneCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getTypeIcon = (type: SafetyZoneType): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<SafetyZoneType, keyof typeof Ionicons.glyphMap> = {
      [SafetyZoneType.POLICE_STATION]: 'shield',
      [SafetyZoneType.HOSPITAL]: 'medical',
      [SafetyZoneType.FIRE_STATION]: 'flame',
      [SafetyZoneType.EMBASSY]: 'business',
      [SafetyZoneType.PHARMACY]: 'medical-outline',
      [SafetyZoneType.URGENT_CARE]: 'fitness',
      [SafetyZoneType.GAS_STATION]: 'car',
      [SafetyZoneType.ATM]: 'card',
      [SafetyZoneType.HOTEL]: 'bed',
      [SafetyZoneType.RESTAURANT]: 'restaurant',
    };
    return iconMap[type] || 'location';
  };

  const getTypeColor = (type: SafetyZoneType): string => {
    const colorMap: Record<SafetyZoneType, string> = {
      [SafetyZoneType.POLICE_STATION]: '#3B82F6', // Blue
      [SafetyZoneType.HOSPITAL]: '#EF4444', // Red
      [SafetyZoneType.FIRE_STATION]: '#F59E0B', // Amber
      [SafetyZoneType.EMBASSY]: '#8B5CF6', // Purple
      [SafetyZoneType.PHARMACY]: '#10B981', // Green
      [SafetyZoneType.URGENT_CARE]: '#F97316', // Orange
      [SafetyZoneType.GAS_STATION]: '#6B7280', // Gray
      [SafetyZoneType.ATM]: '#059669', // Emerald
      [SafetyZoneType.HOTEL]: '#EC4899', // Pink
      [SafetyZoneType.RESTAURANT]: '#DC2626', // Red
    };
    return colorMap[type] || '#6B7280';
  };

  const getTypeLabel = (type: SafetyZoneType): string => {
    const labelMap: Record<SafetyZoneType, string> = {
      [SafetyZoneType.POLICE_STATION]: 'Police Station',
      [SafetyZoneType.HOSPITAL]: 'Hospital',
      [SafetyZoneType.FIRE_STATION]: 'Fire Station',
      [SafetyZoneType.EMBASSY]: 'Embassy',
      [SafetyZoneType.PHARMACY]: 'Pharmacy',
      [SafetyZoneType.URGENT_CARE]: 'Urgent Care',
      [SafetyZoneType.GAS_STATION]: 'Gas Station',
      [SafetyZoneType.ATM]: 'ATM',
      [SafetyZoneType.HOTEL]: 'Hotel',
      [SafetyZoneType.RESTAURANT]: 'Restaurant',
    };
    return labelMap[type] || 'Safety Zone';
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  const handleDirections = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const directionsUrl = safetyZonesService.getDirectionsUrl(safetyZone);
      const supported = await Linking.canOpenURL(directionsUrl);
      
      if (supported) {
        await Linking.openURL(directionsUrl);
      } else {
        Alert.alert('Error', 'Unable to open directions');
      }
    } catch (error) {
      console.error('Error opening directions:', error);
      Alert.alert('Error', 'Unable to open directions');
    }
  };

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const phoneNumber = safetyZone.phone || safetyZonesService.getEmergencyContact(safetyZone.type);
    
    Alert.alert(
      'Call Emergency Services',
      `Call ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber}`);
          },
        },
      ]
    );
  };

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(safetyZone);
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.background }]}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: getTypeColor(safetyZone.type) }]}>
          <Ionicons name={getTypeIcon(safetyZone.type)} size={24} color="white" />
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {safetyZone.name}
          </Text>
          <Text style={[styles.type, { color: colors.tabIconDefault }]}>
            {getTypeLabel(safetyZone.type)}
          </Text>
        </View>
        <View style={styles.distanceContainer}>
          <Text style={[styles.distance, { color: colors.tint }]}>
            {formatDistance(safetyZone.distance)}
          </Text>
        </View>
      </View>

      <Text style={[styles.address, { color: colors.tabIconDefault }]} numberOfLines={2}>
        {safetyZone.address}
      </Text>

      <View style={styles.footer}>
        <View style={styles.ratingContainer}>
          {safetyZone.rating && (
            <View style={styles.rating}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={[styles.ratingText, { color: colors.tabIconDefault }]}>
                {safetyZone.rating.toFixed(1)}
              </Text>
            </View>
          )}
          {safetyZone.openNow !== undefined && (
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot,
                { backgroundColor: safetyZone.openNow ? '#10B981' : '#EF4444' }
              ]} />
              <Text style={[styles.statusText, { color: colors.tabIconDefault }]}>
                {safetyZone.openNow ? 'Open' : 'Closed'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={handleDirections}
          >
            <Ionicons name="navigate" size={18} color="white" />
            <Text style={styles.actionButtonText}>Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
            onPress={handleCall}
          >
            <Ionicons name="call" size={18} color="white" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  type: {
    fontSize: 14,
    fontWeight: '500',
  },
  distanceContainer: {
    alignItems: 'flex-end',
  },
  distance: {
    fontSize: 16,
    fontWeight: '700',
  },
  address: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 