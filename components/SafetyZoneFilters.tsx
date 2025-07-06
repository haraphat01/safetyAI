import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SafetyZoneFilters, SafetyZoneType } from '@/services/SafetyZonesService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SafetyZoneFiltersProps {
  filters: SafetyZoneFilters;
  onFiltersChange: (filters: SafetyZoneFilters) => void;
}

export default function SafetyZoneFiltersComponent({ filters, onFiltersChange }: SafetyZoneFiltersProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showModal, setShowModal] = useState(false);

  const allTypes = [
    SafetyZoneType.POLICE_STATION,
    SafetyZoneType.HOSPITAL,
    SafetyZoneType.FIRE_STATION,
    SafetyZoneType.EMBASSY,
    SafetyZoneType.PHARMACY,
    SafetyZoneType.URGENT_CARE,
    SafetyZoneType.GAS_STATION,
    SafetyZoneType.ATM,
    SafetyZoneType.HOTEL,
    SafetyZoneType.RESTAURANT,
  ];

  const distanceOptions = [
    { label: '1km', value: 1000 },
    { label: '2km', value: 2000 },
    { label: '5km', value: 5000 },
    { label: '10km', value: 10000 },
    { label: '25km', value: 25000 },
  ];

  const getTypeLabel = (type: SafetyZoneType): string => {
    const labelMap: Record<SafetyZoneType, string> = {
      [SafetyZoneType.POLICE_STATION]: 'Police',
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
    return labelMap[type] || 'Unknown';
  };

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

  const toggleType = (type: SafetyZoneType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    
    onFiltersChange({
      ...filters,
      types: newTypes,
    });
  };

  const setDistance = (distance: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFiltersChange({
      ...filters,
      maxDistance: distance,
    });
  };

  const toggleOpenNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFiltersChange({
      ...filters,
      openNow: filters.openNow === undefined ? true : filters.openNow === true ? false : undefined,
    });
  };

  const resetFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onFiltersChange({
      types: [
        SafetyZoneType.POLICE_STATION,
        SafetyZoneType.HOSPITAL,
        SafetyZoneType.FIRE_STATION,
        SafetyZoneType.EMBASSY,
        SafetyZoneType.PHARMACY,
        SafetyZoneType.URGENT_CARE,
      ],
      maxDistance: 5000,
      openNow: undefined,
    });
  };

  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (filters.types.length !== 6) count++; // Not default types
    if (filters.maxDistance !== 5000) count++; // Not default distance
    if (filters.openNow !== undefined) count++; // Has open now filter
    return count;
  };

  const getDistanceLabel = (distance: number): string => {
    const option = distanceOptions.find(opt => opt.value === distance);
    return option ? option.label : `${(distance / 1000).toFixed(0)}km`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.filterButton, { backgroundColor: colors.background }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowModal(true);
        }}
      >
        <Ionicons name="filter" size={20} color={colors.tint} />
        <Text style={[styles.filterButtonText, { color: colors.tint }]}>
          Filters
        </Text>
        {getActiveFiltersCount() > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.tint }]}>
            <Text style={styles.badgeText}>{getActiveFiltersCount()}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Safety Zones</Text>
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Types Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Types</Text>
              <View style={styles.typesGrid}>
                {allTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: filters.types.includes(type) ? colors.tint : colors.tabIconDefault,
                      },
                    ]}
                    onPress={() => toggleType(type)}
                  >
                    <Ionicons
                      name={getTypeIcon(type)}
                      size={16}
                      color={filters.types.includes(type) ? 'white' : colors.text}
                    />
                    <Text
                      style={[
                        styles.typeChipText,
                        {
                          color: filters.types.includes(type) ? 'white' : colors.text,
                        },
                      ]}
                    >
                      {getTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Distance Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Maximum Distance</Text>
              <View style={styles.distanceOptions}>
                {distanceOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.distanceChip,
                      {
                        backgroundColor: filters.maxDistance === option.value ? colors.tint : colors.tabIconDefault,
                      },
                    ]}
                    onPress={() => setDistance(option.value)}
                  >
                    <Text
                      style={[
                        styles.distanceChipText,
                        {
                          color: filters.maxDistance === option.value ? 'white' : colors.text,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Open Now Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Availability</Text>
              <TouchableOpacity
                style={[
                  styles.openNowChip,
                  {
                    backgroundColor: filters.openNow === true ? colors.tint : colors.tabIconDefault,
                  },
                ]}
                onPress={toggleOpenNow}
              >
                <Ionicons
                  name="time"
                  size={16}
                  color={filters.openNow === true ? 'white' : colors.text}
                />
                <Text
                  style={[
                    styles.openNowChipText,
                    {
                      color: filters.openNow === true ? 'white' : colors.text,
                    },
                  ]}
                >
                  Open Now Only
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.resetButton, { borderColor: colors.tint }]}
              onPress={resetFilters}
            >
              <Text style={[styles.resetButtonText, { color: colors.tint }]}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.tint }]}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  distanceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  distanceChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  distanceChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  openNowChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  openNowChipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 