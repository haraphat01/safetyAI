import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface RecordingStatusProps {
  recordingTimer: number;
  onStopAndSend: () => void;
}

export default function RecordingStatus({ recordingTimer, onStopAndSend }: RecordingStatusProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={{
      alignItems: 'center',
      marginBottom: 12,
      backgroundColor: colors.card,
      borderRadius: 8,
      paddingVertical: 8,
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
      <Text style={{ fontSize: 13, color: colors.tabIconDefault, marginTop: 2 }}>
        Audio will be sent every minute
      </Text>
      <TouchableOpacity
        style={{
          marginTop: 8,
          backgroundColor: '#FF6B6B',
          paddingVertical: 8,
          paddingHorizontal: 20,
          borderRadius: 6,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
          elevation: 1,
        }}
        onPress={onStopAndSend}
      >
        <Text style={{ color: colors.buttonText, fontWeight: 'bold' as const, fontSize: 15, letterSpacing: 1 }}>
          Stop & Send Now
        </Text>
      </TouchableOpacity>
    </View>
  );
} 