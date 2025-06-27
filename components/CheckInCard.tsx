import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface CheckInCardProps {
  timer: number;
  onStopCheckIn: () => void;
}

export default function CheckInCard({ timer, onStopCheckIn }: CheckInCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  function formatTimerDHMS(seconds: number) {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    let parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    return parts.join(', ');
  }

  const checkInStyles = {
    checkInCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center' as const,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    checkInTitle: {
      fontSize: 18,
      fontWeight: 'bold' as const,
      color: colors.text,
      marginBottom: 8,
    },
    timerCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.tint + '22',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 4,
      borderColor: colors.tint,
    },
    timerText: {
      fontSize: 32,
      fontWeight: 'bold' as const,
      color: colors.tint,
    },
    stopButton: {
      marginTop: 12,
      backgroundColor: colors.error,
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 8,
      alignItems: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    stopButtonText: {
      color: colors.buttonText,
      fontWeight: 'bold' as const,
      fontSize: 16,
      letterSpacing: 1,
    },
  };

  return (
    <View style={checkInStyles.checkInCard}>
      <Text style={checkInStyles.checkInTitle}>Safety Check-In Active</Text>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.tint, marginBottom: 8 }}>
        {formatTimerDHMS(timer)} left
      </Text>
      <TouchableOpacity onPress={onStopCheckIn} style={checkInStyles.stopButton}>
        <Text style={checkInStyles.stopButtonText}>Stop</Text>
      </TouchableOpacity>
    </View>
  );
} 