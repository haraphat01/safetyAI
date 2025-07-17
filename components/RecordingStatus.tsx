import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { Text, View } from 'react-native';

interface RecordingStatusProps {
  recordingTimer: number;
}

export default function RecordingStatus({ recordingTimer }: RecordingStatusProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={{
      alignItems: 'center',
      marginBottom: 12,
      backgroundColor: colors.card,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    }}>
      <Text style={{
        fontSize: 18,
        fontWeight: '600' as const,
        color: colors.tint,
        letterSpacing: 1,
      }}>
        Recording: {`${Math.floor(recordingTimer / 60).toString().padStart(2, '0')}:${(recordingTimer % 60).toString().padStart(2, '0')}`} / 01:00
      </Text>
      <Text style={{ fontSize: 13, color: colors.tabIconDefault, marginTop: 4 }}>
        Audio will be sent automatically every minute
      </Text>
      <View style={{
        marginTop: 8,
        backgroundColor: '#4CAF50',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
      }}>
        <Text style={{ color: 'white', fontWeight: '500' as const, fontSize: 12 }}>
          🔴 RECORDING IN PROGRESS
        </Text>
      </View>
    </View>
  );
} 