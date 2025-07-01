import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface QuickActionsProps {
  onCheckIn: () => void;
  onContacts: () => void;
  onSettings: () => void;
  onSafetyTips: () => void;
  onFakeCall: () => void;
  hasActiveCheckIn: boolean;
}

export default function QuickActions({ 
  onCheckIn, 
  onContacts, 
  onSettings, 
  onSafetyTips, 
  onFakeCall,
  hasActiveCheckIn 
}: QuickActionsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.quickActions}>
      <View className="actionGrid" style={styles.actionGrid}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={onCheckIn}
          disabled={hasActiveCheckIn}
        >
          <Ionicons name="location" size={24} color={colors.tint} />
          <Text style={[styles.actionText, { color: colors.text }]}>Check In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={onContacts}
        >
          <Ionicons name="people" size={24} color={colors.tint} />
          <Text style={[styles.actionText, { color: colors.text }]}>Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={onSettings}
        >
          <Ionicons name="settings" size={24} color={colors.tint} />
          <Text style={[styles.actionText, { color: colors.text }]}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={onSafetyTips}
        >
          <Ionicons name="shield" size={24} color={colors.tint} />
          <Text style={[styles.actionText, { color: colors.text }]}>Safety Tips</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={onFakeCall}
        >
          <Ionicons name="call" size={24} color={colors.tint} />
          <Text style={[styles.actionText, { color: colors.text }]}>Fake Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  quickActions: {
    marginBottom: 24,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 60) / 2,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
}); 