import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface AIMonitoringStatusProps {
  isMonitoring: boolean;
  monitoringPulse: Animated.Value;
}

export default function AIMonitoringStatus({ isMonitoring, monitoringPulse }: AIMonitoringStatusProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
      <View style={styles.statusHeader}>
        <Animated.View style={[styles.monitoringIndicator, { transform: [{ scale: monitoringPulse }] }]}>
          <Ionicons
            name={isMonitoring ? "shield-checkmark" : "shield-outline"}
            size={24}
            color={isMonitoring ? "#4CAF50" : colors.tabIconDefault}
          />
        </Animated.View>
        <Text style={[styles.statusTitle, { color: colors.text }]}>
          AI Safety Monitor
        </Text>
      </View>
      <Text style={[styles.statusText, { color: colors.tabIconDefault }]}>
        {isMonitoring
          ? "Active - Monitoring for threats"
          : "Inactive - Please enable permissions"
        }
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  monitoringIndicator: {
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
  },
}); 