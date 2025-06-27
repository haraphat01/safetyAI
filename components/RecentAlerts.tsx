import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThreatDetection } from '@/services/AISafetyMonitor';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface RecentAlertsProps {
  recentThreats: ThreatDetection[];
}

export default function RecentAlerts({ recentThreats }: RecentAlertsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (recentThreats.length === 0) {
    return null;
  }

  return (
    <View style={styles.recentAlerts}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Alerts</Text>
      {recentThreats.map((threat, index) => (
        <View key={index} style={[styles.alertItem, { backgroundColor: colors.card }]}>
          <Ionicons
            name={threat.type === 'fall' ? 'warning' : 'alert-circle'}
            size={20}
            color="#FF6B6B"
          />
          <View style={styles.alertContent}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              {threat.type.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={[styles.alertTime, { color: colors.tabIconDefault }]}>
              {new Date(threat.timestamp).toLocaleTimeString()}
            </Text>
          </View>
          <Text style={[styles.alertConfidence, { color: colors.tint }]}>
            {Math.round(threat.confidence * 100)}%
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  recentAlerts: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  alertContent: {
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
  alertConfidence: {
    fontSize: 12,
    fontWeight: '600',
  },
}); 