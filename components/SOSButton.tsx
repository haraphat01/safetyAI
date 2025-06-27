import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SOSButtonProps {
  isSOSActive: boolean;
  sosButtonScale: Animated.Value;
  onSOSPress: () => void;
  onStopSOS: () => void;
}

export default function SOSButton({ 
  isSOSActive, 
  sosButtonScale, 
  onSOSPress, 
  onStopSOS 
}: SOSButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.sosContainer}>
      <Animated.View style={[styles.sosButtonContainer, { transform: [{ scale: sosButtonScale }] }]}>
        <TouchableOpacity
          style={[
            styles.sosButton,
            {
              backgroundColor: isSOSActive ? '#FF6B6B' : colors.tint,
              borderColor: isSOSActive ? '#FF6B6B' : colors.tint,
            },
          ]}
          onPress={isSOSActive ? onStopSOS : onSOSPress}
        >
          <Ionicons name="warning" size={32} color="white" />
          <Text style={[styles.sosButtonText, { color: colors.buttonText }]}>
            {isSOSActive ? 'Stop SOS' : 'SOS'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
      <Text style={[styles.sosDescription, { color: colors.tabIconDefault }]}>
        Tap to {isSOSActive ? 'stop' : 'send'} emergency alert to your contacts
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sosContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sosButtonContainer: {
    marginBottom: 12,
  },
  sosButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sosButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  sosDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 