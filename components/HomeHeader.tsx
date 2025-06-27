import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HomeHeaderProps {
  onSignOut: () => void;
}

export default function HomeHeader({ onSignOut }: HomeHeaderProps) {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Welcome back, {user?.user_metadata?.full_name || 'User'}!
        </Text>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          Your safety is our priority
        </Text>
      </View>
      <TouchableOpacity onPress={onSignOut} style={styles.signOutButton}>
        <Ionicons name="log-out-outline" size={24} color={colors.tint} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  signOutButton: {
    padding: 8,
  },
}); 