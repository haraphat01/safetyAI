import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface CrimeAlert {
  type: string;
  severity: string;
  timestamp: string;
}

interface CrimeAlertsProps {
  crimeAlerts: CrimeAlert[];
}

export default function CrimeAlerts({ crimeAlerts }: CrimeAlertsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (crimeAlerts.length === 0) {
    return null;
  }

  return (
    <View style={styles.recentAlerts}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Safety Warnings</Text>
      {crimeAlerts.map((alert, index) => (
        <View key={index} style={[styles.alertItem, { backgroundColor: colors.card }]}>
          <Ionicons
            name={alert.severity === 'high' ? 'warning' : 'alert-circle'}
            size={20}
            color={alert.severity === 'high' ? '#F44336' : '#FF9800'}
          />
          <View style={styles.alertContent}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              {alert.type.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={[styles.alertTime, { color: colors.tabIconDefault }]}>
              {new Date(alert.timestamp).toLocaleTimeString()}
            </Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: alert.severity === 'high' ? '#F44336' : '#FF9800' }]}>
            <Text style={styles.severityText}>{alert.severity.toUpperCase()}</Text>
          </View>
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
  severityBadge: {
    padding: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 